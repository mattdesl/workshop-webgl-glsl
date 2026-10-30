import type { Literal, Root } from 'mdast'
import type { Plugin } from 'unified'

import { valueToEstree } from 'estree-util-value-to-estree'
import { parse as parseToml } from 'smol-toml'
import { define } from 'unist-util-mdx-define'
import { parse as parseYaml } from 'yaml'

type FrontmatterParsers = Record<string, (value: string) => unknown>

namespace remarkMdxFrontmatter {
  export interface Options extends define.Options {
    /**
     * The default value to export if no frontmatter data is found.
     *
     * @default undefined
     */
    default?: unknown

    /**
     * If specified, the YAML data is exported using this name. Otherwise, each
     * object key will be used as an export name.
     */
    name?: string

    /**
     * A mapping of node types to parsers.
     *
     * Each key represents a frontmatter node type. The value is a function that accepts the
     * frontmatter data as a string, and returns the parsed data.
     *
     * By default `yaml` nodes will be parsed using [`yaml`](https://github.com/eemeli/yaml) and
     * `toml` nodes using [`toml`](https://github.com/BinaryMuse/toml-node).
     */
    parsers?: FrontmatterParsers
  }
}

/**
 * A remark plugin to expose frontmatter data as named exports.
 *
 * @param options
 *   Optional options to configure the output.
 * @returns
 *   A unified transformer.
 */
const remarkMdxFrontmatter: Plugin<[remarkMdxFrontmatter.Options?], Root> = ({
  name = 'frontmatter',
  parsers,
  ...options
} = {}) => {
  const allParsers: FrontmatterParsers = {
    yaml: parseYaml,
    toml: parseToml,
    ...parsers
  }

  return (ast, file) => {
    let data = options.default
    const node = ast.children.find((child) => Object.hasOwn(allParsers, child.type))

    if (node) {
      const parser = allParsers[node.type]

      const { value } = node as Literal
      data = parser(value)
    }

    define(ast, file, { [name]: valueToEstree(data, { preserveReferences: true }) }, options)
  }
}

export default remarkMdxFrontmatter
