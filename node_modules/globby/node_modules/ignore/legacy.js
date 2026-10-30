"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
// A simple implementation of make-array
function makeArray(subject) {
  return Array.isArray(subject) ? subject : [subject];
}
var UNDEFINED = undefined;
var EMPTY = '';
var SPACE = ' ';
var ESCAPE = '\\';

// The characters that carry a meaning of their own inside a regular
//   expression, so a literal one has to be escaped before it is emitted.
var REGEX_LITERAL_SPECIAL = /[.*+?()[\]{}^$|\\/]/;
var BOM = "\uFEFF";
var REGEX_INVALID_TRAILING_BACKSLASH = /(?:[^\\]|^)\\$/;
// A run of two or more asterisks is a globstar (#175)
var REGEX_ANCHORED_GLOBSTAR = /^\/\*{2,}$/;
var REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION = /^\\!/;
var REGEX_REPLACE_LEADING_EXCAPED_HASH = /^\\#/;
var REGEX_SPLITALL_CRLF = /\r?\n/g;

// Invalid:
// - /foo,
// - ./foo,
// - ../foo,
// - .
// - ..
// Valid:
// - .foo
var DOUBLE_SLASH = '//';
var SLASH_CODE = 47;
var DOT_CODE = 46;
var SLASH = '/';

// Do not use ternary expression here, since "istanbul ignore next" is buggy
var TMP_KEY_IGNORE = 'node-ignore';
/* istanbul ignore else */
if (typeof Symbol !== 'undefined') {
  TMP_KEY_IGNORE = Symbol["for"]('node-ignore');
}
var KEY_IGNORE = TMP_KEY_IGNORE;
var define = function define(object, key, value) {
  Object.defineProperty(object, key, {
    value: value
  });
  return value;
};
var RETURN_FALSE = function RETURN_FALSE() {
  return false;
};

// > The range notation, e.g. [a-zA-Z],
// > can be used to match one of the characters in a range.
//
// gitignore(5) defers to fnmatch(3) for this, and git implements it in
//   `wildmatch.c`.  A bracket expression has a sub-grammar of its own, which
//   is neither the surrounding pattern grammar nor the JavaScript one:
//
//   - a `]` right after `[` or `[!` is a literal member, not the terminator
//   - `[:alpha:]` names one of twelve POSIX classes
//   - `\` escapes the next member, `]` included
//   - `*`, `?` and `.` are plain literal members
//   - an unterminated expression makes the whole pattern match nothing
//
// which means the expression can not be located -- let alone translated -- by
//   a regular expression.  It is scanned out of the pattern before the
//   replacers below run, and put back once they are done, so that neither the
//   metacharacter escaper nor the `?` / `*` replacers ever see its body.

// git classifies with its own ASCII-only ctype macros (`wildmatch.c`), never
//   with the C library ones, so these must not be mapped onto `\d` / `\w` /
//   `\s`, which are wider.  `/` is left out of every expansion, because a
//   bracket expression never matches a path separator.
var POSIX_CLASSES = {
  alnum: '0-9A-Za-z',
  alpha: 'A-Za-z',
  blank: ' \\t',
  cntrl: '\\x00-\\x1f\\x7f',
  digit: '0-9',
  graph: '!-.0-~',
  lower: 'a-z',
  print: ' -.0-~',
  punct: '!-.:-@\\[-`{-~',
  // git's `sane-ctype.h` classifies \v and \f as control, not space,
  //   unlike C's `isspace`
  space: ' \\t\\n\\r',
  upper: 'A-Z',
  xdigit: '0-9A-Fa-f'
};
var CLASS_MEMBERS_TO_ESCAPE = '\\]^-[';
var escapeMember = function escapeMember(_char) {
  return CLASS_MEMBERS_TO_ESCAPE.indexOf(_char) < 0 ? _char : ESCAPE + _char;
};

// > if (matched == negated || ((flags & WM_PATHNAME) && text_ch == '/'))
// >   return WM_ABORT_TO_STARSTAR;                     (git, `wildmatch.c`)
// A bracket expression never matches a path separator, whatever its members
//   say, so a negated class gets `/` as one more excluded character, while a
//   plain one -- where a literal member or a range could still let `/` in --
//   is guarded with a lookahead, `/` being impossible to subtract from a
//   JavaScript character class.
var NON_SLASH = '(?!\\/)';
var classSource = function classSource(negated, body) {
  if (negated) {
    return "[^\\/".concat(body, "]");
  }
  var source = "[".concat(body, "]");
  return new RegExp(source).test('/') ? NON_SLASH + source : source;
};

// Scan the bracket expression that starts at `pattern[start] === '['`,
//   mirroring the member loop of git's `wildmatch.c`.
// @returns {{end: number, source: string} | null} `null` if the expression is
//   never terminated, which makes the whole pattern match nothing.
var scanBracket = function scanBracket(pattern, start) {
  var length = pattern.length;
  var index = start + 1;
  var negated = EMPTY;
  var lead = pattern[index];
  if (lead === '!' || lead === '^') {
    negated = '^';
    index++;
  }
  var body = EMPTY;

  // The member a `-` could start a range from, or EMPTY when the previous
  //   member can not open one (start of the body, or a range / POSIX class
  //   that has just closed)
  var prev = EMPTY;

  // git scans the members with a do-while, so the first one is consumed
  //   unconditionally.  That is the whole reason a leading `]` is a member
  //   and not the terminator.
  for (;;) {
    var _char2 = pattern[index];
    if (_char2 === UNDEFINED) {
      return null;
    }
    if (_char2 === ESCAPE) {
      var escaped = pattern[index + 1];
      if (escaped === UNDEFINED) {
        return null;
      }
      body += escapeMember(escaped);
      prev = escaped;
      index++;
    } else if (_char2 === '-' && prev && index + 1 < length && pattern[index + 1] !== ']') {
      index++;
      var to = pattern[index];
      if (to === ESCAPE) {
        // A pattern can not end on a lone backslash -- `checkPattern` has
        //   already thrown it away -- so there is an upper bound to read.
        to = pattern[index += 1];
      }
      // An out-of-order range matches nothing in git but is a syntax error in
      //   JavaScript, so it is dropped.  Its lower bound stays: git tests it
      //   as a plain member before it ever looks at the `-`, so `[c-a]` does
      //   match `c`.
      if (prev <= to) {
        body += "-".concat(escapeMember(to));
      }
      prev = EMPTY;
    } else if (_char2 === '[' && pattern[index + 1] === ':') {
      var nameStart = index + 2;
      var end = nameStart;
      while (end < length && pattern[end] !== ']') {
        end++;
      }
      if (end === length) {
        return null;
      }
      if (end > nameStart && pattern[end - 1] === ':') {
        var name = pattern.slice(nameStart, end - 1);

        // An unknown class name makes the whole pattern match nothing
        if (!Object.prototype.hasOwnProperty.call(POSIX_CLASSES, name)) {
          return null;
        }
        body += POSIX_CLASSES[name];
        prev = EMPTY;
        index = end;
      } else {
        // No `:]` to close it, so the `[` is a plain member and scanning
        //   resumes right after it.
        body += escapeMember('[');
        prev = '[';
        index = nameStart - 2;
      }
    } else {
      body += escapeMember(_char2);
      prev = _char2;
    }
    index++;
    if (pattern[index] === ']') {
      return {
        end: index,
        source: classSource(negated, body)
      };
    }
  }
};

