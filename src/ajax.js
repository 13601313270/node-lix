(new Promise((res, rej) => {
    var headers = {
        'Content-Type': 'application/json'
    };
    // if (__webpack_require__) {
    //     var nodeLix = __webpack_require__('./node_modules/node-lix/src/index.js');
    //     if (nodeLix && nodeLix.lix) {
    //         if (nodeLix.lix.prototype.getHeaderObj) {
    //             headers = Object.assign(headers, nodeLix.lix.prototype.getHeaderObj());
    //         }
    //     }
    // }
    fetch('$$url$$',{
        method: "POST",
        headers:headers,
        body:`$$content$$`
    })
        .then(function(response) {
            response.json().then(json=>{
                json.console.forEach(item=>{
                    if(item.type==='error'){
                        console.error.apply({},item.text.map(item=>{
                            return JSON.parse(item)
                        }));
                    } else if(item.type==='warn'){
                        console.warn.apply({},item.text.map(item=>{
                            return JSON.parse(item)
                        }));
                    } else {
                        console.log.apply({},item.text.map(item=>{
                            return JSON.parse(item)
                        }))
                    }
                });
                if(json.finish){
                    res(json.data)
                } else {
                    rej(json.data)
                }
            })
        });
}))
