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
let BARE_KEY = /^[a-z0-9-_]+$/i;
let HAS_WELLFORMED = !!(''.isWellFormed);
function extendedTypeOf(obj) {
    let type = typeof obj;
    if (type === 'object') {
        if (Array.isArray(obj))
            return 'array';
        if (typeof obj.getUTCDate === 'function' && obj instanceof Date)
            return 'date';
        if (globalThis.Temporal) {
            if (obj.until) {
                if (obj instanceof Temporal.ZonedDateTime)
                    return 'temporal/tz+uc';
                if (obj instanceof Temporal.PlainDateTime || obj instanceof Temporal.PlainDate)
                    return 'temporal/uc';
                if (obj instanceof Temporal.PlainTime || obj instanceof Temporal.Instant)
                    return 'temporal';
                if (obj instanceof Temporal.PlainYearMonth)
                    return 'temporal/x';
            }
            else if ((obj.toPlainDate && obj instanceof Temporal.PlainMonthDay) ||
                (obj.negated && obj instanceof Temporal.Duration)) {
                return 'temporal/x';
            }
        }
    }
    return type;
}
function isArrayOfTables(obj) {
    for (let i = 0; i < obj.length; i++) {
        if (extendedTypeOf(obj[i]) !== 'object')
            return false;
    }
    return obj.length != 0;
}
function formatWellFormedStringUnchecked(s) {
    return JSON.stringify(s).replaceAll('\x7f', '\\u007f');
}
function formatString(s) {
    return formatWellFormedStringUnchecked(HAS_WELLFORMED ? s.toWellFormed() : s);
}
function formatKey(s) {
    if (BARE_KEY.test(s))
        return s;
    if (HAS_WELLFORMED && !s.isWellFormed())
        throw new RangeError('key contains illegal lone surrogates');
    return formatWellFormedStringUnchecked(s);
}
function stringifyValue(val, type, depth, numberAsFloat, strictTemporal) {
    if (depth === 0) {
        throw new Error('Could not stringify the object: maximum object depth exceeded');
    }
    switch (type) {
        // @ts-expect-error -- intentional fallthrough case
        case 'number':
            if (isNaN(val))
                return 'nan';
            if (val === Infinity)
                return 'inf';
            if (val === -Infinity)
                return '-inf';
            if (Number.isInteger(val) && (numberAsFloat || !Number.isSafeInteger(val)))
                return val.toFixed(1);
        case 'bigint':
        case 'boolean':
        case 'temporal':
            return val.toString();
        case 'string':
            return formatString(val);
        case 'date':
            if (isNaN(val.getTime()))
                throw new TypeError('cannot serialize invalid date');
            return val.toISOString();
        case 'object':
            return stringifyInlineTable(val, depth, numberAsFloat, strictTemporal);
        case 'array':
            return stringifyArray(val, depth, numberAsFloat, strictTemporal);
        // @ts-expect-error -- intentional fallthrough case
        case 'temporal/tz+uc':
            if (strictTemporal) {
                let tz = val.timeZoneId;
                let tzc = tz.charCodeAt(0);
                if (
                // Classic offset
                tzc !== 0x2b /* + */ && tzc !== 0x2d /* - */ &&
                    (
                    // Fast pre-check pass; see below for the actually accepted values
                    (tzc !== 0x55 /* U */ && tzc !== 0x47 /* G */ && tzc !== 0x5a /* Z */ && tzc !== 0x45 /* E */) ||
                        (
                        // UTC and its aliases; Temporal implementations don't all canonicalise unfortunately
                        tz !== 'UTC' && tz !== 'UCT' && tz !== 'Universal' && tz !== 'Zulu' &&
                            // GMT is a TZ but it's for all intents and purposes equivalent to UTC. Safe to downgrade.
                            !tz.startsWith('GMT') && tz !== 'Greenwich' &&
                            // Etc/* are all safe to downgrade to offset (either UTC, GMT, or offset)
                            !tz.startsWith('Etc/')))) {
                    throw new TypeError('Temporal objects with an IANA timezone are not allowed in Temporal strict mode');
                }
            }
        case 'temporal/uc':
            if (strictTemporal && val.calendarId !== 'iso8601')
                throw new TypeError('Temporal objects with a non-default calendar are not allowed in Temporal strict mode');
            return val.toString({
                calendarName: 'never',
                timeZoneName: 'never',
            });
        case 'temporal/x':
            throw new TypeError('Unsupported ' + val[Symbol.toStringTag]);
    }
}
function stringifyInlineTable(obj, depth, numberAsFloat, strictTemporal) {
    let keys = Object.keys(obj);
    if (keys.length === 0)
        return '{}';
    let res = '{ ';
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i];
        if (i)
            res += ', ';
        res += formatKey(k) + ' = ' + stringifyValue(obj[k], extendedTypeOf(obj[k]), depth - 1, numberAsFloat, strictTemporal);
    }
    return res + ' }';
}
function stringifyArray(array, depth, numberAsFloat, strictTemporal) {
    if (array.length === 0)
        return '[]';
    let res = '[ ';
    for (let i = 0; i < array.length; i++) {
        if (i)
            res += ', ';
        if (array[i] === null || array[i] === void 0) {
            throw new TypeError('arrays cannot contain null or undefined values');
        }
        res += stringifyValue(array[i], extendedTypeOf(array[i]), depth - 1, numberAsFloat, strictTemporal);
    }
    return res + ' ]';
}
function stringifyArrayTable(array, key, depth, numberAsFloat, strictTemporal) {
    if (depth === 0) {
        throw new Error('Could not stringify the object: maximum object depth exceeded');
    }
    let res = '';
    for (let i = 0; i < array.length; i++) {
        res += `${res && '\n'}[[${key}]]\n`;
        res += stringifyTable(0, array[i], key, depth, numberAsFloat, strictTemporal);
    }
    return res;
}
function stringifyTable(tableKey, obj, prefix, depth, numberAsFloat, strictTemporal) {
    if (depth === 0) {
        throw new Error('Could not stringify the object: maximum object depth exceeded');
    }
    let preamble = '';
    let tables = '';
    let keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i];
        if (obj[k] !== null && obj[k] !== void 0) {
            let type = extendedTypeOf(obj[k]);
            if (type === 'symbol' || type === 'function') {
                throw new TypeError(`cannot serialize values of type '${type}'`);
            }
            let key = formatKey(k);
            if (type === 'array' && isArrayOfTables(obj[k])) {
                tables += (tables && '\n') + stringifyArrayTable(obj[k], prefix ? `${prefix}.${key}` : key, depth - 1, numberAsFloat, strictTemporal);
            }
            else if (type === 'object') {
                let tblKey = prefix ? `${prefix}.${key}` : key;
                tables += (tables && '\n') + stringifyTable(tblKey, obj[k], tblKey, depth - 1, numberAsFloat, strictTemporal);
            }
            else {
                preamble += key;
                preamble += ' = ';
                preamble += stringifyValue(obj[k], type, depth, numberAsFloat, strictTemporal);
                preamble += '\n';
            }
        }
    }
    if (tableKey && (preamble || !tables)) // Create table only if necessary
        preamble = preamble ? `[${tableKey}]\n${preamble}` : `[${tableKey}]`;
    return preamble && tables
        ? `${preamble}\n${tables}`
        : preamble || tables;
}
export function stringify(obj, { maxDepth = 1000, numbersAsFloat = false, strictTemporal = false } = {}) {
    if (extendedTypeOf(obj) !== 'object') {
        throw new TypeError('stringify can only be called with an object');
    }
    let str = stringifyTable(0, obj, '', maxDepth, numbersAsFloat, strictTemporal);
    if (str[str.length - 1] !== '\n')
        return str + '\n';
    return str;
}