// An empty JavaScript class can never match, which is how a pattern that git
//   gives up on (`WM_ABORT_ALL`) is expressed here.
var NEVER_MATCH = '[]';

// A NUL can appear in neither a `.gitignore` line nor a path, which makes it
//   the one safe placeholder character.  A literal one in the pattern is
//   held aside all the same, so a collision is impossible by construction.
var PLACEHOLDER = "\0";
var REGEX_RESTORE_PLACEHOLDER = new RegExp("".concat(PLACEHOLDER, "(\\d+)").concat(PLACEHOLDER), 'g');

// The one wildcard the chain does not expand for itself is a trailing `*`. How
//   it expands depends on the mode (`regex` vs `checkRegex`), so `_make` is
//   left to do it, and until then the pending wildcard travels as this marker.
//   That is what keeps it apart from a user-escaped literal `\*`: the unescape
//   steps collapse the escaped one to the exact `\*` a wildcard would leave
//   behind, so by the time `_make` runs the two are otherwise the same string
//   and a literal star gets wrongly rewritten into a wildcard. The marker is a
//   private-use character, and `extractBrackets` keeps one that came out of the
//   pattern apart from it, so the only marker `_make` ever turns back into a
//   real wildcard is the one this chain put there itself.
var TRAILING_WILDCARD = "\uE000";

// A trailing "/**" is deferred the same way, because `checkRegex` has to tell
//   it apart from a trailing "/*" (see `checkSourceOf`). For `.ignores()` it
//   still never matches the folder itself (#21).
var TRAILING_DOUBLESTAR = "\uE001";

// The three characters above mean something to the chain that builds the
//   source rather than to the path, so one that came out of the pattern is
//   held aside like a bracket expression instead of going straight out. Being
//   held is what makes it safe: the restore runs after the step that anchors
//   the source, so the character comes back in the middle of the source and
//   not at its end, which is the one place `_make` and `checkSourceOf` look
//   for a marker. Without it a pattern's own character lands where a pending
//   marker sits, and `_make` turns it into a real trailing wildcard.
//
// It is held as a one-member class rather than bare, in both of the branches
//   a reserved character can reach, so that the property can be
//   read off this function alone -- a reserved character never goes out on
//   its own -- rather than depending on where in the chain the restore
//   happens to run. In the expression built here `[x]` matches exactly what
//   `x` matches, none of the three being special to a regular expression or
//   inside a class, so no test can tell the two apart: the class is insurance,
//   and the paragraph above is the reason it is not needed.
var isReserved = function isReserved(_char3) {
  return _char3 === PLACEHOLDER || _char3 === TRAILING_WILDCARD || _char3 === TRAILING_DOUBLESTAR;
};

// Replace every bracket expression with a placeholder the replacers below
//   leave alone, and translate it separately.
var extractBrackets = function extractBrackets(pattern) {
  var sources = [];
  var hold = function hold(source) {
    return "".concat(PLACEHOLDER).concat(sources.push(source) - 1).concat(PLACEHOLDER);
  };
  var length = pattern.length;
  var out = EMPTY;
  var index = 0;
  while (index < length) {
    var _char4 = pattern[index];
    if (_char4 === ESCAPE) {
      // > Put a backslash ("\") in front of ... a character to make it literal.
      //                                            (gitignore(5) -> fnmatch(3))
      // A backslash quotes the next character, whatever it is, so `\d` is a
      //   literal `d`, not the regex digit class, and `\?` is a literal `?`,
      //   not a wildcard. Held aside as its literal here, the escape never
      //   reaches the replacers below, which would otherwise let `\d`, `\b`,
      //   `\1`, `\/` keep their regular-expression meaning, and would turn a
      //   `\?` into `[^\/]`.
      //
      // Three escapes are still left for the chain: `\*` (a literal star,
      //   told apart from a wildcard by `TRAILING_WILDCARD` and the wildcard
      //   replacers), `\[` (a literal bracket, the one `[` the bracket
      //   replacer still expects), and `\ ` (a quoted space, which one pass
      //   below rewrites in bulk -- holding each one aside instead costs more
      //   on a pattern built out of them). A lone trailing backslash can reach
      //   here after line-ending cleanup.
      //
      // A quoted backslash is not among them. The chain doubles every
      //   backslash, then takes the doubling back out again, and a quoted one
      //   standing next to a character the chain also escapes left the two
      //   counts sharing a run, so one of the escapes was lost. Held here as
      //   the literal it means, it never joins that run.
      var escaped = pattern[index + 1];
      if (escaped === UNDEFINED || escaped === SLASH && index + 2 === length) {
        // Git removes a final directory slash before matching. An escape
        //   without a character after that removal makes the pattern invalid.
        out += hold(NEVER_MATCH);
      } else if (escaped === '*' || escaped === '[' || escaped === SPACE) {
        out += pattern.slice(index, index + 2);
      } else {
        out += hold(REGEX_LITERAL_SPECIAL.test(escaped) ? ESCAPE + escaped : isReserved(escaped) ? "[".concat(escaped, "]") : escaped);
      }
      index += 2;
    } else if (isReserved(_char4)) {
      out += hold("[".concat(_char4, "]"));
      index++;
    } else if (_char4 === '[') {
      var scanned = scanBracket(pattern, index);
      if (scanned === null) {
        // git gives up on the whole pattern (`WM_ABORT_ALL`), so whatever
        //   follows can not make it match either.
        out += hold(NEVER_MATCH);
        index = length;
      } else {
        out += hold(scanned.source);
        index = scanned.end + 1;
      }
    } else {
      out += _char4;
      index++;
    }
  }
  return {
    source: out,
    sources: sources
  };
};

