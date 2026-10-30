import { Any, Cc, P, Z } from "uc.micro";
//#region src/rebuilder.ts
var REBuilder = class {
	src_Any = Any.source;
	src_Cc = Cc.source;
	src_Z = Z.source;
	src_P = P.source;
	src_ZPCc = [
		this.src_Z,
		this.src_P,
		this.src_Cc
	].join("|");
	src_ZCc = [this.src_Z, this.src_Cc].join("|");
	cache = {};
	opts = {
		maxLength: 1e4,
		urlAuth: false,
		schema_names: []
	};
	constructor(opts = {}) {
		this.opts = {
			...this.opts,
			...opts
		};
	}
	set(opts = {}) {
		this.opts = {
			...this.opts,
			...opts
		};
		this.cache = {};
		return this;
	}
	escapeRE(str) {
		return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
	}
	nestedPairRE(open, close, depth = 4) {
		const openRE = this.escapeRE(open);
		const closeRE = this.escapeRE(close);
		const atom = `(?:(?!${this.src_ZCc}|${openRE}|${closeRE}).)`;
		let pair = `${openRE}${atom}{0,1000}${closeRE}`;
		for (let level = 2; level <= depth; level++) pair = `${openRE}(?:${atom}|${pair}){0,1000}${closeRE}`;
		return pair;
	}
	get_text_separators() {
		return this.cache.text_separators ??= /[><\uff5c]/;
	}
	get_pseudo_letter() {
		return this.cache.src_pseudo_letter ??= new RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`);
	}
	get_ipv4_addr() {
		return this.cache.src_ip4 ??= /* @__PURE__ */ new RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])");
	}
	get_ipv6_addr() {
		const h16 = "[0-9A-Fa-f]{1,4}";
		const ls32 = `(?:(?:${h16}:${h16})|${this.get_ipv4_addr().source})`;
		return this.cache.src_ip6_addr ??= new RegExp(`(?:(?:${h16}:){6}${ls32}|::(?:${h16}:){5}${ls32}|(?:${h16})?::(?:${h16}:){4}${ls32}|(?:(?:${h16}:){0,1}${h16})?::(?:${h16}:){3}${ls32}|(?:(?:${h16}:){0,2}${h16})?::(?:${h16}:){2}${ls32}|(?:(?:${h16}:){0,3}${h16})?::${h16}:${ls32}|(?:(?:${h16}:){0,4}${h16})?::${ls32}|(?:(?:${h16}:){0,5}${h16})?::${h16}|(?:(?:${h16}:){0,6}${h16})?::)`);
	}
	get_ipv6_url_host() {
		return this.cache.src_ip6_host ??= new RegExp(`\\[${this.get_ipv6_addr().source}\\]`);
	}
	get_ipv6_mail_host() {
		return this.cache.src_ipv6_mail_host ??= new RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`);
	}
	get_auth() {
		return this.cache.src_auth ??= new RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`);
	}
	get_port() {
		return this.cache.src_port ??= /* @__PURE__ */ new RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?");
	}
	get_host_terminator() {
		return this.cache.src_host_terminator ??= new RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`);
	}
	get_path_terminator() {
		return this.cache.src_path_terminator ??= new RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`);
	}
	get_path() {
		return this.cache.src_path ??= new RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`);
	}
	get_mail_name() {
		return this.cache.src_mail_name ??= /* @__PURE__ */ new RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}");
	}
	get_xn() {
		return this.cache.src_xn ??= /* @__PURE__ */ new RegExp("xn--[a-z0-9\\-]{1,59}");
	}
	get_tld() {
		if (this.cache.tld) return this.cache.tld;
		const tlds_src = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
		this.cache.tld = new RegExp(`${tlds_src || "$#none#$"}|${this.get_xn().source}`);
		return this.cache.tld;
	}
	get_domain_root() {
		return this.cache.src_domain_root ??= new RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`);
	}
	get_domain() {
		return this.cache.src_domain ??= new RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`);
	}
	get_url_host_port() {
		return this.cache.url_host_port ??= new RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source);
	}
	get_fuzzy_url_host_port() {
		return this.cache.fuzzy_url_host_port ??= new RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source);
	}
	get_mail_host() {
		return this.cache.src_mail_host ??= new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source);
	}
	get_fuzzy_mail_host() {
		return this.cache.src_fuzzy_mail_host ??= new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source);
	}
	get_path_extra() {
		return this.cache.src_path_extra ??= /* @__PURE__ */ new RegExp("");
	}
	get_fuzzy_mail_host_search() {
		return this.cache.mail_fuzzy_host_search ??= new RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig");
	}
	get_fuzzy_link_search() {
		return this.cache.link_fuzzy_search ??= new RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uff5c]|${this.src_ZPCc}))(?:(?![$+<=>^\`|\uff5c])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig");
	}
	get_http_validator() {
		return this.cache.http_validator ??= new RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy");
	}
	get_relative_proto_validator() {
		return this.cache.relative_proto_validator ??= new RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy");
	}
	get_mail_name_validator() {
		return this.cache.mail_name_validator ??= new RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`);
	}
	get_mailto_validator() {
		return this.cache.mailto_validator ??= new RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy");
	}
	get_schema_names() {
		return this.cache.schema_names ??= new RegExp((this.opts.schema_names || []).map((name) => this.escapeRE(name)).join("|"));
	}
	get_schema_search() {
		return this.cache.schema_search ??= new RegExp(`(^|(?!_)(?:[><\uff5c]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig");
	}
	get_schema_at_start() {
		return this.cache.schema_at_start ??= new RegExp(`^${this.get_schema_search().source}`, "i");
	}
};
//#endregion
//#region src/linkifyit.ts
var web_schema = {
	validate: (text, pos, self) => {
		const re = self.re.get_http_validator();
		re.lastIndex = pos;
		const m = re.exec(text);
		return m ? m[0].length : 0;
	},
	normalize: (match, self) => self.normalize(match)
};
var defaultSchemas = {
	"http:": web_schema,
	"https:": web_schema,
	"ftp:": web_schema,
	"//": {
		validate: function(text, pos, self) {
			const re = self.re.get_relative_proto_validator();
			re.lastIndex = pos;
			const m = re.exec(text);
			if (m) {
				if (pos >= 3 && text[pos - 3] === ":") return 0;
				if (pos >= 3 && text[pos - 3] === "/") return 0;
				return m[0].length;
			}
			return 0;
		},
		normalize: (match, self) => self.normalize(match)
	},
	"mailto:": {
		validate: function(text, pos, self) {
			const re = self.re.get_mailto_validator();
			re.lastIndex = pos;
			const m = re.exec(text);
			return m ? m[0].length : 0;
		},
		normalize: (match, self) => self.normalize(match)
	}
};
var tlds_2ch = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw";
var tlds_default = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function unpackTlds() {
	const result = tlds_default.split("|");
	tlds_2ch.split("|").forEach((item) => {
		const sep = item.indexOf(":");
		const prefix = item.slice(0, sep);
		for (const suffix of item.slice(sep + 1)) result.push(prefix + suffix);
	});
	return result;
}
var defaultOptions = {
	fuzzyLink: false,
	fuzzyEmail: true,
	fuzzyIP: false,
	"---": false,
	tlds: unpackTlds(),
	urlAuth: false,
	maxLength: 1e4
};
/**
* Match result returned by {@link LinkifyIt.match} and
* {@link LinkifyIt.matchAtStart}.
*
* @category types
*/
var Match = class {
	/** Prefix (protocol) for matched string. Empty for fuzzy links. */
	schema;
	/** First position of matched string. */
	index;
	/** Next position after matched string. */
	lastIndex;
	/** Matched string. */
	raw;
	/** Normalized text of matched string. */
	text;
	/** Normalized URL of matched string. */
	url;
	constructor(text, schema, index, lastIndex) {
		const raw = text.slice(index, lastIndex);
		this.schema = schema.toLowerCase();
		this.index = index;
		this.lastIndex = lastIndex;
		this.raw = raw;
		this.text = raw;
		this.url = raw;
	}
};
/** Linkifier instance. */
var LinkifyIt = class {
	__opts__;
	__schemas__;
	re;
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
	constructor(options = {}) {
		const { rebuilder, ...linkifyOptions } = options;
		this.__opts__ = {
			...defaultOptions,
			...linkifyOptions
		};
		this.__schemas__ = { ...defaultSchemas };
		this.re = rebuilder || new REBuilder();
		this.re.set({
			...this.__opts__,
			schema_names: Object.keys(this.__schemas__)
		});
	}
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
	add(schema, definition = null) {
		if (!definition) delete this.__schemas__[schema];
		else {
			const def = {
				normalize: (match, self) => self.normalize(match),
				...definition
			};
			this.__schemas__[schema] = def;
		}
		this.re.set({
			...this.__opts__,
			schema_names: Object.keys(this.__schemas__)
		});
		return this;
	}
	/**
	* Set recognition options for links without schema.
	*
	* @param options Recognition options.
	*/
	set(options = {}) {
		this.__opts__ = {
			...this.__opts__,
			...options
		};
		this.re.set({
			...this.__opts__,
			schema_names: Object.keys(this.__schemas__)
		});
		return this;
	}
	/**
	* Searches linkifiable pattern and returns `true` on success or `false` on fail.
	*
	* @param text Text to scan.
	*/
	test(text) {
		if (!text.length) return false;
		let m, re;
		re = this.re.get_schema_search();
		re.lastIndex = 0;
		while ((m = re.exec(text)) !== null) if (this.testSchemaAt(text, m[2], re.lastIndex)) return true;
		if (this.__opts__.fuzzyLink && this.__schemas__["http:"]) {
			re = this.re.get_fuzzy_link_search();
			re.lastIndex = 0;
			if (re.exec(text) !== null) return true;
		}
		if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"]) {
			if (text.indexOf("@") >= 0) {
				const mailHostRe = this.re.get_fuzzy_mail_host_search();
				const mailNameRe = this.re.get_mail_name_validator();
				mailHostRe.lastIndex = 0;
				while ((m = mailHostRe.exec(text)) !== null) {
					const name = text.slice(Math.max(0, m.index - 65), m.index);
					if (mailNameRe.test(name)) return true;
				}
			}
		}
		return false;
	}
	/**
	* Similar to {@link LinkifyIt.test} but checks only specific protocol tail exactly
	* at given position. Returns length of found pattern (0 on fail).
	*
	* @param text Text to scan.
	* @param schema Rule (schema) name.
	* @param pos Text offset to check from.
	*/
	testSchemaAt(text, schema, pos) {
		if (!this.__schemas__[schema.toLowerCase()]) return 0;
		return this.__schemas__[schema.toLowerCase()].validate(text.slice(0, pos + this.__opts__.maxLength), pos, this);
	}
	/**
	* Returns array of found link descriptions or `null` on fail. We strongly
	* recommend to use {@link LinkifyIt.test} first, for best speed.
	*
	* @param text Text to scan.
	*/
	match(text) {
		const result = [];
		const schemaRe = this.re.get_schema_search();
		let fuzzyLinkRe;
		let mailHostRe;
		let mailNameRe;
		let fuzzyLinkCandidate;
		let fuzzyEmailCandidate;
		let schemaPrefix;
		let schemaDone = false;
		let fuzzyLinkDone = false;
		let fuzzyEmailDone = false;
		let pos = 0;
		if (!text.length) return null;
		schemaRe.lastIndex = 0;
		if (this.__opts__.fuzzyLink && this.__schemas__["http:"]) {
			fuzzyLinkRe = this.re.get_fuzzy_link_search();
			fuzzyLinkRe.lastIndex = 0;
		}
		if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"]) {
			mailHostRe = this.re.get_fuzzy_mail_host_search();
			mailHostRe.lastIndex = 0;
			mailNameRe = this.re.get_mail_name_validator();
		}
		for (;;) {
			const scanFrom = Math.max(pos - 1, 0);
			if (mailHostRe && mailNameRe && !fuzzyEmailDone && (!fuzzyEmailCandidate || fuzzyEmailCandidate.index < pos)) {
				if (mailHostRe.lastIndex < scanFrom) mailHostRe.lastIndex = scanFrom;
				for (;;) {
					const m = mailHostRe.exec(text);
					if (!m) {
						fuzzyEmailDone = true;
						fuzzyEmailCandidate = void 0;
						break;
					}
					const name = mailNameRe.exec(text.slice(Math.max(0, m.index - 65), m.index));
					if (!name) continue;
					fuzzyEmailCandidate = {
						schema: "mailto:",
						index: m.index - name[1].length,
						lastIndex: m.index + m[0].length
					};
					if (fuzzyEmailCandidate.index >= pos) break;
					if (mailHostRe.lastIndex < scanFrom) mailHostRe.lastIndex = scanFrom;
				}
			}
			if (fuzzyLinkRe && !fuzzyLinkDone && (!fuzzyLinkCandidate || fuzzyLinkCandidate.index < pos)) {
				if (fuzzyLinkRe.lastIndex < scanFrom) fuzzyLinkRe.lastIndex = scanFrom;
				for (;;) {
					const m = fuzzyLinkRe.exec(text);
					if (!m) {
						fuzzyLinkDone = true;
						fuzzyLinkCandidate = void 0;
						break;
					}
					fuzzyLinkCandidate = {
						schema: "",
						index: m.index + m[1].length,
						lastIndex: m.index + m[0].length
					};
					if (fuzzyLinkCandidate.index >= pos) break;
					if (fuzzyLinkRe.lastIndex < scanFrom) fuzzyLinkRe.lastIndex = scanFrom;
				}
			}
			let fuzzyCandidate = fuzzyEmailCandidate;
			if (!fuzzyCandidate || fuzzyLinkCandidate && (fuzzyLinkCandidate.index < fuzzyCandidate.index || fuzzyLinkCandidate.index === fuzzyCandidate.index && fuzzyLinkCandidate.lastIndex > fuzzyCandidate.lastIndex)) fuzzyCandidate = fuzzyLinkCandidate;
			let schemaCandidate;
			if (!schemaDone) for (;;) {
				if (!schemaPrefix) {
					if (schemaRe.lastIndex < scanFrom) schemaRe.lastIndex = scanFrom;
					const m = schemaRe.exec(text);
					if (!m) {
						schemaDone = true;
						break;
					}
					schemaPrefix = {
						schema: m[2],
						index: m.index + m[1].length,
						lastIndex: m.index + m[0].length
					};
				}
				if (schemaPrefix.index < pos) {
					schemaPrefix = void 0;
					continue;
				}
				if (fuzzyCandidate && schemaPrefix.index > fuzzyCandidate.index) break;
				const prefix = schemaPrefix;
				schemaPrefix = void 0;
				const len = this.testSchemaAt(text, prefix.schema, prefix.lastIndex);
				if (len) {
					schemaCandidate = {
						schema: prefix.schema,
						index: prefix.index,
						lastIndex: prefix.lastIndex + len
					};
					break;
				}
			}
			let candidate = schemaCandidate;
			if (!candidate || fuzzyEmailCandidate && (fuzzyEmailCandidate.index < candidate.index || fuzzyEmailCandidate.index === candidate.index && fuzzyEmailCandidate.lastIndex > candidate.lastIndex)) candidate = fuzzyEmailCandidate;
			if (!candidate || fuzzyLinkCandidate && (fuzzyLinkCandidate.index < candidate.index || fuzzyLinkCandidate.index === candidate.index && fuzzyLinkCandidate.lastIndex > candidate.lastIndex)) candidate = fuzzyLinkCandidate;
			if (!candidate) break;
			if (candidate === fuzzyEmailCandidate) fuzzyEmailCandidate = void 0;
			else if (candidate === fuzzyLinkCandidate) fuzzyLinkCandidate = void 0;
			const match = new Match(text, candidate.schema, candidate.index, candidate.lastIndex);
			if (match.schema) this.__schemas__[match.schema].normalize(match, this);
			else this.normalize(match);
			result.push(match);
			pos = candidate.lastIndex;
		}
		if (result.length) return result;
		return null;
	}
	/**
	* Returns fully-formed (not fuzzy) link if it starts at the beginning
	* of the string, and null otherwise.
	*
	* @param text Text to scan.
	*/
	matchAtStart(text) {
		if (!text.length) return null;
		const m = this.re.get_schema_at_start().exec(text);
		if (!m) return null;
		const len = this.testSchemaAt(text, m[2], m[0].length);
		if (!len) return null;
		const match = new Match(text, m[2], m.index + m[1].length, m.index + m[0].length + len);
		this.__schemas__[match.schema].normalize(match, this);
		return match;
	}
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
	tlds(list, keepOld = false) {
		list = Array.isArray(list) ? list : [list];
		if (!keepOld) this.__opts__.tlds = list;
		else this.__opts__.tlds = this.__opts__.tlds.concat(list);
		this.re.set({
			...this.__opts__,
			schema_names: Object.keys(this.__schemas__)
		});
		return this;
	}
	/**
	* Default normalizer (if schema does not define its own).
	*
	* @param match Match to normalize.
	*/
	normalize(match) {
		if (!match.schema) match.url = `http://${match.url}`;
		if (match.schema === "mailto:" && !/^mailto:/i.test(match.url)) match.url = `mailto:${match.url}`;
	}
};
function linkifyit(options = {}) {
	return new LinkifyIt(options);
}
//#endregion
export { LinkifyIt, REBuilder, linkifyit };

//# sourceMappingURL=index.mjs.map