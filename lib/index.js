"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const acquerello_1 = require("acquerello");
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const table_1 = require("table");
function printRoutes(routes, useColors) {
    var _a, _b;
    if (routes.length === 0) {
        return;
    }
    const styler = useColors ? acquerello_1.colorize : acquerello_1.clean;
    // Sort routes
    routes = routes
        .filter((r) => { var _a; return ((_a = r.config) === null || _a === void 0 ? void 0 : _a.hide) !== true; })
        .sort((a, b) => a.url !== b.url ? a.url.localeCompare(b.url) : a.method.localeCompare(b.method));
    // Build the output
    const rows = [
        [
            styler('{{bold white}}Method(s){{-}}'),
            styler('{{bold white}}Path{{-}}'),
            styler('{{bold white}}Description{{-}}')
        ]
    ];
    for (const route of routes) {
        const methods = Array.isArray(route.method) ? route.method : [route.method];
        rows.push([
            styler(
            // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
            methods
                .sort()
                .map((m) => `{{cyan}}${m}{{-}}`)
                .join(' | ')),
            // eslint-disable-next-line no-useless-escape
            styler(`{{bold green}}${route.url.replace(/(?:\:[\w]+|\[\:\w+\])/g, '{{yellow}}$&{{-}}')}{{-}}`),
            styler(`{{italic}}${(_b = (_a = route.config) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : ''}{{-}}`)
        ]);
    }
    const output = table_1.table(rows, {
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
exports.plugin = fastify_plugin_1.default(function (instance, options, done) {
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
exports.default = exports.plugin;
module.exports = exports.plugin;
Object.assign(module.exports, exports);
