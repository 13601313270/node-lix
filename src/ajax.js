(new Promise((res, rej) => {
    fetch('$$url$$',{
        method: "POST",
        headers:{
            'Content-Type': 'application/json'
        },
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
                })
                if(json.finish){
                    res(json.data)
                } else {
                    rej(json.data)
                }
            })
        });
}))
