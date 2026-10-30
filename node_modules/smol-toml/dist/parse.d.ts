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
import { type IntegersAsBigInt, type TomlTable, type TomlTableWithoutBigInt } from './util.js';
export type UnsafeKeyBehaviour = 
/** Preserve the unsafe key in the final object. */
'keep'
/** Silently drop the unsafe key from the final object. */
 | 'drop'
/** Reject documents with unsafe keys. */
 | 'throw';
export interface ParseOptions {
    /**
     * Whether to parse integers as {@link BigInt} or not.
     *
     * Use the special value `"asNeeded"` to only use {@link BigInt} for
     * integers that cannot be safely represented as JavaScript numbers.
     *
     * @defaultValue `false`
     * @since 1.4.0
     */
    integersAsBigInt?: IntegersAsBigInt;
    /**
     * Whether to use the legacy {@link TomlDate}, instead of the new
     * {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal | Temporal API}.
     *
     * @defaultValue `true`
     * @since 1.9.0
     */
    useLegacyDate?: boolean;
    /**
     * Behaviour of the library when encountering a potentially unsafe property (`__proto__`, `constructor`).
     *
     * @defaultValue `'keep'`
     * @since 1.9.0
     */
    unsafeKeyBehaviour?: UnsafeKeyBehaviour;
    /**
     * Maximum permitted inline object/array depth.
     *
     * @defaultValue `1000`
     * @since 1.9.0
     */
    maxDepth?: number;
}
export declare function parse(toml: string, options?: ParseOptions & {
    integersAsBigInt: Exclude<IntegersAsBigInt, undefined | false>;
}): TomlTable;
export declare function parse(toml: string, options?: ParseOptions): TomlTableWithoutBigInt;
