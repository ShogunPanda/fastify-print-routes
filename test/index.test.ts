/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-floating-promises */

import fastify, { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { SinonStub, stub } from 'sinon'
import t from 'tap'
import { plugin as fastifyPrintRoutes } from '../src'
type Test = typeof t

async function buildServer(options: FastifyPluginOptions = {}): Promise<FastifyInstance> {
  const server = fastify()

  server.register(fastifyPrintRoutes, options)

  server.get('/abc', {
    async handler() {
      return { ok: true }
    }
  })

  server.options('/abc', {
    async handler() {
      return { ok: true }
    }
  })

  server.route({
    url: '/another/:params',
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

  return server
}

t.test('Plugin', (t: Test) => {
  let consoleStub: SinonStub

  t.beforeEach((done: () => void) => {
    consoleStub = stub(console, 'log')
    done()
  })

  t.afterEach((done: () => void) => {
    consoleStub.restore()
    done()
  })

  t.test('should correctly list unhidden routes with colors', async (t: Test) => {
    const server = await buildServer()
    await server.listen(0)
    await server.close()

    t.equal(
      // eslint-disable-next-line no-control-regex
      consoleStub.firstCall.args[0].replace(/\x1b\[\d+m/g, ''),
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

  t.test('should correctly list unhidden routes without colors', async (t: Test) => {
    const server = await buildServer({ useColors: false })
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

  t.test('should print nothing when no routes are available', async (t: Test) => {
    const server = fastify()
    server.register(fastifyPrintRoutes)
    await server.listen(0)
    await server.close()

    t.equal(consoleStub.callCount, 0)
  })

  t.end()
})
