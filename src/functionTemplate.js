exports['$$functionName$$'] = function (params) {
    consoles = [];
    var data = (`$$content$$`).apply(this, params)
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
