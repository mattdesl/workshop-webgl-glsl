/*!
* Copyright (c) Squirrel Chat et al., All rights reserved.
* SPDX-License-Identifier: BSD-3-Clause
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice, this
*    list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright notice,
*    this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
* 3. Neither the name of the copyright holder nor the names of its contributors
*    may be used to endorse or promote products derived from this software without
*    specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
"use strict";
Object.defineProperties(exports, {
	__esModule: { value: true },
	[Symbol.toStringTag]: { value: "Module" }
});
//#region src/error.ts
function getLineColFromPtr(string, ptr) {
	let lines = string.slice(0, ptr).split(/\r?\n/);
	return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line, column) {
	let lines = string.split(/\r?\n/);
	let codeblock = "";
	let numberLen = (Math.log10(line + 1) | 0) + 1;
	for (let i = line - 1; i <= line + 1; i++) {
		let l = lines[i - 1];
		if (!l) continue;
		codeblock += i.toString().padEnd(numberLen, " ");
		codeblock += ":  ";
		codeblock += l;
		codeblock += "\n";
		if (i === line) {
			codeblock += " ".repeat(numberLen + column + 2);
			codeblock += "^\n";
		}
	}
	return codeblock;
}
var TomlError = class TomlError extends Error {
	line;
	column;
	codeblock;
	constructor(message, options) {
		const [line, column] = getLineColFromPtr(options.toml, options.ptr);
		const codeblock = makeCodeBlock(options.toml, line, column);
		super(`Invalid TOML document: ${message}\n\n${codeblock}`, options);
		this.line = line;
		this.column = column;
		this.codeblock = codeblock;
	}
	/** @internal */
	static x(message, ctx, ptr) {
		throw new TomlError(message, {
			toml: ctx.s,
			ptr: ptr ?? ctx.p
		});
	}
};
//#endregion
//#region src/primitive.ts
/** @internal */
function parseString(ctx) {
	let startPtr = ctx.p;
	let c = ctx.s.charCodeAt(ctx.p++);
	let first = c;
	let isLiteral = c === 39;
	let isMultiline = c === ctx.s.charCodeAt(ctx.p) && c === ctx.s.charCodeAt(ctx.p + 1);
	if (isMultiline) {
		if ((c = ctx.s.charCodeAt(ctx.p += 2)) === 10) ctx.p++;
		else if (c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10) ctx.p += 2;
	}
	let parsed = "";
	let sliceStart = ctx.p;
	let state = 0;
	for (; ctx.p < ctx.s.length; ctx.p++) {
		c = ctx.s.charCodeAt(ctx.p);
		if (isMultiline && (c === 10 || c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10)) state = state && 3;
		else if (c < 32 && c !== 9 || c === 127) TomlError.x("control characters are not allowed in strings", ctx);
		else if ((!state || state === 3) && c === first && (!isMultiline || ctx.s.charCodeAt(ctx.p + 1) === first && ctx.s.charCodeAt(ctx.p + 2) === first)) {
			if (isMultiline) {
				if (ctx.s.charCodeAt(ctx.p + 3) === first) ctx.p++;
				if (ctx.s.charCodeAt(ctx.p + 3) === first) ctx.p++;
			}
			if (!state) {
				let s = ctx.s.slice(sliceStart, ctx.p);
				parsed = parsed ? parsed + s : s;
			}
			ctx.p += isMultiline ? 3 : 1;
			return parsed;
		} else if (!state) {
			if (!isLiteral && c === 92) {
				parsed += ctx.s.slice(sliceStart, sliceStart = ctx.p);
				state = 1;
			}
		} else if (state === 1) {
			if (c === 120 || c === 117 || c === 85) {
				let errPtr = ctx.p++ - 1;
				let value = 0;
				let len = c === 120 ? 2 : c === 117 ? 4 : 8;
				for (let j = 0; j < len; j++, ctx.p++) {
					let hex = ctx.s.charCodeAt(ctx.p);
					let digit = hex >= 48 && hex <= 57 ? hex - 48 : hex >= 65 && hex <= 70 ? hex - 65 + 10 : hex >= 97 && hex <= 102 ? hex - 97 + 10 : -1;
					if (digit < 0) TomlError.x("invalid non-hex character in unicode escape", ctx);
					value = value << 4 | digit;
				}
				if (value < 0 || value > 1114111 || value >= 55296 && value <= 57343) TomlError.x("invalid unicode escape", ctx, errPtr);
				parsed += String.fromCodePoint(value);
				sliceStart = ctx.p--;
				state = 0;
			} else if (isMultiline && (c === 32 || c === 9)) state = 2;
			else {
				if (c === 98) parsed += "\b";
				else if (c === 116) parsed += "	";
				else if (c === 110) parsed += "\n";
				else if (c === 102) parsed += "\f";
				else if (c === 114) parsed += "\r";
				else if (c === 101) parsed += "\x1B";
				else if (c === 34) parsed += "\"";
				else if (c === 92) parsed += "\\";
				else TomlError.x("unrecognised escape sequence", ctx);
				sliceStart = ctx.p + 1;
				state = 0;
			}
		} else if (c !== 32 && c !== 9) {
			if (state === 2) TomlError.x("invalid escape: only line-ending whitespace may be escaped", ctx, sliceStart);
			state = !isLiteral && c === 92 ? 1 : 0;
			sliceStart = ctx.p;
		}
	}
	TomlError.x("unfinished string", ctx, startPtr);
}
//#endregion
//#region src/date.ts
let DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[Tt ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|z|[-+]\d{2}:\d{2})?$/i;
var TomlDate = class TomlDate extends Date {
	#hasDate = false;
	#hasTime = false;
	#offset = null;
	constructor(date, fasttype, unsafeDelim) {
		let hasDate = true;
		let hasTime = true;
		let offset = "Z";
		let c;
		if (typeof date === "string") {
			if (fasttype) prep: {
				if (fasttype < 3) {
					if (+date.slice(11, 13) > 23) {
						date = "";
						break prep;
					}
					if (fasttype === 2) {
						offset = null;
						date += "Z";
					} else if ((c = date.charCodeAt(date.length - 1)) !== 90 && c !== 122) offset = date.slice(date.length - 6);
					if (unsafeDelim) date = date.slice(0, 10) + "T" + date.slice(11);
				} else if (fasttype === 4) date = +date.slice(0, 2) > 23 ? "" : `0000-01-01T${date}Z`;
				hasDate = fasttype !== 4;
				hasTime = fasttype !== 3;
			}
			else {
				let match = date.match(DATE_TIME_RE);
				if (match) {
					if (!match[1]) {
						hasDate = false;
						date = `0000-01-01T${date}`;
					}
					hasTime = !!match[2];
					hasTime && date[10] === " " && (date = date.replace(" ", "T"));
					if (match[2] && +match[2] > 23) date = "";
					else {
						offset = match[3] || null;
						if (!offset && hasTime) date += "Z";
					}
				} else date = "";
			}
		}
		super(date);
		if (!isNaN(this.getTime())) {
			this.#hasDate = hasDate;
			this.#hasTime = hasTime;
			this.#offset = offset;
		}
	}
	isDateTime() {
		return this.#hasDate && this.#hasTime;
	}
	isLocal() {
		return !this.#hasDate || !this.#hasTime || !this.#offset;
	}
	isDate() {
		return this.#hasDate && !this.#hasTime;
	}
	isTime() {
		return this.#hasTime && !this.#hasDate;
	}
	isValid() {
		return this.#hasDate || this.#hasTime;
	}
	toISOString() {
		let iso = super.toISOString();
		if (this.isDate()) return iso.slice(0, 10);
		if (this.isTime()) return iso.slice(11, 23);
		if (this.#offset === null) return iso.slice(0, -1);
		if (this.#offset === "Z" || this.#offset === "z") return iso;
		let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
		offset = this.#offset[0] === "-" ? offset : -offset;
		return (/* @__PURE__ */ new Date(this.getTime() - offset * 6e4)).toISOString().slice(0, -1) + this.#offset;
	}
	static wrapAsOffsetDateTime(jsDate, offset = "Z") {
		let date = new TomlDate(jsDate);
		date.#offset = offset;
		return date;
	}
	static wrapAsLocalDateTime(jsDate) {
		let date = new TomlDate(jsDate);
		date.#offset = null;
		return date;
	}
	static wrapAsLocalDate(jsDate) {
		let date = new TomlDate(jsDate);
		date.#hasTime = false;
		date.#offset = null;
		return date;
	}
	static wrapAsLocalTime(jsDate) {
		let date = new TomlDate(jsDate);
		date.#hasDate = false;
		date.#offset = null;
		return date;
	}
};
//#endregion
//#region src/extract.ts
function isDigit(char, base = 10) {
	return base === 16 ? char > 47 && char < 58 || char > 64 && char < 71 || char > 96 && char < 103 : char > 47 && char < 48 + base;
}
function isEndOfValue(char, delim) {
	return char === 32 || char === 9 || char === 10 || char === 13 || delim && (char === delim || char === 44) || char === 35;
}
/** @internal */
function extractValue(ctx, end) {
	let errPtr = ctx.p;
	let c = ctx.s.charCodeAt(ctx.p);
	if (c === 91 || c === 123) {
		ctx.d-- || TomlError.x("document contains excessively nested structures. aborting.", ctx);
		let value = c === 91 ? parseArray(ctx) : parseInlineTable(ctx);
		ctx.d++;
		return value;
	}
	if (c === 34 || c === 39) return parseString(ctx);
	if (c === 116) {
		if (ctx.s.charCodeAt(++ctx.p) !== 114 || ctx.s.charCodeAt(++ctx.p) !== 117 || ctx.s.charCodeAt(++ctx.p) !== 101) TomlError.x("invalid value", ctx, errPtr);
		return ctx.p++, true;
	}
	if (c === 102) {
		if (ctx.s.charCodeAt(++ctx.p) !== 97 || ctx.s.charCodeAt(++ctx.p) !== 108 || ctx.s.charCodeAt(++ctx.p) !== 115 || ctx.s.charCodeAt(++ctx.p) !== 101) TomlError.x("invalid value", ctx, errPtr);
		return ctx.p++, false;
	}
	if (c === 43 || c === 45) return parseNumber(ctx, ctx.p, ctx.s.charCodeAt(++ctx.p), 44 - c, end);
	if (ctx.s.charCodeAt(ctx.p + 4) === 45 && ctx.s.charCodeAt(ctx.p + 7) === 45) return parseDate(ctx, c, end);
	if (ctx.s.charCodeAt(ctx.p + 2) === 58) return parseTime(ctx, c, end);
	return parseNumber(ctx, ctx.p, c, 0, end);
}
function parseNumber(ctx, startPtr, startChr, sign, endChr) {
	let c = startChr;
	let state = 0;
	let hasUnderscores = false;
	if (c === 105) {
		if (ctx.s.charCodeAt(++ctx.p) !== 110 || ctx.s.charCodeAt(++ctx.p) !== 102) TomlError.x("invalid value", ctx, startPtr);
		return ctx.p++, (sign || 1) / 0;
	}
	if (c === 110) {
		if (ctx.s.charCodeAt(++ctx.p) !== 97 || ctx.s.charCodeAt(++ctx.p) !== 110) TomlError.x("invalid value", ctx, startPtr);
		return ctx.p++, NaN;
	}
	if (c === 48) {
		if (++ctx.p >= ctx.s.length || isEndOfValue(c = ctx.s.charCodeAt(ctx.p), endChr)) return ctx.bi === true ? 0n : 0;
		if (!sign) {
			if (c === 120) return parseIntegerBaseN(ctx, startPtr, 16, endChr);
			else if (c === 98) return parseIntegerBaseN(ctx, startPtr, 2, endChr);
			else if (c === 111) return parseIntegerBaseN(ctx, startPtr, 8, endChr);
		}
		if (c === 46) state = 2;
		else if (c === 101 || c === 69) state = 4;
		else TomlError.x("illegal leading zero", ctx, startPtr);
	} else if (!isDigit(c)) TomlError.x("invalid value", ctx, startPtr);
	while (++ctx.p < ctx.s.length && (c = ctx.s.charCodeAt(ctx.p), !isEndOfValue(c, endChr))) {
		if (!state) state = 1;
		if (c === 95) {
			if (!(state & 1)) TomlError.x("illegal underscore", ctx);
			state += 11;
			hasUnderscores = true;
		} else if (state === 1 && c === 46) state = 2;
		else if ((state === 1 || state === 3) && (c === 101 || c === 69)) state = 4;
		else if (state === 4 && (c === 43 || c === 45)) state = 6;
		else if (!isDigit(c)) TomlError.x(`illegal character in numeric literal`, ctx);
		else if (state > 9) state -= 11;
		else if (!(state & 1)) state++;
	}
	if (!state) {
		let val = (startChr - 48) * (sign || 1);
		return ctx.bi === true ? BigInt(val) : val;
	}
	if (!(state & 1)) TomlError.x("unfinished numeric value", ctx, startPtr);
	let str = ctx.s.slice(startPtr, ctx.p);
	if (hasUnderscores) str = str.replaceAll("_", "");
	return state > 1 ? parseFloat(str) : parseInteger(ctx, str, 10, startPtr);
}
function parseIntegerBaseN(ctx, startPtr, base, endChr) {
	let c, underscore = 1;
	while (++ctx.p < ctx.s.length && (c = ctx.s.charCodeAt(ctx.p), !isEndOfValue(c, endChr))) if (c === 95) {
		if (underscore & 1) TomlError.x("illegal underscore", ctx);
		underscore = 3;
	} else if (!isDigit(c, base)) TomlError.x(`illegal character in numeric literal`, ctx);
	else if (underscore & 1) underscore--;
	if (underscore & 1) TomlError.x("unfinished numeric value", ctx);
	let str = ctx.s.slice(startPtr + 2, ctx.p);
	if (underscore) str = str.replaceAll("_", "");
	return parseInteger(ctx, str, base, startPtr);
}
function parseInteger(ctx, str, base, startPtr) {
	if (ctx.bi !== true) int: {
		let val = parseInt(str, base);
		if (!Number.isSafeInteger(val)) {
			if (ctx.bi) break int;
			TomlError.x("integer value cannot be represented losslessly", ctx, startPtr);
		}
		return val;
	}
	return base === 10 ? BigInt(str) : BigInt((base === 2 ? "0b" : base === 8 ? "0o" : "0x") + str);
}
function parseDate(ctx, c, endChr) {
	let startPtr = ctx.p++, unsafeSeparator;
	if (!isDigit(c) || !isDigit(ctx.s.charCodeAt(ctx.p++)) || !isDigit(ctx.s.charCodeAt(ctx.p++)) || !isDigit(ctx.s.charCodeAt(ctx.p++))) return parseNumber(ctx, ctx.p = startPtr, c, 0, endChr);
	ctx.p += 5;
	if (!isDigit(ctx.s.charCodeAt(ctx.p++))) TomlError.x("invalid date-time: date part is malformed", ctx, startPtr);
	if (ctx.p >= ctx.s.length || ((c = ctx.s.charCodeAt(ctx.p)) !== 32 || (unsafeSeparator = true, !isDigit(ctx.s.charCodeAt(ctx.p + 1)))) && c !== 84 && c !== 116) return readDate(ctx, ctx.s.slice(startPtr, ctx.p), 3, false, startPtr);
	if (ctx.s.charCodeAt(ctx.p += 3) !== 58) TomlError.x("invalid date-time: time part is malformed", ctx, startPtr);
	if (ctx.s.charCodeAt(ctx.p += 3) === 58) ctx.p += 3;
	if (ctx.s.charCodeAt(ctx.p) === 46) while (isDigit(ctx.s.charCodeAt(++ctx.p)));
	if (c = ctx.s.charCodeAt(ctx.p)) {
		if (c === 90 || c === 122) return readDate(ctx, ctx.s.slice(startPtr, ++ctx.p), 1, unsafeSeparator, startPtr, "[+00:00]");
		if (c === 43 || c === 45) return readDate(ctx, ctx.s.slice(startPtr, ctx.p += 6), 1, unsafeSeparator, startPtr, !ctx.ld && "[" + ctx.s.slice(ctx.p - 6, ctx.p) + "]");
	}
	return readDate(ctx, ctx.s.slice(startPtr, ctx.p), 2, unsafeSeparator, startPtr);
}
function parseTime(ctx, c, endChr) {
	let start = ctx.p;
	if (!isDigit(c) || !isDigit(ctx.s.charCodeAt(++ctx.p))) return parseNumber(ctx, --ctx.p, c, 0, endChr);
	if (ctx.s.charCodeAt(ctx.p += 4) === 58) ctx.p += 3;
	if (ctx.s.charCodeAt(ctx.p) === 46) while (isDigit(ctx.s.charCodeAt(++ctx.p)));
	return readDate(ctx, ctx.s.slice(start, ctx.p), 4, false, start);
}
function readDate(ctx, str, type, unsafeDelim, errPtr, temporalSuffix) {
	if (ctx.ld) {
		let date = new TomlDate(str, type, unsafeDelim);
		if (!date.isValid()) TomlError.x("invalid date", ctx, errPtr);
		return date;
	}
	try {
		if (temporalSuffix) str += temporalSuffix;
		switch (type) {
			case 1: return Temporal.ZonedDateTime.from(str);
			case 2: return Temporal.PlainDateTime.from(str);
			case 3: return Temporal.PlainDate.from(str);
			case 4: return Temporal.PlainTime.from(str);
		}
	} catch (e) {
		TomlError.x(e instanceof Error ? e.message : "" + e, ctx, errPtr);
	}
}
//#endregion
//#region src/util.ts
/** @internal */
function skipComment(ctx) {
	for (; ctx.p < ctx.s.length; ctx.p++) {
		let c = ctx.s.charCodeAt(ctx.p);
		if (c === 10) break;
		if (c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10) {
			ctx.p++;
			break;
		}
		if (c < 32 && c !== 9 || c === 127) TomlError.x("control characters are not allowed in comments", ctx);
	}
}
/** @internal */
function skipVoid(ctx, banNewLines, banComments) {
	let c;
	while (ctx.p < ctx.s.length) {
		while (ctx.p < ctx.s.length && ((c = ctx.s.charCodeAt(ctx.p)) === 32 || c === 9 || !banNewLines && (c === 10 || c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10))) ctx.p++;
		if (banComments || c !== 35) break;
		skipComment(ctx);
	}
}
//#endregion
//#region src/struct.ts
/** @internal */
function parseKey(ctx, end = 61) {
	let startPtr;
	let state = 0;
	let parsed = [];
	let sliceStart;
	let c = ctx.s.charCodeAt(startPtr = ctx.p);
	do
		if (c === end) {
			if (!state) TomlError.x("unexpected end of key", ctx);
			if (state === 1) parsed.push(ctx.s.slice(sliceStart, ctx.p));
			return ctx.p++, parsed;
		} else if (c === 46) {
			if (!state) TomlError.x("illegal empty bare key", ctx);
			if (state === 1) parsed.push(ctx.s.slice(sliceStart, ctx.p));
			state = 0;
		} else if (!state && (c === 34 || c === 39)) {
			if (c === ctx.s.charCodeAt(ctx.p + 1) && c === ctx.s.charCodeAt(ctx.p + 2)) TomlError.x("illegal quoted key: multiline strings are not allowed", ctx);
			parsed.push(parseString(ctx));
			state = 2;
			ctx.p--;
		} else if (c === 32 || c === 9) {
			if (state === 1) {
				parsed.push(ctx.s.slice(sliceStart, ctx.p));
				state = 2;
			}
		} else if (state === 2 || c < 48 && c !== 45 || c > 57 && c < 65 || c > 90 && c < 97 && c !== 95 || c > 122) TomlError.x("illegal character in key", ctx);
		else if (!state) {
			state = 1;
			sliceStart = ctx.p;
		}
	while (c = ctx.s.charCodeAt(++ctx.p));
	TomlError.x("incomplete key-value: cannot find end of key", ctx, startPtr);
}
/** @internal */
function parseInlineTable(ctx) {
	let startPtr = ctx.p++;
	let res = Object.create(null);
	let seen = /* @__PURE__ */ new Set();
	let c;
	while (ctx.p < ctx.s.length) {
		skipVoid(ctx);
		if ((c = ctx.s.charCodeAt(ctx.p)) === 125) {
			ctx.p++;
			return res;
		}
		let k;
		let t = res;
		let hasOwn = false;
		let errPtr = ctx.p;
		let key = parseKey(ctx);
		for (let i = 0; i < key.length; i++) {
			if (i) t = hasOwn ? t[k] : t[k] = Object.create(null);
			k = key[i];
			if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) TomlError.x("trying to redefine an already defined value", ctx, errPtr);
			let unsafe = k === "__proto__";
			if (ctx.uk && (unsafe || k === "constructor")) {
				t = ctx.uk !== 1 && TomlError.x("document contains an unsafe property", ctx, errPtr);
				break;
			}
			if (!hasOwn && unsafe) Object.defineProperty(t, k, {
				enumerable: true,
				configurable: true,
				writable: true
			});
		}
		if (hasOwn) TomlError.x("trying to redefine an already defined value", ctx, errPtr);
		skipVoid(ctx, true, true);
		let value = extractValue(ctx, 125);
		if (t && typeof (t[k] = value) === "object") seen.add(value);
		skipVoid(ctx);
		if ((c = ctx.s.charCodeAt(ctx.p++)) === 125) return res;
		if (c !== 44) TomlError.x("expected comma or end of structure", ctx, ctx.p - 1);
	}
	TomlError.x("unfinished table", ctx, startPtr);
}
/** @internal */
function parseArray(ctx) {
	let startPtr = ctx.p++;
	let res = [];
	let c;
	while (ctx.p < ctx.s.length) {
		skipVoid(ctx);
		if ((c = ctx.s.charCodeAt(ctx.p)) === 93) {
			ctx.p++;
			return res;
		}
		res.push(extractValue(ctx, 93));
		skipVoid(ctx);
		if ((c = ctx.s.charCodeAt(ctx.p++)) === 93) return res;
		if (c !== 44) TomlError.x("expected comma or end of structure", ctx, ctx.p - 1);
	}
	TomlError.x("unfinished array", ctx, startPtr);
}
//#endregion
//#region src/parse.ts
function peekTable(ctx, key, table, meta, type) {
	let t = table;
	let m = meta;
	let k;
	let hasOwn = false;
	let state;
	for (let i = 0; i < key.length; i++) {
		if (i) {
			t = hasOwn ? t[k] : t[k] = Object.create(null);
			m = (state = m[k]).c;
			if (type === 0 && (state.t === 1 || state.t === 2)) return null;
			if (state.t === 2) {
				let l = t.length - 1;
				t = t[l];
				m = m[l].c;
			}
		}
		k = key[i];
		if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) return null;
		if (!hasOwn) {
			let unsafe = k === "__proto__";
			if (ctx.uk && (unsafe || k === "constructor")) return false;
			if (unsafe) {
				Object.defineProperty(t, k, {
					enumerable: true,
					configurable: true,
					writable: true
				});
				Object.defineProperty(m, k, {
					enumerable: true,
					configurable: true,
					writable: true
				});
			}
			m[k] = {
				t: i < key.length - 1 && type === 2 ? 3 : type,
				d: false,
				i: 0,
				c: Object.create(null)
			};
		}
	}
	state = m[k];
	if (state.t !== type && !(type === 1 && state.t === 3)) return null;
	if (type === 2) {
		if (!state.d) {
			state.d = true;
			t[k] = [];
		}
		t[k].push(t = Object.create(null));
		state.c[state.i++] = state = {
			t: 1,
			d: false,
			i: 0,
			c: Object.create(null)
		};
	}
	if (state.d) return null;
	state.d = true;
	if (type === 1) t = hasOwn ? t[k] : t[k] = Object.create(null);
	else if (type === 0 && hasOwn) return null;
	return [
		k,
		t,
		state.c
	];
}
function validateTablePeek(ctx, peek, ptr) {
	if (peek === null || ctx.uk === 2) TomlError.x(peek === null ? "trying to redefine an already defined table or value" : "document contains an unsafe property", ctx, ptr);
}
function parse(toml, options = {}) {
	let ctx = {
		s: toml,
		p: 0,
		d: options.maxDepth ?? 1e3,
		bi: options.integersAsBigInt ?? false,
		ld: options.useLegacyDate ?? true,
		uk: options.unsafeKeyBehaviour === "throw" ? 2 : options.unsafeKeyBehaviour === "drop" ? 1 : 0
	};
	let res = Object.create(null);
	let meta = Object.create(null);
	let tmp;
	let skipping = false;
	let tbl = res;
	let m = meta;
	if (toml.charCodeAt(0) === 65279) ctx.p++;
	skipVoid(ctx);
	while (ctx.p < toml.length) {
		if (toml.charCodeAt(ctx.p) === 91) {
			let isTableArray = toml.charCodeAt(++ctx.p) === 91;
			tmp = ctx.p += +isTableArray;
			skipping = false;
			let k = parseKey(ctx, 93);
			if (isTableArray) {
				if (toml.charCodeAt(ctx.p) !== 93) TomlError.x("expected end of table array declaration", ctx);
				ctx.p++;
			}
			let p = peekTable(ctx, k, res, meta, isTableArray ? 2 : 1);
			if (!p) {
				validateTablePeek(ctx, p, tmp);
				skipping = true;
			} else {
				m = p[2];
				tbl = p[1];
			}
		} else {
			tmp = ctx.p;
			let p = peekTable(ctx, parseKey(ctx), tbl, m, 0);
			if (!p && !skipping) validateTablePeek(ctx, p, tmp);
			skipVoid(ctx, true, true);
			let v = extractValue(ctx, void 0);
			if (p && !skipping) p[1][p[0]] = v;
		}
		skipVoid(ctx, true);
		if (ctx.p < toml.length && (tmp = toml.charCodeAt(ctx.p)) !== 10 && (tmp !== 13 || toml.charCodeAt(ctx.p + 1) !== 10)) TomlError.x("each key-value declaration must be followed by an end-of-line", ctx);
		skipVoid(ctx);
	}
	return res;
}
//#endregion
//#region src/stringify.ts
let BARE_KEY = /^[a-z0-9-_]+$/i;
let HAS_WELLFORMED = !!"".isWellFormed;
function extendedTypeOf(obj) {
	let type = typeof obj;
	if (type === "object") {
		if (Array.isArray(obj)) return "array";
		if (typeof obj.getUTCDate === "function" && obj instanceof Date) return "date";
		if (globalThis.Temporal) {
			if (obj.until) {
				if (obj instanceof Temporal.ZonedDateTime) return "temporal/tz+uc";
				if (obj instanceof Temporal.PlainDateTime || obj instanceof Temporal.PlainDate) return "temporal/uc";
				if (obj instanceof Temporal.PlainTime || obj instanceof Temporal.Instant) return "temporal";
				if (obj instanceof Temporal.PlainYearMonth) return "temporal/x";
			} else if (obj.toPlainDate && obj instanceof Temporal.PlainMonthDay || obj.negated && obj instanceof Temporal.Duration) return "temporal/x";
		}
	}
	return type;
}
function isArrayOfTables(obj) {
	for (let i = 0; i < obj.length; i++) if (extendedTypeOf(obj[i]) !== "object") return false;
	return obj.length != 0;
}
function formatWellFormedStringUnchecked(s) {
	return JSON.stringify(s).replaceAll("", "\\u007f");
}
function formatString(s) {
	return formatWellFormedStringUnchecked(HAS_WELLFORMED ? s.toWellFormed() : s);
}
function formatKey(s) {
	if (BARE_KEY.test(s)) return s;
	if (HAS_WELLFORMED && !s.isWellFormed()) throw new RangeError("key contains illegal lone surrogates");
	return formatWellFormedStringUnchecked(s);
}
function stringifyValue(val, type, depth, numberAsFloat, strictTemporal) {
	if (depth === 0) throw new Error("Could not stringify the object: maximum object depth exceeded");
	switch (type) {
		case "number":
			if (isNaN(val)) return "nan";
			if (val === Infinity) return "inf";
			if (val === -Infinity) return "-inf";
			if (Number.isInteger(val) && (numberAsFloat || !Number.isSafeInteger(val))) return val.toFixed(1);
		case "bigint":
		case "boolean":
		case "temporal": return val.toString();
		case "string": return formatString(val);
		case "date":
			if (isNaN(val.getTime())) throw new TypeError("cannot serialize invalid date");
			return val.toISOString();
		case "object": return stringifyInlineTable(val, depth, numberAsFloat, strictTemporal);
		case "array": return stringifyArray(val, depth, numberAsFloat, strictTemporal);
		case "temporal/tz+uc": if (strictTemporal) {
			let tz = val.timeZoneId;
			let tzc = tz.charCodeAt(0);
			if (tzc !== 43 && tzc !== 45 && (tzc !== 85 && tzc !== 71 && tzc !== 90 && tzc !== 69 || tz !== "UTC" && tz !== "UCT" && tz !== "Universal" && tz !== "Zulu" && !tz.startsWith("GMT") && tz !== "Greenwich" && !tz.startsWith("Etc/"))) throw new TypeError("Temporal objects with an IANA timezone are not allowed in Temporal strict mode");
		}
		case "temporal/uc":
			if (strictTemporal && val.calendarId !== "iso8601") throw new TypeError("Temporal objects with a non-default calendar are not allowed in Temporal strict mode");
			return val.toString({
				calendarName: "never",
				timeZoneName: "never"
			});
		case "temporal/x": throw new TypeError("Unsupported " + val[Symbol.toStringTag]);
	}
}
function stringifyInlineTable(obj, depth, numberAsFloat, strictTemporal) {
	let keys = Object.keys(obj);
	if (keys.length === 0) return "{}";
	let res = "{ ";
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i];
		if (i) res += ", ";
		res += formatKey(k) + " = " + stringifyValue(obj[k], extendedTypeOf(obj[k]), depth - 1, numberAsFloat, strictTemporal);
	}
	return res + " }";
}
function stringifyArray(array, depth, numberAsFloat, strictTemporal) {
	if (array.length === 0) return "[]";
	let res = "[ ";
	for (let i = 0; i < array.length; i++) {
		if (i) res += ", ";
		if (array[i] === null || array[i] === void 0) throw new TypeError("arrays cannot contain null or undefined values");
		res += stringifyValue(array[i], extendedTypeOf(array[i]), depth - 1, numberAsFloat, strictTemporal);
	}
	return res + " ]";
}
function stringifyArrayTable(array, key, depth, numberAsFloat, strictTemporal) {
	if (depth === 0) throw new Error("Could not stringify the object: maximum object depth exceeded");
	let res = "";
	for (let i = 0; i < array.length; i++) {
		res += `${res && "\n"}[[${key}]]\n`;
		res += stringifyTable(0, array[i], key, depth, numberAsFloat, strictTemporal);
	}
	return res;
}
function stringifyTable(tableKey, obj, prefix, depth, numberAsFloat, strictTemporal) {
	if (depth === 0) throw new Error("Could not stringify the object: maximum object depth exceeded");
	let preamble = "";
	let tables = "";
	let keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i];
		if (obj[k] !== null && obj[k] !== void 0) {
			let type = extendedTypeOf(obj[k]);
			if (type === "symbol" || type === "function") throw new TypeError(`cannot serialize values of type '${type}'`);
			let key = formatKey(k);
			if (type === "array" && isArrayOfTables(obj[k])) tables += (tables && "\n") + stringifyArrayTable(obj[k], prefix ? `${prefix}.${key}` : key, depth - 1, numberAsFloat, strictTemporal);
			else if (type === "object") {
				let tblKey = prefix ? `${prefix}.${key}` : key;
				tables += (tables && "\n") + stringifyTable(tblKey, obj[k], tblKey, depth - 1, numberAsFloat, strictTemporal);
			} else {
				preamble += key;
				preamble += " = ";
				preamble += stringifyValue(obj[k], type, depth, numberAsFloat, strictTemporal);
				preamble += "\n";
			}
		}
	}
	if (tableKey && (preamble || !tables)) preamble = preamble ? `[${tableKey}]\n${preamble}` : `[${tableKey}]`;
	return preamble && tables ? `${preamble}\n${tables}` : preamble || tables;
}
function stringify(obj, { maxDepth = 1e3, numbersAsFloat = false, strictTemporal = false } = {}) {
	if (extendedTypeOf(obj) !== "object") throw new TypeError("stringify can only be called with an object");
	let str = stringifyTable(0, obj, "", maxDepth, numbersAsFloat, strictTemporal);
	if (str[str.length - 1] !== "\n") return str + "\n";
	return str;
}
//#endregion
//#region src/index.ts
/** @deprecated use `import * as ... from 'smol-toml'` instead */
var src_default = {
	parse,
	stringify,
	TomlDate,
	TomlError
};
//#endregion
exports.TomlDate = TomlDate;
exports.TomlError = TomlError;
exports.default = src_default;
exports.parse = parse;
exports.stringify = stringify;
