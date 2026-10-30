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
import { parseKey } from './struct.js';
import { extractValue } from './extract.js';
import { skipVoid } from './util.js';
import { TomlError } from './error.js';
function peekTable(ctx, key, table, meta, type) {
    let t = table;
    let m = meta;
    let k;
    let hasOwn = false;
    let state;
    for (let i = 0; i < key.length; i++) {
        if (i) {
            t = hasOwn ? t[k] : (t[k] = Object.create(null));
            m = (state = m[k]).c;
            if (type === 0 /* Type.DOTTED */ && (state.t === 1 /* Type.EXPLICIT */ || state.t === 2 /* Type.ARRAY */)) {
                return null;
            }
            if (state.t === 2 /* Type.ARRAY */) {
                let l = t.length - 1;
                t = t[l];
                m = m[l].c;
            }
        }
        k = key[i];
        if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 /* Type.DOTTED */ && m[k]?.d) {
            return null;
        }
        if (!hasOwn) {
            let unsafe = k === '__proto__';
            if (ctx.uk && (unsafe || k === 'constructor'))
                return false;
            if (unsafe) {
                Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
                Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true });
            }
            m[k] = {
                t: i < key.length - 1 && type === 2 /* Type.ARRAY */
                    ? 3 /* Type.ARRAY_DOTTED */ : type,
                d: false,
                i: 0,
                c: Object.create(null),
            };
        }
    }
    state = m[k];
    if (state.t !== type && !(type === 1 /* Type.EXPLICIT */ && state.t === 3 /* Type.ARRAY_DOTTED */)) {
        // Bad key type!
        return null;
    }
    if (type === 2 /* Type.ARRAY */) {
        if (!state.d) {
            state.d = true;
            t[k] = [];
        }
        t[k].push(t = Object.create(null));
        state.c[state.i++] = (state = { t: 1 /* Type.EXPLICIT */, d: false, i: 0, c: Object.create(null) });
    }
    if (state.d) {
        // Redefining a table!
        return null;
    }
    state.d = true;
    if (type === 1 /* Type.EXPLICIT */) {
        t = hasOwn ? t[k] : (t[k] = Object.create(null));
    }
    else if (type === 0 /* Type.DOTTED */ && hasOwn) {
        return null;
    }
    return [k, t, state.c];
}
function validateTablePeek(ctx, peek, ptr) {
    if (peek === null || ctx.uk === 2)
        TomlError.x(peek === null
            ? 'trying to redefine an already defined table or value'
            : 'document contains an unsafe property', ctx, ptr);
}
export function parse(toml, options = {}) {
    let ctx = {
        s: toml,
        p: 0,
        d: options.maxDepth ?? 1000,
        bi: options.integersAsBigInt ?? false,
        ld: options.useLegacyDate ?? true,
        uk: options.unsafeKeyBehaviour === 'throw' ? 2 : options.unsafeKeyBehaviour === 'drop' ? 1 : 0,
    };
    let res = Object.create(null);
    let meta = Object.create(null);
    let tmp;
    let skipping = false;
    let tbl = res;
    let m = meta;
    // BOM is allowed, skip.
    // JS is UTF-16, so we have to check for the UTF-16 BOM instead of the UTF-8 BOM sequence!
    if (toml.charCodeAt(0) === 0xfeff)
        ctx.p++;
    skipVoid(ctx);
    while (ctx.p < toml.length) {
        if (toml.charCodeAt(ctx.p) === 0x5b /* [ */) {
            let isTableArray = toml.charCodeAt(++ctx.p) === 0x5b; /* [ */
            tmp = ctx.p += +isTableArray;
            skipping = false;
            let k = parseKey(ctx, 0x5d /* ] */);
            if (isTableArray) {
                if (toml.charCodeAt(ctx.p) !== 0x5d /* ] */) {
                    TomlError.x('expected end of table array declaration', ctx);
                }
                ctx.p++;
            }
            let p = peekTable(ctx, k, res, meta, isTableArray ? 2 /* Type.ARRAY */ : 1 /* Type.EXPLICIT */);
            if (!p) {
                validateTablePeek(ctx, p, tmp);
                skipping = true;
            }
            else {
                m = p[2];
                tbl = p[1];
            }
        }
        else {
            tmp = ctx.p;
            let k = parseKey(ctx);
            let p = peekTable(ctx, k, tbl, m, 0 /* Type.DOTTED */);
            if (!p && !skipping)
                validateTablePeek(ctx, p, tmp);
            skipVoid(ctx, true, true);
            let v = extractValue(ctx, void 0);
            if (p && !skipping)
                p[1][p[0]] = v;
        }
        skipVoid(ctx, true);
        if (ctx.p < toml.length && (tmp = toml.charCodeAt(ctx.p)) !== 0xa /* \n */ && (tmp !== 0xd /* \r */ || toml.charCodeAt(ctx.p + 1) !== 0xa /* \n */)) {
            TomlError.x('each key-value declaration must be followed by an end-of-line', ctx);
        }
        skipVoid(ctx);
    }
    return res;
}
