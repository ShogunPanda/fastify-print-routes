# fastify-print-routes

[![Package Version](https://img.shields.io/npm/v/fastify-print-routes.svg)](https://npm.im/fastify-print-routes)
[![Dependency Status](https://img.shields.io/david/ShogunPanda/fastify-print-routes)](https://david-dm.org/ShogunPanda/fastify-print-routes)
[![Build](https://github.com/ShogunPanda/fastify-print-routes/workflows/CI/badge.svg)](https://github.com/ShogunPanda/fastify-print-routes/actions?query=workflow%3ACI)
[![Code Coverage](https://img.shields.io/codecov/c/gh/ShogunPanda/fastify-print-routes?token=FQ4HHLINJ8)](https://codecov.io/gh/ShogunPanda/fastify-print-routes)

A simple plugin for Fastify prints all available routes.

http://sw.cowtech.it/fastify-print-routes

## Installation

Just run:

```bash
npm install fastify-print-routes --save
```

## Usage

Register as a plugin as early as possible, optional providing any of the following options:

- `useColors`: If to use colors to highlight routes.

Routes can be omitted by the list by setting `hide` option to `true` inside their `config`.

Once the server is started, it will print on the console all available routes and methods.

## Example

```js
const server = require('fastify')()

server.register(require('fastify-print-routes'))

server.get('/path1', {
  async handler() {
    return { ok: true }
  }
})

server.route({
  url: '/path2/:params',
  method: ['POST', 'GET'],
  async handler() {
    return { ok: true }
  },
  config: {
    description: 'Title'
  }
})

server.route({
  url: '/path3',
  method: ['POST', 'GET'],
  async handler() {
    return { ok: true }
  },
  config: {
    hide: true
  }
})

server.listen(0, () => {
  console.log(`Server listening on port ${server.server.address().port} ...`)
})
```

Once started, this will be printed to the console:

```
Available routes:

╔════════════╤════════════════╤═════════════╗
║  Method(s) │ Path           │ Description ║
╟────────────┼────────────────┼─────────────╢
║        GET │ /path1         │             ║
║ GET | POST │ /path2/:params │ Title       ║
╚════════════╧════════════════╧═════════════╝

Server listening on port 60792 ...
```

## Contributing to fastify-print-routes

- Check out the latest master to make sure the feature hasn't been implemented or the bug hasn't been fixed yet.
- Check out the issue tracker to make sure someone already hasn't requested it and/or contributed it.
- Fork the project.
- Start a feature/bugfix branch.
- Commit and push until you are happy with your contribution.
- Make sure to add tests for it. This is important so I don't break it in a future version unintentionally.

## Copyright

Copyright (C) 2020 and above Shogun (shogun@cowtech.it).

Licensed under the ISC license, which can be found at https://choosealicense.com/licenses/isc.
