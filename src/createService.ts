export function createService<T>(self: T) {
    return function (service: (this: T, ...params: any[]) => any, ...params: any[]): any {
        // @ts-ignore
        if (service instanceof Promise) {
            // @ts-ignore
            return service.then(res => {
                return res;
            })
        } else {
            // @ts-ignore
            return Promise.resolve(service);
        }
    };
}
