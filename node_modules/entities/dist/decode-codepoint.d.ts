/**
 * Replace the given code point with U+FFFD if it is NUL (0), a surrogate, or
 * outside the valid Unicode range. Code points in the C1 controls range
 * (128–159) are remapped to their Windows-1252 equivalents, following the
 * HTML spec. All other code points are returned unchanged.
 * @param codePoint Unicode code point to convert.
 */
export declare function replaceCodePoint(codePoint: number): number;
/**
 * XML numeric character references are the referenced Unicode code point.
 * Invalid values still become U+FFFD; the HTML Windows-1252 C1 remap is not
 * applied.
 * @see https://www.w3.org/TR/xml/#NT-CharRef
 * @param codePoint Unicode code point to convert.
 */
export declare function replaceCodePointXML(codePoint: number): number;
/**
 * Convert the code point of a decoded numeric entity to a string, replacing
 * invalid values.
 *
 * Fast path for plain BMP code points: [1..0x7F] and [0xA0..0xD7FF] pass
 * `replaceCodePoint` unchanged (no NUL, C1 remap, surrogate, or out-of-range
 * handling) and fit a single charCode. 0xd760 = 0xD800 (the first surrogate)
 * - 0xA0.
 * @param codePoint Unicode code point to convert.
 */
export declare function codePointToString(codePoint: number): string;
//# sourceMappingURL=decode-codepoint.d.ts.map