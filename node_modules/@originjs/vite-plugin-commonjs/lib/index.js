"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.esbuildCommonjs = exports.viteCommonjs = void 0;
const esbuild_1 = require("esbuild");
const lib_1 = require("./lib");
const fs = __importStar(require("fs"));
const filter_1 = __importDefault(require("./filter"));
function viteCommonjs(options = { skipPreBuild: false }) {
    const filter = filter_1.default(options.include, options.exclude);
    return {
        name: "originjs:commonjs",
        apply: "serve",
        transform(code, id) {
            if (!filter(id) ||
                (options.skipPreBuild && id.indexOf("/node_modules/.vite/") !== -1)) {
                return null;
            }
            let result = lib_1.transformRequire(code, id);
            if (id.indexOf("/node_modules/.vite/") == -1 && lib_1.isCommonJS(code)) {
                return esbuild_1.transformSync(result.code, { format: "esm" });
            }
            if (result.replaced) {
                return {
                    code: result.code,
                    map: null,
                    warnings: null,
                };
            }
            return null;
        },
    };
}
exports.viteCommonjs = viteCommonjs;
function esbuildCommonjs(include = []) {
    return {
        name: "originjs:commonjs",
        setup(build) {
            build.onLoad({
                filter: new RegExp("(" + include.join("|") + ").*.js"),
                namespace: "file",
            }, async ({ path: id }) => {
                const code = fs.readFileSync(id).toString();
                let result = lib_1.transformRequire(code, id);
                if (result.replaced) {
                    return {
                        contents: result.code,
                        loader: "js",
                    };
                }
                return null;
            });
        },
    };
}
exports.esbuildCommonjs = esbuildCommonjs;
//# sourceMappingURL=index.js.map