// A step of the chain below is normally a `[matcher, replacer]` pair handed
//   to `String.replace`. `DIRECT` marks the ones that are plain string work
//   instead, and take `(source, pattern)`.
//
// Anchoring the two ends is exactly that -- a test of one character and a
//   concatenation -- and putting it through the regular expression engine
//   cost a third of this chain for nothing: 167ns where 10ns does the same
//   job. The two are still steps in the same list, in the same places,
//   because their position in the order is part of what they mean.
var DIRECT = null;

// A separator at the beginning or in the middle of a pattern, as opposed to
//   one at the very end.
var REGEX_INNER_SLASH = /\/(?!$)/;

// > If the pattern ends with a slash,
// > it is removed for the purpose of the following description,
// > but it would only find a match with a directory.
// > In other words, foo/ will match a directory foo and paths underneath it,
// > but will not match a regular file or a symbolic link foo
// >  (this is consistent with the way how pathspec works in general in Git).
// '`foo/`' will not match regular file '`foo`' or symbolic link '`foo`'
// -> ignore-rules will not deal with it, because it costs extra `fs.stat` call
//      you could use option `mark: true` with `glob`

// '`foo/`' should not continue with the '`..`'
// The chain that turns one gitignore pattern into a regular expression
//   source, in order. A step is either
//
//   [matcher, replacer]            handed to `String.replace`
//   [matcher, replacer, required]  the same, but skipped outright unless
//                                    `required` appears in the string, which
//                                    the matcher cannot match without
//   [DIRECT, transform]            plain string work, taking (source, pattern)
//
// The `required` character is only ever a shortcut: finding it does not mean
//   the matcher will match, and not finding it means it cannot. It is there
//   because scanning for one character costs a fraction of running a matcher
//   that then finds nothing -- for the wildcard step, whose `[^\\]+`
//   backtracks its way through the whole string before giving up, 11ns
//   against 400ns.
var REPLACERS = [
// Replace (\ ) with ' '
// Only a space: an escaped tab or other whitespace is already a literal by
//   the time it reaches here, and a bare tab must be left as one, not turned
//   into a space.
// (\ ) -> ' '
// (\\ ) -> '\\ '
// (\\\ ) -> '\\ '
[
// A run of backslashes is taken whole, from its first one, so no match
//   ever starts again inside it -- `(\\+?) ` did, which made a long run
//   quadratic.
/(\\+)( ?)/g, function (_, run, space) {
  return space ? run.slice(0, run.length - run.length % 2) + SPACE : run;
}, ESCAPE + SPACE],
// git's wildmatch() reads a run of two or more asterisks as one globstar
//   whenever the run fills a path segment: it starts the pattern or follows
//   a `/`, and it ends the pattern or comes before a `/`. A run of two is
//   already `**`; a longer one is folded into `**` here, so the steps
//   below only ever have to know `**`.
// `***/foo` -> `**/foo`, `a/***/b` -> `a/**/b`, `a/***` -> `a/**`
// git also takes a run beside a literal prefix (`a***/b`) or beside an
//   escaped slash (`***\/b`) as a globstar, and this does not; the README
//   lists both, under "A run of asterisks".
[/(^|\/)\*{3,}(?=\/|$)/g, function (_, start) {
  return "".concat(start, "**");
}, '*'],
// Escape metacharacters
// which is written down by users but means special for regular expressions.

// > There are 12 characters with special meanings:
// > - the backslash \,
// > - the caret ^,
// > - the dollar sign $,
// > - the period or dot .,
// > - the vertical bar or pipe symbol |,
// > - the question mark ?,
// > - the asterisk or star *,
// > - the plus sign +,
// > - the opening parenthesis (,
// > - the closing parenthesis ),
// > - and the opening square bracket [,
// > - the opening curly brace {,
// > These special characters are often called "metacharacters".
[/[\\$.|*+(){^]/g, function (match) {
  return "\\".concat(match);
}], [
// > a question mark (?) matches a single character
/(?!\\)\?/g, function () {
  return '[^/]';
}, '?'],
// leading slash
[
// > A leading slash matches the beginning of the pathname.
// > For example, "/*.c" matches "cat-file.c" but not "mozilla-sha1/sha1.c".
// A leading slash matches the beginning of the pathname
/^\//, function () {
  return '^';
}, SLASH],
// replace special metacharacter slash after the leading slash
[/\//g, function () {
  return '\\/';
}, SLASH], [
// > A leading "**" followed by a slash means match in all directories.
// > For example, "**/foo" matches file or directory "foo" anywhere,
// > the same as pattern "foo".
// > "**/foo/bar" matches file or directory "bar" anywhere that is directly
// >   under directory "foo".
// Notice that the '*'s have been replaced as '\\*'
/^\^*(?:\\\*\\\*\\\/)+/,
// '**/foo' <-> 'foo'
function () {
  return '^(?:.*\\/)?';
}, '*'],
// starting
[
// there will be no leading '/'
//   (which has been replaced by section "leading slash")
// If starts with '**', adding a '^' to the regular expression also works
DIRECT, function (source, pattern) {
  // Nothing to anchor to, or already anchored
  if (!source || source[0] === '^') {
    return source;
  }

  // If has a slash `/` at the beginning or middle
  var anchor = !REGEX_INNER_SLASH.test(pattern)
  // > Prior to 2.22.1
  // > If the pattern does not contain a slash /,
  // >   Git treats it as a shell glob pattern
  // Actually, if there is only a trailing slash,
  //   git also treats it as a shell glob pattern

  // After 2.22.1 (compatible but clearer)
  // > If there is a separator at the beginning or middle (or both)
  // > of the pattern, then the pattern is relative to the directory
  // > level of the particular .gitignore file itself.
  // > Otherwise the pattern may also match at any level below
  // > the .gitignore level.
  ? '(?:^|\\/)'

  // > Otherwise, Git treats the pattern as a shell glob suitable for
  // >   consumption by fnmatch(3)
  : '^';
  return anchor + source;
}],
// two globstars
[
// Use lookahead assertions so that we could match more than one `'/**'`
/\\\/\\\*\\\*(?=\\\/|$)/g,
// Zero, one or several directories
// should not use '*', or it will be replaced by the next replacer

// Check if it is not the last `'/**'`
function (_, index, str) {
  return index + 6 < str.length

  // case: /**/ at the end of the pattern, i.e. a trailing `'/**/'`
  // > A trailing `"/**/"` (a trailing `"/**"` restricted to directories)
  // >   matches everything inside, but it should not match the current
  // >   folder itself, so it requires at least one directory segment.
  // 'a/**/' matches 'a/b/', 'a/x/y/' but not 'a/'
  ? str.slice(index + 6) === '\\/' ? '(?:\\/[^\\/]+)+'

  // case: /**/
  // > A slash followed by two consecutive asterisks then a slash matches
  // >   zero or more directories.
  // > For example, "a/**/b" matches "a/b", "a/x/b", "a/x/y/b" and so on.
  // '/**/'
  : '(?:\\/[^\\/]+)*'

  // case: /**
  // > A trailing `"/**"` matches everything inside.

  // #21: everything inside but it should not include the current folder,
  //   resolved by `_make`
  : "\\/".concat(TRAILING_DOUBLESTAR);
}, '*'],
// normal intermediate wildcards
[
// Never replace escaped '*'
// ignore rule '\*' will match the path '*'

// 'abc.*/' -> go
// 'abc.*'  -> skip this rule,
//    coz trailing single wildcard will be handed by [trailing wildcard]
/(^|[^\\]+)(\\\*)+(?=.+)/g,
// '*.js' matches '.js'
// '*.js' doesn't match 'abc'
function (_, p1, p2) {
  // 1.
  // > An asterisk "*" matches anything except a slash.
  // 2.
  // > Other consecutive asterisks are considered regular asterisks
  // > and will match according to the previous rules.
  var unescaped = p2.replace(/\\\*/g, '[^\\/]*');
  return p1 + unescaped;
}, '*'],
// trailing wildcard, held apart from a literal star
[
// The step above leaves a trailing `*` alone, so a single `\*` is all that
//   can be left at the end here, and what stands in front of it says which
//   kind it is. A wildcard arrives as the escaper wrote it, `\*` with
//   nothing before it; a literal arrives as the user's own escape, which
//   the escaper doubled, and then the star's own -- `\\` and then `\*`.
//   There is no third case: every backslash still reaching the chain is
//   one `\*`, `\[` or `\ ` carries itself, and each is followed by its
//   own character, so a longer run can never form. This runs while the
//   two are still distinct, before the unescape steps below collapse the
//   literal onto the very `\*` a wildcard leaves behind.
/(^|[^\\])((?:\\\\)*)\\\*$/, function (match, p1, p2) {
  return p2 === EMPTY
  // A real wildcard: carry it to `_make` as the marker, so the unescape
  //   steps and the trailing-wildcard rewrite can never mistake it for a
  //   literal `\*` (nor the reverse).
  ? p1 + TRAILING_WILDCARD
  // A literal star: leave it exactly as it stands for the unescape steps.
  : match;
}, '*'], [
// unescape, revert step 3 except for back slash
// For example, if a user escape a '\\*',
// after step 3, the result will be '\\\\\\*'
/\\\\\\(?=[$.|*+(){^])/g, function () {
  return ESCAPE;
}, ESCAPE + ESCAPE], [
// '\\\\' -> '\\'
/\\\\/g, function () {
  return ESCAPE;
}, ESCAPE + ESCAPE], [
// Every real bracket expression -- POSIX classes included -- has already
//   been held aside by `extractBrackets`, so the only `[` left in the
//   pattern is an escaped, literal one.

// A backslash could only stand at the end of the range if it quoted the
//   `]`, and `\]` is held aside long before this.
/\\\[([^\]/]*?)($|\])/g,
// '\\[bar]' -> '\\\\[bar]'
function (match, range, close) {
  return "\\[".concat(range).concat(close);
}, '['],
// ending
[
// 'js' will not match 'js.'
// 'ab' will not match 'abc'
DIRECT,
// WTF!
// https://git-scm.com/docs/gitignore
// changes in [2.22.1](https://git-scm.com/docs/gitignore/2.22.1)
// which re-fixes #24, #38

// > If there is a separator at the end of the pattern then the pattern
// > will only match directories, otherwise the pattern can match both
// > files and directories.

// 'js*' will not match 'a.js'
// 'js/' will not match 'a.js'
// 'js' will match 'a.js' and 'a.js/'
function (source) {
  var last = source[source.length - 1];

  // The pattern is empty, or ends in a pending marker `_make` owns --
  //   the trailing wildcard, or a trailing "/**". A trailing `*` that is
  //   not the marker is a literal star, which anchors like any other
  //   final character.
  if (!last || last === TRAILING_WILDCARD || last === TRAILING_DOUBLESTAR) {
    return source;
  }
  return last === SLASH
  // foo/ will not match 'foo'
  ? "".concat(source, "$") // foo matches 'foo' and 'foo/'
  : "".concat(source, "(?=$|\\/$)");
}]];
var REGEX_REPLACE_TRAILING_WILDCARD = /(^|\\\/)?\uE000$/;
var MODE_IGNORE = 'regex';
var MODE_CHECK_IGNORE = 'checkRegex';
var UNDERSCORE = '_';
var replaceTrailingWildcard = function replaceTrailingWildcard(_, p1) {
  var prefix = p1
  // '\^':
  // '/*' does not match EMPTY
  // '/*' does not match everything

  // '\\\/':
  // 'abc/*' does not match 'abc/'
  ? "".concat(p1, "[^/]+") // 'a*' matches 'a'
  // 'a*' matches 'aa'
  : '[^/]*';
  return "".concat(prefix, "(?=$|\\/$)");
};
var REGEX_REPLACE_TRAILING_DOUBLESTAR = /\uE001$/;

