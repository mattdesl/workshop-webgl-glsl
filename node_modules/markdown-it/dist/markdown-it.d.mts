import * as mdurl from "mdurl";
import * as ucmicro from "uc.micro";
import { LinkifyIt } from "linkify-it";
//#endregion
//#region src/types.d.ts
/** @inline */
interface Reference {
  title: string;
  href: string;
}
/**
 * Shared environment passed through parsing and rendering.
 *
 * Plugins may use it to store arbitrary data.
 */
interface Env {
  [key: string | symbol]: unknown;
  references?: Record<string, Reference>;
}
/** Delimiter entry used by emphasis-like inline rules. */
interface Delimiter {
  /** Char code of the starting marker. */
  marker: number;
  /** Total length of this series of delimiters. */
  length?: number;
  /** A position of the token this delimiter corresponds to. */
  token: number;
  /**
   * If this delimiter is matched as a valid opener, `end` will be
   * equal to its position, otherwise it's `-1`.
   */
  end: number;
  /** Whether this delimiter can open an emphasis. */
  open: boolean;
  /** Whether this delimiter can close an emphasis. */
  close: boolean;
  /** One delimiter represents two characters. */
  jump?: number;
}
/**
 * Options controlling Markdown parsing and rendering.
 *
 * @category Main
 */
interface MarkdownItOptions {
  /**
   * Enable HTML tags in source.
   *
   * @defaultValue `false` (`true` for `'commonmark'` preset only)
   */
  html?: boolean;
  /**
   * Use '/' to close single tags (`<br />`).
   *
   * @defaultValue `false` (`true` for `'commonmark'` preset only)
   */
  xhtmlOut?: boolean;
  /**
   * Convert '\n' in paragraphs into `<br>`.
   *
   * @defaultValue `false`
   */
  breaks?: boolean;
  /**
   * CSS language prefix for fenced blocks, used by external syntax highlighters.
   *
   * @defaultValue `'language-'`
   */
  langPrefix?: string;
  /**
   * Autoconvert URL-like text to links.
   *
   * @defaultValue `false`
   */
  linkify?: boolean;
  /**
   * Enable language-neutral replacements and quotes beautification.
   *
   * See the [replacement rules](https://github.com/markdown-it/markdown-it/blob/master/src/rules_core/replacements.ts)
   * for the full list.
   *
   * @defaultValue `false`
   */
  typographer?: boolean;
  /**
   * Double + single quotes replacement pairs, when typographer is enabled
   * and smartquotes are on. Can be either a string or an array.
   *
   * For example, use `'«»„“'` for Russian, `'„“‚‘'` for German, and
   * `['«\xA0', '\xA0»', '‹\xA0', '\xA0›']` for French (including nbsp).
   *
   * @defaultValue `'“”‘’'`
   */
  quotes?: string | string[];
  /**
   * Highlighter function. Should return escaped HTML, or an empty string if
   * the source string was not changed and should be escaped externally.
   * If the result starts with `<pre`, the internal wrapper is skipped.
   *
   * The highlighter is called by the default `fence` renderer rule. If needed,
   * you can replace that renderer rule completely; see the
   * [renderer source](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts).
   *
   * @example
   * ```js
   * import MarkdownIt from 'markdown-it'
   * import hljs from 'highlight.js' // https://highlightjs.org
   *
   * const md = new MarkdownIt({
   *   highlight: function (str, lang) {
   *     if (lang && hljs.getLanguage(lang)) {
   *       try {
   *         return hljs.highlight(str, { language: lang }).value
   *       } catch (__) {}
   *     }
   *
   *     return '' // use external default escaping
   *   }
   * });
   * ```
   *
   * @example
   * Or with full wrapper override (if you need assign class to `<pre>` or `<code>`):
   * ```js
   * import MarkdownIt from 'markdown-it'
   * import hljs from 'highlight.js' // https://highlightjs.org
   *
   * const md = new MarkdownIt({
   *   highlight: function (str, lang) {
   *     if (lang && hljs.getLanguage(lang)) {
   *       try {
   *         return `<pre><code class="hljs">${hljs.highlight(str,
   *           { language: lang, ignoreIllegals: true }).value}</code></pre>`
   *       } catch (__) {}
   *     }
   *
   *     return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
   *   }
   * });
   * ```
   *
   * @defaultValue `null`
   */
  highlight?: ((str: string, lang: string, attrs: string) => string) | null;
  /**
   * Internal protection against excessive recursion.
   *
   * @defaultValue `100`
   */
  maxNesting?: number;
}
declare namespace utils_d_exports {
  export { arrayReplaceAt, asciiTrim, callable, escapeHtml, escapeRE, fromCodePoint, isMdAsciiPunct, isPunctChar, isPunctCharCode, isSpace, isValidEntityCode, isWhiteSpace, lib, normalizeReference, unescapeAll, unescapeMd };
}
/** @hidden */
type ClassToWrap = new (...args: any[]) => object;
/** Wraps a class so it can be called with or without `new`. */
declare function callable<T extends ClassToWrap>(cls: T): T & ((...args: ConstructorParameters<T>) => InstanceType<T>);
/**
 * Returns a copy of a token array with the token at `pos` replaced by
 * `newElements`. Used to transform token streams without modifying the
 * original array.
 */
