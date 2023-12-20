import { clean, colorize } from 'acquerello'
import { type FastifyError, type FastifyInstance, type FastifyPluginOptions, type RouteOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { table } from 'table'

type RouteConfig = Record<string, any>

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

function printRoutes(routes: RouteOptions[], useColors: boolean, compact: boolean): void {
  if (routes.length === 0) {
    return
  }

  const styler = useColors ? colorize : clean

  // Sort and eventually unify routes
  routes = routes.filter(r => getRouteConfig(r).hide !== true).sort(sortRoutes)

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

    const row = [
      styler(
        methods
          .sort((a, b) => methodsOrder.indexOf(a) - methodsOrder.indexOf(b))
          .map(m => `{{cyan}}${m}{{-}}`)
          .join(' | ')
      ),

      styler(`{{bold green}}${route.url.replaceAll(/:\w+|\[:\w+]/g, '{{yellow}}$&{{-}}')}{{-}}`)
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

    const routes: RouteOptions[] = []

    // Utility to track all the RouteOptionss we add
    instance.addHook('onRoute', route => {
      routes.push(route)
    })

    instance.addHook('onReady', done => {
      printRoutes(routes, useColors, compact)
      done()
    })

    done()
  },
  { name: 'fastify-print-routes', fastify: '4.x' }
)

export default plugin