// 'abc/**' matches everything under 'abc', but not 'abc/' itself (#21)
var replaceTrailingDoublestar = function replaceTrailingDoublestar() {
  return '.+(?=$|\\/$)';
};
var WILDCARD = '[^\\/]*';

// The fixed piece between the wildcard at `at` and the next wildcard of the
//   run: the tokens that separate them, joined as they appear in the source.
//   A run never holds two wildcards in a row, so there is always at least one
//   token.
var separatorAfter = function separatorAfter(run, at) {
  var separator = EMPTY;
  for (var index = at + 1; index < run.length && !run[index].wildcard; index++) {
    separator += run[index].single;
  }
  return separator;
};

// Where a run of non-slash wildcards is split by fixed pieces --
//   `[^/]*ab[^/]*cd...` -- the engine has many equivalent ways to lay the
//   input across the wildcards, and on input that does not match it works
//   through all of them, so the time grows with the number of wildcards
//   rather than the length of the path. Every wildcard but the last in such a
//   run can be pinned to stop where the piece after it begins, which leaves
//   one way to lay out the input and no rewinding, without changing which
//   paths match: the fixed pieces still bound the count, and the last
//   wildcard still absorbs the rest.
//
// A wildcard is pinned to the whole piece, never to the piece's first
//   character. The pin leaves no way back, so a wildcard that stopped at that
//   first character would hand over wherever the character happens to turn
//   up, including the places the rest of the piece cannot follow -- which is
//   how `f*o/*/*` came to miss `foo/b/c`, the first `o` of `foo` not being
//   the one the `o/` after it needs. Every token of a piece matches exactly
//   one character, so the first place the whole piece fits is the leftmost
//   place it can sit, and whatever is left over goes to the wildcards that
//   follow.
//
// The source is read one token at a time -- a wildcard, a single-character
//   piece (a literal, an escape, a class), or a parenthesised group or anchor
//   that ends the run -- so only a genuine wildcard is touched.
var pinWildcards = function pinWildcards(source) {
  if (source.indexOf(WILDCARD) < 0) {
    return source;
  }
  var tokens = [];
  var length = source.length;
  var index = 0;
  while (index < length) {
    var _char5 = source[index];
    if (source.startsWith(WILDCARD, index)) {
      tokens.push({
        wildcard: true
      });
      index += WILDCARD.length;
    } else if (_char5 === '[') {
      var end = index + 1;
      if (source[end] === '^') {
        end++;
      }
      if (source[end] === ']') {
        end++;
      }
      while (end < length && source[end] !== ']') {
        end += source[end] === ESCAPE ? 2 : 1;
      }
      end++;
      tokens.push({
        single: source.slice(index, end)
      });
      index = end;
    } else if (_char5 === ESCAPE) {
      tokens.push({
        single: source.slice(index, index + 2)
      });
      index += 2;
    } else if (_char5 === '(') {
      var depth = 0;
      var _end = index;
      do {
        if (source[_end] === ESCAPE) {
          _end++;
        } else if (source[_end] === '(') {
          depth++;
        } else if (source[_end] === ')') {
          depth--;
        }
        _end++;
      } while (_end < length && depth > 0);
      if ('*+?'.indexOf(source[_end]) >= 0) {
        _end++;
      }
      tokens.push({
        boundary: source.slice(index, _end)
      });
      index = _end;
    } else if (_char5 === '^' || _char5 === '$') {
      tokens.push({
        boundary: _char5
      });
      index++;
    } else {
      tokens.push({
        single: _char5
      });
      index++;
    }
  }
  var out = EMPTY;
  var run = [];
  var flush = function flush() {
    var lastWildcard;
    run.forEach(function (token, at) {
      if (token.wildcard) {
        lastWildcard = at;
      }
    });
    run.forEach(function (token, at) {
      if (!token.wildcard) {
        out += token.single;
        return;
      }

      // Every wildcard but the last is pinned to the whole piece that
      //   follows it, for the reason set out above this function. The last
      //   one stays as it is and takes up the rest.
      out += at === lastWildcard ? WILDCARD : "(?:(?!".concat(separatorAfter(run, at), ")[^\\/])*");
    });
    run = [];
  };
  tokens.forEach(function (token) {
    if (token.boundary === undefined) {
      run.push(token);
      return;
    }
    flush();
    out += token.boundary;
  });
  flush();
  return out;
};

