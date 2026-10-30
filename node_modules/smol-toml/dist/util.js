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
import { TomlError } from './error.js';
/** @internal */
export function skipComment(ctx) {
    for (; ctx.p < ctx.s.length; ctx.p++) {
        let c = ctx.s.charCodeAt(ctx.p);
        if (c === 0xa /* \n */)
            break;
        if (c === 0xd /* \r */ && ctx.s.charCodeAt(ctx.p + 1) === 0xa /* \n */) {
            ctx.p++;
            break;
        }
        if ((c < 0x20 && c !== 0x9 /* \t */) || c === 0x7f) {
            TomlError.x('control characters are not allowed in comments', ctx);
        }
    }
}
/** @internal */
export function skipVoid(ctx, banNewLines, banComments) {
    let c;
    while (ctx.p < ctx.s.length) {
        while (ctx.p < ctx.s.length && ((c = ctx.s.charCodeAt(ctx.p)) === 0x20 ||
            c === 0x9 /* \t */ ||
            (!banNewLines &&
                (c === 0xa /* \n */ || (c === 0xd /* \r */ && ctx.s.charCodeAt(ctx.p + 1) === 0xa /* \n */)))))
            ctx.p++;
        if (banComments || c !== 0x23 /* # */)
            break;
        skipComment(ctx);
    }
}
