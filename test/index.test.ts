/* eslint-disable @typescript-eslint/no-floating-promises */

import fastify from 'fastify'
import sinon, { SinonStub } from 'sinon'
import t from 'tap'
import { plugin as fastifyPrintRoutes } from '../src/index.js'

function handler(): void {}

t.test('Plugin', t => {
  let consoleStub: SinonStub

  t.beforeEach(() => {
    consoleStub = sinon.stub(console, 'log')
  })

  t.afterEach(() => {
    consoleStub.restore()
  })

  t.test('should correctly list unhidden routes with colors', async t => {
    const server = fastify()

    server.register(fastifyPrintRoutes)

    server.get('/abc', { handler })

    server.options('/abc', { handler })

    server.route({
      url: '/another/:params',
      method: ['POST', 'GET'],
      handler,
      config: {
        description: 'Title'
      }
    })

    server.route({
      url: '/path3',
      method: ['POST', 'GET'],
      handler,
      config: {
        hide: true
      }
    })

    await server.listen(0)
    await server.close()

    t.equal(
      // eslint-disable-next-line no-control-regex
      consoleStub.firstCall.args[0].replace(/\u001B\[\d+m/g, ''),
      `
        Available routes:
        @
        ╔════════════╤══════════════════╤═════════════╗
        ║  Method(s) │ Path             │ Description ║
        ╟────────────┼──────────────────┼─────────────╢
        ║        GET │ /abc             │             ║
        ║    OPTIONS │ /abc             │             ║
        ║ GET | POST │ /another/:params │ Title       ║
        ╚════════════╧══════════════════╧═════════════╝
      `
        .replace(/^\s+/gm, '')
        .replace('@', '')
    )
  })

  t.test('should correctly list unhidden routes without colors', async t => {
    const server = fastify()

    server.register(fastifyPrintRoutes, { useColors: false })

    server.get('/abc', { handler })

    server.options('/abc', { handler })

    server.route({
      url: '/another/:params',
      method: ['POST', 'GET'],
      handler,
      config: {
        description: 'Title'
      }
    })

    server.route({
      url: '/path3',
      method: ['POST', 'GET'],
      handler,
      config: {
        hide: true
      }
    })
    await server.listen(0)
    await server.close()

    t.equal(
      consoleStub.firstCall.args[0],
      `
        Available routes:
        @
        ╔════════════╤══════════════════╤═════════════╗
        ║  Method(s) │ Path             │ Description ║
        ╟────────────┼──────────────────┼─────────────╢
        ║        GET │ /abc             │             ║
        ║    OPTIONS │ /abc             │             ║
        ║ GET | POST │ /another/:params │ Title       ║
        ╚════════════╧══════════════════╧═════════════╝
      `
        .replace(/^\s+/gm, '')
        .replace('@', '')
    )
  })

  t.test('should omit description column if not needed', async t => {
    const server = fastify()

    server.register(fastifyPrintRoutes, { useColors: false })

    server.get('/abc', { handler })

    server.options('/abc', { handler })

    server.route({
      url: '/another/:params',
      method: ['POST', 'GET'],
      handler
    })

    server.route({
      url: '/path3',
      method: ['POST', 'GET'],
      handler,
      config: {
        hide: true
      }
    })

    await server.listen(0)
    await server.close()

    t.equal(
      consoleStub.firstCall.args[0],
      `
        Available routes:
        @
        ╔════════════╤══════════════════╗
        ║  Method(s) │ Path             ║
        ╟────────────┼──────────────────╢
        ║        GET │ /abc             ║
        ║    OPTIONS │ /abc             ║
        ║ GET | POST │ /another/:params ║
        ╚════════════╧══════════════════╝
      `
        .replace(/^\s+/gm, '')
        .replace('@', '')
    )
  })

  t.test('should print nothing when no routes are available', async t => {
    const server = fastify()
    server.register(fastifyPrintRoutes)
    await server.listen(0)
    await server.close()

    t.equal(consoleStub.callCount, 0)
  })

  t.end()
})
