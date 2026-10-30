// @ts-check

/** @typedef {import("markdownlint-cli2").Options} Options */

/**
 * Clones (the necessary parts of) an options (or configuration) object.
 * @param {Options | null | undefined} obj Options object.
 * @returns {Options} Cloned object.
 */
const cloneOptions = (obj) => {
  if (!obj) {
    // @ts-ignore
    return obj;
  }
  const clone = {
    ...obj
  };
  if (clone.config) {
    clone.config = { ...clone.config };
  }
  if (clone.overrides) {
    clone.overrides = clone.overrides.map(
      (override) => override.config
        ? {
            ...override,
            "config": { ...override.config }
          }
        : override
    );
  }
  return clone;
};

export default cloneOptions;
