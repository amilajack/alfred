/* eslint import/prefer-default-export: off */

/**
 * Execute promises serially
 * @REFACTOR There's cleaner ways of implementing this
 */
export function serial(fns: Array<() => Promise<any>>): Promise<any> {
  return fns.reduce(
    (promise: Promise<any>, fn) =>
      // eslint-disable-next-line promise/no-nesting
      promise.then(result => fn().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );
}