// @param {pattern}
var makeRegexPrefix = function makeRegexPrefix(pattern) {
  // `/**` matches every path, as `**` does. The translation below only finds
  //   a globstar beside a slash it keeps, and the leading one is turned into
  //   an anchor, so `/**` would come out as `/*` and match one level only.
  //   Here rather than in `createRule`, so that `checkSourceOf`, which
  //   compiles `/**/` again without its trailing slash, gets it too.
  if (REGEX_ANCHORED_GLOBSTAR.test(pattern)) {
    pattern = '**';
  }
  var _extractBrackets = extractBrackets(pattern),
    source = _extractBrackets.source,
    sources = _extractBrackets.sources;
  var replaced = REPLACERS.reduce(
  // A pass whose matcher finds nothing hands back the very string it was
  //   given, so asking first costs a search and saves a rewrite. Ten of the
  //   fifteen passes never fire for a typical .gitignore line, and between
  //   them they were 45% of this chain.
  function (prev, _ref) {
    var _ref2 = _slicedToArray(_ref, 3),
      matcher = _ref2[0],
      replacer = _ref2[1],
      required = _ref2[2];
    if (matcher === DIRECT) {
      return replacer(prev, pattern);
    }
    if (required !== UNDEFINED && prev.indexOf(required) < 0) {
      return prev;
    }

    // A pass whose matcher finds nothing hands back the very string it was
    //   given, so asking first costs a search and saves a rewrite.
    return matcher.test(prev) ? prev.replace(matcher, replacer.bind(pattern)) : prev;
  }, source);

  // Most patterns hold no bracket expression at all, and then there is
  //   nothing to put back.
  return sources.length ? replaced.replace(REGEX_RESTORE_PLACEHOLDER, function (match, index) {
    return sources[index];
  }) : replaced;
};

// `checkRegex` tests a path with a trailing slash, 'abc/', the way
//   `git check-ignore` matches that literal string once the directory itself
//   is known not to be excluded (see `checkIgnore`): a trailing '/' of the
//   pattern is dropped, a basename pattern sees an empty basename, and only a
//   pattern whose last segment is a pending wildcard can match what is left
//   after the final slash -- 'abc/*' and 'abc/**' match 'abc/', and 'abc/**'
//   also matches 'abc/d/' (#77, #169).
var checkSourceOf = function checkSourceOf(body, prefix) {
  if (body[body.length - 1] === SLASH) {
    prefix = makeRegexPrefix(body.slice(0, -1));
  }
  var head = prefix.slice(0, -1);
  var last = prefix[prefix.length - 1];
  return last === TRAILING_WILDCARD ? "".concat(head, "$") : last === TRAILING_DOUBLESTAR ? "".concat(head, ".*$") : NEVER_MATCH;
};