declare function arrayReplaceAt<T>(src: T[], pos: number, newElements: T[]): T[];
/** Checks whether a code point can be decoded from a numeric HTML entity. */
declare function isValidEntityCode(c: number): boolean;
/**
 * Converts a Unicode code point to a string, like `String.fromCodePoint()`,
 * but does not throw for invalid input.
 */
declare function fromCodePoint(c: number): string;
/** Decodes Markdown backslash escapes. */
declare function unescapeMd(str: string): string;
/**
 * Decodes Markdown backslash escapes and HTML character references in link
 * destinations, link titles, and fenced code info strings.
 */
declare function unescapeAll(str: string): string;
/** Escapes HTML special characters in a string. */
declare function escapeHtml(str: string): string;
/** Escapes regular expression metacharacters in a string. */
declare function escapeRE(str: string): string;
/** Checks whether a character code is an ASCII space or tab. */
declare function isSpace(code: number): boolean;
/**
 * Checks whether a character code is whitespace recognized by Markdown.
 *
 * Matches the Unicode `Zs` category or `\t`, `\f`, `\v`, `\r`, `\n`.
 */
declare function isWhiteSpace(code: number): boolean;
/**
 * Checks whether a character is Unicode punctuation or a symbol.
 *
 * Does not support astral characters.
 */
declare function isPunctChar(ch: string): boolean;
/** Checks whether a Unicode code point is punctuation or a symbol. */
declare function isPunctCharCode(code: number): boolean;
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
declare function isMdAsciiPunct(ch: number): boolean;
/** Normalizes `[reference labels]` for case-insensitive lookup. */
declare function normalizeReference(str: string): string;
/**
 * "Light" `.trim()` for blocks (headings, paragraphs), where Unicode spaces
 * should be preserved.
 */
declare function asciiTrim(str: string): string;
/**
 * Libraries commonly used by markdown-it and its plugins, re-exported to
 * reduce duplicate dependencies in browser bundles.
 */
declare const lib: {
  mdurl: typeof mdurl;
  ucmicro: typeof ucmicro;
};
//#endregion
//#region src/token.d.ts
/** @inline */
type TokenNesting = -1 | 0 | 1;
/** @inline */
type TokenAttribute = [name: string, value: string | number];
/**
 * Represents one item in the parsed token stream, storing parsed data and
 * providing helpers for managing HTML attributes.
 */
