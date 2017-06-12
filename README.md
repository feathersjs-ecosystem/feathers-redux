# feathers-redux

[![Build Status](https://travis-ci.org/feathersjs/feathers-redux.png?branch=master)](https://travis-ci.org/feathersjs/feathers-redux)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-redux/badges/gpa.svg)](https://codeclimate.com/github/feathersjs/feathers-redux)
[![Test Coverage](https://codeclimate.com/github/feathersjs/feathers-redux/badges/coverage.svg)](https://codeclimate.com/github/feathersjs/feathers-redux/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-redux.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-redux)
[![Download Status](https://img.shields.io/npm/dm/feathers-redux.svg?style=flat-square)](https://www.npmjs.com/package/feathers-redux)

> Integrate Feathers services with your Redux store

## Installation

```
npm install feathers-redux --save
```

## Documentation

Please refer to the [feathers-redux documentation](http://docs.feathersjs.com/) for more details.

## Complete Example

Here's an example of a Feathers server that uses `feathers-redux`. 

```js
const feathers = require('feathers');
const rest = require('feathers-rest');
const hooks = require('feathers-hooks');
const bodyParser = require('body-parser');
const errorHandler = require('feathers-errors/handler');
const plugin = require('feathers-redux');

// Initialize the application
const app = feathers()
  .configure(rest())
  .configure(hooks())
  // Needed for parsing bodies (login)
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  // Initialize your feathers plugin
  .use('/plugin', plugin())
  .use(errorHandler());

app.listen(3030);

console.log('Feathers app started on 127.0.0.1:3030');
```

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
