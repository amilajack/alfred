/*!
 * express-hello-world <https://github.com/tunnckoCore/express-hello-world>
 *
 * Copyright (c) 2015 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

/* jshint asi:true */

'use strict'

var test = require('assertit')
var express = require('express')
var request = require('supertest')
var helloWorld = require('./index')

test('express-hello-world:', function () {
  test('should say "Hello World"', function (done) {
    var app = express()
    app.use(helloWorld())

    request(app)
      .get('/')
      .expect(200, 'Hello World')
      .end(done)
  })
  test('should yield next middleware', function (done) {
    var app = express()
    app
      .use(function (req, res, next) {
        res.set('X-First', 'foo')
        next()
      })
      .use(helloWorld())
      .use(function (req, res, next) {
        test.equal(res.get('X-First'), 'foo')
      })

    request(app)
      .get('/')
      .expect(200, 'Hello World')
      .expect('X-First', 'foo')
      .end(function (err) {
        test.ifError(err)
        done()
      })
  })
})