declare class Token {
  /**
   * Type of the token (string, e.g. "paragraph_open")
   */
  type: string;
  /**
   * html tag name, e.g. "p"
   */
  tag: string;
  /** Html attributes. Format: `[ [ name1, value1 ], [ name2, value2 ] ]` */
  attrs: TokenAttribute[] | null;
  /**
   * Source map info. Format: `[ line_begin, line_end ]`
   */
  map: [number, number] | null;
  /**
   * Level change (number in {-1, 0, 1} set), where:
   *
   * -  `1` means the tag is opening
   * -  `0` means the tag is self-closing
   * - `-1` means the tag is closing
   */
  nesting: TokenNesting;
  /**
   * nesting level, the same as `state.level`
   */
  level: number;
  /**
   * An array of child nodes (inline and img tokens)
   */
  children: Token[] | null;
  /**
   * In a case of self-closing tag (code, html, fence, etc.),
   * it has contents of this tag.
   */
  content: string;
  /**
   * '*' or '_' for emphasis, fence string for fence, etc.
   */
  markup: string;
  /**
   * Additional information:
   *
   * - Info string for "fence" tokens
   * - The value "auto" for autolink "link_open" and "link_close" tokens
   * - The string value of the item marker for ordered-list "list_item_open" tokens
   */
  info: string;
  /** A place for plugins to store an arbitrary data */
  meta: Record<string, unknown> | null;
  /**
   * True for block-level tokens, false for inline tokens.
   * Used in renderer to calculate line breaks
   */
  block: boolean;
  /**
   * If it's true, ignore this element when rendering. Used for tight lists
   * to hide paragraphs.
   */
  hidden: boolean;
  constructor(type: string, tag: string, nesting: TokenNesting);
  /**
   * Search attribute index by name.
   */
  attrIndex(name: string): number;
  /**
   * Add `[ name, value ]` attribute to list. Init attrs if necessary
   */
  attrPush(attrData: TokenAttribute): void;
  /**
   * Set `name` attribute to `value`. Override old value if exists.
   */
  attrSet(name: string, value: string | number): void;
  /**
   * Get the value of attribute `name`, or null if it does not exist.
   */
  attrGet(name: string): string | number | null;
  /**
   * Join value to existing attribute via space. Or create new attribute if not
   * exists. Useful to operate with token classes.
   */
  attrJoin(name: string, value: string | number): void;
}
//#endregion
//#region src/rules_inline/state_inline.d.ts
/** @inline */
interface ScannedDelimiters {
  can_open: boolean;
  can_close: boolean;
  length: number;
}
/** @inline */
type StateTokenMeta = Record<string, unknown> & {
  delimiters?: Delimiter[];
};
/** Mutable state passed to inline rules while tokenizing inline content. */
declare class StateInline {
  src: string;
  env: Env;
  md: MarkdownIt;
  tokens: Token[];
  tokens_meta: Array<StateTokenMeta | undefined>;
  pos: number;
  posMax: number;
  level: number;
  pending: string;
  pendingLevel: number;
  cache: Record<number, number>;
  backticks: Record<number, number>;
  backticksScanned: boolean;
  skipHtmlSpecial: boolean;
  linkLevel: number;
  delimiters: Delimiter[];
  _prev_delimiters: Delimiter[][];
  Token: typeof Token;
  constructor(src: string, md: MarkdownIt, env: Env, outTokens: Token[]);
  pushPending(): Token;
  push(type: string, tag: string, nesting: -1 | 0 | 1): Token;
  scanDelims(start: number, canSplitWord: boolean): ScannedDelimiters;
}
//#endregion
//#region src/helpers/parse_link_label.d.ts
/** Finds the end of a link or image label (`[label]`). */
declare function parseLinkLabel(state: StateInline, start: number, disableNested?: boolean): number;
//#endregion
//#region src/helpers/parse_link_destination.d.ts
/** Parses the destination in `[label](destination "title")`. */
declare function parseLinkDestination(str: string, start: number, max: number): {
  ok: boolean;
  pos: number;
  str: string;
};
//#endregion
//#region src/helpers/parse_link_title.d.ts
/** @inline */
interface ParseLinkTitleResult {
  ok: boolean;
  can_continue: boolean;
  pos: number;
  str: string;
  marker: number;
}
/**
 * Parses the optional title in `[label](destination "title")` or
 * `[label]: destination "title"`.
 *
 * `prev_state` continues a reference title on the next source line.
 */
