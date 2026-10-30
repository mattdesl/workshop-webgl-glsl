# RE2JS is the JavaScript port of RE2, a regular expression engine that provides linear time matching

[![Test/Build/Publish](https://github.com/le0pard/re2js/actions/workflows/ci.yml/badge.svg)](https://github.com/le0pard/re2js/actions/workflows/ci.yml)

## [Playground](https://re2js.leopard.in.ua/)

## What is RE2?

RE2 is a regular expression engine designed to operate in time proportional to the size of the input, ensuring linear time complexity. RE2JS is a pure JavaScript port that achieves full architectural parity with the [Go regexp implementation](https://pkg.go.dev/regexp).

JavaScript's standard regular expression engine, [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions), and many other widely used packages (Perl, Python, PCRE) use a backtracking implementation strategy. When a pattern presents alternatives like `a|b`, the engine tries to match subpattern `a` first; if that fails, it resets the input and tries subpattern `b`.

If such choices are deeply nested, this strategy requires an exponential number of passes over the input data, potentially exceeding the lifetime of the universe for large inputs. This creates a security risk known as Regular Expression Denial of Service (ReDoS) when accepting patterns from untrusted sources.

In contrast, RE2JS utilizes a combination of Deterministic Finite Automaton (DFA) and Nondeterministic Finite Automaton (NFA) strategies to explore all matches simultaneously in a single pass over the input data. This approach guarantees $O(n)$ linear time complexity, providing a secure environment for both Node.js and browser applications.

## Installation

To install RE2JS:

```bash
# npm
npm install re2js
# yarn
yarn add re2js
# pnpm
pnpm add re2js
# bun
bun add re2js
```

## Usage

This document provides a series of examples demonstrating how to use RE2JS in your code. For more detailed information about regex syntax, please visit this page: [Google RE2 Syntax Documentation](https://github.com/google/re2/wiki/Syntax).

You can utilize ECMAScript (ES6) imports to import and use the RE2JS library:

```js
import { RE2JS } from 're2js'
```

If you're using CommonJS, you can `require` the library:

```js
const { RE2JS } = require('re2js')
```

### Compiling Patterns

You can compile a regex pattern using the `compile()` function:

```js
import { RE2JS } from 're2js'

const p = RE2JS.compile('abc')
console.log(p.pattern()) // Outputs: 'abc'
console.log(p.flags()) // Outputs: 0
```

The `compile()` function also supports flags:

```js
import { RE2JS } from 're2js'

const p = RE2JS.compile('abc', RE2JS.CASE_INSENSITIVE | RE2JS.MULTILINE)
console.log(p.pattern()) // Outputs: 'abc'
console.log(p.flags()) // Outputs: 5
```

#### Tagged Template Literals (No Double-Escaping)

To avoid the tedious "double-backslash" escaping problem common with the `RE2JS.compile("\\d+")` syntax, the library provides a handy `re` tagged template literal. This allows you to write patterns exactly as they appear in standard JavaScript regex literals:

```js
import { re, RE2JS } from 're2js'

// Instead of RE2JS.compile('\\b\\w+\\b')
const p1 = re`\b\w+\b`
console.log(p1.pattern()) // Outputs: '\b\w+\b'

// You can also pass flags by calling `re` as a function first:
const p2 = re(RE2JS.CASE_INSENSITIVE | RE2JS.MULTILINE)`^foo\d+`
console.log(p2.test('FOO42')) // true
```

#### Supported flags:

The `compile()` function and the `re()` template tag support the following flags:

```js
/**
 * Flag: case insensitive matching.
 */
RE2JS.CASE_INSENSITIVE
/**
 * Flag: dot ({@code .}) matches all characters, including newline.
 */
RE2JS.DOTALL
/**
 * Flag: multiline matching: {@code ^} and {@code $} match at beginning and end of line, not just
 * beginning and end of input.
 */
RE2JS.MULTILINE
/**
 * Flag: Unicode groups (e.g. {@code \p\ Greek\} ) will be syntax errors.
 */
RE2JS.DISABLE_UNICODE_GROUPS
/**
 * Flag: matches longest possible string (changes the match semantics to leftmost-longest).
 */
RE2JS.LONGEST_MATCH
/**
 * Flag: enable linear-time captureless lookbehinds.
 */
RE2JS.LOOKBEHINDS
```

### Checking for Matches

RE2JS allows you to check if a string matches a given regex pattern using the `matches()` function.

_**Performance Note:** The `matches()` method is highly optimized. It performs a strict anchored check and runs directly on the high-speed DFA (Deterministic Finite Automaton) engine without tracking capture groups or instantiating a stateful `Matcher` object._

```js
import { RE2JS } from 're2js'

RE2JS.matches('ab+c', 'abbbc') // true
RE2JS.matches('ab+c', 'cbbba') // false
// or
RE2JS.compile('ab+c').matches('abbbc') // true
RE2JS.compile('ab+c').matches('cbbba') // false
// with flags
RE2JS.compile('ab+c', RE2JS.CASE_INSENSITIVE).matches('AbBBc') // true
RE2JS.compile('^ab.*c$', RE2JS.DOTALL | RE2JS.MULTILINE | RE2JS.CASE_INSENSITIVE).matches('AB\nc') // true
```

### High-Performance Boolean Testing

If you only need to know **whether** a string matches a pattern (without extracting capture groups), you should use the `test()`, `testExact()`, or `matches()` methods. Unlike `.matcher()`, these methods do not instantiate stateful `Matcher` objects and request exactly `0` capture groups. This guarantees that execution is securely routed to the high-speed DFA (Deterministic Finite Automaton) engine whenever possible in linear `O(n)` time

#### `test(input)`

Tests if the regular expression matches **any part** of the provided input (unanchored). This method mirrors the standard JavaScript `RegExp.prototype.test()` API

```js
import { RE2JS } from 're2js'

// Compile once, reuse often
const re = RE2JS.compile('error|warning|critical')

// Extremely fast, unanchored DFA search
if (re.test('The system encountered a critical failure')) {
  console.log('Log needs attention!')
}
```

#### `testExact(input)`

Tests if the regular expression matches the entire input string (anchored to both start and end).

_Note: `RE2JS.matches()` delegates to this method, so they provide the exact same performance and behavior._

```js
import { RE2JS } from 're2js'

const isHex = RE2JS.compile('[0-9A-Fa-f]+')

// Fast, anchored DFA validation
console.log(isHex.testExact('1A4F')) // true
console.log(isHex.testExact('1A4F-xyz')) // false
```

### Checking Initial Match

The `lookingAt()` method determines whether the start of the given string matches the pattern

```js
import { RE2JS } from 're2js'

RE2JS.compile('abc').matcher('abcdef').lookingAt() // true
RE2JS.compile('abc').matcher('ab').lookingAt() // false
```

Note that the `lookingAt` method only checks the start of the string. It does not search the entire string for a match

### Finding Matches

To find a match for a given regex pattern in a string, you can use the `find()` function

```js
import { RE2JS } from 're2js'

RE2JS.compile('ab+c').matcher('xxabbbc').find() // true
RE2JS.compile('ab+c').matcher('cbbba').find() // false
// with flags
RE2JS.compile('ab+c', RE2JS.CASE_INSENSITIVE).matcher('abBBc').find() // true
```

Example to collect all matches in string

```js
import { RE2JS } from 're2js'

const p = RE2JS.compile('abc+')
const matchString = p.matcher('abc abcccc abcc')
const results = []
while (matchString.find()) {
  results.push(matchString.group())
}
results // ['abc', 'abcccc', 'abcc']
```

The `find()` method searches for a pattern match in a string starting from a specific index

```js
import { RE2JS } from 're2js'

const p = RE2JS.compile('.*[aeiou]')
const matchString = p.matcher('abcdefgh')
matchString.find(0) // true
matchString.group() // 'abcde'
matchString.find(1) // true
matchString.group() // 'bcde'
matchString.find(4) // true
matchString.group() // 'e'
matchString.find(7) // false
```

### Executing a Search (`exec`)

If you want a native, 1:1 drop-in replacement for JavaScript's `RegExp.prototype.exec()`, you can use the `.exec()` method.

Instead of dealing with a stateful `Matcher` object, `exec()` performs a single search and returns a standard `RegExpExecArray`-shaped result, or `null` if no match is found. It includes the `.index`, `.input`, and `.groups` properties, and accurately maps unmatched optional capture groups to `undefined` (just like native JavaScript).

```js
import { RE2JS } from 're2js'

const re = RE2JS.compile('(?P<first>\\w+) (?:(?P<middle>\\w+) )?(?P<last>\\w+)')
const result = re.exec('John Doe')

if (result !== null) {
  console.log(result[0]) // "John Doe" (Full match)
  console.log(result[1]) // "John" (Group 1)
  console.log(result[2]) // undefined (Group 2 didn't match)
  console.log(result[3]) // "Doe" (Group 3)

  console.log(result.index) // 0
  console.log(result.input) // "John Doe"

  // Named groups dictionary
  console.log(result.groups.first) // "John"
  console.log(result.groups.middle) // undefined
  console.log(result.groups.last) // "Doe"
}
```

_**Performance Note:** If you are running `exec()` inside a `while` loop to manually extract multiple matches globally, it is highly recommended to use `.matchAll()` instead, as it is cleaner, strictly stateless, and avoids infinite loop pitfalls._

### Iterating Over Matches (`matchAll`)

For a more modern, JavaScript-native developer experience, RE2JS provides a `.matchAll()` method. This returns an ES6 `IterableIterator`, allowing you to safely and cleanly iterate over matches using `for...of` loops or the array spread operator `[...]`.

Unlike native `RegExp` objects with the `/g` flag, RE2JS is completely stateless. This means you don't have to worry about `.lastIndex` bugs—you can iterate over the same regex instance as many times as you want safely.

The yielded match arrays perfectly mirror the shape of native JavaScript regex matches. They include `.index`, `.input`, and `.groups` properties, and properly map unmatched capture groups to `undefined`.

```js
import { RE2JS } from 're2js'

const re2 = RE2JS.compile('(?P<year>\\d{4})-(?P<month>\\d{2})')
const input = 'Dates: 2024-05 and 2025-11.'

// Native ES6 Iteration
for (const match of re2.matchAll(input)) {
  console.log(match[0]) // "2024-05", then "2025-11"
  console.log(match.index) // 7, then 19
  console.log(match.groups) // { year: '2024', month: '05' } then { year: '2025', month: '11' }
  console.log(match.groups.year) // "2024", then "2025"
}

// Or easily collect all matches into an array
const allMatches = [...re2.matchAll(input)]
console.log(allMatches.length) // 2
```

### Multi-Pattern Matching (RE2Set)

RE2JS includes a highly optimized `RE2Set` API that allows you to match multiple regular expressions against a single string simultaneously. Instead of running 100 different regexes in a loop ($O(100n)$ time), `RE2Set` compiles them into a single state machine and finds all matches in a single pass ($O(n)$ linear time).

This is incredibly powerful for profanity filters, routing engines, or log parsers.

```js
import { RE2Set } from 're2js'

// Create a new set. You can optionally pass an anchor, public RE2JS flags, and a max memory limit for the DFA.
// Default anchor: RE2Set.UNANCHORED
const set = new RE2Set()

// Add patterns to the set.
// The add() method returns the integer ID of the pattern.
set.add('error') // ID: 0
set.add('warning') // ID: 1
set.add('critical') // ID: 2

// You must compile the set before matching!
set.compile()

// Match against a string.
// Returns an array of IDs for all patterns that successfully matched.
console.log(set.match('The system encountered a critical error.'))
// Outputs: [0, 2]

console.log(set.match('All systems operational.'))
// Outputs: []
```

#### Anchoring a Set and Memory Limits

You can strictly anchor the entire set by passing an anchor constant to the constructor (`RE2Set.UNANCHORED`, `RE2Set.ANCHOR_START`, or `RE2Set.ANCHOR_BOTH`).

You can pass standard public `RE2JS` flags (like `CASE_INSENSITIVE` or `LOOKBEHINDS`) as the second argument to apply them to all patterns in the set.

Additionally, the third argument allows you to specify a `maxMem` limit (in bytes) to prevent the underlying DFA from exploding and consuming too much memory on highly ambiguous patterns.
The default is 8 * 1024 * 1024 (8MB).

```js
import { RE2Set, RE2JS } from 're2js'

// Anchor the set to match the entire string, make it case-insensitive,
// and limit the DFA memory usage to ~4MB (default is 8MB).
const maxMem = 4 * 1024 * 1024
const set = new RE2Set(RE2Set.ANCHOR_BOTH, RE2JS.CASE_INSENSITIVE, maxMem)

set.add('foo') // ID: 0
set.add('bar') // ID: 1
set.add('.*') // ID: 2

set.compile()

console.log(set.match('FOO')) // [0, 2] (Matches 'foo' and '.*' because of CASE_INSENSITIVE)
console.log(set.match('foobar')) // [2] (Only '.*' matches the entire string because of ANCHOR_BOTH)
```

_**Performance Note:** `RE2Set` heavily utilizes the high-speed DFA engine to process multi-pattern matches simultaneously. However, if your patterns contain boundaries (e.g., `\b`) or trigger a massive state explosion, it will seamlessly and safely fall back to the bounded NFA engine._

#### Example: Fast JS Routing with RE2Set

```js
import { RE2Set, RE2JS } from 're2js'

class Router {
  constructor() {
    this.set = new RE2Set()
    this.routes = []
  }

  addRoute(pattern, handler) {
    // compile the individual regex (for extracting groups later)
    const re = RE2JS.compile(pattern)

    // add the raw string to the blazing-fast Set
    const id = this.set.add(pattern)

    // store them together
    this.routes[id] = { re, handler }
  }

  compile() {
    this.set.compile()
  }

  execute(path) {
    // find WHICH routes matched in O(N) time
    const matchedIDs = this.set.match(path)

    if (matchedIDs.length === 0) {
      return '404 Not Found'
    }

    // extract groups ONLY for the routes that won
    for (const id of matchedIDs) {
      const route = this.routes[id]
      const matcher = route.re.matcher(path)

      if (matcher.matches()) {
        const params = matcher.getNamedGroups()
        return route.handler(params)
      }
    }
  }
}

// --- Usage ---
const router = new Router()

router.addRoute('^/users/(?P<id>\\d+)$', (params) => `User ID: ${params.id}`)
router.addRoute('^/posts/(?P<slug>[a-z-]+)$', (params) => `Post: ${params.slug}`)

router.compile()

console.log(router.execute('/users/42')) // Outputs: "User ID: 42"
```

### Splitting Strings

You can split a string based on a regex pattern using the `split()` function

```js
import { RE2JS } from 're2js'

RE2JS.compile('/').split('abcde') // ['abcde']
RE2JS.compile('/').split('a/b/cc//d/e//') // ['a', 'b', 'cc', '', 'd', 'e']
RE2JS.compile(':').split(':a::b') // ['', 'a', '', 'b']
```

The `split()` function also supports a limit parameter

```js
import { RE2JS } from 're2js'

RE2JS.compile('/').split('a/b/cc//d/e//', 3) // ['a', 'b', 'cc//d/e//']
RE2JS.compile('/').split('a/b/cc//d/e//', 4) // ['a', 'b', 'cc', '/d/e//']
RE2JS.compile('/').split('a/b/cc//d/e//', 9) // ['a', 'b', 'cc', '', 'd', 'e', '', '']
RE2JS.compile(':').split('boo:and:foo', 2) // ['boo', 'and:foo']
RE2JS.compile(':').split('boo:and:foo', 5) // ['boo', 'and', 'foo']
```

### Working with Groups

RE2JS supports capturing groups in regex patterns

#### Group Count

You can get the count of groups in a pattern using the `groupCount()` function

```js
import { RE2JS } from 're2js'

RE2JS.compile('(.*)ab(.*)a').groupCount() // 2
RE2JS.compile('(.*)((a)b)(.*)a').groupCount() // 4
RE2JS.compile('(.*)(\\(a\\)b)(.*)a').groupCount() // 3
```

#### Named Groups

You can access the named groups in a pattern using the `namedGroups()` function

```js
import { RE2JS } from 're2js'

RE2JS.compile('(?P<foo>\\d{2})').namedGroups() // { foo: 1 }
RE2JS.compile('(?<bar>\\d{2})').namedGroups() // { bar: 1 }
RE2JS.compile('\\d{2}').namedGroups() // {}
RE2JS.compile('(?P<foo>.*)(?P<bar>.*)').namedGroups() // { foo: 1, bar: 2 }
```

#### Group Content

The `group()` method retrieves the content matched by a specific capturing group

```js
import { RE2JS } from 're2js'

const p = RE2JS.compile('(a)(b(c)?)d?(e)')
const matchString = p.matcher('xabdez')
if (matchString.find()) {
  matchString.group(0) // 'abde'
  matchString.group(1) // 'a'
  matchString.group(2) // 'b'
  matchString.group(3) // null
  matchString.group(4) // 'e'
}
```

#### Named Group Content

The `group()` method retrieves the content matched by a specific name of capturing group

```js
import { RE2JS } from 're2js'

// example with `(?P<name>expr)`
const p = RE2JS.compile('(?P<baz>f(?P<foo>b*a(?P<another>r+)){0,10})(?P<bag>bag)?(?P<nomatch>zzz)?')
const matchString = p.matcher('fbbarrrrrbag')
if (matchString.matches()) {
  matchString.group('baz') // 'fbbarrrrr'
  matchString.group('foo') // 'bbarrrrr'
  matchString.group('another') // 'rrrrr'
  matchString.group('bag') // 'bag'
  matchString.group('nomatch') // null
}

// example with `(?<name>expr)`
const m = RE2JS.compile('(?<baz>f(?<foo>b*a))')
const mString = m.matcher('fbba')
if (mString.matches()) {
  mString.group('baz') // 'fbba'
  mString.group('foo') // 'bba'
}
```

#### Extracting All Named Groups

If you have multiple named capturing groups, the `getNamedGroups()` method provides a convenient way to retrieve all of them at once as a JavaScript dictionary (object). If an optional group was not matched, its value will be `null`.

```js
import { RE2JS } from 're2js'

const p = RE2JS.compile('(?P<first>\\w+) (?:(?P<middle>\\w+) )?(?P<last>\\w+)')
const matchString = p.matcher('John Doe')

if (matchString.matches()) {
  matchString.getNamedGroups()
  // Returns:
  // {
  //   first: 'John',
  //   middle: null,
  //   last: 'Doe'
  // }
}
```

### Replacing Matches

RE2JS allows you to replace all occurrences or the first occurrence of a pattern match in a string with a specific replacement string

#### Replacing All Occurrences

The `replaceAll()` method replaces all occurrences of a pattern match in a string with the given replacement

```js
import { RE2JS } from 're2js'

RE2JS.compile('Frog').matcher("What the Frog's Eye Tells the Frog's Brain").replaceAll('Lizard') // "What the Lizard's Eye Tells the Lizard's Brain"
RE2JS.compile('(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)')
  .matcher('abcdefghijklmnopqrstuvwxyz123')
  .replaceAll('$10$20') // 'jb0wo0123'
```

Note that the replacement string can include references to capturing groups from the pattern

Parameters:

- `replacement (String | Function)`: The string that replaces the substrings found, or a function invoked to create the new substring. A replacement string is expanded exactly as by JavaScript's [`String.prototype.replace`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement):
  - `$&` refers to the entire matched substring
  - `$1, $2, ...` refer to the corresponding capture groups in the pattern. At most two digits are read, and the second only when the two digits form a valid group number (with one group, `$10` is group 1 followed by `0`); `$01` is the same as `$1`. An unmatched group inserts nothing; a number that is not a group, like `$0` or `$3` with two groups, is kept as is
  - `$$` inserts a literal `$`
  - `$<name>` references a named capture group, when the pattern has named groups (otherwise `$<` is kept as is). A name that is not a group inserts nothing
  - `` $` `` inserts the portion of the string that precedes the matched substring
  - `$'` inserts the portion of the string that follows the matched substring
- `javaMode (Boolean)`: If set to `true`, the replacement follows Java's rules for replacement. Defaults to `false`. If `javaMode = true`, changed rules for capture groups and special characters:
  - `$0` refers to the entire matched substring
  - `$1, $2, ...` refer to the corresponding capture groups in the pattern
  - `\$` inserts a literal `$`
  - `${name}` can be used to reference named capture groups
  - on invalid group - throw exception

Examples:

```js
import { RE2JS } from 're2js'

RE2JS.compile('(\\w+) (\\w+)').matcher('Hello World').replaceAll('$& - $&') // 'Hello World - Hello World'
RE2JS.compile('(\\w+) (\\w+)').matcher('Hello World').replaceAll('$0 - $0', true) // 'Hello World - Hello World'
```

#### Replacing the First Occurrence

The `replaceFirst()` method replaces the first occurrence of a pattern match in a string with the given replacement

```js
import { RE2JS } from 're2js'

RE2JS.compile('Frog').matcher("What the Frog's Eye Tells the Frog's Brain").replaceFirst('Lizard') // "What the Lizard's Eye Tells the Frog's Brain"
RE2JS.compile('(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)(.)')
  .matcher('abcdefghijklmnopqrstuvwxyz123')
  .replaceFirst('$10$20') // 'jb0nopqrstuvwxyz123'
```

Function support second argument `javaMode`, which work in the same way, as for `replaceAll` function.

#### Using a Replacer Function

For a more modern JavaScript developer experience, RE2JS supports passing a **replacer function** to `replaceAll()` and `replaceFirst()`, perfectly mirroring native `String.prototype.replace(regex, replacer)` behavior while taking advantage of the high-speed linear-time engine.

The replacer function is invoked for each match, and its return value is used as the replacement string. The function receives the following arguments:

1. `match`: The matched substring.
2. `p1, p2, ...`: The string found by a capture group (if any). Unmatched optional groups evaluate to `undefined`.
3. `offset`: The offset of the matched substring within the whole string.
4. `string`: The original input string (or byte array).
5. `groups`: A dictionary object of named capture groups (if any exist in the pattern).

```js
import { RE2JS } from 're2js'

// Example 1: Dynamic replacements
const re1 = RE2JS.compile('\\d+')
const m1 = re1.matcher('Numbers: 1, 2, 3')

m1.replaceAll((match) => String(Number(match) * 10))
// 'Numbers: 10, 20, 30'

// Example 2: Using named capture groups and function signature
const re2 = RE2JS.compile('(?P<first>\\w+) (?:(?P<middle>\\w+) )?(?P<last>\\w+)')
const m2 = re2.matcher('Hello World')

m2.replaceFirst((match, p1, p2, p3, offset, string, groups) => {
  // 'middle' didn't match, so p2 and groups.middle will be undefined
  return `${groups.last}, ${groups.first}`
})
// 'World, Hello'
```

### Safe Replacements

When using untrusted user input as a replacement string, you must escape special characters so they aren't accidentally evaluated as capture groups (e.g., `$1`).

Use the static method `quoteReplacement(string, javaMode)` to safely escape these characters. **Note:** You must pass the same `javaMode` boolean to `quoteReplacement` that you plan to use in `replaceAll()` / `replaceFirst()`, because the two modes use different escaping logic

```js
import { RE2JS } from 're2js'

const text = 'The cost is 100 bucks.'
const regex = RE2JS.compile('100 bucks')
const unsafeUserInput = '$500'

// Safe (Default Mode)
const safeDefault = RE2JS.quoteReplacement(unsafeUserInput) // "\$500"
regex.matcher(text).replaceAll(safeDefault) // "The cost is $500."

// Safe (Java Mode)
const safeJava = RE2JS.quoteReplacement(unsafeUserInput, true) // "$$500"
regex.matcher(text).replaceAll(safeJava, true) // "The cost is $500."
```

### Escaping Special Characters

The `quote()` method returns a literal pattern string for the specified string. This can be useful if you want to search for a literal string pattern that may contain special characters

```js
import { RE2JS } from 're2js'

const regexp = RE2JS.quote('ab+c') // 'ab\\+c'

RE2JS.matches(regexp, 'ab+c') // true
RE2JS.matches(regexp, 'abc') // false
```

### Program size

The program size represents a very approximate measure of a regexp's "cost". Larger numbers are more expensive than smaller numbers

```js
import { RE2JS } from 're2js'

console.log(RE2JS.compile('^').programSize()) // Outputs: 3
console.log(RE2JS.compile('a+b').programSize()) // Outputs: 5
console.log(RE2JS.compile('(a+b?)').programSize()) // Outputs: 8
```

### Translating Regular Expressions

The `translateRegExp()` method preprocesses a given regular expression string or native RegExp object to ensure compatibility with RE2JS. It applies necessary transformations, such as escaping special characters, adjusting Unicode sequences, converting named capture groups, and mapping native execution flags

```js
import { RE2JS } from 're2js'

const regexp = RE2JS.translateRegExp('(?<word>\\w+)') // '(?P<word>\\w+)'

RE2JS.matches(regexp, 'hello') // true
RE2JS.matches(regexp, '123') // true

const unicodeRegexp = RE2JS.translateRegExp('\\u{1F600}') // '\\x{1F600}'

RE2JS.matches(unicodeRegexp, '😀') // true
RE2JS.matches(unicodeRegexp, '😃') // false

// also support native Regex
const translatedNative = RE2JS.translateRegExp(/foo/ims) // '(?ims)foo'

const re = RE2JS.compile(translatedNative)
re.test('FOO') // true

RE2JS.translateRegExp(/bar/giy) // '(?i)bar'
```

## Performance and Architecture

The RE2JS engine provides strict linear-time $O(n)$ safety guarantees against Regular Expression Denial of Service (ReDoS) attacks, a critical vulnerability inherent to native JavaScript `RegExp` objects.

Originally, the C++ implementation of the RE2 engine included both NFA (Nondeterministic Finite Automaton) and DFA (Deterministic Finite Automaton) engines with highly optimized memory operations. Russ Cox later ported the core engine to Go, and Alan Donovan ported it to Java.

`re2js` achieves full architectural parity with the highly optimized Go `regexp` package and incorporates advanced performance features from the original C++ engine. To maximize execution speed on everyday queries without ever sacrificing memory safety, `re2js` intelligently and dynamically routes execution through a highly advanced multi-tiered architecture:

- **The Prefilter Engine:** Analyzes the Abstract Syntax Tree (AST) before execution to extract mandatory string literals (e.g., extracting `"error"` and `"critical"` from `/error.*critical/`). It uses blistering-fast native JavaScript `indexOf` to instantly reject mismatches, completely bypassing the regex state-machines.
- **Aggressive AST Simplification:** Trims impossible match branches and collapses redundant logic prior to compilation, mathematically pruning dead execution paths to dramatically reduce the size of the generated state machine.
- **Multi-Pattern Sets (`RE2Set`):** Combines hundreds or thousands of regular expressions into a single combined DFA, allowing you to search a string for all patterns simultaneously in strict $O(N)$ linear time.
- **OnePass DFA:** Provides high-speed capture group extraction for mathematically 1-unambiguous patterns, bypassing thread queues entirely.
- **Lazy Powerset DFA:** Executes high-speed boolean matches (e.g., `.test()`) by fusing active states dynamically on the fly, including patterns with anchors and word boundaries (`^`, `$`, `\b`), which it resolves from the surrounding characters as RE2's DFA does.
- **BitState Backtracker:** Avoids heavy object array allocations by using bitwise operations to extract captures on short-to-medium length strings.
- **Pike VM (NFA):** Acts as the robust, bounded-memory fallback engine for complex, ambiguous patterns that exceed fast-path limits.

Thanks to these dynamic fast-paths, `re2js` delivers performance comparable to native engines for simple queries, while remaining completely immune to catastrophic backtracking and stack overflow crashes.

If your code runs only on Node.js and mostly makes a few calls on very large inputs, consider [Node-RE2](https://github.com/uhop/node-re2/), the native RE2 C++ binding. Its per-call cost into C++ matters less there. For many calls on short strings, RE2JS is usually faster, as the comparison below shows, and it also runs in browsers and other JavaScript runtimes.

### RE2JS vs RE2-Node (C++ Bindings)

Because RE2JS's Lazy DFA, Prefilter, and OnePass engines operate efficiently within V8's Just-In-Time (JIT) compiler, they can outperform native C++ bindings (`re2-node`) for many operations by avoiding the cross-boundary serialization costs between JavaScript and C++.

Here is a [benchmark running 30,000 short strings](src/__tests__/re2.bench.js) through both engines using their respective `.test()` fast-paths. The ratio is the comparable figure; absolute times depend on the machine:

| Benchmark Scenario      | Pattern Example            | Result                      | RE2JS (Pure JS) | RE2-Node (C++) |
| :---------------------- | :------------------------- | :-------------------------- | --------------: | -------------: |
| **Simple Literal**      | `/damage/`                 | `re2js` is **14.9x** faster |         0.88 ms |       13.12 ms |
| **ReDoS Attempt**       | `/(a+)+!/`                 | `re2js` is **12.8x** faster |         1.31 ms |       16.74 ms |
| **Deep State Machine**  | `/([0-9]+(/[0-9]+)+)/`     | `re2js` is **6.0x** faster  |         2.73 ms |       16.45 ms |
| **Greedy Wildcard**     | `/enters.*battlefield/`    | `re2js` is **4.2x** faster  |         3.35 ms |       13.93 ms |
| **Lazy Wildcard**       | `/enters.*?battlefield/`   | `re2js` is **4.1x** faster  |         3.40 ms |       13.95 ms |
| **Word Boundaries**     | `/\b(Flying\|First...)\b/` | `re2js` is **2.6x** faster  |         6.35 ms |       16.37 ms |
| **Bounded Repetition**  | `/[A-Z][a-z]{5,15}/`       | `re2js` is **2.3x** faster  |         6.08 ms |       14.23 ms |
| **Massive Alternation** | `/White\|Blue\|Black.../`  | `re2js` is **2.2x** faster  |         6.86 ms |       15.24 ms |
| **Case Insensitive**    | `/(?i)swamp/`              | `re2js` is **1.5x** faster  |        11.03 ms |       16.53 ms |

Measured on an Apple M1 Pro with macOS 27.0.1, Node.js 24.14.0, `re2js` 2.9.0 and `re2` 1.27.0 (October 2026). Times are the mean of one pass over the 30,000 strings, from one run (each benchmark measures for 2 seconds after a 1 second warm-up); ratios vary by a few tenths between runs. The benchmark also checks that both libraries find the same matches.

**Takeaways:**

- **Many short calls favour RE2JS.** Every `re2-node` call crosses from JavaScript into C++, and that fixed cost dominates here: `re2-node` takes roughly the same 13-17 ms for every pattern, while RE2JS's time follows the work each pattern needs. With few calls on very large inputs, that per-call cost is amortized and the C++ engine is the better fit; this benchmark does not measure that case.
- **Boolean matching runs on the lazy DFA.** Literals, wildcards, nested groups, alternations, character classes, case-insensitive matching and assertions such as `^`, `$` and `\b` all run on RE2JS's lazy DFA, often after the prefilter has already ruled out most strings. Lookbehinds are the exception: they run on the NFA (see [Lookbehinds](#lookbehinds-linear-time-execution)).
- **Ratios vary by hardware.** On a GitHub Actions `ubuntu-24.04` (x86-64) runner, the same benchmark shows larger gaps in favour of RE2JS, because the per-call cost of the native binding is higher there.

To reproduce, install the binding temporarily and run the benchmarks (each result is also written as JSON to `bench-results/`):

```bash
YARN_ENABLE_SCRIPTS=true YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn add -D re2@1.27.0
RE2JS_BENCH_OUTPUT=bench-results yarn bench
git checkout package.json yarn.lock && yarn install
```

### RE2JS vs JavaScript's native RegExp

These examples illustrate the performance comparison between the RE2JS library and JavaScript's native `RegExp` for both a simple case and a ReDoS (Regular Expression Denial of Service) scenario.

```js
const regex = 'a+'
const string = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'

// Running 30,000 iterations
RE2JS.compile(regex).test(string) // Total time: ~9.87 ms
new RegExp(regex).test(string) // Total time: ~11.43 ms
```

For safe, simple patterns, the RE2JS DFA fast-path is heavily optimized and performs at parity with—or even slightly faster than—V8's native RegExp engine.

```js
const regex = '([a-z]+)+$'
const string = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'

// Running 30,000 iterations
RE2JS.compile(regex).test(string) // Total time: ~454.17 ms
// Running EXACTLY 1 iteration
new RegExp(regex).test(string) // Total time: ~105802.02 ms (over 105 seconds)
```

In the second example, a ReDoS scenario is depicted. The regular expression `([a-z]+)+$` is a potentially problematic one because it contains a nested quantifier. In standard NFA engines (like JavaScript's native `RegExp`), nested quantifiers can cause catastrophic backtracking. If a malicious user inputs a carefully crafted string, it results in exponentially high processing times, leading to a Denial of Service (DoS) attack.

RE2JS processed this poison-pill string **30,000 times in just ~454 milliseconds**, while the native RegExp completely locked up the main thread for **over 1 minute and 45 seconds trying to evaluate it just once**. This demonstrates why RE2JS is absolutely essential for securely handling untrusted regular expressions and protecting Node.js and browser applications against ReDoS attacks.

## Lookbehinds (Linear-Time Execution)

Historically, the RE2 specification has strictly forbidden lookaround assertions (like lookbehinds) because traditional regex engines use backtracking to evaluate them, leading to catastrophic exponential execution times and ReDoS vulnerabilities.

However, `re2js` implements a breakthrough algorithmic approach ([developed by researchers at EPFL](https://arxiv.org/pdf/2311.17620), [RE2 guide how to add it](https://systemf.epfl.ch/blog/re2-lookbehinds/)) that evaluates **captureless lookbehinds in strict linear $O(n)$ time** without backtracking. Because this diverges from the standard RE2 specification and carries a slight performance trade-off, it is disabled by default.

You can enable it by passing the `RE2JS.LOOKBEHINDS` flag during compilation:

```js
import { RE2JS } from 're2js'

// Positive Lookbehind: Match 'bar' only if preceded by 'foo'
const positive = RE2JS.compile('(?<=foo)bar', RE2JS.LOOKBEHINDS)
positive.test('foobar') // true
positive.test('bazbar') // false

// Negative Lookbehind: Match 'bar' only if NOT preceded by 'foo'
const negative = RE2JS.compile('(?<!foo)bar', RE2JS.LOOKBEHINDS)
negative.test('bazbar') // true
negative.test('foobar') // false
```

### Important Limitations and Warnings

1. **Performance Overhead:** If a regex contains a lookbehind, the engine is forced to safely bypass the ultra-fast Lazy DFA and OnePass engines. It evaluates the lookbehinds using parallel automata running on the NFA (Pike VM). While execution remains mathematically safe and linear $O(n)$, the NFA engine is generally slower than the DFA fast-paths. Use lookbehinds only when necessary.
2. **Prefix Acceleration is Disabled:** The lookbehind automata must observe every character of the input, so high-speed string prefix skipping (e.g., using `indexOf` to jump to a starting literal) is disabled when lookbehinds are present.
3. **Captureless Guarantee:** To prevent state-explosion vulnerabilities and maintain strict safety invariants, lookbehinds are strictly evaluated as _captureless_. If you attempt to include a capturing group inside a lookbehind (e.g., `(?<=(foo))bar`), the engine will proactively throw a `SyntaxError` at compile time. Use non-capturing groups `(?:...)` instead.
4. **Repeated Matching:** The lookbehind automata run from the beginning of the input, because a lookbehind may depend on text arbitrarily far behind the match (e.g. `(?<=x.*)b`). A `Matcher` therefore carries their state from one match to the next: `find()` loops, `matchAll()`, `split()` and `replaceAll()` scan the input once and stay linear in its length. Only a `find(start)` that jumps _backwards_ (to a position before the previous search started) re-evaluates the lookbehinds from the beginning of the input.

## Development

Some files are generated and should be edited in their generator files:

- `src/UnicodeTables.js` (Unicode categories, scripts, binary properties and case folding) is generated by `tools/scripts/genUnicodeTable.js` from the Unicode Character Database package (`@unicode/unicode-17.0.0`). To regenerate and format it:

  ```bash
  yarn gen:unicode
  ```

  The generator reads only that package, never the JavaScript runtime's own case mapping, so the output does not depend on the Node version. It checks that every table decodes back to its source data and writes the file only if all checks pass. To move to a new Unicode version, update the `@unicode/unicode-*` dev dependency and the `UNICODE` constant in the generator, regenerate, and update the version-specific expectations in the tests (such as the number of case-folding code points in `src/__tests__/Unicode.test.js`).

- `src/CharGroup.js` (the Perl classes `\d`, `\s`, `\w` and POSIX classes such as `[:alpha:]`) is generated by `tools/scripts/make_perl_groups.pl`, which asks Perl which ASCII characters each class matches. It needs Perl installed (the required version is specified inside `.tool-versions`). To regenerate and format it:

  ```bash
  yarn gen:char-groups
  ```

The conformance tests in `src/__tests__/Exec.test.js` run the RE2 and AT&T POSIX test data through every matching engine, on both UTF-16 and UTF-8 input. By default they check a sample of the 5.8 million-line exhaustive RE2 data; to check all of it (this takes several minutes):

```bash
RE2JS_EXHAUSTIVE=1 yarn vitest run --project=node src/__tests__/Exec.test.js
```

The fuzzers in `tools/fuzz` run random patterns and inputs, each against a different reference:

- `engines`: every matching engine must give the same answer, including on invalid UTF-8 and UTF-16, with lookbehinds, and under tiny DFA memory budgets
- `set`: `RE2Set` must report exactly the patterns that match on their own
- `native`: lookbehinds and `translateRegExp()` must agree with the JavaScript engine's `RegExp`
- `go`: results must agree with Go's `regexp` package; this needs the Go toolchain (without it, that fuzzer is skipped)

They run every night in CI with a new seed. A failure is shrunk to a minimal pattern and input and printed with the command that replays it:

```bash
yarn fuzz                                                    # 30 seconds per fuzzer, random seed
RE2JS_FUZZ_SECONDS=300 RE2JS_FUZZ_ONLY=engines yarn fuzz     # one fuzzer, longer
RE2JS_FUZZ_SEED=1234 RE2JS_FUZZ_ONLY=go RE2JS_FUZZ_CASE=42 yarn fuzz  # replay a reported case
```

Differences from Go that are intended are listed, with their reasons, in `tools/fuzz/go.js`.

[Playground website](https://re2js.leopard.in.ua/) maintained in `www` branch
