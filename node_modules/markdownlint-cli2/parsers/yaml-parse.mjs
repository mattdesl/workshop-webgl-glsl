// @ts-check

import { load } from "js-yaml";

/* eslint-disable arrow-body-style */

/**
 * Parses a YAML string, returning the corresponding object.
 * @type {import("markdownlint").ConfigurationParser}
 */
const yamlParse = (text) => {
  // @ts-ignore
  return load(text);
};

export default yamlParse;