declare function parseLinkTitle(str: string, start: number, max: number, prev_state?: ParseLinkTitleResult): ParseLinkTitleResult;
declare namespace index_d_exports {
  export { parseLinkDestination, parseLinkLabel, parseLinkTitle };
}
//#endregion
//#region src/ruler.d.ts
/** @inline */
type RuleOptions = {
  alt?: string[];
};
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
declare class Ruler<Args extends unknown[], Result> {
  /** @internal */
  __rules__: Array<{
    name: string;
    enabled: boolean;
    fn: (...args: Args) => Result;
    alt: string[];
  }>;
  /** @internal */
  __cache__: Record<string, Array<(...args: Args) => Result>> | null;
  /** @internal */
  __find__(name: string): number;
  /** @internal */
  __compile__(): void;
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
  at(name: string, fn: (...args: Args) => Result, options?: RuleOptions): void;
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
  before(beforeName: string, ruleName: string, fn: (...args: Args) => Result, options?: RuleOptions): void;
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
  after(afterName: string, ruleName: string, fn: (...args: Args) => Result, options?: RuleOptions): void;
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
  push(ruleName: string, fn: (...args: Args) => Result, options?: RuleOptions): void;
  /**
   * Enable rules with given names. If any rule name not found - throw Error.
   * Errors can be disabled by second param.
   *
   * See also {@link Ruler.disable}, {@link Ruler.enableOnly}.
   *
   * Returns list of found rule names (if no exception happened).
   */
  enable(list: string | string[], ignoreInvalid?: boolean): string[];
  /**
   * Enable rules with given names, and disable everything else. If any rule name
   * not found - throw Error. Errors can be disabled by second param.
   *
   * See also {@link Ruler.disable}, {@link Ruler.enable}.
   */
  enableOnly(list: string | string[], ignoreInvalid?: boolean): void;
  /**
   * Disable rules with given names. If any rule name not found - throw Error.
   * Errors can be disabled by second param.
   *
   * See also {@link Ruler.enable}, {@link Ruler.enableOnly}.
   *
   * Returns list of found rule names (if no exception happened).
   */
  disable(list: string | string[], ignoreInvalid?: boolean): string[];
  /**
   * Return array of active functions (rules) for given chain name. It analyzes
   * rules configuration, compiles caches if not exists and returns result.
   *
   * Default chain name is `''` (empty string). It can't be skipped. That's
   * done intentionally, to keep signature monomorphic for high speed.
   */
  getRules(chainName: string): Array<(...args: Args) => Result>;
}
//#endregion
//#region src/renderer.d.ts
/** Function that renders a token at a given position in a token stream. */
type RendererRule = (tokens: Token[], idx: number, options: Required<MarkdownItOptions>, env: Env | undefined, renderer: Renderer) => string;
/**
 * Generates HTML from parsed token stream. Each instance has independent
 * copy of rules. Those can be rewritten with ease. Also, you can add new
 * rules if you create plugin and adds new token types.
 *
 * Creates new renderer instance and fills {@link Renderer.rules} with defaults.
 */
declare class Renderer {
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
  rules: Record<string, RendererRule>;
  /**
   * Render token attributes to string.
   */
  renderAttrs(token: Pick<Token, 'attrs'>): string;
  /**
   * Default token renderer. Can be overriden by custom function
   * in {@link Renderer.rules}.
   */
  renderToken(tokens: Token[], idx: number, options: Required<MarkdownItOptions>): string;
  /**
   * The same as {@link Renderer.render}, but for single token of `inline` type.
   */
  renderInline(tokens: Token[], options: Required<MarkdownItOptions>, env: Env | undefined): string;
  /**
   * Special kludge for image `alt` attributes to conform CommonMark spec.
   * Don't try to use it! Spec requires to show `alt` content with stripped markup,
   * instead of simple escaping.
   */
  renderInlineAsText(tokens: Token[], options: Required<MarkdownItOptions>, env: Env | undefined): string;
  /**
   * Takes token stream and generates HTML. Probably, you will never need to call
   * this method directly.
   */
  render(tokens: Token[], options: Required<MarkdownItOptions>, env?: Env): string;
}
//#endregion
//#region src/rules_core/state_core.d.ts
/** Mutable state passed through the core rules chain. */
declare class StateCore {
  src: string;
  env: Env;
  tokens: Token[];
  inlineMode: boolean;
  md: MarkdownIt;
  Token: typeof Token;
  constructor(src: string, md: MarkdownIt, env: Env);
}
//#endregion
//#region src/parser_core.d.ts
/**
 * Top-level rules executor. Glues block/inline parsers and does intermediate
 * transformations.
 */
