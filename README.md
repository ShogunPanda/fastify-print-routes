# fastify-print-routes

[![Version](https://img.shields.io/npm/v/fastify-print-routes.svg)](https://npm.im/fastify-print-routes)
[![Dependencies](https://img.shields.io/librariesio/release/npm/fastify-print-routes)](https://libraries.io/npm/fastify-print-routes)
[![Build](https://github.com/ShogunPanda/fastify-print-routes/workflows/CI/badge.svg)](https://github.com/ShogunPanda/fastify-print-routes/actions?query=workflow%3ACI)
[![Coverage](https://img.shields.io/codecov/c/gh/ShogunPanda/fastify-print-routes?token=FQ4HHLINJ8)](https://codecov.io/gh/ShogunPanda/fastify-print-routes)

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
- `compact`: If to show all routes of the same path in a single line even if they are defined using different handlers. Descripion of unified routes will not be printed.

Routes can be omitted by the list by setting `hide` option to `true` inside their `config`.

Once the server is started, it will print on the console all available routes and methods.

## Example

```js
import fastify from 'fastify'
import fastifyPrintRoutes from 'fastify-print-routes'

const server = fastify()

/*
Since fastify-print-routes uses an onRoute hook, you have to either:

* use `await register...`
* wrap you routes definitions in a plugin

See: https://www.fastify.io/docs/latest/Guides/Migration-Guide-V4/#synchronous-route-definitions
*/
await server.register(fastifyPrintRoutes)

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

server.listen({ port: 3000 }, () => {
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
║       HEAD │ /path1         │             ║
║ GET | POST │ /path2/:params │ Title       ║
╚════════════╧════════════════╧═════════════╝

Server listening on port 60792 ...
```

## ESM Only

This package only supports to be directly imported in a ESM context.

For informations on how to use it in a CommonJS context, please check [this page](https://gist.github.com/ShogunPanda/fe98fd23d77cdfb918010dbc42f4504d).

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
