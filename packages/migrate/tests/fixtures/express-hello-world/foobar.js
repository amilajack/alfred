/*!
 * express-hello-world <https://github.com/tunnckoCore/express-hello-world>
 *
 * Copyright (c) 2015 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

/* jshint asi:true */
/* eslint import/no-unresolved: off, import/no-extraneous-dependencies: off */

const test = require('assertit');
const express = require('express');
const request = require('supertest');
const helloWorld = require('./index');

test('express-hello-world:', function() {
  test('should say "Hello World"', function(done) {
    const app = express();
    app.use(helloWorld());

    request(app)
      .get('/')
      .expect(200, 'Hello World')
      .end(done);
  });
  test('should yield next middleware', function(done) {
    const app = express();
    app
      .use(function(req, res, next) {
        res.set('X-First', 'foo');
        next();
      })
      .use(helloWorld())
      .use(function(req, res) {
        test.equal(res.get('X-First'), 'foo');
      });

    request(app)
      .get('/')
      .expect(200, 'Hello World')
      .expect('X-First', 'foo')
      .end(function(err) {
        test.ifError(err);
        done();
      });
  });
});
