import fastify, { type RouteOptions } from 'fastify'
import { deepStrictEqual } from 'node:assert'
import { test, type MockedObject, type TestContext } from 'node:test'
import { table } from 'table'
import { plugin as fastifyPrintRoutes } from '../src/index.js'

function handler(): void {}

function mockConsole(t: TestContext): MockedObject {
  const fn = t.mock.method(console, 'log')
  fn.mock.mockImplementation(() => {})

  return fn
}

function generateOutput(rows: string[][], header: string[] = ['Method(s)', 'Path', 'Description']): string {
  return (
    'Available routes:\n\n' +
    table([header].concat(rows), {
      columns: {
        0: {
          alignment: 'right'
        },
        1: {
          alignment: 'left'
        },
        2: {
          alignment: 'left'
        }
      },
      drawHorizontalLine(index: number, size: number): boolean {
        return index < 2 || index > size - 1
      }
    })
  )
}

test('should correctly list unhidden routes with colors', async t => {
  const logCalls = mockConsole(t)
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

  deepStrictEqual(
    // eslint-disable-next-line no-control-regex
    logCalls.mock.calls[0].arguments[0].replaceAll(/\u001B\[\d+m/g, ''),
    generateOutput([
      ['GET', '/abc', ''],
      ['HEAD', '/abc', ''],
      ['OPTIONS', '/abc', ''],
      ['GET | POST', '/another/:params', 'Title'],
      ['HEAD', '/another/:params', 'Title']
    ])
  )
})

test('should correctly include querystring in the URL if present', async t => {
  const logCalls = mockConsole(t)
  const server = fastify()

  await server.register(fastifyPrintRoutes, { compact: true })

  server.route({
    url: '/first',
    method: ['GET'],
    handler,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          }
        },
        required: ['foo']
      }
    }
  })

  server.route({
    url: '/second',
    method: ['GET'],
    handler,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          }
        },
        required: ['bar']
      }
    }
  })

  server.route({
    url: '/third',
    method: ['GET'],
    handler,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          },
          baz: {
            type: 'integer'
          }
        },
        required: ['bar']
      }
    }
  })

  server.route({
    url: '/fourth',
    method: ['GET'],
    handler,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          },
          baz: {
            type: 'integer'
          }
        },
        required: ['baz']
      }
    }
  })

  await server.listen({ port: 0 })
  await server.close()

  deepStrictEqual(
    // eslint-disable-next-line no-control-regex
    logCalls.mock.calls[0].arguments[0].replaceAll(/\u001B\[\d+m/g, ''),
    generateOutput(
      [
        ['GET | HEAD', '/first?foo=value(&bar=value)'],
        ['GET | HEAD', '/fourth?(foo=value&)(bar=value&)baz=value'],
        ['GET | HEAD', '/second?(foo=value&)bar=value'],
        ['GET | HEAD', '/third?(foo=value&)bar=value(&baz=value)']
      ],
      ['Method(s)', 'Path']
    )
  )
})

test('should correctly skip querystring in the URLs if asked to', async t => {
  const logCalls = mockConsole(t)
  const server = fastify()

  await server.register(fastifyPrintRoutes, { compact: true, querystring: false })

  server.route({
    url: '/first',
    method: ['GET'],
    handler,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          }
        },
        required: ['foo']
      }
    }
  })

  server.route({
    url: '/second',
    method: ['GET'],
    handler,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          }
        },
        required: ['bar']
      }
    }
  })

  server.route({
    url: '/third',
    method: ['GET'],
    handler,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          },
          baz: {
            type: 'integer'
          }
        },
        required: ['bar']
      }
    }
  })

  server.route({
    url: '/fourth',
    method: ['GET'],
    handler,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          },
          bar: {
            type: 'integer'
          },
          baz: {
            type: 'integer'
          }
        },
        required: ['baz']
      }
    }
  })

  await server.listen({ port: 0 })
  await server.close()

  deepStrictEqual(
    // eslint-disable-next-line no-control-regex
    logCalls.mock.calls[0].arguments[0].replaceAll(/\u001B\[\d+m/g, ''),
    generateOutput(
      [
        ['GET | HEAD', '/first'],
        ['GET | HEAD', '/fourth'],
        ['GET | HEAD', '/second'],
        ['GET | HEAD', '/third']
      ],
      ['Method(s)', 'Path']
    )
  )
})

test('should correctly list unhidden routes without colors', async t => {
  const logCalls = mockConsole(t)
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

  deepStrictEqual(
    logCalls.mock.calls[0].arguments[0],
    generateOutput([
      ['GET', '/abc', ''],
      ['HEAD', '/abc', ''],
      ['OPTIONS', '/abc', ''],
      ['GET | POST', '/another/:params', 'Title'],
      ['HEAD', '/another/:params', 'Title']
    ])
  )
})

test('should correctly list filtered routes without colors', async t => {
  const logCalls = mockConsole(t)
  const server = fastify()

  await server.register(fastifyPrintRoutes, {
    useColors: false,
    filter(route: RouteOptions): boolean {
      return route.url === '/abc'
    }
  })

  server.get('/abc', {
    handler,
    config: {
      description: 'Title'
    }
  })

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

  deepStrictEqual(
    logCalls.mock.calls[0].arguments[0],
    generateOutput([
      ['GET', '/abc', 'Title'],
      ['HEAD', '/abc', 'Title'],
      ['OPTIONS', '/abc', '']
    ])
  )
})

test('should correctly compact routes', async t => {
  const logCalls = mockConsole(t)
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

  deepStrictEqual(
    // eslint-disable-next-line no-control-regex
    logCalls.mock.calls[0].arguments[0].replaceAll(/\u001B\[\d+m/g, ''),
    generateOutput([
      ['GET | HEAD | OPTIONS', '/abc', ''],
      ['GET | POST | HEAD', '/another/:params', 'Title'],
      ['GET | HEAD | OPTIONS', '/cde', '']
    ])
  )
})

test('should omit description column if not needed', async t => {
  const logCalls = mockConsole(t)
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

  deepStrictEqual(
    logCalls.mock.calls[0].arguments[0],
    generateOutput(
      [
        ['GET', '/abc'],
        ['HEAD', '/abc'],
        ['OPTIONS', '/abc'],
        ['GET | POST', '/another/:params'],
        ['HEAD', '/another/:params']
      ],
      ['Method(s)', 'Path']
    )
  )
})

test('should print nothing when no routes are available', async t => {
  const logCalls = mockConsole(t)
  const server = fastify()

  await server.register(fastifyPrintRoutes)
  await server.listen({ port: 0 })
  await server.close()

  deepStrictEqual(logCalls.mock.callCount(), 0)
})
