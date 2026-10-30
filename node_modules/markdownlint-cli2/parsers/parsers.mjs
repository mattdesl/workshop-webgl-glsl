// @ts-check

import jsoncParse from "./jsonc-parse.mjs";
import tomlParse from "./toml-parse.mjs";
import yamlParse from "./yaml-parse.mjs";

/**
 * Array of parser objects ordered by priority.
 * @type {import("markdownlint").ConfigurationParser[]}
 */
const parsers = [
  jsoncParse,
  tomlParse,
  yamlParse
];

export default parsers;
