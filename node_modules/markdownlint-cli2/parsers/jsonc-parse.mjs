// @ts-check

import { parse, printParseErrorCode } from "jsonc-parser";

/**
 * Parses a JSONC string, returning the corresponding object.
 * @type {import("markdownlint").ConfigurationParser}
 */
const jsoncParse = (text) => {
  /** @type {import("jsonc-parser").ParseError[]} */
  const errors = [];
  const result = parse(text, errors, { "allowTrailingComma": true });
  if (errors.length > 0) {
    const aggregate = errors.map(
      (error) => `${printParseErrorCode(error.error)} (offset ${error.offset}, length ${error.length})`
    ).join(", ");
    throw new Error(`Unable to parse JSONC content, ${aggregate}`);
  }
  return result;
};

export default jsoncParse;
