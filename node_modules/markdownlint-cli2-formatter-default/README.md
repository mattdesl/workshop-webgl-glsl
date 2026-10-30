# markdownlint-cli2-formatter-default

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that produces
> the same output as [`markdownlint-cli`][markdownlint-cli]

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```bash
npm install markdownlint-cli2-formatter-default --save-dev
```

## Use

No action is necessary; this is the default output formatter for
`markdownlint-cli2`.

To reference it directly in `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-default" ]
  ]
}
```

## Example

```text
dir/about.md:1:3 error MD021/no-multiple-space-closed-atx Multiple spaces inside hashes on closed atx style heading [Context: "#  About  #"]
dir/about.md:1:10 error MD021/no-multiple-space-closed-atx Multiple spaces inside hashes on closed atx style heading [Context: "#  About  #"]
dir/about.md:4 error MD032/blanks-around-lists Lists should be surrounded by blank lines [Context: "1. List"]
dir/about.md:5:1 error MD029/ol-prefix Ordered list item prefix [Expected: 2; Actual: 3; Style: 1/2/3]
dir/subdir/info.md:1 error MD022/blanks-around-headings Headings should be surrounded by blank lines [Expected: 1; Actual: 0; Below] [Context: "## Information"]
dir/subdir/info.md:1 error MD041/first-line-heading/first-line-h1 First line in a file should be a top-level heading [Context: "## Information"]
dir/subdir/info.md:2:7 error MD038/no-space-in-code Spaces inside code span elements [Context: "` code1`"]
dir/subdir/info.md:2:26 error MD038/no-space-in-code Spaces inside code span elements [Context: "`code2 `"]
dir/subdir/info.md:4 error MD012/no-multiple-blanks Multiple consecutive blank lines [Expected: 1; Actual: 2]
viewme.md:3:10 error MD009/no-trailing-spaces Trailing spaces [Expected: 0 or 2; Actual: 1]
viewme.md:5 warning MD012/no-multiple-blanks Multiple consecutive blank lines [Expected: 1; Actual: 2]
viewme.md:6 error MD025/single-title/single-h1 Multiple top-level headings in the same document [Context: "Description"]
viewme.md:12:4 error MD019/no-multiple-space-atx Multiple spaces after hash on atx style heading [Context: "##  Summary"]
viewme.md:14:14 warning MD047/single-trailing-newline Files should end with a single newline character
```

[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-default.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli]: https://github.com/igorshubovych/markdownlint-cli
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-default.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-default
