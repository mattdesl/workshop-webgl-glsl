// @ts-check

const packageName = "markdownlint-cli2";
const packageVersion = "0.24.0";

const libraryName = "markdownlint";

const cli2SchemaKeys = new Set([
  "config",
  "customRules",
  "fix",
  "frontMatter",
  "gitignore",
  "globs",
  "ignores",
  "markdownItPlugins",
  "modulePaths",
  "noBanner",
  "noInlineConfig",
  "noProgress",
  "outputFormatters",
  "overrides",
  "showFound"
]);

export {
  cli2SchemaKeys,
  libraryName,
  packageName,
  packageVersion
};
