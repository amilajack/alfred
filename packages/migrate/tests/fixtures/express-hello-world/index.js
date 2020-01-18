/*!
 * express-hello-world <https://github.com/tunnckoCore/express-hello-world>
 *
 * Copyright (c) 2015 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

module.exports = function expressHelloWorld() {
  return function(req, res, next) {
    res.send('Hello World');
    next();
  };
};
