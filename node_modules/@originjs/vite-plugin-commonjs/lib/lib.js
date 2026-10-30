"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCommonJS = exports.transformRequire = void 0;
const commonJSRegex = /\b(module\.exports|exports\.\w+|exports\s*=\s*|exports\s*\[.*\]\s*=\s*)/;
const requireRegex = /_{0,2}require\s*\(\s*(["'].*?["'])\s*\)/g;
const IMPORT_STRING_PREFIX = "__require_for_vite";
const multilineCommentsRegex = /\/\*(.|[\r\n])*?\*\//gm;
const singleCommentsRegex = /([^\:])\/\/.*/g;
function transformRequire(code, id) {
    let replaced = false;
    // skip if has no require
    if (!/require/.test(code)) {
        return {
            replaced,
            code,
        };
    }
    // empty multiline comments
    code = removeComments(code, multilineCommentsRegex, '/* */');
    // remove singleline comments
    code = removeComments(code, singleCommentsRegex);
    const requireMatches = code.matchAll(requireRegex);
    let importsString = '';
    let packageName = '';
    for (let item of requireMatches) {
        if (!isString(item[1])) {
            console.warn(`Not supported dynamic import, file:${id}`);
            continue;
        }
        replaced = true;
        packageName = `${IMPORT_STRING_PREFIX}_${randomString(6)}`;
        importsString += `import * as ${packageName} from ${item[1]};\n`;
        code = code.replace(item[0], `${packageName}.default || ${packageName}`);
    }
    if (replaced) {
        code = importsString + code;
    }
    return {
        replaced,
        code,
    };
}
exports.transformRequire = transformRequire;
function isCommonJS(code) {
    return commonJSRegex.test(code);
}
exports.isCommonJS = isCommonJS;
function removeComments(code, exp, replaceValue) {
    const matches = code.matchAll(exp);
    let matcheStr;
    for (let item of matches) {
        matcheStr = item[0];
        if (matcheStr.search(requireRegex) == -1) {
            continue;
        }
        if (!replaceValue) {
            replaceValue = item[1] || '';
        }
        code = code.replace(matcheStr, replaceValue);
    }
    return code;
}
function randomString(length) {
    const code = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let result = "";
    for (let index = 0; index < length; index++) {
        result += code[Math.floor(Math.random() * code.length)];
    }
    return result;
}
function isString(text) {
    try {
        return typeof eval(text) === "string";
    }
    catch (err) {
        return false;
    }
}
//# sourceMappingURL=lib.js.map