// A trailing slash does not stop a pattern being basename-only: it restricts
//   the match to a directory, it does not let the pattern reach across one.
//   Everything else a pattern can hold -- a wildcard, a character class, an
//   escape -- stays inside a single path segment too, so a pattern with no
//   separator in it can only ever describe the last one.
var matchesBasename = function matchesBasename(body) {
  var index = body.indexOf(SLASH);
  return index < 0 || index === body.length - 1;
};

// The last segment of a path, keeping a trailing slash, because a pattern that
//   ends in one matches only a directory.
// 'a/b/c.js' -> 'c.js';  'a/b/' -> 'b/';  'c.js' -> 'c.js' (no copy made)
var basenameOf = function basenameOf(path) {
  var end = path.length - 1;
  var index = path.lastIndexOf(SLASH, path[end] === SLASH ? end - 1 : end);
  return index < 0 ? path : path.slice(index + 1);
};

// The parent directory of a path, with its trailing separator, or EMPTY when
//   the path has none.
// 'a/b/c' -> 'a/b/';  'a/b/' -> 'a/';  'a' -> EMPTY;  'a/' -> EMPTY
//
// A path holding an empty segment has to be taken apart, because its
//   ancestors are not prefixes of it: the parent of 'a//b' is 'a/', not
//   'a//', and the parent of '/a/' is nothing at all. Both shapes reach here
//   -- 'a//b' is accepted outright, and `checkIgnore` does not put the path
//   it is given through the relative-path check.
//
// Every other path is a prefix of itself, and cutting one costs a fraction of
//   splitting it into an array and joining that back at every level: 73ns
//   against 207ns.
var parentOf = function parentOf(path) {
  if (path.charCodeAt(0) === SLASH_CODE || path.indexOf(DOUBLE_SLASH) >= 0) {
    var slices = path.split(SLASH).filter(Boolean);
    slices.pop();
    return slices.length ? slices.join(SLASH) + SLASH : EMPTY;
  }
  var end = path.length - 1;

  // Look back from before a trailing separator, since that one belongs to the
  //   path itself.
  //
  // A negative place to start would be a trap here: `lastIndexOf` clamps one
  //   to 0 and searches there rather than reporting no match, so '/' would
  //   come back as its own parent and the walk would never end. It cannot
  //   happen -- that is the only path short enough to produce one, and the
  //   test above has already sent it the other way.
  var cut = path.lastIndexOf(SLASH, path.charCodeAt(end) === SLASH_CODE ? end - 1 : end);
  return cut < 0 ? EMPTY : path.slice(0, cut + 1);
};
var isString = function isString(subject) {
  return typeof subject === 'string';
};

// Blank lines and comments are told by `createRule`, once the pattern is
//   normalized.
var checkPattern = function checkPattern(pattern) {
  return pattern && isString(pattern) && !REGEX_INVALID_TRAILING_BACKSLASH.test(pattern);
};
var splitPattern = function splitPattern(pattern) {
  return pattern.split(REGEX_SPLITALL_CRLF).filter(Boolean);
};
var IgnoreRule = /*#__PURE__*/function () {
  function IgnoreRule(pattern, mark, body, ignoreCase, negative, prefix) {
    _classCallCheck(this, IgnoreRule);
    this.pattern = pattern;
    this.mark = mark;
    this.negative = negative;
    define(this, 'body', body);
    define(this, 'ignoreCase', ignoreCase);
    define(this, 'regexPrefix', prefix);
  }

  // Worked out on first use and kept behind an own property, the way `regex`
  //   caches itself in `_regex`. Deciding it in the constructor instead would
  //   add a fourth `defineProperty` to every rule ever built, which cost 4% of
  //   every compile -- including the compiles of rules that are never matched
  //   against anything.
  _createClass(IgnoreRule, [{
    key: "_basenameOnly",
    get: function get() {
      return define(this, '_basenameOnly', matchesBasename(this.body));
    }
  }, {
    key: "regex",
    get: function get() {
      var key = UNDERSCORE + MODE_IGNORE;
      if (this[key]) {
        return this[key];
      }
      return this._make(MODE_IGNORE, key);
    }
  }, {
    key: "checkRegex",
    get: function get() {
      var key = UNDERSCORE + MODE_CHECK_IGNORE;
      if (this[key]) {
        return this[key];
      }
      return this._make(MODE_CHECK_IGNORE, key);
    }
  }, {
    key: "_make",
    value: function _make(mode, key) {
      var str = pinWildcards(mode === MODE_IGNORE ? this.regexPrefix.replace(REGEX_REPLACE_TRAILING_WILDCARD, replaceTrailingWildcard).replace(REGEX_REPLACE_TRAILING_DOUBLESTAR, replaceTrailingDoublestar) : checkSourceOf(this.body, this.regexPrefix));
      var regex = this.ignoreCase ? new RegExp(str, 'i') : new RegExp(str);
      return define(this, key, regex);
    }
  }]);
  return IgnoreRule;
}();
var isLineEnd = function isLineEnd(_char6) {
  return _char6 === '\r' || _char6 === '\n';
};

// Drop a line terminator, which can remain when patterns are passed as an
//   array, and then the trailing spaces. Git trims spaces only, and a space
//   escaped by an odd run of backslashes stays, unescaped, as the last one.
// Scanned from the end: a regular expression can only try each start in
//   turn, which is quadratic over a long run of spaces or backslashes.
// 'a  ' -> 'a';  'a\ ' -> 'a ';  'a\\ ' -> 'a\\';  'a\t' -> 'a\t'
var trimEnd = function trimEnd(body) {
  var end = body.length;
  while (end && isLineEnd(body[end - 1])) {
    end--;
  }
  var lineEnd = end;
  while (end && body[end - 1] === SPACE) {
    end--;
  }
  if (end === lineEnd) {
    return body.slice(0, end);
  }
  var backslashes = 0;
  while (backslashes < end && body[end - backslashes - 1] === ESCAPE) {
    backslashes++;
  }
  return backslashes % 2 ? body.slice(0, end - 1) + SPACE : body.slice(0, end);
};
var createRule = function createRule(_ref3, ignoreCase) {
  var pattern = _ref3.pattern,
    mark = _ref3.mark;
  // Git drops a BOM before it reads the first line, so before anything else.
  var body = pattern[0] === BOM ? pattern.slice(1) : pattern;

  // > A line starting with # serves as a comment.
  if (body[0] === '#') {
    return;
  }
  var negative = false;

  // > An optional prefix "!" which negates the pattern;
  if (body[0] === '!') {
    negative = true;
    body = body.slice(1);
  }

  // Normalize the body before checking which slashes anchor the pattern.
  //   Otherwise `bar/ ` is mistaken for a pattern containing an inner slash.
  //   Only a body ending in a space or a line terminator has anything to trim.
  var last = body[body.length - 1];
  if (last === SPACE || last === '\r' || last === '\n') {
    body = trimEnd(body);
  }

  // > A blank line matches no files, so it can serve as a separator for
  // >   readability.
  // Nor does a lone "!", or anything else left empty here: an empty pattern
  //   would compile to a regex matching every path.
  if (!body) {
    return;
  }
  body = body
  // > Put a backslash ("\") in front of the first "!" for patterns that
  // >   begin with a literal "!", for example, `"\!important!.txt"`.
  .replace(REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION, '!')
  // > Put a backslash ("\") in front of the first hash for patterns that
  // >   begin with a hash.
  .replace(REGEX_REPLACE_LEADING_EXCAPED_HASH, '#');
  var regexPrefix = makeRegexPrefix(body);
  return new IgnoreRule(pattern, mark, body, ignoreCase, negative, regexPrefix);
};
var RuleManager = /*#__PURE__*/function () {
  function RuleManager(ignoreCase) {
    _classCallCheck(this, RuleManager);
    this._ignoreCase = ignoreCase;
    this._rules = [];

    // How many of the rules git would tag `EXC_FLAG_NODIR`.
    //
    // The scan uses it to decide, once for the whole set, whether handing
    //   those rules the basename is worth what it costs the others. The
    //   shortcut saves a full-path scan on every rule it applies to and costs
    //   a check on every rule it does not, so a set where almost nothing is
    //   basename-only comes out behind -- a 955 pattern set with 44 of them
    //   measured 19% slower with the shortcut always on.
    //
    // Deciding this by measurement rather than by meaning is safe: a
    //   basename-only pattern gives the very same answer against the whole
    //   path, it just takes longer to say so. The choice can only change how
    //   fast the scan runs, never what it returns.
    this._basenameCount = 0;
  }
  _createClass(RuleManager, [{
    key: "_add",
    value: function _add(pattern) {
      // #32
      if (pattern && pattern[KEY_IGNORE]) {
        this._rules = this._rules.concat(pattern._rules._rules);
        this._basenameCount += pattern._rules._basenameCount;
        this._added = true;
        return;
      }
      if (isString(pattern)) {
        pattern = {
          pattern: pattern
        };
      }
      var rule = checkPattern(pattern.pattern) && createRule(pattern, this._ignoreCase);
      if (rule) {
        this._added = true;
        this._rules.push(rule);

        // Deliberately not `rule._basenameOnly`: reading that would materialise
        //   the rule's own copy, and the whole point of leaving it lazy is that
        //   a rule which is compiled and never matched never pays for it.
        if (matchesBasename(rule.body)) {
          this._basenameCount++;
        }
      }
    }

    // @param {Array<string> | string | Ignore} pattern
  }, {
    key: "add",
    value: function add(pattern) {
      this._added = false;
      makeArray(isString(pattern) ? splitPattern(pattern) : pattern).forEach(this._add, this);
      if (this._added) {
        this._literalRules = UNDEFINED;
      }
      return this._added;
    }

    // Match the literal 'abc/' for `checkIgnore`, last rule wins. Only a rule
    //   ending in a wildcard can match it (see `checkSourceOf`), so the rest
    //   are left out once, rather than tested or compiled for every path.
  }, {
    key: "testLiteral",
    value: function testLiteral(path) {
      var rules = this._literalRules || (this._literalRules = this._rules.filter(function (_ref4) {
        var body = _ref4.body;
        return body[body.length - (body[body.length - 1] === SLASH ? 2 : 1)] === '*';
      }));
      var ignored = false;
      var unignored = false;
      var matchedRule;
      for (var index = rules.length - 1; index >= 0; index--) {
        var rule = rules[index];
        if (rule.checkRegex.test(path)) {
          ignored = !rule.negative;
          unignored = rule.negative;
          matchedRule = rule.negative ? UNDEFINED : rule;
          break;
        }
      }
      var ret = {
        ignored: ignored,
        unignored: unignored
      };
      if (matchedRule) {
        ret.rule = matchedRule;
      }
      return ret;
    }

    // Test one single path without recursively checking parent directories
    //
    // - mode `string` either `MODE_IGNORE` or `MODE_CHECK_IGNORE`

    // @returns {TestResult}
  }, {
    key: "test",
    value: function test(path, mode) {
      // Most of a .gitignore is patterns with no slash in them, and running
      //   those against the whole path makes the regular expression engine walk
      //   every directory name on the way to the only segment that could match.
      //   Handing them the basename instead is what git does, and it is where
      //   the time in a directory walk goes: the rule scan was two thirds of it.
      var rules = this._rules;
      var length = rules.length;
      var shortcut = this._basenameCount * 2 >= length;
      var basename = shortcut ? basenameOf(path) : path;

      // The last rule to match decides, as in git, and it is the rule
      //   `git check-ignore -v` reports, so the scan runs from the end and stops
      //   at the first match.
      // A plain loop rather than `forEach`, so that `path`, `basename` and
      //   `shortcut` are locals. As a callback they became closure variables,
      //   and reaching for one of those once per rule cost 10% of a scan over a
      //   large rule set -- more than the shortcut they were there to serve.
      for (var index = length - 1; index >= 0; index--) {
        var rule = rules[index];
        if (rule[mode].test(shortcut && rule._basenameOnly ? basename : path)) {
          var negative = rule.negative;
          var ret = {
            ignored: !negative,
            unignored: negative
          };
          if (!negative) {
            ret.rule = rule;
          }
          return ret;
        }
      }
      return {
        ignored: false,
        unignored: false
      };
    }
  }]);
  return RuleManager;
}();
var throwError = function throwError(message, Ctor) {
  throw new Ctor(message);
};
var checkPath = function checkPath(path, originalPath, doThrow) {
  if (!isString(path)) {
    return doThrow("path must be a string, but got `".concat(originalPath, "`"), TypeError);
  }

  // We don't know if we should ignore EMPTY, so throw
  if (!path) {
    return doThrow("path must not be empty", TypeError);
  }

  // Check if it is a relative path
  if (checkPath.isNotRelative(path)) {
    var r = '`path.relative()`d';
    return doThrow("path should be a ".concat(r, " string, but got \"").concat(originalPath, "\""), RangeError);
  }
  return true;
};

// > pathname should be a `path.relative()`d one
//
// The same thing `REGEX_TEST_INVALID_PATH` says, spelled out: a path is not
//   relative if it begins with a separator, or with `./` or `../`, or is
//   nothing but `.` or `..`. Every match is decided by the first three
//   characters, and this runs on every path handed to the library -- where it
//   was 55% of a cached lookup, more than the cache lookup itself.
var isNotRelative = function isNotRelative(path) {
  var first = path.charCodeAt(0);
  if (first === SLASH_CODE) {
    return true;
  }
  if (first !== DOT_CODE) {
    return false;
  }

  // '.'
  if (path.length === 1) {
    return true;
  }
  var second = path.charCodeAt(1);

  // './'
  if (second === SLASH_CODE) {
    return true;
  }
  if (second !== DOT_CODE) {
    return false;
  }

  // '..' or '../'
  return path.length === 2 || path.charCodeAt(2) === SLASH_CODE;
};
checkPath.isNotRelative = isNotRelative;

// On windows, the following function will be replaced
/* istanbul ignore next */
checkPath.convert = function (p) {
  return p;
};
var Ignore = /*#__PURE__*/function () {
  function Ignore() {
    var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref5$ignorecase = _ref5.ignorecase,
      ignorecase = _ref5$ignorecase === void 0 ? true : _ref5$ignorecase,
      _ref5$ignoreCase = _ref5.ignoreCase,
      ignoreCase = _ref5$ignoreCase === void 0 ? ignorecase : _ref5$ignoreCase,
      _ref5$allowRelativePa = _ref5.allowRelativePaths,
      allowRelativePaths = _ref5$allowRelativePa === void 0 ? false : _ref5$allowRelativePa;
    _classCallCheck(this, Ignore);
    define(this, KEY_IGNORE, true);
    this._rules = new RuleManager(ignoreCase);
    this._strictPathCheck = !allowRelativePaths;
    this._initCache();
  }
  _createClass(Ignore, [{
    key: "_initCache",
    value: function _initCache() {
      // A cache for the result of `.ignores()`
      this._ignoreCache = Object.create(null);

      // A cache for the result of `.test()`
      this._testCache = Object.create(null);
    }
  }, {
    key: "add",
    value: function add(pattern) {
      if (this._rules.add(pattern)) {
        // Some rules have just added to the ignore,
        //   making the behavior changed,
        //   so we need to re-initialize the result cache
        this._initCache();
      }
      return this;
    }

    // legacy
  }, {
    key: "addPattern",
    value: function addPattern(pattern) {
      return this.add(pattern);
    }

    // @returns {TestResult}
  }, {
    key: "_test",
    value: function _test(originalPath, cache) {
      var path = originalPath
      // Supports nullable path
      && checkPath.convert(originalPath);
      checkPath(path, originalPath, this._strictPathCheck ? throwError : RETURN_FALSE);
      return this._t(path, cache);
    }
  }, {
    key: "checkIgnore",
    value: function checkIgnore(path) {
      // If the path doest not end with a slash, `.ignores()` is much equivalent
      //   to `git check-ignore`
      if (path.charCodeAt(path.length - 1) !== SLASH_CODE) {
        return this.test(path);
      }

      // Like `git check-ignore`: a directory excluded by itself or by an
      //   ancestor settles it, and only then is the literal 'abc/' matched
      //   against the rules (see `checkSourceOf`).
      var dir = this._t(path, this._testCache);
      if (dir.ignored) {
        return dir;
      }
      var literal = this._rules.testLiteral(path);
      return literal.ignored || literal.unignored ? literal : dir;
    }
  }, {
    key: "_t",
    value: function _t(
    // The path to be tested
    path,
    // The cache for the result of a certain checking
    cache) {
      if (path in cache) {
        return cache[path];
      }
      var parentPath = parentOf(path);

      // If the path contains a parent directory, check the parent first
      var parent = parentPath ? this._t(parentPath, cache) : UNDEFINED;
      return cache[path] = parent && parent.ignored
      // > It is not possible to re-include a file if a parent directory of
      // >   that file is excluded.
      ? parent : this._rules.test(path, MODE_IGNORE);
    }
  }, {
    key: "ignores",
    value: function ignores(path) {
      return this._test(path, this._ignoreCache).ignored;
    }
  }, {
    key: "createFilter",
    value: function createFilter() {
      var _this = this;
      return function (path) {
        return !_this.ignores(path);
      };
    }
  }, {
    key: "filter",
    value: function filter(paths) {
      return makeArray(paths).filter(this.createFilter());
    }

    // @returns {TestResult}
  }, {
    key: "test",
    value: function test(path) {
      return this._test(path, this._testCache);
    }
  }]);
  return Ignore;
}();
var factory = function factory(options) {
  return new Ignore(options);
};
var isPathValid = function isPathValid(path) {
  return checkPath(path && checkPath.convert(path), path, RETURN_FALSE);
};

/* istanbul ignore next */
var setupWindows = function setupWindows() {
  /* eslint no-control-regex: "off" */
  var makePosix = function makePosix(str) {
    return /^\\\\\?\\/.test(str) || /[\0-\x1F"<>\|]+/.test(str) ? str : str.replace(/\\/g, '/');
  };
  checkPath.convert = makePosix;

  // 'C:\\foo'     <- 'C:\\foo' has been converted to 'C:/'
  // 'd:\\foo'
  var REGEX_TEST_WINDOWS_PATH_ABSOLUTE = /^[a-z]:\//i;
  checkPath.isNotRelative = function (path) {
    return REGEX_TEST_WINDOWS_PATH_ABSOLUTE.test(path) || isNotRelative(path);
  };
};

// Windows
// --------------------------------------------------------------
/* istanbul ignore next */
if (
// Detect `process` so that it can run in browsers.
typeof process !== 'undefined' && process.platform === 'win32') {
  setupWindows();
}

// COMMONJS_EXPORTS ////////////////////////////////////////////////////////////

module.exports = factory;

// Although it is an anti-pattern,
//   it is still widely misused by a lot of libraries in github
// Ref: https://github.com/search?q=ignore.default%28%29&type=code
factory["default"] = factory;
module.exports.isPathValid = isPathValid;

// For testing purposes
define(module.exports, Symbol["for"]('setupWindows'), setupWindows);
