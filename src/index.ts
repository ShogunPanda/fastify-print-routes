import { clean, colorize } from 'acquerello'
import { FastifyError, FastifyInstance, FastifyPluginOptions, RouteOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { table } from 'table'

interface RouteConfig {
  [key: string]: any
}

const methodsOrder = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS']

function getRouteConfig(r: RouteOptions): RouteConfig {
  return (r.config as RouteConfig) ?? {}
}

function printRoutes(routes: Array<RouteOptions>, useColors: boolean): void {
  if (routes.length === 0) {
    return
  }

  const styler = useColors ? colorize : clean

  // Sort routes
  routes = routes
    .filter((r: RouteOptions) => getRouteConfig(r).hide !== true)
    .sort((a: RouteOptions, b: RouteOptions) =>
      a.url !== b.url ? a.url.localeCompare(b.url) : (a.method as string).localeCompare(b.method as string)
    )

  const hasDescription = routes.some((r: RouteOptions) => 'description' in getRouteConfig(r))

  // Build the output
  const headers = [styler('{{bold white}}Method(s){{-}}'), styler('{{bold white}}Path{{-}}')]

  if (hasDescription) {
    headers.push(styler('{{bold white}}Description{{-}}'))
  }

  const rows: Array<Array<string>> = [headers]

  for (const route of routes) {
    const methods = Array.isArray(route.method) ? route.method : [route.method]

    const row = [
      styler(
        // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
        methods
          .sort((a: string, b: string) => methodsOrder.indexOf(a) - methodsOrder.indexOf(b))
          .map((m: string) => `{{cyan}}${m}{{-}}`)
          .join(' | ')
      ),
      // eslint-disable-next-line no-useless-escape
      styler(`{{bold green}}${route.url.replace(/(?:\:[\w]+|\[\:\w+\])/g, '{{yellow}}$&{{-}}')}{{-}}`)
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
    const useColors = options.useColors ?? true

    const routes: Array<RouteOptions> = []

    // Utility to track all the RouteOptionss we add
    instance.addHook('onRoute', (route: RouteOptions) => {
      routes.push(route)
    })

    instance.ready((err: Error) => {
      /* istanbul ignore if */
      if (err) {
        return
      }

      printRoutes(routes, useColors)
    })

    done()
  },
  { name: 'fastify-print-routes' }
)

export default plugin
module.exports = plugin
Object.assign(module.exports, exports)
