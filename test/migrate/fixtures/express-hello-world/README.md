# express-hello-world [![npmjs.com][npmjs-img]][npmjs-url] [![The MIT License][license-img]][license-url] 

> Express.js 'Hello World' middleware, useful for testing

[![code climate][codeclimate-img]][codeclimate-url] [![standard code style][standard-img]][standard-url] [![travis build status][travis-img]][travis-url] [![coverage status][coveralls-img]][coveralls-url] [![dependency status][david-img]][david-url]


## Install
```
npm i express-hello-world --save
npm test
```


## Usage
> For more use-cases see the [tests](./test.js)

```js
var express = require('express')
var helloWorld = require('express-hello-world')

var app = express()
app.use(helloWorld()).listen(1234)
```


## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/tunnckoCore/express-hello-world/issues/new).  
But before doing anything, please read the [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines.


## [Charlike Make Reagent](http://j.mp/1stW47C) [![new message to charlike][new-message-img]][new-message-url] [![freenode #charlike][freenode-img]][freenode-url]

[![tunnckocore.tk][author-www-img]][author-www-url] [![keybase tunnckocore][keybase-img]][keybase-url] [![tunnckoCore npm][author-npm-img]][author-npm-url] [![tunnckoCore twitter][author-twitter-img]][author-twitter-url] [![tunnckoCore github][author-github-img]][author-github-url]


[npmjs-url]: https://www.npmjs.com/package/express-hello-world
[npmjs-img]: https://img.shields.io/npm/v/express-hello-world.svg?label=express-hello-world

[license-url]: https://github.com/tunnckoCore/express-hello-world/blob/master/LICENSE.md
[license-img]: https://img.shields.io/badge/license-MIT-blue.svg


[codeclimate-url]: https://codeclimate.com/github/tunnckoCore/express-hello-world
[codeclimate-img]: https://img.shields.io/codeclimate/github/tunnckoCore/express-hello-world.svg

[travis-url]: https://travis-ci.org/tunnckoCore/express-hello-world
[travis-img]: https://img.shields.io/travis/tunnckoCore/express-hello-world.svg

[coveralls-url]: https://coveralls.io/r/tunnckoCore/express-hello-world
[coveralls-img]: https://img.shields.io/coveralls/tunnckoCore/express-hello-world.svg

[david-url]: https://david-dm.org/tunnckoCore/express-hello-world
[david-img]: https://img.shields.io/david/dev/tunnckoCore/express-hello-world.svg

[standard-url]: https://github.com/feross/standard
[standard-img]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg


[author-www-url]: http://www.tunnckocore.tk
[author-www-img]: https://img.shields.io/badge/www-tunnckocore.tk-fe7d37.svg

[keybase-url]: https://keybase.io/tunnckocore
[keybase-img]: https://img.shields.io/badge/keybase-tunnckocore-8a7967.svg

[author-npm-url]: https://www.npmjs.com/~tunnckocore
[author-npm-img]: https://img.shields.io/badge/npm-~tunnckocore-cb3837.svg

[author-twitter-url]: https://twitter.com/tunnckoCore
[author-twitter-img]: https://img.shields.io/badge/twitter-@tunnckoCore-55acee.svg

[author-github-url]: https://github.com/tunnckoCore
[author-github-img]: https://img.shields.io/badge/github-@tunnckoCore-4183c4.svg

[freenode-url]: http://webchat.freenode.net/?channels=charlike
[freenode-img]: https://img.shields.io/badge/freenode-%23charlike-5654a4.svg

[new-message-url]: https://github.com/tunnckoCore/messages
[new-message-img]: https://img.shields.io/badge/send%20me-message-green.svg
