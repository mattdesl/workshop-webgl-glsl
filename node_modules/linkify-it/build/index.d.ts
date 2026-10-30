/**
 * @category types
 */
interface REBuilderOptions {
    '---'?: boolean;
    fuzzyIP?: boolean;
    schema_names?: string[];
    tlds?: string[];
    urlAuth?: boolean;
    maxLength?: number;
}
declare class REBuilder {
    src_Any: string;
    src_Cc: string;
    src_Z: string;
    src_P: string;
    src_ZPCc: string;
    src_ZCc: string;
    cache: Record<string, RegExp | undefined>;
    opts: REBuilderOptions;
    constructor(opts?: REBuilderOptions);
    set(opts?: REBuilderOptions): this;
    escapeRE(str: string): string;
    nestedPairRE(open: string, close: string, depth?: number): string;
    get_text_separators(): RegExp;
    get_pseudo_letter(): RegExp;
    get_ipv4_addr(): RegExp;
    get_ipv6_addr(): RegExp;
    get_ipv6_url_host(): RegExp;
    get_ipv6_mail_host(): RegExp;
    get_auth(): RegExp;
    get_port(): RegExp;
    get_host_terminator(): RegExp;
    get_path_terminator(): RegExp;
    get_path(): RegExp;
    get_mail_name(): RegExp;
    get_xn(): RegExp;
    get_tld(): RegExp;
    get_domain_root(): RegExp;
    get_domain(): RegExp;
    get_url_host_port(): RegExp;
    get_fuzzy_url_host_port(): RegExp;
    get_mail_host(): RegExp;
    get_fuzzy_mail_host(): RegExp;
    get_path_extra(): RegExp;
    get_fuzzy_mail_host_search(): RegExp;
    get_fuzzy_link_search(): RegExp;
    get_http_validator(): RegExp;
    get_relative_proto_validator(): RegExp;
    get_mail_name_validator(): RegExp;
    get_mailto_validator(): RegExp;
    get_schema_names(): RegExp;
    get_schema_search(): RegExp;
    get_schema_at_start(): RegExp;
}

/**
 * Recognition options for schemaless links.
 *
 * @category types
 */
interface LinkifyOptions {
    /** Recognize URLs without `http(s)://` prefix. Default `false`. */
    fuzzyLink?: boolean;
    /** Recognize emails without `mailto:` prefix. Default `true`. */
    fuzzyEmail?: boolean;
    /**
     * Allow IPs in fuzzy links. Can conflict with some texts, like version
     * numbers. Default `false`.
     */
    fuzzyIP?: boolean;
    /**
     * Terminate link with `---` if it is considered a long dash. Default `false`.
     */
    '---'?: boolean;
    /** Allowed TLDs list for fuzzy links. Replaces the default list when set. */
    tlds?: string[];
    /** Recognize authentication data in URLs. Default `false`. */
    urlAuth?: boolean;
    /** Maximum link length. Default `10000`. */
    maxLength?: number;
}
interface LinkifyConstructorOptions extends LinkifyOptions {
    /** Custom regular expression builder. */
    rebuilder?: REBuilder;
}
/**
 * Custom schema definition.
 *
 * @category types
 */
interface SchemaOpts {
    /**
     * Checks text after the schema prefix. Should return matched tail length on
     * success, or `0` on fail.
     */
    validate: (text: string, pos: number, self: LinkifyIt) => number;
    /**
     * Optional function to normalize `text` and `url` of matched result, for
     * example for `@twitter` mentions.
     */
    normalize?: (match: Match, self: LinkifyIt) => void;
}
/**
 * Match result returned by {@link LinkifyIt.match} and
 * {@link LinkifyIt.matchAtStart}.
 *
 * @category types
 */
