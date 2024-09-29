declare class lix {
  constructor(message: string);
  static header(callback: () => {
    [key in string]: string
  })
}
export const lix