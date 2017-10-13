function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

_8d3‍.d((() => {
  var _ref = _asyncToGenerator(function* (input) {
    const importedProviders = yield Promise.all([
    // Other providers here..
    _8d3‍.i('./Es6ImportsProvider')]);

    const providers = importedProviders.map(function (Provider) {
      return new Provider();
    })
    // Sort the providers by priority.
    // @TODO: Temporarily sort by priority number. Eventually we'll implement an listener patterh
    //        to hook into when each provider has finished. Providers will listen for when other
    //        provider have finished
    .sort(function (a, b) {
      return a.priority - b.priority;
    });

    // Invoke each provider
    providers.reduce(function (provider, _input) {
      return provider.provide(_input);
    }, input);
  });

  function Providers(_x) {
    return _ref.apply(this, arguments);
  }

  return Providers;
})());