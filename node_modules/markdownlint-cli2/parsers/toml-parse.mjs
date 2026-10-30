// @ts-check

import { parse } from "smol-toml";

/**
 * Parses a TOML string, returning the corresponding object.
 * @type {import("markdownlint").ConfigurationParser}
 */
const tomlParse = (text) => parse(text);

export default tomlParse;
