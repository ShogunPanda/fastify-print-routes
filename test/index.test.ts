/* eslint-disable @typescript-eslint/no-floating-promises */

import fastify from 'fastify'
import t from 'tap'
import { plugin as fastifyPrintRoutes } from '../src/index.js'

function handler(): void {}

t.test('Plugin', t => {
  t.test('should correctly list unhidden routes with colors', async t => {
    const logCalls = t.capture(console, 'log')
    const server = fastify()

    await server.register(fastifyPrintRoutes)

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

    await server.listen({ port: 0 })
    await server.close()

    t.equal(
      // eslint-disable-next-line no-control-regex
      logCalls()[0].args[0].replaceAll(/\u001B\[\d+m/g, ''),
      `
        Available routes:
        @
        ╔════════════╤══════════════════╤═════════════╗
        ║  Method(s) │ Path             │ Description ║
        ╟────────────┼──────────────────┼─────────────╢
        ║        GET │ /abc             │             ║
        ║       HEAD │ /abc             │             ║
        ║    OPTIONS │ /abc             │             ║
        ║ GET | POST │ /another/:params │ Title       ║
        ║       HEAD │ /another/:params │ Title       ║
        ╚════════════╧══════════════════╧═════════════╝
      `
        .replaceAll(/^\s+/gm, '')
        .replace('@', '')
    )
  })

  t.test('should correctly list unhidden routes without colors', async t => {
    const logCalls = t.capture(console, 'log')
    const server = fastify()

    await server.register(fastifyPrintRoutes, { useColors: false })

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
    await server.listen({ port: 0 })
    await server.close()

    t.equal(
      logCalls()[0].args[0],
      `
        Available routes:
        @
        ╔════════════╤══════════════════╤═════════════╗
        ║  Method(s) │ Path             │ Description ║
        ╟────────────┼──────────────────┼─────────────╢
        ║        GET │ /abc             │             ║
        ║       HEAD │ /abc             │             ║
        ║    OPTIONS │ /abc             │             ║
        ║ GET | POST │ /another/:params │ Title       ║
        ║       HEAD │ /another/:params │ Title       ║
        ╚════════════╧══════════════════╧═════════════╝
      `
        .replaceAll(/^\s+/gm, '')
        .replace('@', '')
    )
  })

  t.test('should correctly compact routes', async t => {
    const logCalls = t.capture(console, 'log')
    const server = fastify()

    await server.register(fastifyPrintRoutes, { compact: true })

    server.get('/abc', {
      handler,
      config: {
        description: 'Another title'
      }
    })

    server.options('/abc', { handler })

    server.get('/cde', { handler })

    server.route({
      url: '/cde',
      method: ['OPTIONS'],
      handler
    })

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

    await server.listen({ port: 0 })
    await server.close()

    t.equal(
      // eslint-disable-next-line no-control-regex
      logCalls()[0].args[0].replaceAll(/\u001B\[\d+m/g, ''),
      `
        Available routes:
        @
        ╔══════════════════════╤══════════════════╤═════════════╗
        ║            Method(s) │ Path             │ Description ║
        ╟──────────────────────┼──────────────────┼─────────────╢
        ║ GET | HEAD | OPTIONS │ /abc             │             ║
        ║    GET | POST | HEAD │ /another/:params │ Title       ║
        ║ GET | HEAD | OPTIONS │ /cde             │             ║
        ╚══════════════════════╧══════════════════╧═════════════╝
      `
        .replaceAll(/^\s+/gm, '')
        .replace('@', '')
    )
  })

  t.test('should omit description column if not needed', async t => {
    const logCalls = t.capture(console, 'log')
    const server = fastify()

    await server.register(fastifyPrintRoutes, { useColors: false })

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

    await server.listen({ port: 0 })
    await server.close()

    t.equal(
      logCalls()[0].args[0],
      `
        Available routes:
        @
        ╔════════════╤══════════════════╗
        ║  Method(s) │ Path             ║
        ╟────────────┼──────────────────╢
        ║        GET │ /abc             ║
        ║       HEAD │ /abc             ║
        ║    OPTIONS │ /abc             ║
        ║ GET | POST │ /another/:params ║
        ║       HEAD │ /another/:params ║
        ╚════════════╧══════════════════╝
      `
        .replaceAll(/^\s+/gm, '')
        .replace('@', '')
    )
  })

  t.test('should print nothing when no routes are available', async t => {
    const logCalls = t.capture(console, 'log')
    const server = fastify()

    await server.register(fastifyPrintRoutes)
    await server.listen({ port: 0 })
    await server.close()

    t.equal(logCalls().length, 0)
  })

  t.end()
})
