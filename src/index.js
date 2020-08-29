const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')
const fs = require('fs')
const md5 = require('md5-node')
const running = require('./running')
let findSlot = null

class LixPlugin {
    constructor({getHttpUrl, getSaveCodePath, saveFileName, getSentParams}) {
        this.getHttpUrl = getHttpUrl;
        this.getSaveCodePath = getSaveCodePath;
        this.saveFileName = saveFileName;
        if (getSentParams) {
            this.getSentParams = getSentParams
        } else {
            this.getSentParams = function (params) {
                return `JSON.stringify({
              params: [${params.join(',')}]
            })`
            }
        }
        const servicePath = this.getSaveCodePath()
        if (!fs.existsSync(servicePath)) {
            fs.mkdirSync(servicePath)
        }
    }

    apply(compiler) {
        const self = this
        const allReplace = new Map()

        function writeFunction(fileName, annotation, content) {
            console.log('写入文件：' + self.getSaveCodePath().replace(/\/$/, '') + '/' + fileName)
            return fs.writeFileSync(
                `${self.getSaveCodePath().replace(/\/$/, '') + '/' + fileName}`,
                `var {
        _slicedToArray,
        _typeof,
        _asyncToGenerator,
        __extends,
        __assign,
        __rest,
        __decorate,
        __param,
        __metadata,
        __awaiter,
        __generator,
        __exportStar,
        __values,
        __read,
        __spread,
        __spreadArrays,
        __await,
        __asyncGenerator,
        __asyncDelegator,
        __asyncValues,
        __makeTemplateObject,
        __importStar,
        __importDefault,
        __classPrivateFieldGet,
        __classPrivateFieldSet,
        __createBinding,
        regeneratorRuntime
        } = require('node-lix').running;
let consoles = [];
const console = {
  log (...params) {
    consoles.push({
      type: 'log',
      text: Array.from(params)
    })
  },
  error(...params){
   consoles.push({
      type: 'error',
      text: Array.from(params)
    })
  },
  warn(...params){
    consoles.push({
      type: 'warn',
      text: Array.from(params)
    })
  }
}
exports.default = function (params) {
    consoles = [];
    return {
        data: (${content}).call(this, params),
        console: consoles
    }
}
exports.error = function(error){
    return {
        data: null,
        console: [...consoles, {
            type: 'error',
            text: [error.message+'!']
        }]
    }
}`,
                'utf8')
        }

        compiler.hooks.watchRun.tap('DefinePlugin', compilation => {
            allReplace.clear()
        })

        compiler.hooks.compilation.tap(
            'DefinePlugin',
            (compilation, {normalModuleFactory}) => {
                compilation.dependencyFactories.set(ConstDependency, new NullFactory())
                compilation.dependencyTemplates.set(
                    ConstDependency,
                    new ConstDependency.Template()
                )

                function handler(parser) {
                    parser.hooks.program.tap('DefinePlugin', (ast, comments) => {
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
                                        const functionName = md5(parser.state.current.originalSource()._value.slice(funcObj.range[0], funcObj.range[1]))
                                        const code = parser.state.current.originalSource()._value.slice(findService.range[0], findService.range[1]);
                                        let annotation = code.match(/__service__\(\s*\/\*(.+?)\*\//);
                                        if (annotation !== null) {
                                            annotation = annotation[1]
                                        }
                                        const fileName = self.saveFileName(functionName, annotation).replace(/^\//, '')
                                        allReplace.set(findService, fileName)
                                        let result = writeFunction(
                                            fileName,
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
                                        var dep = new ConstDependency(`(new Promise(function (res, rej) {
                      fetch('${self.getHttpUrl(functionName, annotation)}',{
                        method: "POST",
                        headers:{
                          'Content-Type': 'application/json'
                        },
                        body:${self.getSentParams(codes)}
                      })
                        .then(function(response) {
                          response.json().then(json=>{
                            json.console.forEach(item=>{
                              if(item.type==='error'){
                                console.error.apply({},item.text);
                              } else if(item.type==='warn'){
                                console.warn.apply({},item.text);
                              } else {
                                console.log.apply({},item.text)
                              }

                            })
                            res(json.data)
                          })
                        });
                    }))`, findService.range, false)
                                        dep.loc = findService.loc
                                        parser.state.current.addDependency(dep)
                                    })
                                })
                            }
                        }
                    })

                    parser.hooks.statement
                        .tap('DefinePlugin', expr => {
                            if (expr.type !== 'FunctionDeclaration' && expr.type !== 'BlockStatement') {
                                findSlot = expr
                            }
                        })
                }

                normalModuleFactory.hooks.parser
                    .for('javascript/auto')
                    .tap('DefinePlugin', handler)
                normalModuleFactory.hooks.parser
                    .for('javascript/dynamic')
                    .tap('DefinePlugin', handler)
                normalModuleFactory.hooks.parser
                    .for('javascript/esm')
                    .tap('DefinePlugin', handler)
            }
        )
        compiler.hooks.afterEmit.tap('DefinePlugin', () => {
            const servicePath = self.getSaveCodePath()
            //!!!!!!!!!!!!
            const runningFunc = Array.from(allReplace.values())
            const files = fs.readdirSync(servicePath)
            files
                .filter(item => {
                    return !runningFunc.includes(item)
                })
                .forEach(item => {
                    fs.unlinkSync(`${servicePath}/${item}`)
                })
        })
    }
}

exports.lix = LixPlugin;
exports.running = running;
