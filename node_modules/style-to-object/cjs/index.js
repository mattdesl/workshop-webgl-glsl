//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let inline_style_parser = require("inline-style-parser");
inline_style_parser = __toESM(inline_style_parser);
//#region src/index.ts
/**
* Parses inline style to object.
*
* @param style - Inline style.
* @param iterator - Iterator.
* @returns - Style object or null.
*
* @example Parsing inline style to object:
*
* ```js
* import parse from 'style-to-object';
* parse('line-height: 42;'); // { 'line-height': '42' }
* ```
*/
function StyleToObject(style, iterator) {
	let styleObject = null;
	if (!style || typeof style !== "string") return styleObject;
	const declarations = (0, inline_style_parser.default)(style);
	const hasIterator = typeof iterator === "function";
	declarations.forEach((declaration) => {
		if (declaration.type !== "declaration") return;
		const { property, value } = declaration;
		if (hasIterator) iterator(property, value, declaration);
		else if (value) {
			styleObject = styleObject ?? {};
			styleObject[property] = value;
		}
	});
	return styleObject;
}
//#endregion
module.exports = StyleToObject;

//# sourceMappingURL=index.js.map