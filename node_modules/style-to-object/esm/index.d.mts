import { Declaration } from "inline-style-parser";

//#region src/index.d.ts
type StyleObject = Record<string, string>;
type Iterator = (property: string, value: string, declaration: Declaration) => void;
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
declare function StyleToObject(style: string, iterator?: Iterator): StyleObject | null;
//#endregion
export { type Declaration, StyleObject, StyleToObject as default };
//# sourceMappingURL=index.d.mts.map