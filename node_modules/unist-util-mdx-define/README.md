# unist-util-mdx-define

[![github actions](https://github.com/remcohaszing/unist-util-mdx-define/actions/workflows/ci.yaml/badge.svg)](https://github.com/remcohaszing/unist-util-mdx-define/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/remcohaszing/unist-util-mdx-define/branch/main/graph/badge.svg)](https://codecov.io/gh/remcohaszing/unist-util-mdx-define)
[![npm version](https://img.shields.io/npm/v/unist-util-mdx-define)](https://www.npmjs.com/package/unist-util-mdx-define)
[![npm downloads](https://img.shields.io/npm/dm/unist-util-mdx-define)](https://www.npmjs.com/package/unist-util-mdx-define)

A [unist](https://github.com/syntax-tree/unist) utility to define [MDX](https://mdxjs.com) exports.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`define`](#define)
- [Compatibility](#compatibility)
- [Related projects](#related-projects)
- [License](#license)

## Introduction

This package provides a utility to define exports in an [MDX](https://mdxjs.com) AST, so you don’t
have to worry about the details. It supports [mdast](https://github.com/syntax-tree/mdast)
([remark](https://github.com/remarkjs)), [hast](https://github.com/syntax-tree/hast)
([rehype](https://github.com/rehypejs)), and [estree](https://github.com/estree/estree) /
[esast](https://github.com/syntax-tree/esast) ([recma](https://github.com/mdx-js/recma)). This
package supports various options to export the variables you define and to handle name conflicts.

## Installation

```sh
npm install unist-util-mdx-define
```

## Usage

Typically this is used with an MDX plugin.

```ts
import { compile } from '@mdx-js/mdx'
import type * as estree from 'estree'
import type * as hast from 'hast'
import type * as mdast from 'mdast'
import { type Plugin } from 'unified'
import { define } from 'unist-util-mdx-define'

const yourRemarkMdxPlugin: Plugin<[], mdast.Root> = () => (ast, file) => {
  define(ast, file, { remarkVariable: { type: 'Literal', value: 'Hello remark plugin!' } })
}

const yourRehypeMdxPlugin: Plugin<[], hast.Root> = () => (ast, file) => {
  define(ast, file, { rehypeVariable: { type: 'Literal', value: 'Hello rehype plugin!' } })
}

const yourRecmaMdxPlugin: Plugin<[], estree.Program> = () => (ast, file) => {
  define(ast, file, { recmaVariable: { type: 'Literal', value: 'Hello recma plugin!' } })
}

const { value } = await compile('{remarkVariable} {rehypeVariable} {recmaVariable}', {
  remarkPlugins: [yourRemarkMdxPlugin],
  rehypePlugins: [yourRehypeMdxPlugin],
  recmaPlugins: [yourRecmaMdxPlugin]
})

console.log(value)
```

MDX remark, rehype, and recma plugins are similar, but not the same. The type of plugin you should
create depends on your goal.

If your goal is to handle something specific to the markdown content, you should write a remark
plugin. A practical example is
[`remark-mdx-frontmatter`](https://github.com/remcohaszing/remark-mdx-frontmatter). This plugin
handles frontmatter data, which no longer exists after the mdast is compiled to hast.

If your goal is to transform or access content, you typically want a rehype plugin. A good example
is [`rehype-mdx-title`](https://github.com/remcohaszing/rehype-mdx-title), which accesses the title
of the document.

For most other purposes, use a recma plugin. For example,
[`recma-export-filepath`](https://github.com/remcohaszing/recma-export-filepath) exposes file
information. This doesn’t need access to the content.

`unist-util-mdx-define` can define variables in any of these AST types. For mdast and hast, it
prepends the variable declarations to the root. This way they’ll end up at the start of the module,
and their value can be used by **user defined** expressions. This does mean the **generated**
expressions are not able to use other variables. For ESTree, `unist-util-mdx-define` attempts to do
the same.

## API

### `define`

Define variables in an MDX related AST.

#### Parameters

- `ast` ([mdast.Root](https://github.com/syntax-tree/mdast#root) |
  [hast.Root](https://github.com/syntax-tree/hast#root) |
  [estree.Program](https://github.com/estree/estree)) — The AST in which to define an export.
- `file` ([VFile](https://github.com/vfile/vfile)) — The file to emit warnings to.
- `variables` (`Record<string, estree.Expression>`) — A mapping of variables to define. They keys
  are the names. The values are the ESTree expression to represent them.
- `options` ([Options](#options)) — Additional options to configure behaviour.

#### Options

- `export` — If and how to export the variable. (Default: `'module'`)
  - `'module'`: Export the value using an ESM const export declaration.
  - `'namespace'`: Attach the value as a property on `MDXContent`.
  - `false`: Define the variable locally, but don’t export it.
- `conflict` — What to do if there’s a name conflict. (Default: `'throw'`)
  - `'skip'`: Don’t insert the variable if there’s a name conflict.
  - `'throw'`: Throw if there’s a name conflict.
  - `'warn'`: Emit a vfile warning, but don’t throw.

## Compatibility

This project is compatible with Node.js 16 or greater.

## Related projects

- [`estree-util-value-to-estree`](https://github.com/remcohaszing/estree-util-value-to-estree) —
  Convert a JavaScript value to an estree expression

## License

[MIT](LICENSE.md) © [Remco Haszing](https://github.com/remcohaszing)
