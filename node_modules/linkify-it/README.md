linkify-it
==========

[![CI](https://github.com/markdown-it/linkify-it/actions/workflows/ci.yml/badge.svg)](https://github.com/markdown-it/linkify-it/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/linkify-it.svg?style=flat)](https://www.npmjs.org/package/linkify-it)
[![Coverage Status](https://coveralls.io/repos/github/markdown-it/linkify-it/badge.svg?branch=master)](https://coveralls.io/github/markdown-it/linkify-it?branch=master)

> Links recognition library with FULL unicode support.
> Focused on high quality link patterns detection in plain text.

__[Demo](http://markdown-it.github.io/linkify-it/)__

Why it's awesome:

- Full unicode support, _with astral characters_!
- International domains support.
- Allows rules extension & custom normalizers.


Install
-------

```bash
npm install linkify-it --save
```


Usage examples
--------------

```js
import { LinkifyIt } from 'linkify-it';
const linkify = new LinkifyIt({ fuzzyLink: true });

linkify
  .tlds(require('tlds'))
  .tlds('onion', true)
  .add('ftp:', null)
  .set({ fuzzyIP: true });

console.log(linkify.test('Site github.com!'));
// true

console.log(linkify.match('Site github.com!'));
// [ {
//   schema: "",
//   index: 5,
//   lastIndex: 15,
//   raw: "github.com",
//   text: "github.com",
//   url: "http://github.com",
// } ]
```

See more in examples folder:

- [twitter mentions](examples/twitter.mjs)
- [CJK paired brackets in URL paths](examples/cjk-paired-brackets.mjs)
- [increased nested scopes depth](examples/nested-scopes-depth.mjs)


API
---

__[API documentation](http://markdown-it.github.io/linkify-it/doc)__

### new LinkifyIt(options)

Creates new linkifier instance.

By default understands:

- `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
- "fuzzy" emails (foo@bar.com).

`options`:

- __fuzzyLink__ - recognize URL-s without `http(s)://` head. Default `false`.
- __fuzzyIP__ - allow IPs in fuzzy links above. Can conflict with some texts
  like version numbers. Default `false`.
- __fuzzyEmail__ - recognize emails without `mailto:` prefix. Default `true`.
- __tlds__ - allowed TLDs list for fuzzy links. Replaces the default list
  when set.
- __---__ - set `true` to terminate link with `---` (if it's considered as long dash).
  Default `false`.
- __rebuilder__ - custom `REBuilder` instance for patched regex fragments.
- __urlAuth__ - recognize authentication data in URLs. Default `false`.
- __maxLength__ - maximum link length. Default `10000`.


### .test(text)

Searches linkifiable pattern and returns `true` on success or `false` on fail.


### .testSchemaAt(text, name, offset)

Similar to `.test()` but checks only specific protocol tail exactly at given
position. Returns length of found pattern (0 on fail).


### .match(text)

Returns `Array` of found link matches or null if nothing found.

Each match has:

- __schema__ - link schema, can be empty for fuzzy links, or `//` for
  protocol-neutral  links.
- __index__ - offset of matched text
- __lastIndex__ - index of next char after mathch end
- __raw__ - matched text
- __text__ - normalized text
- __url__ - link, generated from matched text


### .matchAtStart(text)

Checks if a match exists at the start of the string. Returns `Match`
(see docs for `match(text)`) or null if no URL is at the start.
Doesn't work with fuzzy links.


### .tlds(list[, keepOld])

Load (or merge) new tlds list. Those are needed for fuzzy links (without schema)
to avoid false positives. By default:

- 2-letter root zones are ok.
- biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф are ok.
- encoded (`xn--...`) root zones are ok.

If that's not enough, you can reload defaults with more detailed zones list.

### .add(key, value)

Add a new schema to the schemas object.

`key` is a link prefix (usually, protocol name with `:` at the end, `skype:`
for example). `linkify-it` makes sure that prefix is not preceded with
alphanumeric char.

`value` is a rule to check tail after link prefix:

- _Object_
  - _validate_ - validator function which, given arguments _text_, _pos_, and
    _self_, returns the length of a match in _text_ starting at index _pos_.
    _pos_ is the index right after the link prefix. _self_ can be used to
    access the linkify object to cache data.
  - _normalize_ - optional function to normalize text & url of matched result
    (for example, for twitter mentions).

To disable an existing rule, use `.add(key, null)`.


### .set(options)

Override default options. Missed properties will not be changed.