declare class ParserCore {
  /**
   * {@link Ruler} instance. Keep configuration of core rules.
   */
  ruler: Ruler<[StateCore], void>;
  State: typeof StateCore;
  constructor();
  /**
   * Executes core chain rules.
   */
  process(state: StateCore): void;
}
//#endregion
//#region src/rules_block/state_block.d.ts
/** Mutable state passed to block rules while tokenizing a source document. */
declare class StateBlock {
  src: string;
  md: MarkdownIt;
  env: Env;
  tokens: Token[];
  bMarks: number[];
  eMarks: number[];
  tShift: number[];
  sCount: number[];
  bsCount: number[];
  blkIndent: number;
  line: number;
  lineMax: number;
  tight: boolean;
  listIndent: number;
  parentType: string;
  level: number;
  Token: typeof Token;
  constructor(src: string, md: MarkdownIt, env: Env, tokens: Token[]);
  push(type: string, tag: string, nesting: -1 | 0 | 1): Token;
  isEmpty(line: number): boolean;
  skipEmptyLines(from: number): number;
  skipSpaces(pos: number): number;
  skipSpacesBack(pos: number, min: number): number;
  skipChars(pos: number, code: number): number;
  skipCharsBack(pos: number, code: number, min: number): number;
  getLines(begin: number, end: number, indent: number, keepLastLF: boolean): string;
}
//#endregion
//#region src/parser_block.d.ts
/**
 * Block-level tokenizer.
 */
declare class ParserBlock {
  /**
   * {@link Ruler} instance. Keep configuration of block rules.
   */
  ruler: Ruler<[StateBlock, number, number, boolean], boolean>;
  State: typeof StateBlock;
  constructor();
  tokenize(state: StateBlock, startLine: number, endLine: number): void;
  /**
   * Process input string and push block tokens into `outTokens`
   */
  parse(src: string, md: MarkdownIt, env: Env, outTokens: Token[]): void;
}
//#endregion
//#region src/parser_inline.d.ts
/**
 * Tokenizes paragraph content.
 */
declare class ParserInline {
  /**
   * {@link Ruler} instance. Keep configuration of inline rules.
   */
  ruler: Ruler<[StateInline, boolean], boolean>;
  /**
   * {@link Ruler} instance. Second ruler used for post-processing
   * (e.g. in emphasis-like rules).
   */
  ruler2: Ruler<[StateInline], void>;
  State: typeof StateInline;
  constructor();
  skipToken(state: StateInline): void;
  tokenize(state: StateInline): void;
  /**
   * Process input string and push inline tokens into `outTokens`
   */
  parse(str: string, md: MarkdownIt, env: Env, outTokens: Token[]): void;
}
//#endregion
//#region src/markdownit.d.ts
declare const config: {
  default: {
    options: Required<MarkdownItOptions>;
    components: {
      core: {};
      block: {};
      inline: {};
    };
  };
  zero: {
    options: Required<MarkdownItOptions>;
    components: {
      core: {
        rules: string[];
      };
      block: {
        rules: string[];
      };
      inline: {
        rules: string[];
        rules2: string[];
      };
    };
  };
  commonmark: {
    options: Required<MarkdownItOptions>;
    components: {
      core: {
        rules: string[];
      };
      block: {
        rules: string[];
      };
      inline: {
        rules: string[];
        rules2: string[];
      };
    };
  };
};
type MarkdownItPresetName = keyof typeof config;
/**
 * Parser preset containing options and enabled rules for each parser component.
 */
interface MarkdownItPreset {
  options?: Required<MarkdownItOptions>;
  components?: {
    core?: {
      rules?: string[];
    };
    block?: {
      rules?: string[];
    };
    inline?: {
      rules?: string[];
      rules2?: string[];
    };
  };
}
/**
 * Parses Markdown into tokens and renders them to HTML.
 *
 * @category Main
 */
