/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
import * as mdurl from "mdurl";
import * as ucmicro from "uc.micro";
import { decodeHTMLStrict } from "entities";
import { LinkifyIt } from "linkify-it";
import punycode from "punycode.js";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region src/common/utils.ts
/**
* Common utility functions exposed through `md.utils` for use by plugins.
*
* @module md.utils
*/
var utils_exports = /* @__PURE__ */ __exportAll({
	arrayReplaceAt: () => arrayReplaceAt,
	asciiTrim: () => asciiTrim,
	callable: () => callable,
	escapeHtml: () => escapeHtml,
	escapeRE: () => escapeRE,
	fromCodePoint: () => fromCodePoint,
	isMdAsciiPunct: () => isMdAsciiPunct,
	isPunctChar: () => isPunctChar,
	isPunctCharCode: () => isPunctCharCode,
	isSpace: () => isSpace,
	isValidEntityCode: () => isValidEntityCode,
	isWhiteSpace: () => isWhiteSpace,
	lib: () => lib,
	normalizeReference: () => normalizeReference,
	unescapeAll: () => unescapeAll,
	unescapeMd: () => unescapeMd
});
function callable(cls) {
	const wrapper = function(...args) {
		return Reflect.construct(cls, args, new.target && new.target !== wrapper ? new.target : cls);
	};
	Object.defineProperty(wrapper, "name", { value: cls.name });
	Object.setPrototypeOf(wrapper, cls);
	wrapper.prototype = cls.prototype;
	return wrapper;
}
/**
* Returns a copy of a token array with the token at `pos` replaced by
* `newElements`. Used to transform token streams without modifying the
* original array.
*/
function arrayReplaceAt(src, pos, newElements) {
	return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
}
/** Checks whether a code point can be decoded from a numeric HTML entity. */
function isValidEntityCode(c) {
	if (c >= 55296 && c <= 57343) return false;
	if (c >= 64976 && c <= 65007) return false;
	if ((c & 65535) === 65535 || (c & 65535) === 65534) return false;
	if (c >= 0 && c <= 8) return false;
	if (c === 11) return false;
	if (c >= 14 && c <= 31) return false;
	if (c >= 127 && c <= 159) return false;
	if (c > 1114111) return false;
	return true;
}
/**
* Converts a Unicode code point to a string, like `String.fromCodePoint()`,
* but does not throw for invalid input.
*/
function fromCodePoint(c) {
	if (c > 65535) {
		c -= 65536;
		const surrogate1 = 55296 + (c >> 10);
		const surrogate2 = 56320 + (c & 1023);
		return String.fromCharCode(surrogate1, surrogate2);
	}
	return String.fromCharCode(c);
}
var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
var UNESCAPE_ALL_RE = new RegExp(`${UNESCAPE_MD_RE.source}|${/&([a-z#][a-z0-9]{1,31});/gi.source}`, "gi");
var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function replaceEntityPattern(match, name) {
	if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
		const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
		if (isValidEntityCode(code)) return fromCodePoint(code);
		return match;
	}
	const decoded = decodeHTMLStrict(match);
	if (decoded !== match) return decoded;
	return match;
}
/** Decodes Markdown backslash escapes. */
function unescapeMd(str) {
	if (str.indexOf("\\") < 0) return str;
	return str.replace(UNESCAPE_MD_RE, "$1");
}
/**
* Decodes Markdown backslash escapes and HTML character references in link
* destinations, link titles, and fenced code info strings.
*/
function unescapeAll(str) {
	if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) return str;
	return str.replace(UNESCAPE_ALL_RE, function(match, escaped, entity) {
		if (escaped) return escaped;
		return replaceEntityPattern(match, entity);
	});
}
var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;"
};
function replaceUnsafeChar(ch) {
	return HTML_REPLACEMENTS[ch];
}
/** Escapes HTML special characters in a string. */
function escapeHtml(str) {
	if (HTML_ESCAPE_TEST_RE.test(str)) return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
	return str;
}
var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;
/** Escapes regular expression metacharacters in a string. */
function escapeRE(str) {
	return str.replace(REGEXP_ESCAPE_RE, "\\$&");
}
/** Checks whether a character code is an ASCII space or tab. */
function isSpace(code) {
	switch (code) {
		case 9:
		case 32: return true;
	}
	return false;
}
/**
* Checks whether a character code is whitespace recognized by Markdown.
*
* Matches the Unicode `Zs` category or `\t`, `\f`, `\v`, `\r`, `\n`.
*/
function isWhiteSpace(code) {
	if (code >= 8192 && code <= 8202) return true;
	switch (code) {
		case 9:
		case 10:
		case 11:
		case 12:
		case 13:
		case 32:
		case 160:
		case 5760:
		case 8239:
		case 8287:
		case 12288: return true;
	}
	return false;
}
/**
* Checks whether a character is Unicode punctuation or a symbol.
*
* Does not support astral characters.
*/
function isPunctChar(ch) {
	return ucmicro.P.test(ch) || ucmicro.S.test(ch);
}
/** Checks whether a Unicode code point is punctuation or a symbol. */
function isPunctCharCode(code) {
	return isPunctChar(fromCodePoint(code));
}
/**
* Markdown ASCII punctuation characters.
*
*     !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @,
*     [, \, ], ^, _, `, {, |, }, or ~
*
* http://spec.commonmark.org/0.15/#ascii-punctuation-character
*
* Don't confuse with Unicode punctuation. It lacks some characters in the
* ASCII range.
*/
function isMdAsciiPunct(ch) {
	switch (ch) {
		case 33:
		case 34:
		case 35:
		case 36:
		case 37:
		case 38:
		case 39:
		case 40:
		case 41:
		case 42:
		case 43:
		case 44:
		case 45:
		case 46:
		case 47:
		case 58:
		case 59:
		case 60:
		case 61:
		case 62:
		case 63:
		case 64:
		case 91:
		case 92:
		case 93:
		case 94:
		case 95:
		case 96:
		case 123:
		case 124:
		case 125:
		case 126: return true;
		default: return false;
	}
}
/** Normalizes `[reference labels]` for case-insensitive lookup. */
function normalizeReference(str) {
	str = str.trim().replace(/\s+/g, " ");
	return str.toLowerCase().toUpperCase();
}
function isAsciiTrimmable(c) {
	return c === 32 || c === 9 || c === 10 || c === 13;
}
/**
* "Light" `.trim()` for blocks (headings, paragraphs), where Unicode spaces
* should be preserved.
*/
function asciiTrim(str) {
	let start = 0;
	for (; start < str.length; start++) if (!isAsciiTrimmable(str.charCodeAt(start))) break;
	let end = str.length - 1;
	for (; end >= start; end--) if (!isAsciiTrimmable(str.charCodeAt(end))) break;
	return str.slice(start, end + 1);
}
/**
* Libraries commonly used by markdown-it and its plugins, re-exported to
* reduce duplicate dependencies in browser bundles.
*/
var lib = {
	mdurl,
	ucmicro
};
//#endregion
//#region src/helpers/parse_link_label.ts
/** Finds the end of a link or image label (`[label]`). */
function parseLinkLabel(state, start, disableNested) {
	let level, found, marker, prevPos;
	const max = state.posMax;
	const oldPos = state.pos;
	state.pos = start + 1;
	level = 1;
	while (state.pos < max) {
		marker = state.src.charCodeAt(state.pos);
		if (marker === 93) {
			level--;
			if (level === 0) {
				found = true;
				break;
			}
		}
		prevPos = state.pos;
		state.md.inline.skipToken(state);
		if (marker === 91) {
			if (prevPos === state.pos - 1) level++;
			else if (disableNested) {
				state.pos = oldPos;
				return -1;
			}
		}
	}
	let labelEnd = -1;
	if (found) labelEnd = state.pos;
	state.pos = oldPos;
	return labelEnd;
}
//#endregion
//#region src/helpers/parse_link_destination.ts
/** Parses the destination in `[label](destination "title")`. */
function parseLinkDestination(str, start, max) {
	let code;
	let pos = start;
	const result = {
		ok: false,
		pos: 0,
		str: ""
	};
	if (str.charCodeAt(pos) === 60) {
		pos++;
		while (pos < max) {
			code = str.charCodeAt(pos);
			if (code === 10) return result;
			if (code === 60) return result;
			if (code === 62) {
				result.pos = pos + 1;
				result.str = unescapeAll(str.slice(start + 1, pos));
				result.ok = true;
				return result;
			}
			if (code === 92 && pos + 1 < max) {
				pos += 2;
				continue;
			}
			pos++;
		}
		return result;
	}
	let level = 0;
	while (pos < max) {
		code = str.charCodeAt(pos);
		if (code === 32) break;
		if (code < 32 || code === 127) break;
		if (code === 92 && pos + 1 < max) {
			if (str.charCodeAt(pos + 1) === 32) {
				pos++;
				continue;
			}
			pos += 2;
			continue;
		}
		if (code === 40) {
			level++;
			if (level > 32) return result;
		}
		if (code === 41) {
			if (level === 0) break;
			level--;
		}
		pos++;
	}
	if (start === pos) return result;
	if (level !== 0) return result;
	result.str = unescapeAll(str.slice(start, pos));
	result.pos = pos;
	result.ok = true;
	return result;
}
//#endregion
//#region src/helpers/parse_link_title.ts
/**
* Parses the optional title in `[label](destination "title")` or
* `[label]: destination "title"`.
*
* `prev_state` continues a reference title on the next source line.
*/
function parseLinkTitle(str, start, max, prev_state) {
	let code;
	let pos = start;
	const state = {
		ok: false,
		can_continue: false,
		pos: 0,
		str: "",
		marker: 0
	};
	if (prev_state) {
		state.str = prev_state.str;
		state.marker = prev_state.marker;
	} else {
		if (pos >= max) return state;
		let marker = str.charCodeAt(pos);
		if (marker !== 34 && marker !== 39 && marker !== 40) return state;
		start++;
		pos++;
		if (marker === 40) marker = 41;
		state.marker = marker;
	}
	while (pos < max) {
		code = str.charCodeAt(pos);
		if (code === state.marker) {
			state.pos = pos + 1;
			state.str += unescapeAll(str.slice(start, pos));
			state.ok = true;
			return state;
		} else if (code === 40 && state.marker === 41) return state;
		else if (code === 92 && pos + 1 < max) pos++;
		pos++;
	}
	state.can_continue = true;
	state.str += unescapeAll(str.slice(start, pos));
	return state;
}
//#endregion
//#region src/helpers/index.ts
/**
* Functions used to parse links and images, split out of parser rules because
* of their size.
*
* @module md.helpers
*/
var helpers_exports = /* @__PURE__ */ __exportAll({
	parseLinkDestination: () => parseLinkDestination,
	parseLinkLabel: () => parseLinkLabel,
	parseLinkTitle: () => parseLinkTitle
});
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
//#region src/token.ts
/**
* Represents one item in the parsed token stream, storing parsed data and
* providing helpers for managing HTML attributes.
*/
var Token = class {
	constructor(type, tag, nesting) {
		_defineProperty(
			this,
			/**
			* Source map info. Format: `[ line_begin, line_end ]`
			*/
			"map",
			null
		);
		_defineProperty(
			this,
			/**
			* nesting level, the same as `state.level`
			*/
			"level",
			0
		);
		_defineProperty(
			this,
			/**
			* An array of child nodes (inline and img tokens)
			*/
			"children",
			null
		);
		_defineProperty(
			this,
			/**
			* In a case of self-closing tag (code, html, fence, etc.),
			* it has contents of this tag.
			*/
			"content",
			""
		);
		_defineProperty(
			this,
			/**
			* '*' or '_' for emphasis, fence string for fence, etc.
			*/
			"markup",
			""
		);
		_defineProperty(
			this,
			/**
			* Additional information:
			*
			* - Info string for "fence" tokens
			* - The value "auto" for autolink "link_open" and "link_close" tokens
			* - The string value of the item marker for ordered-list "list_item_open" tokens
			*/
			"info",
			""
		);
		_defineProperty(
			this,
			/**
			* True for block-level tokens, false for inline tokens.
			* Used in renderer to calculate line breaks
			*/
			"block",
			false
		);
		_defineProperty(
			this,
			/**
			* If it's true, ignore this element when rendering. Used for tight lists
			* to hide paragraphs.
			*/
			"hidden",
			false
		);
		this.type = type;
		this.tag = tag;
		this.attrs = null;
		this.nesting = nesting;
		this.meta = null;
	}
	/**
	* Search attribute index by name.
	*/
	attrIndex(name) {
		if (!this.attrs) return -1;
		const attrs = this.attrs;
		for (let i = 0, len = attrs.length; i < len; i++) if (attrs[i][0] === name) return i;
		return -1;
	}
	/**
	* Add `[ name, value ]` attribute to list. Init attrs if necessary
	*/
	attrPush(attrData) {
		if (this.attrs) this.attrs.push(attrData);
		else this.attrs = [attrData];
	}
	/**
	* Set `name` attribute to `value`. Override old value if exists.
	*/
	attrSet(name, value) {
		const idx = this.attrIndex(name);
		const attrData = [name, value];
		if (idx < 0) this.attrPush(attrData);
		else this.attrs[idx] = attrData;
	}
	/**
	* Get the value of attribute `name`, or null if it does not exist.
	*/
	attrGet(name) {
		const idx = this.attrIndex(name);
		let value = null;
		if (idx >= 0) value = this.attrs[idx][1];
		return value;
	}
	/**
	* Join value to existing attribute via space. Or create new attribute if not
	* exists. Useful to operate with token classes.
	*/
	attrJoin(name, value) {
		const idx = this.attrIndex(name);
		if (idx < 0) this.attrPush([name, value]);
		else this.attrs[idx][1] = `${this.attrs[idx][1]} ${value}`;
	}
};
//#endregion
//#region src/ruler.ts
/**
* Helper class, used by {@link MarkdownIt.core}, {@link MarkdownIt.block} and
* {@link MarkdownIt.inline} to manage sequences of functions (rules):
*
* - keep rules in defined order
* - assign the name to each rule
* - enable/disable rules
* - add/replace rules
* - allow assign rules to additional named chains (in the same)
* - cacheing lists of active rules
*
* You will not need use this class directly until write plugins. For simple
* rules control use {@link MarkdownIt.disable}, {@link MarkdownIt.enable} and
* {@link MarkdownIt.use}.
*/
var Ruler = class {
	constructor() {
		_defineProperty(
			this,
			/** @internal */
			"__rules__",
			[]
		);
		_defineProperty(
			this,
			/** @internal */
			"__cache__",
			null
		);
	}
	/** @internal */
	__find__(name) {
		for (let i = 0; i < this.__rules__.length; i++) if (this.__rules__[i].name === name) return i;
		return -1;
	}
	/** @internal */
	__compile__() {
		const chains = /* @__PURE__ */ new Set();
		this.__rules__.forEach((rule) => {
			if (!rule.enabled) return;
			rule.alt.forEach((altName) => {
				if (altName) chains.add(altName);
			});
		});
		this.__cache__ = Object.create(null);
		this.__cache__[""] = [];
		this.__rules__.forEach((rule) => {
			if (rule.enabled) this.__cache__[""].push(rule.fn);
		});
		chains.forEach((chain) => {
			this.__cache__[chain] = [];
			this.__rules__.forEach((rule) => {
				if (rule.enabled && rule.alt.indexOf(chain) >= 0) this.__cache__[chain].push(rule.fn);
			});
		});
	}
	/**
	* Replace rule by name with new function & options. Throws error if name not
	* found.
	*
	* @example Replace existing typographer replacement rule with new one
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* md.core.ruler.at('replacements', function replace(state) {
	*   //...
	* });
	* ```
	*/
	at(name, fn, options = {}) {
		const index = this.__find__(name);
		if (index === -1) throw new Error(`Parser rule not found: ${name}`);
		this.__rules__[index].fn = fn;
		this.__rules__[index].alt = options.alt || [];
		this.__cache__ = null;
	}
	/**
	* Add new rule to chain before one with given name. See also
	* {@link Ruler.after}, {@link Ruler.push}.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
	*   //...
	* });
	* ```
	*/
	before(beforeName, ruleName, fn, options = {}) {
		const index = this.__find__(beforeName);
		if (index === -1) throw new Error(`Parser rule not found: ${beforeName}`);
		this.__rules__.splice(index, 0, {
			name: ruleName,
			enabled: true,
			fn,
			alt: options.alt || []
		});
		this.__cache__ = null;
	}
	/**
	* Add new rule to chain after one with given name. See also
	* {@link Ruler.before}, {@link Ruler.push}.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* md.inline.ruler.after('text', 'my_rule', function replace(state) {
	*   //...
	* });
	* ```
	*/
	after(afterName, ruleName, fn, options = {}) {
		const index = this.__find__(afterName);
		if (index === -1) throw new Error(`Parser rule not found: ${afterName}`);
		this.__rules__.splice(index + 1, 0, {
			name: ruleName,
			enabled: true,
			fn,
			alt: options.alt || []
		});
		this.__cache__ = null;
	}
	/**
	* Push new rule to the end of chain. See also
	* {@link Ruler.before}, {@link Ruler.after}.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* md.core.ruler.push('my_rule', function replace(state) {
	*   //...
	* });
	* ```
	*/
	push(ruleName, fn, options = {}) {
		this.__rules__.push({
			name: ruleName,
			enabled: true,
			fn,
			alt: options.alt || []
		});
		this.__cache__ = null;
	}
	/**
	* Enable rules with given names. If any rule name not found - throw Error.
	* Errors can be disabled by second param.
	*
	* See also {@link Ruler.disable}, {@link Ruler.enableOnly}.
	*
	* Returns list of found rule names (if no exception happened).
	*/
	enable(list, ignoreInvalid = false) {
		if (!Array.isArray(list)) list = [list];
		const result = [];
		list.forEach((name) => {
			const idx = this.__find__(name);
			if (idx < 0) {
				if (ignoreInvalid) return;
				throw new Error(`Rules manager: invalid rule name ${name}`);
			}
			this.__rules__[idx].enabled = true;
			result.push(name);
		});
		this.__cache__ = null;
		return result;
	}
	/**
	* Enable rules with given names, and disable everything else. If any rule name
	* not found - throw Error. Errors can be disabled by second param.
	*
	* See also {@link Ruler.disable}, {@link Ruler.enable}.
	*/
	enableOnly(list, ignoreInvalid = false) {
		if (!Array.isArray(list)) list = [list];
		this.__rules__.forEach((rule) => {
			rule.enabled = false;
		});
		this.enable(list, ignoreInvalid);
	}
	/**
	* Disable rules with given names. If any rule name not found - throw Error.
	* Errors can be disabled by second param.
	*
	* See also {@link Ruler.enable}, {@link Ruler.enableOnly}.
	*
	* Returns list of found rule names (if no exception happened).
	*/
	disable(list, ignoreInvalid = false) {
		if (!Array.isArray(list)) list = [list];
		const result = [];
		list.forEach((name) => {
			const idx = this.__find__(name);
			if (idx < 0) {
				if (ignoreInvalid) return;
				throw new Error(`Rules manager: invalid rule name ${name}`);
			}
			this.__rules__[idx].enabled = false;
			result.push(name);
		});
		this.__cache__ = null;
		return result;
	}
	/**
	* Return array of active functions (rules) for given chain name. It analyzes
	* rules configuration, compiles caches if not exists and returns result.
	*
	* Default chain name is `''` (empty string). It can't be skipped. That's
	* done intentionally, to keep signature monomorphic for high speed.
	*/
	getRules(chainName) {
		if (!this.__cache__) this.__compile__();
		return this.__cache__[chainName] || [];
	}
};
//#endregion
//#region src/renderer.ts
var default_rules = {};
default_rules.code_inline = function(tokens, idx, options, env, slf) {
	const token = tokens[idx];
	return `<code${slf.renderAttrs(token)}>${escapeHtml(token.content)}</code>`;
};
default_rules.code_block = function(tokens, idx, options, env, slf) {
	const token = tokens[idx];
	return `<pre${slf.renderAttrs(token)}><code>${escapeHtml(tokens[idx].content)}</code></pre>\n`;
};
default_rules.fence = function(tokens, idx, options, env, slf) {
	const token = tokens[idx];
	const info = token.info ? unescapeAll(token.info).trim() : "";
	let langName = "";
	let langAttrs = "";
	if (info) {
		const arr = info.split(/(\s+)/g);
		langName = arr[0];
		langAttrs = arr.slice(2).join("");
	}
	let highlighted;
	if (options.highlight) highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
	else highlighted = escapeHtml(token.content);
	if (highlighted.indexOf("<pre") === 0) return highlighted + "\n";
	if (info) {
		const i = token.attrIndex("class");
		const tmpAttrs = token.attrs ? token.attrs.slice() : [];
		if (i < 0) tmpAttrs.push(["class", `${options.langPrefix}${langName}`]);
		else {
			tmpAttrs[i] = [tmpAttrs[i][0], tmpAttrs[i][1]];
			tmpAttrs[i][1] += ` ${options.langPrefix}${langName}`;
		}
		const tmpToken = { attrs: tmpAttrs };
		return `<pre><code${slf.renderAttrs(tmpToken)}>${highlighted}</code></pre>\n`;
	}
	return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>\n`;
};
default_rules.image = function(tokens, idx, options, env, slf) {
	const token = tokens[idx];
	token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
	return slf.renderToken(tokens, idx, options);
};
default_rules.hardbreak = function(tokens, idx, options) {
	return options.xhtmlOut ? "<br />\n" : "<br>\n";
};
default_rules.softbreak = function(tokens, idx, options) {
	return options.breaks ? options.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
};
default_rules.text = function(tokens, idx) {
	return escapeHtml(tokens[idx].content);
};
default_rules.html_block = function(tokens, idx) {
	return tokens[idx].content;
};
default_rules.html_inline = function(tokens, idx) {
	return tokens[idx].content;
};
/**
* Generates HTML from parsed token stream. Each instance has independent
* copy of rules. Those can be rewritten with ease. Also, you can add new
* rules if you create plugin and adds new token types.
*
* Creates new renderer instance and fills {@link Renderer.rules} with defaults.
*/
var Renderer = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* Contains render rules for tokens. Can be updated and extended.
			*
			* See [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts)
			* for more details and examples.
			*
			* @example Custom render rules
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* md.renderer.rules.strong_open  = function () { return '<b>'; };
			* md.renderer.rules.strong_close = function () { return '</b>'; };
			*
			* const result = md.renderInline(...);
			* ```
			*
			* @example Each rule is called as independent static function with fixed signature
			* ```javascript
			* function my_token_render(tokens, idx, options, env, renderer) {
			*   // ...
			*   return renderedHTML;
			* }
			* ```
			*/
			"rules",
			Object.assign({}, default_rules)
		);
	}
	/**
	* Render token attributes to string.
	*/
	renderAttrs(token) {
		let i, l, result;
		if (!token.attrs) return "";
		result = "";
		for (i = 0, l = token.attrs.length; i < l; i++) result += ` ${escapeHtml(token.attrs[i][0])}="${escapeHtml(String(token.attrs[i][1]))}"`;
		return result;
	}
	/**
	* Default token renderer. Can be overriden by custom function
	* in {@link Renderer.rules}.
	*/
	renderToken(tokens, idx, options) {
		const token = tokens[idx];
		let result = "";
		if (token.hidden) return "";
		let prev = idx - 1;
		while (prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === 0) prev--;
		if (token.block && token.nesting !== -1 && prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === -1) result += "\n";
		result += (token.nesting === -1 ? "</" : "<") + token.tag;
		result += this.renderAttrs(token);
		if (token.nesting === 0 && options.xhtmlOut) result += " /";
		let needLf = false;
		if (token.block) {
			needLf = true;
			if (token.nesting === 1) {
				let next = idx + 1;
				while (next < tokens.length && tokens[next].hidden && tokens[next].nesting === 0) next++;
				if (next < tokens.length) {
					const nextToken = tokens[next];
					if (nextToken.type === "inline" || nextToken.hidden) needLf = false;
					else if (nextToken.nesting === -1 && nextToken.tag === token.tag) needLf = false;
				}
			}
		}
		result += needLf ? ">\n" : ">";
		return result;
	}
	/**
	* The same as {@link Renderer.render}, but for single token of `inline` type.
	*/
	renderInline(tokens, options, env) {
		let result = "";
		const rules = this.rules;
		for (let i = 0, len = tokens.length; i < len; i++) {
			const type = tokens[i].type;
			if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
			else result += this.renderToken(tokens, i, options);
		}
		return result;
	}
	/**
	* Special kludge for image `alt` attributes to conform CommonMark spec.
	* Don't try to use it! Spec requires to show `alt` content with stripped markup,
	* instead of simple escaping.
	*/
	renderInlineAsText(tokens, options, env) {
		let result = "";
		for (let i = 0, len = tokens.length; i < len; i++) switch (tokens[i].type) {
			case "text":
			case "code_inline":
				result += tokens[i].content;
				break;
			case "image":
				result += this.renderInlineAsText(tokens[i].children, options, env);
				break;
			case "html_inline":
			case "html_block":
				result += tokens[i].content;
				break;
			case "softbreak":
			case "hardbreak": result += "\n";
		}
		return result;
	}
	/**
	* Takes token stream and generates HTML. Probably, you will never need to call
	* this method directly.
	*/
	render(tokens, options, env) {
		let result = "";
		const rules = this.rules;
		for (let i = 0, len = tokens.length; i < len; i++) {
			const type = tokens[i].type;
			if (type === "inline") result += this.renderInline(tokens[i].children, options, env);
			else if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
			else result += this.renderToken(tokens, i, options);
		}
		return result;
	}
};
//#endregion
//#region src/rules_core/state_core.ts
/** Mutable state passed through the core rules chain. */
var StateCore = class {
	constructor(src, md, env) {
		_defineProperty(this, "tokens", []);
		_defineProperty(this, "inlineMode", false);
		_defineProperty(this, "Token", Token);
		this.src = src;
		this.env = env;
		this.md = md;
	}
};
//#endregion
//#region src/rules_core/normalize.ts
var UNNORMALIZED_NEWLINE_RE = /\r\n?/g;
var NULL_RE = /\0/g;
function normalize(state) {
	let str;
	str = state.src.replace(UNNORMALIZED_NEWLINE_RE, "\n");
	str = str.replace(NULL_RE, "�");
	state.src = str;
}
//#endregion
//#region src/rules_core/block.ts
function block(state) {
	let token;
	if (state.inlineMode) {
		token = new state.Token("inline", "", 0);
		token.content = state.src;
		token.map = [0, 1];
		token.children = [];
		state.tokens.push(token);
	} else state.md.block.parse(state.src, state.md, state.env, state.tokens);
}
//#endregion
//#region src/rules_core/strip_references.ts
function strip_references(state) {
	const tokens = state.tokens;
	let last = 0;
	for (let curr = 0; curr < tokens.length; curr++) {
		if (tokens[curr].type === "reference_definition") continue;
		if (curr !== last) tokens[last] = tokens[curr];
		last++;
	}
	if (tokens.length !== last) tokens.length = last;
}
//#endregion
//#region src/rules_core/inline.ts
function inline(state) {
	const tokens = state.tokens;
	for (let i = 0, l = tokens.length; i < l; i++) {
		const tok = tokens[i];
		if (tok.type === "inline") state.md.inline.parse(tok.content, state.md, state.env, tok.children);
	}
}
//#endregion
//#region src/rules_core/linkify.ts
function isLinkOpen$1(str) {
	return /^<a[>\s]/i.test(str);
}
function isLinkClose$1(str) {
	return /^<\/a\s*>/i.test(str);
}
function linkify$1(state) {
	const blockTokens = state.tokens;
	if (!state.md.options.linkify) return;
	for (let j = 0, l = blockTokens.length; j < l; j++) {
		if (blockTokens[j].type !== "inline" || !state.md.linkify.test(blockTokens[j].content)) continue;
		const tokens = blockTokens[j].children;
		const replacements = [];
		let htmlLinkLevel = 0;
		for (let i = tokens.length - 1; i >= 0; i--) {
			const currentToken = tokens[i];
			if (currentToken.type === "link_close") {
				i--;
				while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") i--;
				continue;
			}
			if (currentToken.type === "html_inline") {
				if (isLinkOpen$1(currentToken.content) && htmlLinkLevel > 0) htmlLinkLevel--;
				if (isLinkClose$1(currentToken.content)) htmlLinkLevel++;
			}
			if (htmlLinkLevel > 0) continue;
			if (currentToken.type === "text" && state.md.linkify.test(currentToken.content)) {
				const text = currentToken.content;
				let links = state.md.linkify.match(text);
				const nodes = [];
				let level = currentToken.level;
				let lastPos = 0;
				if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") links = links.slice(1);
				for (let ln = 0; ln < links.length; ln++) {
					const url = links[ln].url;
					const fullUrl = state.md.normalizeLink(url);
					if (!state.md.validateLink(fullUrl)) continue;
					let urlText = links[ln].text;
					if (!links[ln].schema) urlText = state.md.normalizeLinkText(`http://${urlText}`).replace(/^http:\/\//, "");
					else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) urlText = state.md.normalizeLinkText(`mailto:${urlText}`).replace(/^mailto:/, "");
					else urlText = state.md.normalizeLinkText(urlText);
					const pos = links[ln].index;
					if (pos > lastPos) {
						const token = new state.Token("text", "", 0);
						token.content = text.slice(lastPos, pos);
						token.level = level;
						nodes.push(token);
					}
					const token_o = new state.Token("link_open", "a", 1);
					token_o.attrs = [["href", fullUrl]];
					token_o.level = level++;
					token_o.markup = "linkify";
					token_o.info = "auto";
					nodes.push(token_o);
					const token_t = new state.Token("text", "", 0);
					token_t.content = urlText;
					token_t.level = level;
					nodes.push(token_t);
					const token_c = new state.Token("link_close", "a", -1);
					token_c.level = --level;
					token_c.markup = "linkify";
					token_c.info = "auto";
					nodes.push(token_c);
					lastPos = links[ln].lastIndex;
				}
				if (lastPos < text.length) {
					const token = new state.Token("text", "", 0);
					token.content = text.slice(lastPos);
					token.level = level;
					nodes.push(token);
				}
				replacements.push({
					index: i,
					nodes
				});
			}
		}
		if (replacements.length > 0) {
			let newTokensLength = tokens.length;
			for (const replacement of replacements) newTokensLength += replacement.nodes.length - 1;
			const newTokens = new Array(newTokensLength);
			let replacementIndex = 0;
			let newTokenIndex = 0;
			replacements.reverse();
			for (let i = 0; i < tokens.length; i++) {
				const replacement = replacements[replacementIndex];
				if ((replacement === null || replacement === void 0 ? void 0 : replacement.index) === i) {
					for (const node of replacement.nodes) newTokens[newTokenIndex++] = node;
					replacementIndex++;
				} else newTokens[newTokenIndex++] = tokens[i];
			}
			blockTokens[j].children = newTokens;
		}
	}
}
//#endregion
//#region src/rules_core/replacements.ts
var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;
var SCOPED_ABBR_RE = /\((c|tm|r)\)/gi;
var SCOPED_ABBR = {
	c: "©",
	r: "®",
	tm: "™"
};
function replaceFn(match, name) {
	return SCOPED_ABBR[name.toLowerCase()];
}
function replace_scoped(inlineTokens) {
	let inside_autolink = 0;
	for (let i = inlineTokens.length - 1; i >= 0; i--) {
		const token = inlineTokens[i];
		if (token.type === "text" && !inside_autolink) token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
		if (token.type === "link_open" && token.info === "auto") inside_autolink--;
		if (token.type === "link_close" && token.info === "auto") inside_autolink++;
	}
}
function replace_rare(inlineTokens) {
	let inside_autolink = 0;
	for (let i = inlineTokens.length - 1; i >= 0; i--) {
		const token = inlineTokens[i];
		if (token.type === "text" && !inside_autolink) {
			if (RARE_RE.test(token.content)) token.content = token.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–");
		}
		if (token.type === "link_open" && token.info === "auto") inside_autolink--;
		if (token.type === "link_close" && token.info === "auto") inside_autolink++;
	}
}
function replace(state) {
	let blkIdx;
	if (!state.md.options.typographer) return;
	for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
		if (state.tokens[blkIdx].type !== "inline") continue;
		if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) replace_scoped(state.tokens[blkIdx].children);
		if (RARE_RE.test(state.tokens[blkIdx].content)) replace_rare(state.tokens[blkIdx].children);
	}
}
//#endregion
//#region src/rules_core/smartquotes.ts
var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var APOSTROPHE = "’";
var MAX_OPENERS = 1e3;
function truncateStack(stack, heads, length) {
	while (stack.length > length) {
		const item = stack.pop();
		if (item.isSingleQuote) heads.single = item.prevSameQuoteIdx;
		else heads.double = item.prevSameQuoteIdx;
	}
}
function addReplacement(replacements, tokenIdx, pos, ch) {
	if (!replacements[tokenIdx]) replacements[tokenIdx] = [];
	replacements[tokenIdx].push({
		pos,
		ch
	});
}
function applyReplacements(str, replacements) {
	let result = "";
	let lastPos = 0;
	replacements.sort((a, b) => a.pos - b.pos);
	for (let i = 0; i < replacements.length; i++) {
		const replacement = replacements[i];
		result += str.slice(lastPos, replacement.pos) + replacement.ch;
		lastPos = replacement.pos + 1;
	}
	return result + str.slice(lastPos);
}
function process_inlines(tokens, state) {
	let j;
	const stack = [];
	const heads = {
		single: -1,
		double: -1
	};
	const replacements = {};
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		const thisLevel = tokens[i].level;
		for (j = stack.length - 1; j >= 0; j--) if (stack[j].level <= thisLevel) break;
		truncateStack(stack, heads, j + 1);
		if (token.type !== "text") continue;
		const text = token.content;
		let pos = 0;
		const max = text.length;
		OUTER: while (pos < max) {
			QUOTE_RE.lastIndex = pos;
			const t = QUOTE_RE.exec(text);
			if (!t) break;
			let canOpen = true;
			let canClose = true;
			pos = t.index + 1;
			const isSingle = t[0] === "'";
			let lastChar = 32;
			if (t.index - 1 >= 0) lastChar = text.charCodeAt(t.index - 1);
			else for (j = i - 1; j >= 0; j--) {
				if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
				if (!tokens[j].content) continue;
				lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
				break;
			}
			let nextChar = 32;
			if (pos < max) nextChar = text.charCodeAt(pos);
			else for (j = i + 1; j < tokens.length; j++) {
				if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
				if (!tokens[j].content) continue;
				nextChar = tokens[j].content.charCodeAt(0);
				break;
			}
			const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
			const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
			const isLastWhiteSpace = isWhiteSpace(lastChar);
			const isNextWhiteSpace = isWhiteSpace(nextChar);
			if (isNextWhiteSpace) canOpen = false;
			else if (isNextPunctChar) {
				if (!(isLastWhiteSpace || isLastPunctChar)) canOpen = false;
			}
			if (isLastWhiteSpace) canClose = false;
			else if (isLastPunctChar) {
				if (!(isNextWhiteSpace || isNextPunctChar)) canClose = false;
			}
			if (nextChar === 34 && t[0] === "\"") {
				if (lastChar >= 48 && lastChar <= 57) canClose = canOpen = false;
			}
			if (canOpen && canClose) {
				canOpen = isLastPunctChar;
				canClose = isNextPunctChar;
			}
			if (!canOpen && !canClose) {
				if (isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
				continue;
			}
			if (canClose) {
				j = isSingle ? heads.single : heads.double;
				if (j >= 0 && stack[j].level === thisLevel) {
					const item = stack[j];
					let openQuote;
					let closeQuote;
					if (isSingle) {
						openQuote = state.md.options.quotes[2];
						closeQuote = state.md.options.quotes[3];
					} else {
						openQuote = state.md.options.quotes[0];
						closeQuote = state.md.options.quotes[1];
					}
					addReplacement(replacements, i, t.index, closeQuote);
					addReplacement(replacements, item.tokenIdx, item.contentPos, openQuote);
					truncateStack(stack, heads, j);
					continue OUTER;
				}
			}
			if (canOpen) {
				if (stack.length >= MAX_OPENERS) return;
				stack.push({
					tokenIdx: i,
					contentPos: t.index,
					isSingleQuote: isSingle,
					level: thisLevel,
					prevSameQuoteIdx: isSingle ? heads.single : heads.double
				});
				if (isSingle) heads.single = stack.length - 1;
				else heads.double = stack.length - 1;
			} else if (canClose && isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
		}
	}
	Object.keys(replacements).forEach(function(tokenIdx) {
		const idx = Number(tokenIdx);
		tokens[idx].content = applyReplacements(tokens[idx].content, replacements[tokenIdx]);
	});
}
function smartquotes(state) {
	if (!state.md.options.typographer) return;
	for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
		if (state.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) continue;
		process_inlines(state.tokens[blkIdx].children, state);
	}
}
//#endregion
//#region src/rules_core/text_join.ts
function join_alt(tokens) {
	let curr, last;
	const max = tokens.length;
	for (curr = 0; curr < max; curr++) if (tokens[curr].type === "text_special") tokens[curr].type = "text";
	for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
	else {
		if (curr !== last) tokens[last] = tokens[curr];
		last++;
	}
	if (curr !== last) tokens.length = last;
}
function text_join(state) {
	let curr, last;
	const blockTokens = state.tokens;
	const l = blockTokens.length;
	for (let j = 0; j < l; j++) {
		if (blockTokens[j].type !== "inline") continue;
		const tokens = blockTokens[j].children;
		const max = tokens.length;
		for (curr = 0; curr < max; curr++) {
			if (tokens[curr].type === "text_special") tokens[curr].type = "text";
			if (tokens[curr].children) join_alt(tokens[curr].children);
		}
		for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
		else {
			if (curr !== last) tokens[last] = tokens[curr];
			last++;
		}
		if (curr !== last) tokens.length = last;
	}
}
//#endregion
//#region src/parser_core.ts
var _rules$2 = [
	["normalize", normalize],
	["block", block],
	["strip_references", strip_references],
	["inline", inline],
	["linkify", linkify$1],
	["replacements", replace],
	["smartquotes", smartquotes],
	["text_join", text_join]
];
/**
* Top-level rules executor. Glues block/inline parsers and does intermediate
* transformations.
*/
var ParserCore = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* {@link Ruler} instance. Keep configuration of core rules.
			*/
			"ruler",
			new Ruler()
		);
		_defineProperty(this, "State", StateCore);
		for (let i = 0; i < _rules$2.length; i++) this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
	}
	/**
	* Executes core chain rules.
	*/
	process(state) {
		const rules = this.ruler.getRules("");
		for (let i = 0, l = rules.length; i < l; i++) rules[i](state);
	}
};
//#endregion
//#region src/rules_block/state_block.ts
/** Mutable state passed to block rules while tokenizing a source document. */
var StateBlock = class {
	constructor(src, md, env, tokens) {
		_defineProperty(this, "bMarks", []);
		_defineProperty(this, "eMarks", []);
		_defineProperty(this, "tShift", []);
		_defineProperty(this, "sCount", []);
		_defineProperty(this, "bsCount", []);
		_defineProperty(this, "blkIndent", 0);
		_defineProperty(this, "line", 0);
		_defineProperty(this, "lineMax", 0);
		_defineProperty(this, "tight", false);
		_defineProperty(this, "listIndent", -1);
		_defineProperty(this, "parentType", "root");
		_defineProperty(this, "level", 0);
		_defineProperty(this, "Token", Token);
		this.src = src;
		this.md = md;
		this.env = env;
		this.tokens = tokens;
		const s = this.src;
		for (let start = 0, pos = 0, indent = 0, offset = 0, len = s.length, indent_found = false; pos < len; pos++) {
			const ch = s.charCodeAt(pos);
			if (!indent_found) {
				if (isSpace(ch)) {
					indent++;
					if (ch === 9) offset += 4 - offset % 4;
					else offset++;
					continue;
				} else indent_found = true;
			}
			if (ch === 10 || pos === len - 1) {
				if (ch !== 10) pos++;
				this.bMarks.push(start);
				this.eMarks.push(pos);
				this.tShift.push(indent);
				this.sCount.push(offset);
				this.bsCount.push(0);
				indent_found = false;
				indent = 0;
				offset = 0;
				start = pos + 1;
			}
		}
		this.bMarks.push(s.length);
		this.eMarks.push(s.length);
		this.tShift.push(0);
		this.sCount.push(0);
		this.bsCount.push(0);
		this.lineMax = this.bMarks.length - 1;
	}
	push(type, tag, nesting) {
		const token = new Token(type, tag, nesting);
		token.block = true;
		if (nesting < 0) this.level--;
		token.level = this.level;
		if (nesting > 0) this.level++;
		this.tokens.push(token);
		return token;
	}
	isEmpty(line) {
		return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
	}
	skipEmptyLines(from) {
		for (let max = this.lineMax; from < max; from++) if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) break;
		return from;
	}
	skipSpaces(pos) {
		for (let max = this.src.length; pos < max; pos++) if (!isSpace(this.src.charCodeAt(pos))) break;
		return pos;
	}
	skipSpacesBack(pos, min) {
		if (pos <= min) return pos;
		while (pos > min) if (!isSpace(this.src.charCodeAt(--pos))) return pos + 1;
		return pos;
	}
	skipChars(pos, code) {
		for (let max = this.src.length; pos < max; pos++) if (this.src.charCodeAt(pos) !== code) break;
		return pos;
	}
	skipCharsBack(pos, code, min) {
		if (pos <= min) return pos;
		while (pos > min) if (code !== this.src.charCodeAt(--pos)) return pos + 1;
		return pos;
	}
	getLines(begin, end, indent, keepLastLF) {
		if (begin >= end) return "";
		const queue = new Array(end - begin);
		for (let i = 0, line = begin; line < end; line++, i++) {
			let lineIndent = 0;
			const lineStart = this.bMarks[line];
			let first = lineStart;
			let last;
			if (line + 1 < end || keepLastLF) last = this.eMarks[line] + 1;
			else last = this.eMarks[line];
			while (first < last && lineIndent < indent) {
				const ch = this.src.charCodeAt(first);
				if (isSpace(ch)) {
					if (ch === 9) lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
					else lineIndent++;
				} else if (first - lineStart < this.tShift[line]) lineIndent++;
				else break;
				first++;
			}
			if (lineIndent > indent) queue[i] = new Array(lineIndent - indent + 1).join(" ") + this.src.slice(first, last);
			else queue[i] = this.src.slice(first, last);
		}
		return queue.join("");
	}
};
//#endregion
//#region src/rules_block/table.ts
var MAX_AUTOCOMPLETED_CELLS = 65536;
function getLine(state, line) {
	const pos = state.bMarks[line] + state.tShift[line];
	const max = state.eMarks[line];
	return state.src.slice(pos, max);
}
function escapedSplit(str) {
	const result = [];
	const max = str.length;
	let pos = 0;
	let ch = str.charCodeAt(pos);
	let isEscaped = false;
	let lastPos = 0;
	let current = "";
	while (pos < max) {
		if (ch === 124) {
			if (!isEscaped) {
				result.push(current + str.substring(lastPos, pos));
				current = "";
				lastPos = pos + 1;
			} else {
				current += str.substring(lastPos, pos - 1);
				lastPos = pos;
			}
		}
		isEscaped = ch === 92;
		pos++;
		ch = str.charCodeAt(pos);
	}
	result.push(current + str.substring(lastPos));
	return result;
}
function table(state, startLine, endLine, silent) {
	if (startLine + 2 > endLine) return false;
	let nextLine = startLine + 1;
	if (state.sCount[nextLine] < state.blkIndent) return false;
	if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
	let pos = state.bMarks[nextLine] + state.tShift[nextLine];
	if (pos >= state.eMarks[nextLine]) return false;
	const firstCh = state.src.charCodeAt(pos++);
	if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) return false;
	if (pos >= state.eMarks[nextLine]) return false;
	const secondCh = state.src.charCodeAt(pos++);
	if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) return false;
	if (firstCh === 45 && isSpace(secondCh)) return false;
	while (pos < state.eMarks[nextLine]) {
		const ch = state.src.charCodeAt(pos);
		if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) return false;
		pos++;
	}
	let lineText = getLine(state, startLine + 1);
	let columns = lineText.split("|");
	const aligns = [];
	for (let i = 0; i < columns.length; i++) {
		const t = columns[i].trim();
		if (!t) {
			if (i === 0 || i === columns.length - 1) continue;
			else return false;
		}
		if (!/^:?-+:?$/.test(t)) return false;
		if (t.charCodeAt(t.length - 1) === 58) aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
		else if (t.charCodeAt(0) === 58) aligns.push("left");
		else aligns.push("");
	}
	lineText = getLine(state, startLine).trim();
	if (lineText.indexOf("|") === -1) return false;
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	columns = escapedSplit(lineText);
	if (columns.length && columns[0] === "") columns.shift();
	if (columns.length && columns[columns.length - 1] === "") columns.pop();
	const columnCount = columns.length;
	if (columnCount === 0 || columnCount !== aligns.length) return false;
	if (silent) return true;
	const oldParentType = state.parentType;
	state.parentType = "table";
	const terminatorRules = state.md.block.ruler.getRules("blockquote");
	const token_to = state.push("table_open", "table", 1);
	const tableLines = [startLine, 0];
	token_to.map = tableLines;
	const token_tho = state.push("thead_open", "thead", 1);
	token_tho.map = [startLine, startLine + 1];
	const token_htro = state.push("tr_open", "tr", 1);
	token_htro.map = [startLine, startLine + 1];
	for (let i = 0; i < columns.length; i++) {
		const token_ho = state.push("th_open", "th", 1);
		if (aligns[i]) token_ho.attrs = [["style", `text-align:${aligns[i]}`]];
		const token_il = state.push("inline", "", 0);
		token_il.content = columns[i].trim();
		token_il.children = [];
		state.push("th_close", "th", -1);
	}
	state.push("tr_close", "tr", -1);
	state.push("thead_close", "thead", -1);
	let tbodyLines;
	let autocompletedCells = 0;
	for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
		if (state.sCount[nextLine] < state.blkIndent) break;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) break;
		lineText = getLine(state, nextLine).trim();
		if (!lineText) break;
		if (state.sCount[nextLine] - state.blkIndent >= 4) break;
		columns = escapedSplit(lineText);
		if (columns.length && columns[0] === "") columns.shift();
		if (columns.length && columns[columns.length - 1] === "") columns.pop();
		autocompletedCells += columnCount - columns.length;
		if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) break;
		if (nextLine === startLine + 2) {
			const token_tbo = state.push("tbody_open", "tbody", 1);
			token_tbo.map = tbodyLines = [startLine + 2, 0];
		}
		const token_tro = state.push("tr_open", "tr", 1);
		token_tro.map = [nextLine, nextLine + 1];
		for (let i = 0; i < columnCount; i++) {
			const token_tdo = state.push("td_open", "td", 1);
			if (aligns[i]) token_tdo.attrs = [["style", `text-align:${aligns[i]}`]];
			const token_il = state.push("inline", "", 0);
			token_il.content = columns[i] ? columns[i].trim() : "";
			token_il.children = [];
			state.push("td_close", "td", -1);
		}
		state.push("tr_close", "tr", -1);
	}
	if (tbodyLines) {
		state.push("tbody_close", "tbody", -1);
		tbodyLines[1] = nextLine;
	}
	state.push("table_close", "table", -1);
	tableLines[1] = nextLine;
	state.parentType = oldParentType;
	state.line = nextLine;
	return true;
}
//#endregion
//#region src/rules_block/code.ts
function code(state, startLine, endLine) {
	if (state.sCount[startLine] - state.blkIndent < 4) return false;
	let nextLine = startLine + 1;
	let last = nextLine;
	while (nextLine < endLine) {
		if (state.isEmpty(nextLine)) {
			nextLine++;
			continue;
		}
		if (state.sCount[nextLine] - state.blkIndent >= 4) {
			nextLine++;
			last = nextLine;
			continue;
		}
		break;
	}
	state.line = last;
	const token = state.push("code_block", "code", 0);
	token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + "\n";
	token.map = [startLine, state.line];
	return true;
}
//#endregion
//#region src/rules_block/fence.ts
function fence(state, startLine, endLine, silent) {
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let max = state.eMarks[startLine];
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	if (pos + 3 > max) return false;
	const marker = state.src.charCodeAt(pos);
	if (marker !== 126 && marker !== 96) return false;
	let mem = pos;
	pos = state.skipChars(pos, marker);
	let len = pos - mem;
	if (len < 3) return false;
	const markup = state.src.slice(mem, pos);
	const params = state.src.slice(pos, max);
	if (marker === 96) {
		if (params.indexOf(String.fromCharCode(marker)) >= 0) return false;
	}
	if (silent) return true;
	let nextLine = startLine;
	let haveEndMarker = false;
	for (;;) {
		nextLine++;
		if (nextLine >= endLine) break;
		pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
		max = state.eMarks[nextLine];
		if (pos < max && state.sCount[nextLine] < state.blkIndent) break;
		if (state.src.charCodeAt(pos) !== marker) continue;
		if (state.sCount[nextLine] - state.blkIndent >= 4) continue;
		pos = state.skipChars(pos, marker);
		if (pos - mem < len) continue;
		pos = state.skipSpaces(pos);
		if (pos < max) continue;
		haveEndMarker = true;
		break;
	}
	len = state.sCount[startLine];
	state.line = nextLine + (haveEndMarker ? 1 : 0);
	const token = state.push("fence", "code", 0);
	token.info = params;
	token.content = state.getLines(startLine + 1, nextLine, len, true);
	token.markup = markup;
	token.map = [startLine, state.line];
	return true;
}
//#endregion
//#region src/rules_block/blockquote.ts
function blockquote(state, startLine, endLine, silent) {
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let max = state.eMarks[startLine];
	const oldLineMax = state.lineMax;
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	if (state.src.charCodeAt(pos) !== 62) return false;
	if (silent) return true;
	const oldBMarks = [];
	const oldBSCount = [];
	const oldSCount = [];
	const oldTShift = [];
	const terminatorRules = state.md.block.ruler.getRules("blockquote");
	const oldParentType = state.parentType;
	state.parentType = "blockquote";
	let lastLineEmpty = false;
	let nextLine;
	for (nextLine = startLine; nextLine < endLine; nextLine++) {
		const isOutdented = state.sCount[nextLine] < state.blkIndent;
		pos = state.bMarks[nextLine] + state.tShift[nextLine];
		max = state.eMarks[nextLine];
		if (pos >= max) break;
		if (state.src.charCodeAt(pos++) === 62 && !isOutdented) {
			let initial = state.sCount[nextLine] + 1;
			let spaceAfterMarker;
			let adjustTab;
			if (state.src.charCodeAt(pos) === 32) {
				pos++;
				initial++;
				adjustTab = false;
				spaceAfterMarker = true;
			} else if (state.src.charCodeAt(pos) === 9) {
				spaceAfterMarker = true;
				if ((state.bsCount[nextLine] + initial) % 4 === 3) {
					pos++;
					initial++;
					adjustTab = false;
				} else adjustTab = true;
			} else spaceAfterMarker = false;
			let offset = initial;
			oldBMarks.push(state.bMarks[nextLine]);
			state.bMarks[nextLine] = pos;
			while (pos < max) {
				const ch = state.src.charCodeAt(pos);
				if (isSpace(ch)) {
					if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
					else offset++;
				} else break;
				pos++;
			}
			lastLineEmpty = pos >= max;
			oldBSCount.push(state.bsCount[nextLine]);
			state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
			oldSCount.push(state.sCount[nextLine]);
			state.sCount[nextLine] = offset - initial;
			oldTShift.push(state.tShift[nextLine]);
			state.tShift[nextLine] = pos - state.bMarks[nextLine];
			continue;
		}
		if (lastLineEmpty) break;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) {
			state.lineMax = nextLine;
			if (state.blkIndent !== 0) {
				oldBMarks.push(state.bMarks[nextLine]);
				oldBSCount.push(state.bsCount[nextLine]);
				oldTShift.push(state.tShift[nextLine]);
				oldSCount.push(state.sCount[nextLine]);
				state.sCount[nextLine] -= state.blkIndent;
			}
			break;
		}
		oldBMarks.push(state.bMarks[nextLine]);
		oldBSCount.push(state.bsCount[nextLine]);
		oldTShift.push(state.tShift[nextLine]);
		oldSCount.push(state.sCount[nextLine]);
		state.sCount[nextLine] = -1;
	}
	const oldIndent = state.blkIndent;
	state.blkIndent = 0;
	const token_o = state.push("blockquote_open", "blockquote", 1);
	token_o.markup = ">";
	const lines = [startLine, 0];
	token_o.map = lines;
	state.md.block.tokenize(state, startLine, nextLine);
	const token_c = state.push("blockquote_close", "blockquote", -1);
	token_c.markup = ">";
	state.lineMax = oldLineMax;
	state.parentType = oldParentType;
	lines[1] = state.line;
	for (let i = 0; i < oldTShift.length; i++) {
		state.bMarks[i + startLine] = oldBMarks[i];
		state.tShift[i + startLine] = oldTShift[i];
		state.sCount[i + startLine] = oldSCount[i];
		state.bsCount[i + startLine] = oldBSCount[i];
	}
	state.blkIndent = oldIndent;
	return true;
}
//#endregion
//#region src/rules_block/hr.ts
function hr(state, startLine, endLine, silent) {
	const max = state.eMarks[startLine];
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	const marker = state.src.charCodeAt(pos++);
	if (marker !== 42 && marker !== 45 && marker !== 95) return false;
	let cnt = 1;
	while (pos < max) {
		const ch = state.src.charCodeAt(pos++);
		if (ch !== marker && !isSpace(ch)) return false;
		if (ch === marker) cnt++;
	}
	if (cnt < 3) return false;
	if (silent) return true;
	state.line = startLine + 1;
	const token = state.push("hr", "hr", 0);
	token.map = [startLine, state.line];
	token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
	return true;
}
//#endregion
//#region src/rules_block/list.ts
function skipBulletListMarker(state, startLine) {
	const max = state.eMarks[startLine];
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	const marker = state.src.charCodeAt(pos++);
	if (marker !== 42 && marker !== 45 && marker !== 43) return -1;
	if (pos < max) {
		if (!isSpace(state.src.charCodeAt(pos))) return -1;
	}
	return pos;
}
function skipOrderedListMarker(state, startLine) {
	const start = state.bMarks[startLine] + state.tShift[startLine];
	const max = state.eMarks[startLine];
	let pos = start;
	if (pos + 1 >= max) return -1;
	let ch = state.src.charCodeAt(pos++);
	if (ch < 48 || ch > 57) return -1;
	for (;;) {
		if (pos >= max) return -1;
		ch = state.src.charCodeAt(pos++);
		if (ch >= 48 && ch <= 57) {
			if (pos - start >= 10) return -1;
			continue;
		}
		if (ch === 41 || ch === 46) break;
		return -1;
	}
	if (pos < max) {
		ch = state.src.charCodeAt(pos);
		if (!isSpace(ch)) return -1;
	}
	return pos;
}
function markTightParagraphs(state, idx) {
	const level = state.level + 2;
	for (let i = idx + 2, l = state.tokens.length - 2; i < l; i++) if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
		state.tokens[i + 2].hidden = true;
		state.tokens[i].hidden = true;
		i += 2;
	}
}
function list(state, startLine, endLine, silent) {
	let max, pos, start, token;
	let nextLine = startLine;
	let tight = true;
	if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
	if (state.listIndent >= 0 && state.sCount[nextLine] - state.listIndent >= 4 && state.sCount[nextLine] < state.blkIndent) return false;
	let isTerminatingParagraph = false;
	if (silent && state.parentType === "paragraph") {
		if (state.sCount[nextLine] >= state.blkIndent) isTerminatingParagraph = true;
	}
	let isOrdered;
	let markerValue;
	let posAfterMarker;
	if ((posAfterMarker = skipOrderedListMarker(state, nextLine)) >= 0) {
		isOrdered = true;
		start = state.bMarks[nextLine] + state.tShift[nextLine];
		markerValue = Number(state.src.slice(start, posAfterMarker - 1));
		if (isTerminatingParagraph && markerValue !== 1) return false;
	} else if ((posAfterMarker = skipBulletListMarker(state, nextLine)) >= 0) isOrdered = false;
	else return false;
	if (isTerminatingParagraph) {
		if (state.skipSpaces(posAfterMarker) >= state.eMarks[nextLine]) return false;
	}
	if (silent) return true;
	const markerCharCode = state.src.charCodeAt(posAfterMarker - 1);
	const listTokIdx = state.tokens.length;
	if (isOrdered) {
		token = state.push("ordered_list_open", "ol", 1);
		if (markerValue !== 1) token.attrs = [["start", markerValue]];
	} else token = state.push("bullet_list_open", "ul", 1);
	const listLines = [nextLine, 0];
	token.map = listLines;
	token.markup = String.fromCharCode(markerCharCode);
	let prevEmptyEnd = false;
	const terminatorRules = state.md.block.ruler.getRules("list");
	const oldParentType = state.parentType;
	state.parentType = "list";
	while (nextLine < endLine) {
		pos = posAfterMarker;
		max = state.eMarks[nextLine];
		const initial = state.sCount[nextLine] + posAfterMarker - (state.bMarks[nextLine] + state.tShift[nextLine]);
		let offset = initial;
		while (pos < max) {
			const ch = state.src.charCodeAt(pos);
			if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine]) % 4;
			else if (ch === 32) offset++;
			else break;
			pos++;
		}
		const contentStart = pos;
		let indentAfterMarker;
		if (contentStart >= max) indentAfterMarker = 1;
		else indentAfterMarker = offset - initial;
		if (indentAfterMarker > 4) indentAfterMarker = 1;
		const indent = initial + indentAfterMarker;
		token = state.push("list_item_open", "li", 1);
		token.markup = String.fromCharCode(markerCharCode);
		const itemLines = [nextLine, 0];
		token.map = itemLines;
		if (isOrdered) token.info = state.src.slice(start, posAfterMarker - 1);
		const oldTight = state.tight;
		const oldTShift = state.tShift[nextLine];
		const oldSCount = state.sCount[nextLine];
		const oldListIndent = state.listIndent;
		state.listIndent = state.blkIndent;
		state.blkIndent = indent;
		state.tight = true;
		state.tShift[nextLine] = contentStart - state.bMarks[nextLine];
		state.sCount[nextLine] = offset;
		if (contentStart >= max && state.isEmpty(nextLine + 1)) state.line = Math.min(state.line + 2, endLine);
		else state.md.block.tokenize(state, nextLine, endLine);
		if (!state.tight || prevEmptyEnd) tight = false;
		prevEmptyEnd = state.line - nextLine > 1 && state.isEmpty(state.line - 1);
		state.blkIndent = state.listIndent;
		state.listIndent = oldListIndent;
		state.tShift[nextLine] = oldTShift;
		state.sCount[nextLine] = oldSCount;
		state.tight = oldTight;
		token = state.push("list_item_close", "li", -1);
		token.markup = String.fromCharCode(markerCharCode);
		nextLine = state.line;
		itemLines[1] = nextLine;
		if (nextLine >= endLine) break;
		if (state.sCount[nextLine] < state.blkIndent) break;
		if (state.sCount[nextLine] - state.blkIndent >= 4) break;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) break;
		if (isOrdered) {
			posAfterMarker = skipOrderedListMarker(state, nextLine);
			if (posAfterMarker < 0) break;
			start = state.bMarks[nextLine] + state.tShift[nextLine];
		} else {
			posAfterMarker = skipBulletListMarker(state, nextLine);
			if (posAfterMarker < 0) break;
		}
		if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) break;
	}
	if (isOrdered) token = state.push("ordered_list_close", "ol", -1);
	else token = state.push("bullet_list_close", "ul", -1);
	token.markup = String.fromCharCode(markerCharCode);
	listLines[1] = nextLine;
	state.line = nextLine;
	state.parentType = oldParentType;
	if (tight) markTightParagraphs(state, listTokIdx);
	return true;
}
//#endregion
//#region src/rules_block/reference.ts
var MAX_LABEL_LENGTH = 999;
function countCodePoints(str) {
	let length = str.length;
	for (let i = 0; i < str.length - 1; i++) {
		const high = str.charCodeAt(i);
		if (high < 55296 || high > 56319) continue;
		const low = str.charCodeAt(i + 1);
		if (low >= 56320 && low <= 57343) {
			length--;
			i++;
		}
	}
	return length;
}
function lineEnd(state, line) {
	return Math.min(state.eMarks[line] + 1, state.src.length);
}
function getNextLinePos(state, nextLine) {
	const endLine = state.lineMax;
	if (nextLine >= endLine || state.isEmpty(nextLine)) return -1;
	let isContinuation = false;
	if (state.sCount[nextLine] - state.blkIndent > 3) isContinuation = true;
	if (state.sCount[nextLine] < 0) isContinuation = true;
	if (!isContinuation) {
		const terminatorRules = state.md.block.ruler.getRules("reference");
		const oldParentType = state.parentType;
		state.parentType = "reference";
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		state.parentType = oldParentType;
		if (terminate) return -1;
	}
	return state.bMarks[nextLine] + state.tShift[nextLine];
}
function reference(state, startLine, _endLine, silent) {
	const src = state.src;
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let nextLine = startLine + 1;
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	if (src.charCodeAt(pos) !== 91) return false;
	let max = lineEnd(state, startLine);
	let rawLabel = "";
	let labelEnd = -1;
	let segmentStart = ++pos;
	while (pos < max) {
		if (rawLabel.length + pos - segmentStart > MAX_LABEL_LENGTH * 2) return false;
		let ch = src.charCodeAt(pos);
		if (ch === 91) return false;
		if (ch === 93) {
			labelEnd = pos;
			break;
		}
		if (ch === 92) ch = src.charCodeAt(++pos);
		if (ch === 10 && pos < max) {
			const nextPos = getNextLinePos(state, nextLine);
			if (nextPos < 0) return false;
			rawLabel += src.slice(segmentStart, max);
			pos = segmentStart = nextPos;
			max = lineEnd(state, nextLine++);
			continue;
		}
		pos++;
	}
	if (labelEnd < 0 || src.charCodeAt(labelEnd + 1) !== 58) return false;
	rawLabel += src.slice(segmentStart, labelEnd);
	if (rawLabel.length > MAX_LABEL_LENGTH && countCodePoints(rawLabel) > MAX_LABEL_LENGTH) return false;
	pos = labelEnd + 2;
	while (pos < max) {
		const ch = src.charCodeAt(pos);
		if (ch === 10) {
			const nextPos = getNextLinePos(state, nextLine);
			if (nextPos < 0) break;
			pos = nextPos;
			max = lineEnd(state, nextLine++);
		} else if (isSpace(ch)) pos++;
		else break;
	}
	const destRes = state.md.helpers.parseLinkDestination(src, pos, max);
	if (!destRes.ok) return false;
	const href = state.md.normalizeLink(destRes.str);
	if (!state.md.validateLink(href)) return false;
	pos = destRes.pos;
	const destEndPos = pos;
	const destEndMax = max;
	const destEndLineNo = nextLine;
	while (pos < max) {
		const ch = src.charCodeAt(pos);
		if (ch === 10) {
			const nextPos = getNextLinePos(state, nextLine);
			if (nextPos < 0) break;
			pos = nextPos;
			max = lineEnd(state, nextLine++);
		} else if (isSpace(ch)) pos++;
		else break;
	}
	const titleStart = pos;
	let titleRes = state.md.helpers.parseLinkTitle(src, pos, max);
	while (titleRes.can_continue) {
		const nextPos = getNextLinePos(state, nextLine);
		if (nextPos < 0) break;
		pos = nextPos;
		max = lineEnd(state, nextLine++);
		titleRes = state.md.helpers.parseLinkTitle(src, pos, max, titleRes);
	}
	let title;
	if (titleStart !== destEndPos && titleRes.ok) {
		title = titleRes.str;
		pos = titleRes.pos;
	} else {
		title = "";
		pos = destEndPos;
		max = destEndMax;
		nextLine = destEndLineNo;
	}
	while (pos < max) {
		if (!isSpace(src.charCodeAt(pos))) break;
		pos++;
	}
	if (pos < max && src.charCodeAt(pos) !== 10) {
		if (title) {
			title = "";
			pos = destEndPos;
			max = destEndMax;
			nextLine = destEndLineNo;
			while (pos < max) {
				if (!isSpace(src.charCodeAt(pos))) break;
				pos++;
			}
		}
	}
	if (pos < max && src.charCodeAt(pos) !== 10) return false;
	const label = normalizeReference(rawLabel);
	if (!label) return false;
	/* istanbul ignore if */
	if (silent) return true;
	if (typeof state.env.references === "undefined") state.env.references = {};
	if (typeof state.env.references[label] === "undefined") state.env.references[label] = {
		title,
		href
	};
	const token = state.push("reference_definition", "", 0);
	token.map = [startLine, nextLine];
	token.hidden = true;
	const meta = Object.create(null);
	meta.label = label;
	token.meta = meta;
	state.line = nextLine;
	return true;
}
//#endregion
//#region src/common/html_blocks.ts
var html_blocks_default = [
	"address",
	"article",
	"aside",
	"base",
	"basefont",
	"blockquote",
	"body",
	"caption",
	"center",
	"col",
	"colgroup",
	"dd",
	"details",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"fieldset",
	"figcaption",
	"figure",
	"footer",
	"form",
	"frame",
	"frameset",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hr",
	"html",
	"iframe",
	"legend",
	"li",
	"link",
	"main",
	"menu",
	"menuitem",
	"nav",
	"noframes",
	"ol",
	"optgroup",
	"option",
	"p",
	"param",
	"search",
	"section",
	"summary",
	"table",
	"tbody",
	"td",
	"tfoot",
	"th",
	"thead",
	"title",
	"tr",
	"track",
	"ul"
];
//#endregion
//#region src/common/html_re.ts
var open_tag = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`;
var close_tag = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
new RegExp(`^(?:${open_tag}|${close_tag}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`);
var HTML_OPEN_CLOSE_TAG_RE = new RegExp(`^(?:${open_tag}|${close_tag})`);
//#endregion
//#region src/rules_block/html_block.ts
var HTML_SEQUENCES = [
	[
		/^<(script|pre|style|textarea)(?=(\s|>|$))/i,
		/<\/(script|pre|style|textarea)>/i,
		true
	],
	[
		/^<!--/,
		/-->/,
		true
	],
	[
		/^<\?/,
		/\?>/,
		true
	],
	[
		/^<![A-Za-z]/,
		/>/,
		true
	],
	[
		/^<!\[CDATA\[/,
		/\]\]>/,
		true
	],
	[
		new RegExp(`^</?(${html_blocks_default.join("|")})(?=(\\s|/?>|$))`, "i"),
		/^$/,
		true
	],
	[
		new RegExp(`${HTML_OPEN_CLOSE_TAG_RE.source}\\s*$`),
		/^$/,
		false
	]
];
function html_block(state, startLine, endLine, silent) {
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let max = state.eMarks[startLine];
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	if (!state.md.options.html) return false;
	if (state.src.charCodeAt(pos) !== 60) return false;
	let lineText = state.src.slice(pos, max);
	let i = 0;
	for (; i < HTML_SEQUENCES.length; i++) if (HTML_SEQUENCES[i][0].test(lineText)) break;
	if (i === HTML_SEQUENCES.length) return false;
	if (silent) return HTML_SEQUENCES[i][2];
	let nextLine = startLine + 1;
	const endsOnBlankLine = HTML_SEQUENCES[i][1].test("");
	if (!HTML_SEQUENCES[i][1].test(lineText)) for (; nextLine < endLine; nextLine++) {
		if (state.sCount[nextLine] < state.blkIndent) {
			if (endsOnBlankLine || !state.isEmpty(nextLine)) break;
		}
		pos = state.bMarks[nextLine] + state.tShift[nextLine];
		max = state.eMarks[nextLine];
		lineText = state.src.slice(pos, max);
		if (HTML_SEQUENCES[i][1].test(lineText)) {
			if (lineText.length !== 0) nextLine++;
			break;
		}
	}
	state.line = nextLine;
	const token = state.push("html_block", "", 0);
	token.map = [startLine, nextLine];
	token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
	return true;
}
//#endregion
//#region src/rules_block/heading.ts
function heading(state, startLine, endLine, silent) {
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let max = state.eMarks[startLine];
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	let ch = state.src.charCodeAt(pos);
	if (ch !== 35 || pos >= max) return false;
	let level = 1;
	ch = state.src.charCodeAt(++pos);
	while (ch === 35 && pos < max && level <= 6) {
		level++;
		ch = state.src.charCodeAt(++pos);
	}
	if (level > 6 || pos < max && !isSpace(ch)) return false;
	if (silent) return true;
	max = state.skipSpacesBack(max, pos);
	const tmp = state.skipCharsBack(max, 35, pos);
	if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) max = tmp;
	state.line = startLine + 1;
	const token_o = state.push("heading_open", `h${level}`, 1);
	token_o.markup = "########".slice(0, level);
	token_o.map = [startLine, state.line];
	const token_i = state.push("inline", "", 0);
	token_i.content = asciiTrim(state.src.slice(pos, max));
	token_i.map = [startLine, state.line];
	token_i.children = [];
	const token_c = state.push("heading_close", `h${level}`, -1);
	token_c.markup = "########".slice(0, level);
	return true;
}
//#endregion
//#region src/rules_block/lheading.ts
function lheading(state, startLine, endLine) {
	const terminatorRules = state.md.block.ruler.getRules("paragraph");
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	const oldParentType = state.parentType;
	state.parentType = "paragraph";
	let level = 0;
	let marker;
	let nextLine = startLine + 1;
	for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
		if (state.sCount[nextLine] - state.blkIndent > 3) continue;
		if (state.sCount[nextLine] >= state.blkIndent) {
			let pos = state.bMarks[nextLine] + state.tShift[nextLine];
			const max = state.eMarks[nextLine];
			if (pos < max) {
				marker = state.src.charCodeAt(pos);
				if (marker === 45 || marker === 61) {
					pos = state.skipChars(pos, marker);
					pos = state.skipSpaces(pos);
					if (pos >= max) {
						level = marker === 61 ? 1 : 2;
						break;
					}
				}
			}
		}
		if (state.sCount[nextLine] < 0) continue;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) break;
	}
	if (!level) {
		state.parentType = oldParentType;
		return false;
	}
	const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
	state.line = nextLine + 1;
	const token_o = state.push("heading_open", `h${level}`, 1);
	token_o.markup = String.fromCharCode(marker);
	token_o.map = [startLine, state.line];
	const token_i = state.push("inline", "", 0);
	token_i.content = content;
	token_i.map = [startLine, state.line - 1];
	token_i.children = [];
	const token_c = state.push("heading_close", `h${level}`, -1);
	token_c.markup = String.fromCharCode(marker);
	state.parentType = oldParentType;
	return true;
}
//#endregion
//#region src/rules_block/paragraph.ts
function paragraph(state, startLine, endLine) {
	const terminatorRules = state.md.block.ruler.getRules("paragraph");
	const oldParentType = state.parentType;
	let nextLine = startLine + 1;
	state.parentType = "paragraph";
	for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
		if (state.sCount[nextLine] - state.blkIndent > 3) continue;
		if (state.sCount[nextLine] < 0) continue;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) break;
	}
	const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
	state.line = nextLine;
	const token_o = state.push("paragraph_open", "p", 1);
	token_o.map = [startLine, state.line];
	const token_i = state.push("inline", "", 0);
	token_i.content = content;
	token_i.map = [startLine, state.line];
	token_i.children = [];
	state.push("paragraph_close", "p", -1);
	state.parentType = oldParentType;
	return true;
}
//#endregion
//#region src/parser_block.ts
var _rules$1 = [
	[
		"table",
		table,
		["paragraph", "reference"]
	],
	["code", code],
	[
		"fence",
		fence,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"blockquote",
		blockquote,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"hr",
		hr,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"list",
		list,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	["reference", reference],
	[
		"html_block",
		html_block,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	[
		"heading",
		heading,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	["lheading", lheading],
	["paragraph", paragraph]
];
/**
* Block-level tokenizer.
*/
var ParserBlock = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* {@link Ruler} instance. Keep configuration of block rules.
			*/
			"ruler",
			new Ruler()
		);
		_defineProperty(this, "State", StateBlock);
		for (let i = 0; i < _rules$1.length; i++) this.ruler.push(_rules$1[i][0], _rules$1[i][1], { alt: (_rules$1[i][2] || []).slice() });
	}
	tokenize(state, startLine, endLine) {
		const rules = this.ruler.getRules("");
		const len = rules.length;
		const maxNesting = state.md.options.maxNesting;
		let line = startLine;
		let hasEmptyLines = false;
		while (line < endLine) {
			state.line = line = state.skipEmptyLines(line);
			if (line >= endLine) break;
			if (state.sCount[line] < state.blkIndent) break;
			if (state.level >= maxNesting) {
				state.line = endLine;
				break;
			}
			const prevLine = state.line;
			let ok = false;
			for (let i = 0; i < len; i++) {
				ok = rules[i](state, line, endLine, false);
				if (ok) {
					if (prevLine >= state.line) throw new Error("block rule didn't increment state.line");
					break;
				}
			}
			if (!ok) throw new Error("none of the block rules matched");
			state.tight = !hasEmptyLines;
			if (state.isEmpty(state.line - 1)) hasEmptyLines = true;
			line = state.line;
			if (line < endLine && state.isEmpty(line)) {
				hasEmptyLines = true;
				line++;
				state.line = line;
			}
		}
	}
	/**
	* Process input string and push block tokens into `outTokens`
	*/
	parse(src, md, env, outTokens) {
		if (!src) return;
		const state = new this.State(src, md, env, outTokens);
		this.tokenize(state, state.line, state.lineMax);
	}
};
//#endregion
//#region src/rules_inline/state_inline.ts
/** Mutable state passed to inline rules while tokenizing inline content. */
var StateInline = class {
	constructor(src, md, env, outTokens) {
		_defineProperty(this, "pos", 0);
		_defineProperty(this, "level", 0);
		_defineProperty(this, "pending", "");
		_defineProperty(this, "pendingLevel", 0);
		_defineProperty(this, "cache", {});
		_defineProperty(this, "backticks", {});
		_defineProperty(this, "backticksScanned", false);
		_defineProperty(this, "skipHtmlSpecial", false);
		_defineProperty(this, "linkLevel", 0);
		_defineProperty(this, "delimiters", []);
		_defineProperty(this, "_prev_delimiters", []);
		_defineProperty(this, "Token", Token);
		this.src = src;
		this.env = env;
		this.md = md;
		this.tokens = outTokens;
		this.tokens_meta = Array(outTokens.length);
		this.posMax = this.src.length;
	}
	pushPending() {
		const token = new Token("text", "", 0);
		token.content = this.pending;
		token.level = this.pendingLevel;
		this.tokens.push(token);
		this.pending = "";
		return token;
	}
	push(type, tag, nesting) {
		if (this.pending) this.pushPending();
		const token = new Token(type, tag, nesting);
		let token_meta = void 0;
		if (nesting < 0) {
			this.level--;
			this.delimiters = this._prev_delimiters.pop();
		}
		token.level = this.level;
		if (nesting > 0) {
			this.level++;
			this._prev_delimiters.push(this.delimiters);
			this.delimiters = [];
			token_meta = { delimiters: this.delimiters };
		}
		this.pendingLevel = this.level;
		this.tokens.push(token);
		this.tokens_meta.push(token_meta);
		return token;
	}
	scanDelims(start, canSplitWord) {
		const max = this.posMax;
		const marker = this.src.charCodeAt(start);
		let lastChar;
		if (start === 0) lastChar = 32;
		else if (start === 1) {
			lastChar = this.src.charCodeAt(0);
			if ((lastChar & 63488) === 55296) lastChar = 65533;
		} else {
			lastChar = this.src.charCodeAt(start - 1);
			if ((lastChar & 64512) === 56320) {
				const highSurr = this.src.charCodeAt(start - 2);
				lastChar = (highSurr & 64512) === 55296 ? 65536 + (highSurr - 55296 << 10) + (lastChar - 56320) : 65533;
			} else if ((lastChar & 64512) === 55296) lastChar = 65533;
		}
		let pos = start;
		while (pos < max && this.src.charCodeAt(pos) === marker) pos++;
		const count = pos - start;
		let nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
		if ((nextChar & 64512) === 55296) {
			const lowSurr = this.src.charCodeAt(pos + 1);
			nextChar = (lowSurr & 64512) === 56320 ? 65536 + (nextChar - 55296 << 10) + (lowSurr - 56320) : 65533;
		} else if ((nextChar & 64512) === 56320) nextChar = 65533;
		const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
		const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
		const isLastWhiteSpace = isWhiteSpace(lastChar);
		const isNextWhiteSpace = isWhiteSpace(nextChar);
		const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
		const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
		return {
			can_open: left_flanking && (canSplitWord || !right_flanking || isLastPunctChar),
			can_close: right_flanking && (canSplitWord || !left_flanking || isNextPunctChar),
			length: count
		};
	}
};
//#endregion
//#region src/rules_inline/text.ts
function isTerminatorChar(ch) {
	switch (ch) {
		case 10:
		case 33:
		case 35:
		case 36:
		case 37:
		case 38:
		case 42:
		case 43:
		case 45:
		case 58:
		case 60:
		case 61:
		case 62:
		case 64:
		case 91:
		case 92:
		case 93:
		case 94:
		case 95:
		case 96:
		case 123:
		case 125:
		case 126: return true;
		default: return false;
	}
}
function text(state, silent) {
	let pos = state.pos;
	while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) pos++;
	if (pos === state.pos) return false;
	if (!silent) state.pending += state.src.slice(state.pos, pos);
	state.pos = pos;
	return true;
}
//#endregion
//#region src/rules_inline/linkify.ts
function isAsciiAlpha(code) {
	return code >= 65 && code <= 90 || code >= 97 && code <= 122;
}
function isSchemeChar(code) {
	return code >= 65 && code <= 90 || code >= 97 && code <= 122 || code >= 48 && code <= 57 || code === 43 || code === 45 || code === 46;
}
function linkify(state, silent) {
	if (!state.md.options.linkify) return false;
	if (state.linkLevel > 0) return false;
	const pos = state.pos;
	const max = state.posMax;
	if (pos + 3 > max) return false;
	if (state.src.charCodeAt(pos) !== 58) return false;
	if (state.src.charCodeAt(pos + 1) !== 47) return false;
	if (state.src.charCodeAt(pos + 2) !== 47) return false;
	const protoMin = pos - Math.min(10, state.pending.length, pos);
	let protoStart = pos;
	while (protoStart > protoMin && isSchemeChar(state.src.charCodeAt(protoStart - 1))) protoStart--;
	if (protoStart === pos || !isAsciiAlpha(state.src.charCodeAt(protoStart))) return false;
	const protoLength = pos - protoStart;
	const link = state.md.linkify.matchAtStart(state.src.slice(protoStart));
	if (!link) return false;
	let url = link.url;
	if (url.length <= protoLength) return false;
	let urlEnd = url.length;
	while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) urlEnd--;
	if (urlEnd !== url.length) url = url.slice(0, urlEnd);
	const fullUrl = state.md.normalizeLink(url);
	if (!state.md.validateLink(fullUrl)) return false;
	if (!silent) {
		state.pending = state.pending.slice(0, -protoLength);
		const token_o = state.push("link_open", "a", 1);
		token_o.attrs = [["href", fullUrl]];
		token_o.markup = "linkify";
		token_o.info = "auto";
		const token_t = state.push("text", "", 0);
		token_t.content = state.md.normalizeLinkText(url);
		const token_c = state.push("link_close", "a", -1);
		token_c.markup = "linkify";
		token_c.info = "auto";
	}
	state.pos += url.length - protoLength;
	return true;
}
//#endregion
//#region src/rules_inline/newline.ts
function newline(state, silent) {
	let pos = state.pos;
	if (state.src.charCodeAt(pos) !== 10) return false;
	const pmax = state.pending.length - 1;
	const max = state.posMax;
	if (!silent) {
		if (pmax >= 0 && state.pending.charCodeAt(pmax) === 32) {
			if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 32) {
				let ws = pmax - 1;
				while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 32) ws--;
				state.pending = state.pending.slice(0, ws);
				state.push("hardbreak", "br", 0);
			} else {
				state.pending = state.pending.slice(0, -1);
				state.push("softbreak", "br", 0);
			}
		} else state.push("softbreak", "br", 0);
	}
	pos++;
	while (pos < max && isSpace(state.src.charCodeAt(pos))) pos++;
	state.pos = pos;
	return true;
}
//#endregion
//#region src/rules_inline/escape.ts
var ESCAPED = [];
for (let i = 0; i < 256; i++) ESCAPED.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(ch) {
	ESCAPED[ch.charCodeAt(0)] = 1;
});
function escape(state, silent) {
	let pos = state.pos;
	const max = state.posMax;
	if (state.src.charCodeAt(pos) !== 92) return false;
	pos++;
	if (pos >= max) return false;
	let ch1 = state.src.charCodeAt(pos);
	if (ch1 === 10) {
		if (!silent) state.push("hardbreak", "br", 0);
		pos++;
		while (pos < max) {
			ch1 = state.src.charCodeAt(pos);
			if (!isSpace(ch1)) break;
			pos++;
		}
		state.pos = pos;
		return true;
	}
	if (ch1 === 32) {
		if (!silent) {
			const token = state.push("text_special", "", 0);
			token.content = "\\";
			token.markup = "\\";
			token.info = "escape";
		}
		state.pos = pos;
		return true;
	}
	let escapedStr = state.src[pos];
	if (ch1 >= 55296 && ch1 <= 56319 && pos + 1 < max) {
		const ch2 = state.src.charCodeAt(pos + 1);
		if (ch2 >= 56320 && ch2 <= 57343) {
			escapedStr += state.src[pos + 1];
			pos++;
		}
	}
	const origStr = "\\" + escapedStr;
	if (!silent) {
		const token = state.push("text_special", "", 0);
		if (ch1 < 256 && ESCAPED[ch1] !== 0) token.content = escapedStr;
		else token.content = origStr;
		token.markup = origStr;
		token.info = "escape";
	}
	state.pos = pos + 1;
	return true;
}
//#endregion
//#region src/rules_inline/backticks.ts
function buildLastRuns(src) {
	const lastRuns = {};
	let pos = 0;
	while ((pos = src.indexOf("`", pos)) !== -1) {
		const start = pos;
		while (src.charCodeAt(++pos) === 96);
		lastRuns[pos - start] = start;
	}
	return lastRuns;
}
function backtick(state, silent) {
	var _state$backticks$open;
	const start = state.pos;
	if (state.src.charCodeAt(start) !== 96) return false;
	const max = state.posMax;
	let pos = start + 1;
	while (pos < max && state.src.charCodeAt(pos) === 96) pos++;
	const marker = state.src.slice(start, pos);
	const openerLength = marker.length;
	if (!state.backticksScanned) {
		state.backticks = buildLastRuns(state.src);
		state.backticksScanned = true;
	}
	if (((_state$backticks$open = state.backticks[openerLength]) !== null && _state$backticks$open !== void 0 ? _state$backticks$open : -1) >= pos) {
		let matchEnd = pos;
		let matchStart;
		while ((matchStart = state.src.indexOf("`", matchEnd)) !== -1 && matchStart < max) {
			matchEnd = matchStart + 1;
			while (state.src.charCodeAt(matchEnd) === 96) matchEnd++;
			if (matchEnd > max) break;
			if (matchEnd - matchStart === openerLength) {
				if (!silent) {
					const token = state.push("code_inline", "code", 0);
					token.markup = marker;
					let content = state.src.slice(pos, matchStart).replace(/\n/g, " ");
					if (content.startsWith(" ") && content.endsWith(" ") && /[^ ]/.test(content)) content = content.slice(1, -1);
					token.content = content;
				}
				state.pos = matchEnd;
				return true;
			}
		}
	}
	if (!silent) state.pending += marker;
	state.pos = pos;
	return true;
}
//#endregion
//#region src/rules_inline/strikethrough.ts
function strikethrough_tokenize(state, silent) {
	const start = state.pos;
	const marker = state.src.charCodeAt(start);
	if (silent) return false;
	if (marker !== 126) return false;
	const scanned = state.scanDelims(state.pos, true);
	let len = scanned.length;
	const ch = String.fromCharCode(marker);
	if (len < 2) return false;
	let token;
	if (len % 2) {
		token = state.push("text", "", 0);
		token.content = ch;
		len--;
	}
	for (let i = 0; i < len; i += 2) {
		token = state.push("text", "", 0);
		token.content = ch + ch;
		state.delimiters.push({
			marker,
			length: 0,
			token: state.tokens.length - 1,
			end: -1,
			open: scanned.can_open,
			close: scanned.can_close
		});
	}
	state.pos += scanned.length;
	return true;
}
function postProcess$1(state, delimiters) {
	let token;
	const loneMarkers = [];
	const max = delimiters.length;
	for (let i = 0; i < max; i++) {
		const startDelim = delimiters[i];
		if (startDelim.marker !== 126) continue;
		if (startDelim.end === -1) continue;
		const endDelim = delimiters[startDelim.end];
		token = state.tokens[startDelim.token];
		token.type = "s_open";
		token.tag = "s";
		token.nesting = 1;
		token.markup = "~~";
		token.content = "";
		token = state.tokens[endDelim.token];
		token.type = "s_close";
		token.tag = "s";
		token.nesting = -1;
		token.markup = "~~";
		token.content = "";
		if (state.tokens[endDelim.token - 1].type === "text" && state.tokens[endDelim.token - 1].content === "~") loneMarkers.push(endDelim.token - 1);
	}
	while (loneMarkers.length) {
		const i = loneMarkers.pop();
		let j = i + 1;
		while (j < state.tokens.length && state.tokens[j].type === "s_close") j++;
		j--;
		if (i !== j) {
			token = state.tokens[j];
			state.tokens[j] = state.tokens[i];
			state.tokens[i] = token;
		}
	}
}
function strikethrough_postProcess(state) {
	const tokens_meta = state.tokens_meta;
	const max = state.tokens_meta.length;
	postProcess$1(state, state.delimiters);
	for (let curr = 0; curr < max; curr++) {
		var _tokens_meta$curr;
		const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
		if (delimiters) postProcess$1(state, delimiters);
	}
}
var strikethrough_default = {
	tokenize: strikethrough_tokenize,
	postProcess: strikethrough_postProcess
};
//#endregion
//#region src/rules_inline/emphasis.ts
function emphasis_tokenize(state, silent) {
	const start = state.pos;
	const marker = state.src.charCodeAt(start);
	if (silent) return false;
	if (marker !== 95 && marker !== 42) return false;
	const scanned = state.scanDelims(state.pos, marker === 42);
	for (let i = 0; i < scanned.length; i++) {
		const token = state.push("text", "", 0);
		token.content = String.fromCharCode(marker);
		state.delimiters.push({
			marker,
			length: scanned.length,
			token: state.tokens.length - 1,
			end: -1,
			open: scanned.can_open,
			close: scanned.can_close
		});
	}
	state.pos += scanned.length;
	return true;
}
function postProcess(state, delimiters) {
	const max = delimiters.length;
	for (let i = max - 1; i >= 0; i--) {
		const startDelim = delimiters[i];
		if (startDelim.marker !== 95 && startDelim.marker !== 42) continue;
		if (startDelim.end === -1) continue;
		const endDelim = delimiters[startDelim.end];
		const isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && delimiters[startDelim.end + 1].token === endDelim.token + 1;
		const ch = String.fromCharCode(startDelim.marker);
		const token_o = state.tokens[startDelim.token];
		token_o.type = isStrong ? "strong_open" : "em_open";
		token_o.tag = isStrong ? "strong" : "em";
		token_o.nesting = 1;
		token_o.markup = isStrong ? ch + ch : ch;
		token_o.content = "";
		const token_c = state.tokens[endDelim.token];
		token_c.type = isStrong ? "strong_close" : "em_close";
		token_c.tag = isStrong ? "strong" : "em";
		token_c.nesting = -1;
		token_c.markup = isStrong ? ch + ch : ch;
		token_c.content = "";
		if (isStrong) {
			state.tokens[delimiters[i - 1].token].content = "";
			state.tokens[delimiters[startDelim.end + 1].token].content = "";
			i--;
		}
	}
}
function emphasis_post_process(state) {
	const tokens_meta = state.tokens_meta;
	const max = state.tokens_meta.length;
	postProcess(state, state.delimiters);
	for (let curr = 0; curr < max; curr++) {
		var _tokens_meta$curr;
		const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
		if (delimiters) postProcess(state, delimiters);
	}
}
var emphasis_default = {
	tokenize: emphasis_tokenize,
	postProcess: emphasis_post_process
};
//#endregion
//#region src/rules_inline/link.ts
function link(state, silent) {
	let code, label, res, ref;
	let href = "";
	let title = "";
	let start = state.pos;
	let parseReference = true;
	if (state.src.charCodeAt(state.pos) !== 91) return false;
	const oldPos = state.pos;
	const max = state.posMax;
	const labelStart = state.pos + 1;
	const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);
	if (labelEnd < 0) return false;
	let pos = labelEnd + 1;
	if (pos < max && state.src.charCodeAt(pos) === 40) {
		parseReference = false;
		pos++;
		for (; pos < max; pos++) {
			code = state.src.charCodeAt(pos);
			if (!isSpace(code) && code !== 10) break;
		}
		if (pos >= max) return false;
		start = pos;
		res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
		if (res.ok) {
			href = state.md.normalizeLink(res.str);
			if (state.md.validateLink(href)) pos = res.pos;
			else href = "";
			start = pos;
			for (; pos < max; pos++) {
				code = state.src.charCodeAt(pos);
				if (!isSpace(code) && code !== 10) break;
			}
			res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
			if (pos < max && start !== pos && res.ok) {
				title = res.str;
				pos = res.pos;
				for (; pos < max; pos++) {
					code = state.src.charCodeAt(pos);
					if (!isSpace(code) && code !== 10) break;
				}
			}
		}
		if (pos >= max || state.src.charCodeAt(pos) !== 41) parseReference = true;
		pos++;
	}
	if (parseReference) {
		if (typeof state.env.references === "undefined") return false;
		if (pos < max && state.src.charCodeAt(pos) === 91) {
			start = pos + 1;
			pos = state.md.helpers.parseLinkLabel(state, pos);
			if (pos >= 0) label = state.src.slice(start, pos++);
			else pos = labelEnd + 1;
		} else pos = labelEnd + 1;
		if (!label) label = state.src.slice(labelStart, labelEnd);
		label = normalizeReference(label);
		ref = state.env.references[label];
		if (!ref) {
			state.pos = oldPos;
			return false;
		}
		href = ref.href;
		title = ref.title;
	}
	if (!silent) {
		state.pos = labelStart;
		state.posMax = labelEnd;
		const token_o = state.push("link_open", "a", 1);
		const attrs = [["href", href]];
		token_o.attrs = attrs;
		if (title) attrs.push(["title", title]);
		if (label) {
			const meta = Object.create(null);
			meta.label = label;
			token_o.meta = meta;
		}
		state.linkLevel++;
		state.md.inline.tokenize(state);
		state.linkLevel--;
		state.push("link_close", "a", -1);
	}
	state.pos = pos;
	state.posMax = max;
	return true;
}
//#endregion
//#region src/rules_inline/image.ts
function image(state, silent) {
	let code, content, label, pos, ref, res, title, start;
	let href = "";
	const oldPos = state.pos;
	const max = state.posMax;
	if (state.src.charCodeAt(state.pos) !== 33) return false;
	if (state.src.charCodeAt(state.pos + 1) !== 91) return false;
	const labelStart = state.pos + 2;
	const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
	if (labelEnd < 0) return false;
	pos = labelEnd + 1;
	if (pos < max && state.src.charCodeAt(pos) === 40) {
		pos++;
		for (; pos < max; pos++) {
			code = state.src.charCodeAt(pos);
			if (!isSpace(code) && code !== 10) break;
		}
		if (pos >= max) return false;
		start = pos;
		res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
		if (res.ok) {
			href = state.md.normalizeLink(res.str);
			if (state.md.validateLink(href)) pos = res.pos;
			else href = "";
		}
		start = pos;
		for (; pos < max; pos++) {
			code = state.src.charCodeAt(pos);
			if (!isSpace(code) && code !== 10) break;
		}
		res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
		if (pos < max && start !== pos && res.ok) {
			title = res.str;
			pos = res.pos;
			for (; pos < max; pos++) {
				code = state.src.charCodeAt(pos);
				if (!isSpace(code) && code !== 10) break;
			}
		} else title = "";
		if (pos >= max || state.src.charCodeAt(pos) !== 41) {
			state.pos = oldPos;
			return false;
		}
		pos++;
	} else {
		if (typeof state.env.references === "undefined") return false;
		if (pos < max && state.src.charCodeAt(pos) === 91) {
			start = pos + 1;
			pos = state.md.helpers.parseLinkLabel(state, pos);
			if (pos >= 0) label = state.src.slice(start, pos++);
			else pos = labelEnd + 1;
		} else pos = labelEnd + 1;
		if (!label) label = state.src.slice(labelStart, labelEnd);
		label = normalizeReference(label);
		ref = state.env.references[label];
		if (!ref) {
			state.pos = oldPos;
			return false;
		}
		href = ref.href;
		title = ref.title;
	}
	if (!silent) {
		content = state.src.slice(labelStart, labelEnd);
		const tokens = [];
		state.md.inline.parse(content, state.md, state.env, tokens);
		const token = state.push("image", "img", 0);
		const attrs = [["src", href], ["alt", ""]];
		token.attrs = attrs;
		token.children = tokens;
		token.content = content;
		if (title) attrs.push(["title", title]);
		if (label) {
			const meta = Object.create(null);
			meta.label = label;
			token.meta = meta;
		}
	}
	state.pos = pos;
	state.posMax = max;
	return true;
}
//#endregion
//#region src/rules_inline/autolink.ts
var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function autolink(state, silent) {
	let pos = state.pos;
	if (state.src.charCodeAt(pos) !== 60) return false;
	const start = state.pos;
	const max = state.posMax;
	for (;;) {
		if (++pos >= max) return false;
		const ch = state.src.charCodeAt(pos);
		if (ch === 60) return false;
		if (ch === 62) break;
	}
	const url = state.src.slice(start + 1, pos);
	if (AUTOLINK_RE.test(url)) {
		const fullUrl = state.md.normalizeLink(url);
		if (!state.md.validateLink(fullUrl)) return false;
		if (!silent) {
			const token_o = state.push("link_open", "a", 1);
			token_o.attrs = [["href", fullUrl]];
			token_o.markup = "autolink";
			token_o.info = "auto";
			const token_t = state.push("text", "", 0);
			token_t.content = state.md.normalizeLinkText(url);
			const token_c = state.push("link_close", "a", -1);
			token_c.markup = "autolink";
			token_c.info = "auto";
		}
		state.pos += url.length + 2;
		return true;
	}
	if (EMAIL_RE.test(url)) {
		const fullUrl = state.md.normalizeLink(`mailto:${url}`);
		if (!state.md.validateLink(fullUrl)) return false;
		if (!silent) {
			const token_o = state.push("link_open", "a", 1);
			token_o.attrs = [["href", fullUrl]];
			token_o.markup = "autolink";
			token_o.info = "auto";
			const token_t = state.push("text", "", 0);
			token_t.content = state.md.normalizeLinkText(url);
			const token_c = state.push("link_close", "a", -1);
			token_c.markup = "autolink";
			token_c.info = "auto";
		}
		state.pos += url.length + 2;
		return true;
	}
	return false;
}
//#endregion
//#region src/rules_inline/html_inline.ts
function isLinkOpen(str) {
	return /^<a[>\s]/i.test(str);
}
function isLinkClose(str) {
	return /^<\/a\s*>/i.test(str);
}
function isLetter(ch) {
	const lc = ch | 32;
	return lc >= 97 && lc <= 122;
}
function scanSpecial(state, pos) {
	const src = state.src;
	let start;
	let terminator;
	if (src.startsWith("<!--", pos)) {
		if (src.startsWith(">", pos + 4)) return pos + 5;
		if (src.startsWith("->", pos + 4)) return pos + 6;
		start = pos + 4;
		terminator = "-->";
	} else if (src.startsWith("<![CDATA[", pos)) {
		start = pos + 9;
		terminator = "]]>";
	} else if (src.charCodeAt(pos + 1) === 63) {
		start = pos + 2;
		terminator = "?>";
	} else if (isLetter(src.charCodeAt(pos + 2))) {
		start = pos + 3;
		terminator = ">";
	} else return -1;
	if (state.skipHtmlSpecial) return -1;
	const end = src.indexOf(terminator, start);
	if (end < 0) {
		state.skipHtmlSpecial = true;
		return -1;
	}
	return end + terminator.length;
}
function html_inline(state, silent) {
	if (!state.md.options.html) return false;
	const max = state.posMax;
	const pos = state.pos;
	if (state.src.charCodeAt(pos) !== 60 || pos + 2 >= max) return false;
	let end;
	const ch = state.src.charCodeAt(pos + 1);
	if (ch === 33 || ch === 63) end = scanSpecial(state, pos);
	else if (ch === 47 || isLetter(ch)) {
		const match = state.src.slice(pos).match(HTML_OPEN_CLOSE_TAG_RE);
		end = match ? pos + match[0].length : -1;
	} else return false;
	if (end < 0) return false;
	if (!silent) {
		const token = state.push("html_inline", "", 0);
		token.content = state.src.slice(pos, end);
		if (isLinkOpen(token.content)) state.linkLevel++;
		if (isLinkClose(token.content)) state.linkLevel--;
	}
	state.pos = end;
	return true;
}
//#endregion
//#region src/rules_inline/entity.ts
var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;
function entity(state, silent) {
	const pos = state.pos;
	const max = state.posMax;
	if (state.src.charCodeAt(pos) !== 38) return false;
	if (pos + 1 >= max) return false;
	if (state.src.charCodeAt(pos + 1) === 35) {
		const match = state.src.slice(pos).match(DIGITAL_RE);
		if (match) {
			if (!silent) {
				const code = match[1][0].toLowerCase() === "x" ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
				const token = state.push("text_special", "", 0);
				token.content = isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(65533);
				token.markup = match[0];
				token.info = "entity";
			}
			state.pos += match[0].length;
			return true;
		}
	} else {
		const match = state.src.slice(pos).match(NAMED_RE);
		if (match) {
			const decoded = decodeHTMLStrict(match[0]);
			if (decoded !== match[0]) {
				if (!silent) {
					const token = state.push("text_special", "", 0);
					token.content = decoded;
					token.markup = match[0];
					token.info = "entity";
				}
				state.pos += match[0].length;
				return true;
			}
		}
	}
	return false;
}
//#endregion
//#region src/rules_inline/balance_pairs.ts
function processDelimiters(delimiters) {
	const openersBottom = {};
	const max = delimiters.length;
	if (!max) return;
	let headerIdx = 0;
	let lastTokenIdx = -2;
	const jumps = [];
	for (let closerIdx = 0; closerIdx < max; closerIdx++) {
		const closer = delimiters[closerIdx];
		jumps.push(0);
		if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) headerIdx = closerIdx;
		lastTokenIdx = closer.token;
		closer.length = closer.length || 0;
		if (!closer.close) continue;
		if (!openersBottom.hasOwnProperty(closer.marker)) openersBottom[closer.marker] = [
			-1,
			-1,
			-1,
			-1,
			-1,
			-1
		];
		const minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
		let openerIdx = headerIdx - jumps[headerIdx] - 1;
		let newMinOpenerIdx = openerIdx;
		for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
			const opener = delimiters[openerIdx];
			if (opener.marker !== closer.marker) continue;
			if (opener.open && opener.end < 0) {
				let isOddMatch = false;
				if (opener.close || closer.open) {
					if ((opener.length + closer.length) % 3 === 0) {
						if (opener.length % 3 !== 0 || closer.length % 3 !== 0) isOddMatch = true;
					}
				}
				if (!isOddMatch) {
					const lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
					jumps[closerIdx] = closerIdx - openerIdx + lastJump;
					jumps[openerIdx] = lastJump;
					closer.open = false;
					opener.end = closerIdx;
					opener.close = false;
					newMinOpenerIdx = -1;
					lastTokenIdx = -2;
					break;
				}
			}
		}
		if (newMinOpenerIdx !== -1) openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
	}
}
function link_pairs(state) {
	const tokens_meta = state.tokens_meta;
	const max = state.tokens_meta.length;
	processDelimiters(state.delimiters);
	for (let curr = 0; curr < max; curr++) {
		var _tokens_meta$curr;
		const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
		if (delimiters) processDelimiters(delimiters);
	}
}
//#endregion
//#region src/rules_inline/fragments_join.ts
function fragments_join(state) {
	let curr, last;
	let level = 0;
	const tokens = state.tokens;
	const max = state.tokens.length;
	for (curr = last = 0; curr < max; curr++) {
		if (tokens[curr].nesting < 0) level--;
		tokens[curr].level = level;
		if (tokens[curr].nesting > 0) level++;
		if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
		else {
			if (curr !== last) tokens[last] = tokens[curr];
			last++;
		}
	}
	if (curr !== last) tokens.length = last;
}
//#endregion
//#region src/parser_inline.ts
var _rules = [
	["text", text],
	["linkify", linkify],
	["newline", newline],
	["escape", escape],
	["backticks", backtick],
	["strikethrough", strikethrough_default.tokenize],
	["emphasis", emphasis_default.tokenize],
	["link", link],
	["image", image],
	["autolink", autolink],
	["html_inline", html_inline],
	["entity", entity]
];
var _rules2 = [
	["balance_pairs", link_pairs],
	["strikethrough", strikethrough_default.postProcess],
	["emphasis", emphasis_default.postProcess],
	["fragments_join", fragments_join]
];
/**
* Tokenizes paragraph content.
*/
var ParserInline = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* {@link Ruler} instance. Keep configuration of inline rules.
			*/
			"ruler",
			new Ruler()
		);
		_defineProperty(
			this,
			/**
			* {@link Ruler} instance. Second ruler used for post-processing
			* (e.g. in emphasis-like rules).
			*/
			"ruler2",
			new Ruler()
		);
		_defineProperty(this, "State", StateInline);
		for (let i = 0; i < _rules.length; i++) this.ruler.push(_rules[i][0], _rules[i][1]);
		for (let i = 0; i < _rules2.length; i++) this.ruler2.push(_rules2[i][0], _rules2[i][1]);
	}
	skipToken(state) {
		const pos = state.pos;
		const rules = this.ruler.getRules("");
		const len = rules.length;
		const maxNesting = state.md.options.maxNesting;
		const cache = state.cache;
		if (typeof cache[pos] !== "undefined") {
			state.pos = cache[pos];
			return;
		}
		let ok = false;
		if (state.level < maxNesting) for (let i = 0; i < len; i++) {
			state.level++;
			ok = rules[i](state, true);
			state.level--;
			if (ok) {
				if (pos >= state.pos) throw new Error("inline rule didn't increment state.pos");
				break;
			}
		}
		else state.pos = state.posMax;
		if (!ok) state.pos++;
		cache[pos] = state.pos;
	}
	tokenize(state) {
		const rules = this.ruler.getRules("");
		const len = rules.length;
		const end = state.posMax;
		const maxNesting = state.md.options.maxNesting;
		while (state.pos < end) {
			const prevPos = state.pos;
			let ok = false;
			if (state.level < maxNesting) for (let i = 0; i < len; i++) {
				ok = rules[i](state, false);
				if (ok) {
					if (prevPos >= state.pos) throw new Error("inline rule didn't increment state.pos");
					break;
				}
			}
			if (ok) {
				if (state.pos >= end) break;
				continue;
			}
			state.pending += state.src[state.pos++];
		}
		if (state.pending) state.pushPending();
	}
	/**
	* Process input string and push inline tokens into `outTokens`
	*/
	parse(str, md, env, outTokens) {
		const state = new this.State(str, md, env, outTokens);
		this.tokenize(state);
		const rules = this.ruler2.getRules("");
		const len = rules.length;
		for (let i = 0; i < len; i++) rules[i](state);
	}
};
//#endregion
//#region src/markdownit.ts
var config = {
	default: {
		options: {
			html: false,
			xhtmlOut: false,
			breaks: false,
			langPrefix: "language-",
			linkify: false,
			typographer: false,
			quotes: "“”‘’",
			highlight: null,
			maxNesting: 100
		},
		components: {
			core: {},
			block: {},
			inline: {}
		}
	},
	zero: {
		options: {
			html: false,
			xhtmlOut: false,
			breaks: false,
			langPrefix: "language-",
			linkify: false,
			typographer: false,
			quotes: "“”‘’",
			highlight: null,
			maxNesting: 20
		},
		components: {
			core: { rules: [
				"normalize",
				"block",
				"strip_references",
				"inline",
				"text_join"
			] },
			block: { rules: ["paragraph"] },
			inline: {
				rules: ["text"],
				rules2: ["balance_pairs", "fragments_join"]
			}
		}
	},
	commonmark: {
		options: {
			html: true,
			xhtmlOut: true,
			breaks: false,
			langPrefix: "language-",
			linkify: false,
			typographer: false,
			quotes: "“”‘’",
			highlight: null,
			maxNesting: 20
		},
		components: {
			core: { rules: [
				"normalize",
				"block",
				"strip_references",
				"inline",
				"text_join"
			] },
			block: { rules: [
				"blockquote",
				"code",
				"fence",
				"heading",
				"hr",
				"html_block",
				"lheading",
				"list",
				"reference",
				"paragraph"
			] },
			inline: {
				rules: [
					"autolink",
					"backticks",
					"emphasis",
					"entity",
					"escape",
					"html_inline",
					"image",
					"link",
					"newline",
					"text"
				],
				rules2: [
					"balance_pairs",
					"emphasis",
					"fragments_join"
				]
			}
		}
	}
};
var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
var RECODE_HOSTNAME_FOR = [
	"http:",
	"https:",
	"mailto:"
];
/**
* Parses Markdown into tokens and renders them to HTML.
*
* @category Main
*/
var MarkdownIt = class {
	/**
	* Link validation function. CommonMark allows too much in links. By default
	* we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
	* except some embedded image types.
	*
	* You can change this behaviour:
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* // enable everything
	* md.validateLink = function () { return true; }
	* ```
	*/
	validateLink(url) {
		const str = url.trim().toLowerCase();
		return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
	}
	/**
	* Function used to encode link url to a machine-readable format,
	* which includes url-encoding, punycode, etc.
	*/
	normalizeLink(url) {
		const parsed = mdurl.parse(url, true);
		if (parsed.hostname) {
			if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
				parsed.hostname = punycode.toASCII(parsed.hostname);
			} catch (er) {}
		}
		if (parsed.auth) parsed.auth = mdurl.encode(parsed.auth);
		if (parsed.hostname) parsed.hostname = mdurl.encode(parsed.hostname);
		if (parsed.pathname) parsed.pathname = mdurl.encode(parsed.pathname);
		if (parsed.search) parsed.search = mdurl.encode(parsed.search);
		if (parsed.hash) parsed.hash = mdurl.encode(parsed.hash);
		return mdurl.format(parsed);
	}
	/**
	* Function used to decode link url to a human-readable format`
	*/
	normalizeLinkText(url) {
		const parsed = mdurl.parse(url, true);
		if (parsed.hostname) {
			if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
				parsed.hostname = punycode.toUnicode(parsed.hostname);
			} catch (er) {}
		}
		return mdurl.decode(mdurl.format(parsed), mdurl.decode.defaultChars + "%");
	}
	constructor(...args) {
		_defineProperty(
			this,
			/**
			* Instance of {@link ParserInline}. You may need it to add new rules when
			* writing plugins. For simple rules control use {@link MarkdownIt.disable}
			* and {@link MarkdownIt.enable}.
			*/
			"inline",
			new ParserInline()
		);
		_defineProperty(
			this,
			/**
			* Instance of {@link ParserBlock}. You may need it to add new rules when
			* writing plugins. For simple rules control use {@link MarkdownIt.disable}
			* and {@link MarkdownIt.enable}.
			*/
			"block",
			new ParserBlock()
		);
		_defineProperty(
			this,
			/**
			* Instance of {@link ParserCore} chain executor. You may need it to add new
			* rules when writing plugins. For simple rules control use
			* {@link MarkdownIt.disable} and {@link MarkdownIt.enable}.
			*/
			"core",
			new ParserCore()
		);
		_defineProperty(
			this,
			/**
			* Instance of {@link Renderer}. Use it to modify output look. Or to add rendering
			* rules for new token types, generated by plugins.
			*
			* See {@link Renderer} docs and
			* [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts).
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* function myToken(tokens, idx, options, env, self) {
			*   //...
			*   return result;
			* };
			*
			* md.renderer.rules['my_token'] = myToken
			* ```
			*/
			"renderer",
			new Renderer()
		);
		_defineProperty(
			this,
			/**
			* [linkify-it](https://github.com/markdown-it/linkify-it) instance.
			* Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/src/rules_core/linkify.ts)
			* rule.
			*/
			"linkify",
			new LinkifyIt()
		);
		_defineProperty(
			this,
			/**
			* Assorted utility functions, useful to write plugins. See details
			* [here](https://github.com/markdown-it/markdown-it/blob/master/src/common/utils.ts).
			*/
			"utils",
			utils_exports
		);
		_defineProperty(
			this,
			/**
			* Link components parser functions, useful to write plugins. See details
			* [here](https://github.com/markdown-it/markdown-it/blob/master/src/helpers).
			*/
			"helpers",
			Object.assign({}, helpers_exports)
		);
		const [presetNameOrOptions, options] = args;
		if (typeof presetNameOrOptions === "string") {
			this.configure(presetNameOrOptions);
			if (options) this.set(options);
		} else {
			this.configure("default");
			this.set(presetNameOrOptions || {});
		}
	}
	/**
	* Set parser options (in the same format as in constructor). Probably, you
	* will never need it, but you can change options after constructor call.
	*
	* __Note:__ To achieve the best possible performance, don't modify a
	* `markdown-it` instance options on the fly. If you need multiple configurations
	* it's best to create multiple instances and initialize each with separate
	* config.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	*
	* const md = new MarkdownIt()
	*   .set({ html: true, breaks: true })
	*   .set({ typographer: true })
	* ```
	*/
	set(options) {
		Object.assign(this.options, options);
		return this;
	}
	/**
	* Batch load of all options and compenent settings. This is internal method,
	* and you probably will not need it. But if you will - see available presets
	* and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/src/presets)
	*
	* We strongly recommend to use presets instead of direct config loads. That
	* will give better compatibility with next versions.
	*/
	configure(presets) {
		let p;
		if (typeof presets === "string") {
			const presetName = presets;
			p = config[presetName];
			if (!p) throw new Error(`Wrong 'markdown-it' preset "${presetName}", check name`);
		} else p = presets;
		if (!p) throw new Error("Wrong `markdown-it` preset, can't be empty");
		if (p.options) this.options = { ...p.options };
		const components = p.components;
		if (components) {
			var _components$inline;
			[
				"core",
				"block",
				"inline"
			].forEach((name) => {
				var _components$name;
				const rules = (_components$name = components[name]) === null || _components$name === void 0 ? void 0 : _components$name.rules;
				if (rules) this[name].ruler.enableOnly(rules);
			});
			const rules2 = (_components$inline = components.inline) === null || _components$inline === void 0 ? void 0 : _components$inline.rules2;
			if (rules2) this.inline.ruler2.enableOnly(rules2);
		}
		return this;
	}
	/**
	* Enable list or rules. It will automatically find appropriate components,
	* containing rules with given names. If rule not found, and `ignoreInvalid`
	* not set - throws exception.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	*
	* const md = new MarkdownIt()
	*   .enable(['sub', 'sup'])
	*   .disable('smartquotes')
	* ```
	*/
	enable(list, ignoreInvalid = false) {
		let result = [];
		if (!Array.isArray(list)) list = [list];
		[
			"core",
			"block",
			"inline"
		].forEach((chain) => {
			result = result.concat(this[chain].ruler.enable(list, true));
		});
		result = result.concat(this.inline.ruler2.enable(list, true));
		const missed = list.filter((name) => result.indexOf(name) < 0);
		if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to enable unknown rule(s): ${missed}`);
		return this;
	}
	/**
	* The same as {@link MarkdownIt.enable}, but turn specified rules off.
	*/
	disable(list, ignoreInvalid = false) {
		let result = [];
		if (!Array.isArray(list)) list = [list];
		[
			"core",
			"block",
			"inline"
		].forEach((chain) => {
			result = result.concat(this[chain].ruler.disable(list, true));
		});
		result = result.concat(this.inline.ruler2.disable(list, true));
		const missed = list.filter((name) => result.indexOf(name) < 0);
		if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to disable unknown rule(s): ${missed}`);
		return this;
	}
	/**
	* Load specified plugin with given params into current parser instance.
	* It's just a sugar to call `plugin(md, params)` with curring.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* import iterator from 'markdown-it-for-inline'
	*
	* const md = new MarkdownIt()
	*   .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
	*     tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar')
	*   })
	* ```
	*/
	use(plugin, ...params) {
		plugin.apply(plugin, [this, ...params]);
		return this;
	}
	/**
	* Parse input string and return list of block tokens (special token type
	* "inline" will contain list of inline tokens). You should not call this
	* method directly, until you write custom renderer (for example, to produce
	* AST).
	*
	* `env` is used to pass data between "distributed" rules and return additional
	* metadata like reference info, needed for the renderer. It also can be used to
	* inject data in specific cases. Usually, you will be ok to pass `{}`,
	* and then pass updated object to renderer.
	*/
	parse(src, env) {
		if (typeof src !== "string") throw new Error("Input data should be a String");
		const state = new this.core.State(src, this, env);
		this.core.process(state);
		return state.tokens;
	}
	/**
	* Render markdown string into html. It does all magic for you :).
	*
	* `env` can be used to inject additional metadata (`{}` by default).
	* But you will not need it with high probability. See also comment
	* in {@link MarkdownIt.parse}.
	*/
	render(src, env = {}) {
		return this.renderer.render(this.parse(src, env), this.options, env);
	}
	/**
	* The same as {@link MarkdownIt.parse} but skip all block rules. It returns
	* the block tokens list with the single `inline` element, containing parsed
	* inline tokens in `children` property. Also updates `env` object.
	*/
	parseInline(src, env) {
		const state = new this.core.State(src, this, env);
		state.inlineMode = true;
		this.core.process(state);
		return state.tokens;
	}
	/**
	* Similar to {@link MarkdownIt.render} but for single paragraph content.
	* Result will NOT be wrapped into `<p>` tags.
	*/
	renderInline(src, env = {}) {
		return this.renderer.render(this.parseInline(src, env), this.options, env);
	}
};
_defineProperty(MarkdownIt, "Token", Token);
_defineProperty(MarkdownIt, "Ruler", Ruler);
_defineProperty(MarkdownIt, "Renderer", Renderer);
_defineProperty(MarkdownIt, "ParserCore", ParserCore);
_defineProperty(MarkdownIt, "StateCore", StateCore);
_defineProperty(MarkdownIt, "ParserBlock", ParserBlock);
_defineProperty(MarkdownIt, "StateBlock", StateBlock);
_defineProperty(MarkdownIt, "ParserInline", ParserInline);
_defineProperty(MarkdownIt, "StateInline", StateInline);
//#endregion
//#region src/index.ts
/**
* Default package export.
*
* For backward compatibility, the {@link MarkdownIt} class is wrapped so
* legacy code can call it without `new`. New code should instantiate it as a
* regular class with `new`. The compatibility wrapper may be removed in a
* future release.
*
* @category Main
*/
var MarkdownItCallable = callable(MarkdownIt);
//#endregion
export { MarkdownItCallable as default };

//# sourceMappingURL=markdown-it.mjs.map