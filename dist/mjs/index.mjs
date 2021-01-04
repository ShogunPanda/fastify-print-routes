import { clean, colorize } from 'acquerello';
import fastifyPlugin from 'fastify-plugin';
import { table } from 'table';
const methodsOrder = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'];
function getRouteConfig(r) {
    var _a;
    return (_a = r.config) !== null && _a !== void 0 ? _a : {};
}
function printRoutes(routes, useColors) {
    var _a;
    if (routes.length === 0) {
        return;
    }
    const styler = useColors ? colorize : clean;
    // Sort routes
    routes = routes
        .filter((r) => getRouteConfig(r).hide !== true)
        .sort((a, b) => a.url.localeCompare(b.url));
    const hasDescription = routes.some((r) => 'description' in getRouteConfig(r));
    // Build the output
    const headers = [styler('{{bold white}}Method(s){{-}}'), styler('{{bold white}}Path{{-}}')];
    if (hasDescription) {
        headers.push(styler('{{bold white}}Description{{-}}'));
    }
    const rows = [headers];
    for (const route of routes) {
        const methods = Array.isArray(route.method) ? route.method : [route.method];
        const row = [
            styler(
            // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
            methods
                .sort((a, b) => methodsOrder.indexOf(a) - methodsOrder.indexOf(b))
                .map((m) => `{{cyan}}${m}{{-}}`)
                .join(' | ')),
            // eslint-disable-next-line no-useless-escape
            styler(`{{bold green}}${route.url.replace(/(?:\:[\w]+|\[\:\w+\])/g, '{{yellow}}$&{{-}}')}{{-}}`)
        ];
        if (hasDescription) {
            row.push(styler(`{{italic}}${(_a = getRouteConfig(route).description) !== null && _a !== void 0 ? _a : ''}{{-}}`));
        }
        rows.push(row);
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
        drawHorizontalLine(index, size) {
            return index < 2 || index > size - 1;
        }
    });
    console.log(`Available routes:\n\n${output}`);
}
export const plugin = fastifyPlugin(function (instance, options, done) {
    var _a;
    const useColors = (_a = options.useColors) !== null && _a !== void 0 ? _a : true;
    const routes = [];
    // Utility to track all the RouteOptionss we add
    instance.addHook('onRoute', (route) => {
        routes.push(route);
    });
    instance.ready((err) => {
        /* istanbul ignore if */
        if (err) {
            return;
        }
        printRoutes(routes, useColors);
    });
    done();
}, { name: 'fastify-print-routes' });
export default plugin;
// Fix CommonJS exporting
/* istanbul ignore else */
if (typeof module !== 'undefined') {
    module.exports = plugin;
    Object.assign(module.exports, exports);
}
