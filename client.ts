class LixClient {
  getHeaderObj: () => {
    [key in string]: string
  } = () => { return {} }

  header(callback: () => {
    [key in string]: string
  }) {
    this.getHeaderObj = callback;
  }

  fetch(url: string, body: any) {
    var headers = {
      'Content-Type': 'application/json'
    };
    return new Promise((res, rej) => {
      fetch(url, {
        method: "POST",
        headers: {
          ...headers,
          ...this.getHeaderObj(),
        },
        body: body
      })
        .then(function (response) {
          response.json().then(json => {
            json.console.forEach((item: any) => {
              if (item.type === 'error') {
                console.error.apply({}, item.text.map((textItem: string) => {
                  return JSON.parse(textItem)
                }));
              } else if (item.type === 'warn') {
                console.warn.apply({}, item.text.map((textItem: string) => {
                  return JSON.parse(textItem)
                }));
              } else {
                console.log.apply({}, item.text.map((textItem: string) => {
                  return JSON.parse(textItem)
                }))
              }
            });
            if (json.finish) {
              res(json.data)
            } else {
              rej(json.data)
            }
          })
        });
    })
  }
}

const single = new LixClient();
// @ts-ignore
window.__lixClientSingle__ = single;

export default single;
