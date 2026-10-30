// @ts-check

/** @typedef {import("markdownlint-cli2").Options} Options */

/**
 * Merges two options objects by combining config and replacing properties.
 * @param {Options | null | undefined} first First options object.
 * @param {Options | null | undefined} second Second options object.
 * @returns {Options} Merged options object.
 */
const mergeOptions = (first, second) => {
  const merged = {
    ...first,
    ...second
  };
  const firstConfig = first && first.config;
  const secondConfig = second && second.config;
  if (firstConfig || secondConfig) {
    merged.config = {
      ...firstConfig,
      ...secondConfig
    };
  }
  return merged;
};

export default mergeOptions;
