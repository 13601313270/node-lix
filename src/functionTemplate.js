exports['$$functionName$$'] = function (params) {
    consoles = [];
    var template = (`$$content$$`);
    if (!("prototype" in template)) {
        console.warn('__service__只能嵌套function(){}，不能嵌套()=>{}')
    }
    var data = template.apply(this, params)
    return new Promise((res) => {
        if (data instanceof Promise) {
            data.then(dataRes => {
                res({
                    data: dataRes,
                    finish: true,
                    console: consoles
                })
            }).catch(e => {
                console.error(e.toString())
                res({
                    data: e.toString(),
                    finish: false,
                    console: consoles
                })
            })
        } else {
            res({
                data: data,
                finish: true,
                console: consoles
            })
        }
    })
}
