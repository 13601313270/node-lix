var {
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
    log(...params) {
        consoles.push({
            type: 'log',
            text: params.map(item => {
                return JSON.stringify(item)
            })
        })
    },
    error(...params) {
        consoles.push({
            type: 'error',
            text: params.map(item => {
                return JSON.stringify(item)
            })
        })
    },
    warn(...params) {
        consoles.push({
            type: 'warn',
            text: params.map(item => {
                return JSON.stringify(item)
            })
        })
    }
}
exports.default = function (params) {
    consoles = [];
    var data = (`$$content$$`).apply(this, params)
    return new Promise((res) => {
        if (data instanceof Promise) {
            data.then(dataRes => {
                res({
                    data: dataRes,
                    console: consoles
                })
            }).catch(e => {
                console.error(e.toString())
                res({
                    data: null,
                    console: consoles
                })
            })
        } else {
            res({
                data: data,
                console: consoles
            })
        }
    })
}
exports.error = function (error) {
    return {
        data: null,
        console: [...consoles, {
            type: 'error',
            text: [error.message + '!']
        }]
    }
}
