declare type ICallbackParams<T> = (this: T, ...params: any[]) => any;

export function createService<T>(self: T) {
    return function (service: ICallbackParams<T>, ...params: any[]): any {
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
