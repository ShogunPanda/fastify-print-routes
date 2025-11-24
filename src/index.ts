import { clean, colorize } from 'acquerello'
import { type FastifyError, type FastifyInstance, type FastifyPluginOptions, type RouteOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { table } from 'table'
import { toJSONSchema, ZodObject } from 'zod'

type RouteConfig = Record<string, any>

type RouteFilter = (route: RouteOptions) => boolean

// using declaration merging, add your plugin props to the appropriate fastify interfaces
// if prop type is defined here, the value will be typechecked when you call decorate{,Request,Reply}
declare module 'fastify' {
  interface FastifyInstance {
    routes: RouteOptions[]
  }
}

interface Schema {
  properties: Record<string, unknown>
  required: string[]
}

const methodsOrder = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS']

function getRouteConfig(r: RouteOptions): RouteConfig {
  return (r.config as RouteConfig) ?? {}
}

function sortRoutes(a: RouteOptions, b: RouteOptions): number {
  return a.url.localeCompare(b.url)
}

function unifyRoutes(routes: RouteOptions[]): RouteOptions[] {
  const routesMap = new Map<string, RouteOptions>()

  for (const route of routes) {
    const unifiedRoute = routesMap.get(route.url)

    if (unifiedRoute) {
      if (typeof unifiedRoute.method === 'string') {
        unifiedRoute.method = [unifiedRoute.method]
      }

      // Unify the routes
      if (typeof route.method === 'string') {
        unifiedRoute.method.push(route.method)
      } else {
        unifiedRoute.method.push(...route.method)
      }

      // Remove the description when they don't match
      const config = unifiedRoute?.config as RouteConfig | undefined

      if (config && config?.description !== (route.config as RouteConfig)?.description) {
        config.description = undefined
      }
    } else {
      routesMap.set(route.url, route)
    }
  }

  return [...routesMap.values()].sort(sortRoutes)
}

function printRoutes(
  routes: RouteOptions[],
  useColors: boolean,
  compact: boolean,
  filter: RouteFilter,
  showQueryString: boolean
): void {
  if (routes.length === 0) {
    return
  }

  const styler = useColors ? colorize : clean

  // Sort and eventually unify routes
  routes = routes.filter(r => getRouteConfig(r).hide !== true && filter(r)).sort(sortRoutes)

  if (compact) {
    routes = unifyRoutes(routes)
  }

  const hasDescription = routes.some(r => 'description' in getRouteConfig(r))

  // Build the output
  const headers = [styler('{{bold white}}Method(s){{-}}'), styler('{{bold white}}Path{{-}}')]

  if (hasDescription) {
    headers.push(styler('{{bold white}}Description{{-}}'))
  }

  const rows: string[][] = [headers]

  for (const route of routes) {
    const methods = Array.isArray(route.method) ? route.method : [route.method]

    const url = route.url.replaceAll(/:\w+|\[:\w+]/g, '{{yellow}}$&{{-}}')
    const querystringComponents = []

    let queryString = ''

    /* c8 ignore next 3 */
    if (showQueryString) {
      if (route.schema?.querystring) {
        // Get all properties
        let schema = route.schema.querystring as Schema

        /* c8 ignore next 5 */
        if (schema instanceof ZodObject) {
          schema = toJSONSchema(schema) as Schema
        }

        const requiredProperties = schema.required ?? []

        for (const property of Object.keys(schema.properties)) {
          const param = `${property}={{yellow}}value{{-}}`
          const separator: string = querystringComponents.length === 0 ? '?' : '&'

          if (requiredProperties.includes(property)) {
            querystringComponents.push(separator + param)
          } else {
            querystringComponents.push(`${separator}(${param})`)
          }
        }
      }

      queryString = querystringComponents
        .join('')
        .replaceAll('&(', '(&')
        .replaceAll(')&', '&)')
        .replaceAll(')(&', '&)(')
    }

    const row = [
      styler(
        methods
          .sort((a, b) => methodsOrder.indexOf(a) - methodsOrder.indexOf(b))
          .map(m => `{{cyan}}${m}{{-}}`)
          .join(' | ')
      ),
      styler(`{{bold green}}${url}${queryString}{{-}}`)
    ]

    if (hasDescription) {
      row.push(styler(`{{italic}}${getRouteConfig(route).description ?? ''}{{-}}`))
    }

    rows.push(row)
  }

  const output = table(rows, {
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

  console.log(`Available routes:\n\n${output}`)
}

export const plugin = fastifyPlugin(
  function (instance: FastifyInstance, options: FastifyPluginOptions, done: (error?: FastifyError) => void): void {
    const useColors: boolean = options.useColors ?? true
    const compact: boolean = options.compact ?? false
    const filter: RouteFilter = options.filter ?? (() => true)
    const querystring: boolean = options.querystring ?? true

    const routes: RouteOptions[] = []

    // Utility to track all the RouteOptionss we add
    instance.addHook('onRoute', route => {
      routes.push(route)
    })

    instance.addHook('onReady', done => {
      printRoutes(routes, useColors, compact, filter, querystring)
      done()
    })

    instance.decorate('routes', routes)

    done()
  },
  { name: 'fastify-print-routes', fastify: '5.x' }
)

export default plugin
