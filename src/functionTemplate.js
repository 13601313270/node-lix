exports['$$functionName$$'] = function (params) {
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
