// @ts-check

"use strict";

/** @typedef {import("../markdownlint-cli2.mjs").OutputFormatterOptions} OutputFormatterOptions */

// Formats markdownlint-cli2 results in the style of `markdownlint-cli`
const outputFormatter = (/** @type {OutputFormatterOptions} */ options) => {
  const { results, logError } = options;
  for (const errorInfo of results) {
    const { fileName, lineNumber, ruleNames, ruleDescription, errorDetail, errorContext, errorRange, severity } = errorInfo;
    const rule = ruleNames.join("/");
    const line = `:${lineNumber}`;
    const rangeStart = (errorRange && errorRange[0]) || 0;
    const column = rangeStart ? `:${rangeStart}` : "";
    const description = ruleDescription;
    const detail = (errorDetail ? ` [${errorDetail}]` : "");
    const context = (errorContext ? ` [Context: "${errorContext}"]` : "");
    const sev = (severity ? ` ${severity}` : "");
    logError(`${fileName}${line}${column}${sev} ${rule} ${description}${detail}${context}`);
  }
  return Promise.resolve();
};

module.exports = outputFormatter;