declare class Match {
    /** Prefix (protocol) for matched string. Empty for fuzzy links. */
    schema: string;
    /** First position of matched string. */
    index: number;
    /** Next position after matched string. */
    lastIndex: number;
    /** Matched string. */
    raw: string;
    /** Normalized text of matched string. */
    text: string;
    /** Normalized URL of matched string. */
    url: string;
    constructor(text: string, schema: string, index: number, lastIndex: number);
}
/** Linkifier instance. */
declare class LinkifyIt {
    __opts__: Required<LinkifyOptions>;
    private __schemas__;
    re: REBuilder;
    /**
     * Creates new linkifier instance.
     *
     * By default understands:
     *
     * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
     * - "fuzzy" emails (foo@bar.com).
     *
     * See {@link LinkifyConstructorOptions} for available options.
     *
     * @param options Recognition options.
     *
     * @example
     * ```javascript
     * import { LinkifyIt } from 'linkify-it'
     *
     * const linkify = new LinkifyIt({ fuzzyLink: true })
     *
     * linkify
     *   .tlds(require('tlds'))       // Reload with full TLD list
     *   .tlds('onion', true)         // Add unofficial `.onion` domain
     *   .add('ftp:', null)           // Disable `ftp:` protocol
     *   .set({ fuzzyIP: true })      // Enable IPs in fuzzy links
     *
     * console.log(linkify.test('Site github.com!')) // true
     * console.log(linkify.match('Site github.com!'))
     * ```
     */
    constructor(options?: LinkifyConstructorOptions);
    /**
     * Add new rule definition.
     *
     * `schema` is a link prefix (usually, protocol name with `:` at the end,
     * `skype:` for example). `linkify-it` makes sure that prefix is not
     * preceded with alphanumeric char and symbols. Only whitespaces and
     * punctuation allowed.
     *
     * `definition` is a rule to check tail after link prefix. To disable an
     * existing rule, pass `null`.
     *
     * @param schema Rule name (fixed pattern prefix).
     * @param definition Schema definition, or `null` to disable the rule.
     *
     * See [twitter mentions example](https://github.com/markdown-it/linkify-it/blob/master/examples/twitter.mjs).
     */
    add(schema: string, definition?: SchemaOpts | null): this;
    /**
     * Set recognition options for links without schema.
     *
     * @param options Recognition options.
     */
    set(options?: LinkifyOptions): this;
    /**
     * Searches linkifiable pattern and returns `true` on success or `false` on fail.
     *
     * @param text Text to scan.
     */
    test(text: string): boolean;
    /**
     * Similar to {@link LinkifyIt.test} but checks only specific protocol tail exactly
     * at given position. Returns length of found pattern (0 on fail).
     *
     * @param text Text to scan.
     * @param schema Rule (schema) name.
     * @param pos Text offset to check from.
     */
    testSchemaAt(text: string, schema: string, pos: number): number;
    /**
     * Returns array of found link descriptions or `null` on fail. We strongly
     * recommend to use {@link LinkifyIt.test} first, for best speed.
     *
     * @param text Text to scan.
     */
    match(text: string): Match[] | null;
    /**
     * Returns fully-formed (not fuzzy) link if it starts at the beginning
     * of the string, and null otherwise.
     *
     * @param text Text to scan.
     */
    matchAtStart(text: string): Match | null;
    /**
     * Load (or merge) new TLDs list. Those are used for fuzzy links (without
     * prefix) to avoid false positives. By default this algorithm is used:
     *
     * - hostname with any 2-letter root zones are ok.
     * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
     *   are ok.
     * - encoded (`xn--...`) root zones are ok.
     *
     * If list is replaced, then exact match for 2-chars root zones will be checked.
     *
     * @param list List of TLDs.
     * @param keepOld Merge with current list if `true` (`false` by default).
     */
    tlds(list: string | string[], keepOld?: boolean): this;
    /**
     * Default normalizer (if schema does not define its own).
     *
     * @param match Match to normalize.
     */
    normalize(match: Match): void;
}
declare function linkifyit(options?: LinkifyConstructorOptions): LinkifyIt;

export { LinkifyIt, Match, REBuilder, linkifyit };
export type { LinkifyConstructorOptions, LinkifyOptions, REBuilderOptions, SchemaOpts };
