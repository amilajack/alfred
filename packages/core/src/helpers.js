/**
 * Execute promises serially
 * @REFACTOR There's cleaner ways of implementing this
 */
export const serial = (funcs: Array<() => Promise<any>>) =>
  funcs.reduce(
    (promise, func) =>
      // eslint-disable-next-line promise/no-nesting
      promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );
