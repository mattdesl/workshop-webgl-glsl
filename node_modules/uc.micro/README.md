# uc.micro

[![CI](https://github.com/markdown-it/uc.micro/actions/workflows/ci.yml/badge.svg)](https://github.com/markdown-it/uc.micro/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/uc.micro.svg?style=flat)](https://www.npmjs.org/package/uc.micro)

> Micro subset of unicode data files for [markdown-it](https://github.com/markdown-it) projects.

Regular expressions are generated at build time from
[`regenerate-unicode-properties`](https://github.com/mathiasbynens/regenerate-unicode-properties),
maintained by [Mathias Bynens](https://github.com/mathiasbynens).

That's just a proxy to reduce dependencies/install size.

**This package content is ONLY for [markdown-it](https://github.com/markdown-it)
projects needs. Don't ask to extend it!**


## Update Unicode data

Update the pinned `regenerate-unicode-properties` dependency and run the tests:

```sh
npm install --save-dev --save-exact regenerate-unicode-properties@latest
npm test
```

To check the Unicode version provided by the dependency:

```sh
node -p "require('regenerate-unicode-properties/unicode-version.js')"
```
