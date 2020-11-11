const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')
const fs = require('fs')
const md5 = require('md5-node')
const running = require('./running')
let findSlot = null

class LixPlugin {
    constructor({getHttpUrl, getSaveCodePath, saveFileName, getSentParams, functionName}) {
        this.getHttpUrl = getHttpUrl;
        this.getSaveCodePath = getSaveCodePath;
        this.saveFileName = saveFileName;
        if (functionName) {
            this.functionName = functionName
        } else {
            this.functionName = function (hash, annotation) {
                return 'default';
            }
        }
        if (getSentParams) {
            this.getSentParams = getSentParams
        } else {
            this.getSentParams = function (params) {
                return `JSON.stringify({
              params: [${params.join(',')}]
            })`
            }
        }
        this.templateFunc = fs.readFileSync(__dirname + '/nodeRunningTemplate.js', 'utf-8')
        this.functionTemplate = fs.readFileSync(__dirname + '/functionTemplate.js', 'utf-8')
        this.ajaxTemplate = fs.readFileSync(__dirname + '/ajax.js', 'utf-8')
        this.filefunctionMap = {};
    }

    static header(callback) {
        LixPlugin.prototype.getHeaderObj = callback;
    }

    apply(compiler) {
        const self = this
        let allFile2Function = {}
        const servicePath = self.getSaveCodePath()
        if (!fs.existsSync(servicePath)) {
            fs.mkdirSync(servicePath)
        }

        function writeFunction(fileName, functionName, content) {
            if (allFile2Function[fileName] === undefined) {
                allFile2Function[fileName] = new Set()
            }
            if (allFile2Function[fileName].has(functionName) && functionName !== 'default') {
                throw new Error('lix构建过程中，文件' + fileName + '里有重复函数:' + functionName)
            }
            allFile2Function[fileName].add(functionName)
            console.log('🔧lix build： ' + functionName + ' ---> ' + fileName)
            if (!fs.existsSync(self.getSaveCodePath().replace(/\/$/, '') + '/' + fileName)) {
                fs.writeFileSync(
                    `${self.getSaveCodePath().replace(/\/$/, '') + '/' + fileName}`,
                    self.templateFunc,
                    'utf8')
            }

            return fs.appendFileSync(
                `${self.getSaveCodePath().replace(/\/$/, '') + '/' + fileName}`,
                self.functionTemplate
                    .replace('`$$content$$`', content)
                    .replace('$$functionName$$', functionName),
                'utf8')
        }

        compiler.hooks.watchRun.tap('lixPlugin', compilation => {
            console.log('lix build begin⏳...')
            // 清理构造目录和变量
            allFile2Function = {}
            const servicePath = self.getSaveCodePath()
            if (!fs.existsSync(servicePath)) {
                fs.mkdirSync(servicePath)
            } else {
                const files = fs.readdirSync(servicePath)
                files
                    .forEach(item => {
                        fs.unlinkSync(`${servicePath}/${item}`)
                    })
            }
        })

        compiler.hooks.compilation.tap(
            'lixPlugin',
            (compilation, {normalModuleFactory}) => {
                // 绑定dependencyFactories
                compilation.dependencyFactories.set(ConstDependency, new NullFactory())
                compilation.dependencyTemplates.set(
                    ConstDependency,
                    new ConstDependency.Template()
                )

                function handler(parser) {
                    parser.hooks.program.tap('lixPlugin', (ast, comments) => {
                        if (
                            parser.state &&
                            parser.state.module &&
                            parser.state.module.resource.indexOf('node_modules') === -1 &&
                            !parser.state.module.resource.match(/\.(html|htm|css|less|scss)$/)
                        ) {
                            if (parser.state.module.resource.includes('__service__')) {
                                ast.body = []
                                var dep = new ConstDependency(`exports.__service__ = function(service, ...params){
                  if (service instanceof Promise) {
                    return service.then(res => {
                      return res;
                    })
                  } else {
                    return Promise.resolve(service);
                  }
                };`, ast.range, false)
                                dep.loc = ast.loc;
                                parser.state.current.addDependency(dep)
                            } else {
                                ast.body.forEach(item => {
                                    const serviceCodeList = []

                                    function find(item) {
                                        if (item.type === 'CallExpression' && item.callee.name === '__service__') {
                                            serviceCodeList.push(item)
                                            return
                                        }
                                        for (let i = 0; i < Object.keys(item).length; i++) {
                                            const key = Object.keys(item)[i]
                                            if (item[key] instanceof Array) {
                                                for (let j = 0; j < item[key].length; j++) {
                                                    if (item[key][j] && item[key][j].type) {
                                                        find(item[key][j])
                                                    }
                                                }
                                            } else if (item[key] && item[key].type) {
                                                find(item[key])
                                            }
                                        }
                                    }

                                    find(item)
                                    serviceCodeList.forEach(findService => {
                                        const funcObj = findService.arguments[0]
                                        const codeHash = md5(parser.state.current.originalSource()._value.slice(funcObj.range[0], funcObj.range[1]))
                                        const code = parser.state.current.originalSource()._value.slice(findService.range[0], findService.range[1]);
                                        let annotation = code.match(/__service__\(\s*\/\*(.+?)\*\//);
                                        if (annotation !== null) {
                                            annotation = annotation[1]
                                        }

                                        const functionName = self.functionName(codeHash, annotation);
                                        const fileName = self.saveFileName(codeHash, annotation).replace(/^\//, '')
                                        let result = writeFunction(
                                            fileName,
                                            functionName,
                                            parser.state.current.originalSource()._value.slice(funcObj.range[0], funcObj.range[1])
                                        )
                                        findService.arguments[0] = {
                                            type: 'Literal',
                                            value: null,
                                            raw: 'null'
                                        }
                                        const codes = findService.arguments.slice(1).map(item => {
                                            return parser.state.current.originalSource()._value.slice(item.range[0], item.range[1])
                                        })

                                        var dep = new ConstDependency(
                                            self.ajaxTemplate
                                                .replace('$$url$$',self.getHttpUrl(codeHash, annotation, fileName))
                                                .replace('`$$content$$`',self.getSentParams(codes))
                                            , findService.range, false)
                                        dep.loc = findService.loc
                                        parser.state.current.addDependency(dep)
                                    })
                                })
                            }
                        }
                    })

                    parser.hooks.statement
                        .tap('lixPlugin', expr => {
                            if (expr.type !== 'FunctionDeclaration' && expr.type !== 'BlockStatement') {
                                findSlot = expr
                            }
                        })
                }

                normalModuleFactory.hooks.parser
                    .for('javascript/auto')
                    .tap('lixPlugin', handler)
                normalModuleFactory.hooks.parser
                    .for('javascript/dynamic')
                    .tap('lixPlugin', handler)
                normalModuleFactory.hooks.parser
                    .for('javascript/esm')
                    .tap('lixPlugin', handler)
            }
        )
    }
}

LixPlugin.prototype.getHeaderObj = function() {
    return {}
}

exports.lix = LixPlugin;
exports.running = running;