declare class MarkdownIt {
  /**
   * Instance of {@link ParserInline}. You may need it to add new rules when
   * writing plugins. For simple rules control use {@link MarkdownIt.disable}
   * and {@link MarkdownIt.enable}.
   */
  inline: ParserInline;
  /**
   * Instance of {@link ParserBlock}. You may need it to add new rules when
   * writing plugins. For simple rules control use {@link MarkdownIt.disable}
   * and {@link MarkdownIt.enable}.
   */
  block: ParserBlock;
  /**
   * Instance of {@link ParserCore} chain executor. You may need it to add new
   * rules when writing plugins. For simple rules control use
   * {@link MarkdownIt.disable} and {@link MarkdownIt.enable}.
   */
  core: ParserCore;
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
  renderer: Renderer;
  /**
   * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
   * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/src/rules_core/linkify.ts)
   * rule.
   */
  linkify: LinkifyIt;
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
  validateLink(url: string): boolean;
  /**
   * Function used to encode link url to a machine-readable format,
   * which includes url-encoding, punycode, etc.
   */
  normalizeLink(url: string): string;
  /**
   * Function used to decode link url to a human-readable format`
   */
  normalizeLinkText(url: string): string;
  /**
   * Assorted utility functions, useful to write plugins. See details
   * [here](https://github.com/markdown-it/markdown-it/blob/master/src/common/utils.ts).
   */
  utils: typeof utils_d_exports;
  /**
   * Link components parser functions, useful to write plugins. See details
   * [here](https://github.com/markdown-it/markdown-it/blob/master/src/helpers).
   */
  helpers: typeof index_d_exports;
  options: Required<MarkdownItOptions>;
  constructor(...args: [] | [options: MarkdownItOptions] | [presetName: MarkdownItPresetName, options?: MarkdownItOptions]);
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
  set(options: MarkdownItOptions): this;
  /**
   * Batch load of all options and compenent settings. This is internal method,
   * and you probably will not need it. But if you will - see available presets
   * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/src/presets)
   *
   * We strongly recommend to use presets instead of direct config loads. That
   * will give better compatibility with next versions.
   */
  configure(presets: MarkdownItPresetName | MarkdownItPreset): this;
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
  enable(list: string | string[], ignoreInvalid?: boolean): this;
  /**
   * The same as {@link MarkdownIt.enable}, but turn specified rules off.
   */
  disable(list: string | string[], ignoreInvalid?: boolean): this;
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
  use<Params extends unknown[]>(plugin: (md: this, ...params: Params) => void, ...params: Params): this;
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
  parse(src: string, env: Env): Token[];
  /**
   * Render markdown string into html. It does all magic for you :).
   *
   * `env` can be used to inject additional metadata (`{}` by default).
   * But you will not need it with high probability. See also comment
   * in {@link MarkdownIt.parse}.
   */
  render(src: string, env?: Env): string;
  /**
   * The same as {@link MarkdownIt.parse} but skip all block rules. It returns
   * the block tokens list with the single `inline` element, containing parsed
   * inline tokens in `children` property. Also updates `env` object.
   */
  parseInline(src: string, env: Env): Token[];
  /**
   * Similar to {@link MarkdownIt.render} but for single paragraph content.
   * Result will NOT be wrapped into `<p>` tags.
   */
  renderInline(src: string, env?: Env): string;
  static Token: typeof Token;
  static Ruler: typeof Ruler;
  static Renderer: typeof Renderer;
  static ParserCore: typeof ParserCore;
  static StateCore: typeof StateCore;
  static ParserBlock: typeof ParserBlock;
  static StateBlock: typeof StateBlock;
  static ParserInline: typeof ParserInline;
  static StateInline: typeof StateInline;
}
//#endregion
//#region src/index.d.ts
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
declare const MarkdownItCallable: typeof MarkdownIt & ((...args: [] | [options: MarkdownItOptions] | [presetName: "default" | "zero" | "commonmark", options?: MarkdownItOptions | undefined]) => MarkdownIt);
//#endregion
export { type Delimiter, type Env, type MarkdownIt, type MarkdownItOptions, type MarkdownItPreset, type ParserBlock, type ParserCore, type ParserInline, type Renderer, type RendererRule, type Ruler, type StateBlock, type StateCore, type StateInline, type Token, MarkdownItCallable as default };