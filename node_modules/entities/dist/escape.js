/**
 * Get the named reference for an XML special character or U+00A0.
 * @param char Code unit matched by one of the escape regexes.
 */
function getEscape(char) {
    return char === 34
        ? "&quot;"
        : char === 38
            ? "&amp;"
            : char === 39
                ? "&apos;"
                : char === 60
                    ? "&lt;"
                    : char === 62
                        ? "&gt;"
                        : "&nbsp;";
}
/**
 * Read a code point at a given index.
 * @param input String to read the code point from.
 * @param index Current read position in the input string.
 * @returns The code point at `index`, or `undefined` if `index` is out of range.
 * @deprecated Use `String.prototype.codePointAt` directly instead; this export
 *   will be removed in the next major.
 */
export const getCodePoint = (input, index) => input.codePointAt(index);
/**
 * Bitset for ASCII characters that need to be escaped in XML.
 */
export const XML_BITSET_VALUE = 0x50_00_00_c4; // 32..63 -> 34 ("),38 (&),39 ('),60 (<),62 (>)
/**
 * Matches exactly the characters `encodeXML` escapes: the five XML special
 * characters plus every non-ASCII code unit (lone surrogates included — no
 * `u` flag). Kept in sync with `XML_BITSET_VALUE`.
 *
 * Shared with `encodeNonAsciiHTML` in `encode.ts`. Because the regex is
 * stateful (`g` flag), every call site must set `lastIndex` before use.
 */
// eslint-disable-next-line unicorn/prefer-unicode-code-point-escapes -- the `\u{...}` form requires the `u` flag, which we deliberately omit so lone surrogates match by code unit
export const xmlEncodeRegex = /["&'<>\u0080-\uFFFF]/g;
/**
 * Whether `code` (a UTF-16 code unit) is escaped by {@link encodeXML}: a
 * non-ASCII unit, or one of the five XML specials flagged in
 * `XML_BITSET_VALUE` (which is only meaningful for code units 32-63).
 * @param code Code unit to test.
 */
function isXmlEscapable(code) {
    return (code >= 0x80 ||
        (code >= 32 && code < 64 && ((XML_BITSET_VALUE >>> code) & 1) === 1));
}
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a numeric hexadecimal reference
 * (eg. `&#xfc;`) will be used.
 * @param input Input string to encode.
 */
export function encodeXML(input) {
    const { length } = input;
    let out;
    let last = 0;
    let index = 0;
    while (index < length) {
        const char = input.charCodeAt(index);
        /*
         * Find the next character to escape: scan a short window inline
         * (escapable characters cluster in markup-heavy input), then fall
         * back to the regex, which skips clean spans in native code.
         */
        if (!isXmlEscapable(char)) {
            const bound = Math.min(index + 32, length);
            let next = index + 1;
            while (next < bound && !isXmlEscapable(input.charCodeAt(next))) {
                next++;
            }
            if (next < bound) {
                index = next;
                continue;
            }
            if (next >= length)
                break;
            xmlEncodeRegex.lastIndex = next;
            if (!xmlEncodeRegex.test(input))
                break;
            index = xmlEncodeRegex.lastIndex - 1;
            continue;
        }
        if (out === undefined)
            out = input.substring(0, index);
        else if (last !== index)
            out += input.substring(last, index);
        if (char < 64) {
            // Known replacement
            out += getEscape(char);
            last = index += 1;
            continue;
        }
        // Non-ASCII: encode as numeric entity (handle surrogate pair)
        const cp = input.codePointAt(index);
        out += `&#x${cp.toString(16)};`;
        if (cp !== char)
            index++; // Skip trailing surrogate
        last = index += 1;
    }
    if (out === undefined)
        return input;
    if (last < length)
        out += input.substr(last);
    return out;
}
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 * @param data String to escape.
 */
export const escape = encodeXML;
/**
 * Escape `data` using `re`, mapping each matched character to its entity.
 * Every match is one UTF-16 code unit, so its index is `lastIndex - 1`.
 * @param re Global regex matching exactly the characters to escape
 *   (`"`, `&`, `'`, `<`, `>`, `\u00A0` at most).
 * @param data String to escape.
 */
function escapeWithRegex(re, data) {
    re.lastIndex = 0;
    if (!re.test(data))
        return data;
    let out = "";
    let last = 0;
    do {
        const index = re.lastIndex - 1;
        if (last !== index)
            out += data.substring(last, index);
        const char = data.charCodeAt(index);
        out += getEscape(char);
        last = index + 1;
    } while (re.test(data));
    return out + data.substring(last);
}
const xmlEscapeRegex = /["&'<>]/g;
/**
 * Encodes all characters not valid in XML documents using XML entities.
 *
 * Note that the output will be character-set dependent.
 * @param data String to escape.
 */
export function escapeUTF8(data) {
    return escapeWithRegex(xmlEscapeRegex, data);
}
const attributeEscapeRegex = /["&\u{A0}]/gu;
/**
 * Encodes all characters that have to be escaped in HTML attributes,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 * @param data String to escape.
 */
export function escapeAttribute(data) {
    return escapeWithRegex(attributeEscapeRegex, data);
}
const textEscapeRegex = /[&<>\u{A0}]/gu;
/**
 * Encodes all characters that have to be escaped in HTML text,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 * @param data String to escape.
 */
export function escapeText(data) {
    return escapeWithRegex(textEscapeRegex, data);
}
//# sourceMappingURL=escape.js.map