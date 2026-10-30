// @ts-check

// Imports
import fsNode from "node:fs";
import os from "node:os";
import pathDefault from "node:path";
const pathPosix = pathDefault.posix;
import { pathToFileURL } from "node:url";
import { globby } from "globby";
import jsonpointer from "jsonpointer";
import micromatch from "micromatch";
import { applyFixes, getVersion, resolveModule } from "markdownlint";
import { lint, extendConfig, readConfig } from "markdownlint/promise";
import { expandTildePath } from "markdownlint/helpers";
import appendToArray from "./append-to-array.mjs";
import { cli2SchemaKeys, libraryName, packageName, packageVersion } from "./constants.mjs";
import cloneOptions from "./clone-options.mjs";
import mergeOptions from "./merge-options.mjs";
import allParsers from "./parsers/parsers.mjs";
import jsoncParse from "./parsers/jsonc-parse.mjs";
import tomlParse from "./parsers/toml-parse.mjs";
import yamlParse from "./parsers/yaml-parse.mjs";

/* eslint-disable jsdoc/reject-any-type */

// Variables
const libraryVersion = getVersion();
const bannerMessage = `${packageName} v${packageVersion} (${libraryName} v${libraryVersion})`;
const dotOnlySubstitute = "*.{md,markdown}";
const utf8 = "utf8";

// No-op function
const noop = () => null;

// Negates a glob
const negateGlob = (/** @type {string} */ glob) => `!${glob}`;

// Reads and parses a JSONC file
const readJsonc = (/** @type {string} */ file, /** @type {FsLike} */ fs) => fs.promises.readFile(file, utf8).then(jsoncParse);

// Reads and parses a TOML file
const readToml = (/** @type {string} */ file, /** @type {FsLike} */ fs) => fs.promises.readFile(file, utf8).then(tomlParse);

// Reads and parses a YAML file
const readYaml = (/** @type {string} */ file, /** @type {FsLike} */ fs) => fs.promises.readFile(file, utf8).then(yamlParse);

// Pluralizes a noun (if necessary)
const pluralize = (/** @type {number} */ count, /** @type {string} */ noun) => `${count} ${noun}${count === 1 ? "" : (noun.endsWith("x") ? "es" : "s")}`;

// Throws a meaningful exception for an unusable configuration file
const throwForConfigurationFile = (/** @type {string} */ file, /** @type {Error | any} */ error) => {
  throw new Error(
    `Unable to use configuration file '${file}'; ${error?.message}`,
    { "cause": error }
  );
};

// Return a POSIX path (even on Windows)
const posixPath = (/** @type {string} */ p) => p.split(pathDefault.sep).join(pathPosix.sep);

// Resolves module paths relative to the specified directory
const resolveModulePaths = (/** @type {string} */ dir, /** @type {string[]} */ modulePaths) => (
  modulePaths.map((path) => pathDefault.resolve(dir, expandTildePath(path, os)))
);

// Import a module ID with a custom directory in the path
const importModule = async (/** @type {string[] | string} */ dirOrDirs, /** @type {any} */ id, /** @type {boolean} */ noImport) => {
  if (typeof id !== "string") {
    return id;
  }
  if (noImport) {
    return null;
  }
  const dirs = Array.isArray(dirOrDirs) ? dirOrDirs : [ dirOrDirs ];
  const expandId = expandTildePath(id, os);
  const errors = [];
  let moduleName = null;
  try {
    try {
      moduleName = pathToFileURL(resolveModule(expandId, dirs));
    } catch (error) {
      errors.push(error);
      moduleName =
        (!pathDefault.isAbsolute(expandId) && URL.canParse(expandId))
          ? new URL(expandId)
          : pathToFileURL(pathDefault.resolve(dirs[0], expandId));
    }
    // @ts-ignore
    // eslint-disable-next-line no-inline-comments
    const module = await import(/* webpackIgnore: true */ moduleName);
    return module.default;
  } catch (error) {
    errors.push(error);
    // eslint-disable-next-line preserve-caught-error
    throw new AggregateError(
      errors,
      `Unable to import module '${id}'.`
    );
  }
};

// Import an array of modules by ID
const importModuleIds = (/** @type {string[]} */ dirs, /** @type {any[]} */ ids, /** @type {boolean} */ noImport) => (
  Promise.all(
    ids.map(
      (id) => importModule(dirs, id, noImport)
    )
  ).then((results) => results.filter(Boolean))
);

// Import an array of modules by ID (preserving parameters)
const importModuleIdsAndParams = (/** @type {string[]} */ dirs, /** @type {any[][]} */ idsAndParams, /** @type {boolean} */ noImport) => (
  Promise.all(
    idsAndParams.map(
      (idAndParams) => importModule(dirs, idAndParams[0], noImport).
        then((module) => module && [ module, ...idAndParams.slice(1) ])
    )
  ).then((results) => results.filter(Boolean))
);

// Update a config object (in place) if it has an "extends" property
const extendConfigObject = async (/** @type {ExecutionContext} */ context, /** @type {Configuration | null | undefined} */ config, /** @type {string} */ configPath) => {
  if (config?.extends) {
    const { fs, parsers } = context;
    const extended = await extendConfig(
      config,
      configPath,
      parsers,
      fs
    );
    for (const [ key, value ] of Object.entries(extended)) {
      config[key] = value;
    }
  }
  return config;
};

const extendOptionsObject = (/** @type {ExecutionContext} */ context, /** @type {Options | null | undefined} */ options, /** @type {string} */ configPath) => {
  const configs = [ options?.config ];
  appendToArray(configs, (options?.overrides || []).map((override) => override.config));
  return Promise.all(configs.
    map((config) => extendConfigObject(
      context,
      config,
      configPath
    ))
  );
};

// Read an options or config file in any format and return the object
const readOptionsOrConfig = async (/** @type {ExecutionContext} */ context, /** @type {string} */ configPath, /** @type {string | undefined} */ configPointer) => {
  const { fs, noImport } = context;
  const basename = pathPosix.basename(configPath);
  const dirname = pathPosix.dirname(configPath);
  let options = null;
  let config = null;
  let unknown = null;
  try {
    if (basename.endsWith(".markdownlint-cli2.jsonc")) {
      options = await readJsonc(configPath, fs);
    } else if (basename.endsWith(".markdownlint-cli2.yaml")) {
      options = await readYaml(configPath, fs);
    } else if (basename.endsWith(".markdownlint-cli2.cjs") || basename.endsWith(".markdownlint-cli2.mjs")) {
      options = cloneOptions(await importModule(dirname, basename, noImport));
    } else if (basename.endsWith(".markdownlint.jsonc") || basename.endsWith(".markdownlint.json")) {
      config = await readJsonc(configPath, fs);
    } else if (basename.endsWith(".markdownlint.yaml") || basename.endsWith(".markdownlint.yml")) {
      config = await readYaml(configPath, fs);
    } else if (basename.endsWith(".markdownlint.cjs") || basename.endsWith(".markdownlint.mjs")) {
      config = cloneOptions(await importModule(dirname, basename, noImport));
    } else if (basename.endsWith(".jsonc") || basename.endsWith(".json")) {
      unknown = await readJsonc(configPath, fs);
    } else if (basename.endsWith(".toml")) {
      unknown = await readToml(configPath, fs);
    } else if (basename.endsWith(".yaml") || basename.endsWith(".yml")) {
      unknown = await readYaml(configPath, fs);
    } else if (basename.endsWith(".cjs") || basename.endsWith(".mjs")) {
      unknown = cloneOptions(await importModule(dirname, basename, noImport));
    } else {
      throw new Error(
        "Configuration file should be one of the supported names " +
        "(e.g., '.markdownlint-cli2.jsonc') or a prefix with a supported name " +
        "(e.g., 'example.markdownlint-cli2.jsonc') or have a supported extension " +
        "(e.g., jsonc, json, yaml, yml, cjs, mjs)."
      );
    }
  } catch (error) {
    throwForConfigurationFile(configPath, error);
  }
  if (configPointer) {
    const objects = [ options, config, unknown ];
    [ options, config, unknown ] = objects.map((obj) => obj && (jsonpointer.get(obj, configPointer) || {}));
  }
  if (unknown) {
    const keys = Object.keys(unknown);
    if (keys.some((key) => cli2SchemaKeys.has(key))) {
      options = unknown;
    } else {
      config = unknown;
    }
  }
  if (options) {
    await extendOptionsObject(context, options, configPath);
    return options;
  }
  await extendConfigObject(context, config, configPath);
  return { config };
};

// Filter a list of files by glob(s)
const filterByGlobs = (/** @type {string} */ dir, /** @type {string[]} */ files, /** @type {string[]} */ globs) => (
  micromatch(
    files.map((file) => pathPosix.relative(dir, file)),
    globs,
    { "dot": true }
  ).map((file) => pathPosix.join(dir, file))
);

// Process/normalize command-line arguments and return glob patterns
const processArgv = (/** @type {string[]} */ argv) => {
  const globPatterns = argv.map(
    (glob) => {
      if (glob.startsWith(":")) {
        return glob;
      }
      // Escape RegExp special characters recognized by fast-glob
      // https://github.com/mrmlnc/fast-glob#advanced-syntax
      const specialCharacters = /\\(?![$()*+?[\]^])/gu;
      return (glob.startsWith("\\:"))
        ? `\\:${glob.slice(2).replace(specialCharacters, "/")}`
        : (glob.startsWith("#") ? `!${glob.slice(1)}` : glob).replace(specialCharacters, "/");
    }
  );
  if ((globPatterns.length === 1) && (globPatterns[0] === ".")) {
    // Substitute a more reasonable pattern
    globPatterns[0] = dotOnlySubstitute;
  }
  return globPatterns;
};

// Show help if missing arguments
const showHelp = (/** @type {Logger} */ logMessage, /** @type {boolean} */ showBanner) => {
  if (showBanner) {
    logMessage(bannerMessage);
  }
  logMessage(`https://github.com/DavidAnson/markdownlint-cli2

Syntax: markdownlint-cli2 glob0 [glob1] [...] [globN] [--config file] [--configPointer pointer] [--fix] [--format] [--help] [--no-globs]

Glob expressions (from the globby library):
- * matches any number of characters, but not /
- ? matches a single character, but not /
- ** matches any number of characters, including /
- {} allows for a comma-separated list of "or" expressions
- ! or # at the beginning of a pattern negate the match
- : at the beginning identifies a literal file path
- - as a glob represents standard input (stdin)

Dot-only glob:
- The command "markdownlint-cli2 ." would lint every file in the current directory tree which is probably not intended
- Instead, it is mapped to "markdownlint-cli2 ${dotOnlySubstitute}" which lints all Markdown files in the current directory
- To lint every file in the current directory tree, the command "markdownlint-cli2 **" can be used instead

Optional parameters:
- --config        specifies the path to a configuration file to define the base configuration
- --configPointer specifies a JSON Pointer to a configuration object within the --config file
- --fix           updates files to resolve fixable issues (can be overridden in configuration)
- --format        reads standard input (stdin), applies fixes, writes standard output (stdout)
- --help          writes this message to the console and exits without doing anything else
- --no-globs      ignores the "globs" property if present in the top-level options object

Configuration via:
- .markdownlint-cli2.jsonc
- .markdownlint-cli2.yaml
- .markdownlint-cli2.cjs or .markdownlint-cli2.mjs
- .markdownlint.jsonc or .markdownlint.json
- .markdownlint.yaml or .markdownlint.yml
- .markdownlint.cjs or .markdownlint.mjs

Cross-platform compatibility:
- UNIX and Windows shells expand globs according to different rules; quoting arguments is recommended
- Some Windows shells don't handle single-quoted (') arguments well; double-quote (") is recommended
- Shells that expand globs do not support negated patterns (!node_modules); quoting is required here
- Some UNIX shells parse exclamation (!) in double-quotes; hashtag (#) is recommended in these cases
- The path separator is forward slash (/) on all platforms; backslash (\\) is automatically converted
- On any platform, passing the parameter "--" causes all remaining parameters to be treated literally

The most compatible syntax for cross-platform support:
$ markdownlint-cli2 "**/*.md" "#node_modules"`
  );
  return 2;
};

// Helpers for getAndProcessDirInfo/handleFirstMatchingConfigurationFile
// Options inputs do not need special handling
const readJsoncWrapper = (/** @type {ConfigurationHandlerParams} */ { file, fs }) => readJsonc(file, fs);
const readYamlWrapper = (/** @type {ConfigurationHandlerParams} */ { file, fs }) => readYaml(file, fs);
const importOptionsModuleWrapper = async (/** @type {ConfigurationHandlerParams} */ { dir, file, noImport }) =>
  cloneOptions(await importModule(dir, file, noImport));
// Configuration inputs need "extends" handled
const readConfigWrapper = (/** @type {ConfigurationHandlerParams} */ { file, fs, parsers }) => readConfig(file, parsers, fs);
const importConfigModuleWrapper = async (/** @type {ConfigurationHandlerParams} */ { context, dir, file, noImport }) =>
  extendConfigObject(context, cloneOptions(await importModule(dir, file, noImport)), file);

/** @type {ConfigurationFileAndHandler[] } */
const optionsFiles = [
  [ ".markdownlint-cli2.jsonc", readJsoncWrapper ],
  [ ".markdownlint-cli2.yaml", readYamlWrapper ],
  [ ".markdownlint-cli2.cjs", importOptionsModuleWrapper ],
  [ ".markdownlint-cli2.mjs", importOptionsModuleWrapper ]
];

/** @type {ConfigurationFileAndHandler[] } */
const configurationFiles = [
  [ ".markdownlint.jsonc", readConfigWrapper ],
  [ ".markdownlint.json", readConfigWrapper ],
  [ ".markdownlint.yaml", readConfigWrapper ],
  [ ".markdownlint.yml", readConfigWrapper ],
  [ ".markdownlint.cjs", importConfigModuleWrapper ],
  [ ".markdownlint.mjs", importConfigModuleWrapper ]
];

/**
 * Processes the first matching configuration file.
 * @param {ExecutionContext} context Execution context.
 * @param {ConfigurationFileAndHandler[]} fileAndHandlers List of configuration files and handlers.
 * @param {string} dir Configuration file directory.
 * @param {(file: string) => void} memoizeFile Function to memoize file name.
 * @returns {Promise<any>} Configuration file content.
 */
const processFirstMatchingConfigurationFile = (context, fileAndHandlers, dir, memoizeFile) => {
  const { fs, noImport, parsers } = context;
  return Promise.allSettled(
    fileAndHandlers.map(([ name, handler ]) => {
      const file = pathPosix.join(dir, name);
      return fs.promises.access(file).then(() => [ file, handler ]);
    })
  ).
    then((values) => {
      /** @type {ConfigurationFileAndHandler} */
      const [ file, handler ] = values.find((result) => (result.status === "fulfilled"))?.value || [ "[UNUSED]", noop ];
      memoizeFile(file);
      return handler({ context, dir, file, fs, noImport, parsers });
    });
};

// Get (creating if necessary) and process a directory's info object
const getAndProcessDirInfo = (
  /** @type {ExecutionContext} */ context,
  /** @type {Task[]} */ tasks,
  /** @type {DirToDirInfo} */ dirToDirInfo,
  /** @type {string} */ dir,
  /** @type {string | null} */ relativeDir
) => {
  // Create dirInfo
  let dirInfo = dirToDirInfo[dir];
  if (!dirInfo) {
    dirInfo = {
      dir,
      relativeDir,
      "parent": null,
      "files": [],
      "markdownlintConfig": null,
      "markdownlintOptions": null
    };
    dirToDirInfo[dir] = dirInfo;

    let cli2File = "[UNKNOWN]";
    tasks.push(

      // Load markdownlint-cli2 object(s)
      processFirstMatchingConfigurationFile(context, optionsFiles, dir, (file) => { cli2File = file; }).
        then((/** @type {Options | null} */ options) => {
          dirInfo.markdownlintOptions = options;
          return extendOptionsObject(context, options, cli2File);
        }).
        catch((/** @type {Error} */ error) => {
          throwForConfigurationFile(cli2File, error);
        }),

      // Load markdownlint object(s)
      processFirstMatchingConfigurationFile(context, configurationFiles, dir, noop).
        then((/** @type {Configuration | null} */ config) => {
          dirInfo.markdownlintConfig = config;
        })
    );
  }

  // Return dirInfo
  return dirInfo;
};

// Get base markdownlint-cli2 options object
const getBaseOptions = async (
  /** @type {ExecutionContext} */ context,
  /** @type {string | null} */ relativeDir,
  /** @type {string[]} */ globPatterns,
  /** @type {Options} */ options,
  /** @type {boolean} */ fixDefault,
  /** @type {boolean} */ noGlobs
) => {
  const { baseDir } = context;
  /** @type {Task[]} */
  const tasks = [];
  /** @type {DirToDirInfo} */
  const dirToDirInfo = {};
  getAndProcessDirInfo(
    context,
    tasks,
    dirToDirInfo,
    baseDir,
    relativeDir
  );
  await Promise.all(tasks);
  // eslint-disable-next-line no-multi-assign
  const baseMarkdownlintOptions = dirToDirInfo[baseDir].markdownlintOptions =
    mergeOptions(
      mergeOptions(
        { "fix": fixDefault },
        options
      ),
      dirToDirInfo[baseDir].markdownlintOptions
    );

  if (!noGlobs) {
    // Append any globs specified in markdownlint-cli2 configuration
    const globs = baseMarkdownlintOptions.globs || [];
    appendToArray(globPatterns, globs);
  }

  // Pass base ignore globs as globby patterns (best performance)
  const ignorePatterns =
    // eslint-disable-next-line unicorn/no-array-callback-reference
    (baseMarkdownlintOptions.ignores || []).map(negateGlob);
  appendToArray(globPatterns, ignorePatterns);

  return {
    baseMarkdownlintOptions,
    dirToDirInfo
  };
};

// Enumerate files from globs and build directory infos
const enumerateFiles = async (
  /** @type {ExecutionContext} */ context,
  /** @type {string[]} */ globPatterns,
  /** @type {DirToDirInfo} */ dirToDirInfo,
  /** @type {boolean} */ gitignore,
  /** @type {string | undefined} */ ignoreFiles
) => {
  const { baseDir, baseDirSystem, fs } = context;
  /** @type {Task[]} */
  const tasks = [];
  /** @type {import("globby").Options} */
  const globbyOptions = {
    "absolute": true,
    "cwd": baseDir,
    "dot": true,
    "expandNegationOnlyPatterns": false,
    gitignore,
    ignoreFiles,
    "suppressErrors": true,
    fs
  };
  // Special-case literal files
  /** @type {string[]} */
  const literalFiles = [];
  const filteredGlobPatterns = globPatterns.filter(
    (globPattern) => {
      if (globPattern.startsWith(":")) {
        literalFiles.push(
          posixPath(pathDefault.resolve(baseDirSystem, globPattern.slice(1)))
        );
        return false;
      }
      return true;
    }
  ).map((globPattern) => globPattern.replace(/^\\:/u, ":"));
  const baseMarkdownlintOptions = dirToDirInfo[baseDir].markdownlintOptions;
  const globsForIgnore =
    (baseMarkdownlintOptions?.globs || []).
      filter((glob) => glob.startsWith("!"));
  const filteredLiteralFiles =
    ((literalFiles.length > 0) && (globsForIgnore.length > 0))
      ? filterByGlobs(baseDir, literalFiles, globsForIgnore)
      : literalFiles;
  // Process glob patterns
  const files = [
    ...await globby(filteredGlobPatterns, globbyOptions),
    ...filteredLiteralFiles
  ];
  for (const file of files) {
    const dir = pathPosix.dirname(file);
    const dirInfo = getAndProcessDirInfo(
      context,
      tasks,
      dirToDirInfo,
      dir,
      null
    );
    dirInfo.files.push(file);
  }
  await Promise.all(tasks);
};

// Enumerate (possibly missing) parent directories and update directory infos
const enumerateParents = async (
  /** @type {ExecutionContext} */ context,
  /** @type {DirToDirInfo} */ dirToDirInfo
) => {
  const { baseDir } = context;
  /** @type {Task[]} */
  const tasks = [];

  // Create a lookup of baseDir and parents
  /** @type {Record<string, boolean>} */
  const baseDirParents = {};
  let baseDirParent = baseDir;
  do {
    baseDirParents[baseDirParent] = true;
    baseDirParent = pathPosix.dirname(baseDirParent);
  // eslint-disable-next-line unicorn/no-computed-property-existence-check
  } while (!baseDirParents[baseDirParent]);

  // Visit parents of each dirInfo
  for (let lastDirInfo of Object.values(dirToDirInfo)) {
    let { dir } = lastDirInfo;
    let lastDir = dir;
    while (
      // eslint-disable-next-line unicorn/no-computed-property-existence-check
      !baseDirParents[dir] &&
      (dir = pathPosix.dirname(dir)) &&
      // eslint-disable-next-line unicorn/prefer-simple-condition-first
      (dir !== lastDir)
    ) {
      lastDir = dir;
      const dirInfo =
        getAndProcessDirInfo(
          context,
          tasks,
          dirToDirInfo,
          dir,
          null
        );
      lastDirInfo.parent = dirInfo;
      lastDirInfo = dirInfo;
    }

    // If dir not under baseDir, inject it as parent for configuration
    if (dir !== baseDir) {
      dirToDirInfo[dir].parent = dirToDirInfo[baseDir];
    }
  }
  await Promise.all(tasks);
};

// Create directory info objects by enumerating file globs
const createDirInfos = async (
  /** @type {ExecutionContext} */ context,
  /** @type {string[]} */ globPatterns,
  /** @type {DirToDirInfo} */ dirToDirInfo,
  /** @type {Options | undefined} */ optionsOverride,
  /** @type {boolean} */ gitignore,
  /** @type {string | undefined} */ ignoreFiles
) => {
  await enumerateFiles(
    context,
    globPatterns,
    dirToDirInfo,
    gitignore,
    ignoreFiles
  );
  await enumerateParents(
    context,
    dirToDirInfo
  );

  // Merge file lists with identical configuration
  // (Sort so parents are handled before children)
  const dirs = Object.keys(dirToDirInfo);
  dirs.sort((a, b) => b.length - a.length);
  /** @type {DirInfo[]} */
  const dirInfos = [];
  const tasks = [];
  for (const dir of dirs) {
    const dirInfo = dirToDirInfo[dir];
    if (dirInfo.parent && !dirInfo.markdownlintConfig && !dirInfo.markdownlintOptions) {
      if (dirInfo.parent) {
        appendToArray(dirInfo.parent.files, dirInfo.files);
      }
      delete dirToDirInfo[dir];
    } else {
      const { noImport } = context;
      const { markdownlintOptions, relativeDir } = dirInfo;
      const effectiveDir = relativeDir || dir;
      const effectiveModulePaths = resolveModulePaths(
        effectiveDir,
        (markdownlintOptions && markdownlintOptions.modulePaths) || []
      );
      if (markdownlintOptions && markdownlintOptions.customRules) {
        tasks.push(
          importModuleIds(
            [ effectiveDir, ...effectiveModulePaths ],
            // @ts-ignore
            markdownlintOptions.customRules,
            noImport
          ).then((customRules) => {
            // Expand nested arrays (for packages that export multiple rules)
            markdownlintOptions.customRules = customRules.flat();
          })
        );
      }
      if (markdownlintOptions && markdownlintOptions.markdownItPlugins) {
        tasks.push(
          importModuleIdsAndParams(
            [ effectiveDir, ...effectiveModulePaths ],
            markdownlintOptions.markdownItPlugins,
            noImport
          ).then((markdownItPlugins) => {
            markdownlintOptions.markdownItPlugins = markdownItPlugins;
          })
        );
      }
      dirInfos.push(dirInfo);
    }
  }
  await Promise.all(tasks);
  for (const dirInfo of dirInfos) {
    // eslint-disable-next-line unicorn/no-computed-property-existence-check
    while (dirInfo.parent && !dirToDirInfo[dirInfo.parent.dir]) {
      dirInfo.parent = dirInfo.parent.parent;
    }
  }

  // Verify dirInfos is simplified
  // if (
  //   dirInfos.filter(
  //     (di) => di.parent && !dirInfos.includes(di.parent)
  //   ).length > 0
  // ) {
  //   throw new Error("Extra parent");
  // }
  // if (
  //   dirInfos.filter(
  //     (di) => !di.parent && (di.dir !== context.baseDir)
  //   ).length > 0
  // ) {
  //   throw new Error("Missing parent");
  // }
  // if (
  //   dirInfos.filter(
  //     (di) => di.parent &&
  //     !((di.markdownlintConfig ? 1 : 0) ^ (di.markdownlintOptions ? 1 : 0))
  //   ).length > 0
  // ) {
  //   throw new Error("Missing object");
  // }
  // if (dirInfos.filter((di) => di.dir === "/").length > 0) {
  //   throw new Error("Includes root");
  // }

  // Merge configuration by inheritance
  for (const dirInfo of dirInfos) {
    let { markdownlintConfig, markdownlintOptions } = dirInfo;
    /** @type {DirInfo | null} */
    let parent = dirInfo;
    // eslint-disable-next-line prefer-destructuring
    while ((parent = parent.parent)) {
      if (parent.markdownlintOptions) {
        markdownlintOptions = mergeOptions(
          parent.markdownlintOptions,
          markdownlintOptions
        );
      }
      if (
        !markdownlintConfig &&
        parent.markdownlintConfig &&
        !markdownlintOptions?.config
      ) {
        // eslint-disable-next-line prefer-destructuring
        markdownlintConfig = parent.markdownlintConfig;
      }
    }
    dirInfo.markdownlintOptions = mergeOptions(
      markdownlintOptions,
      optionsOverride
    );
    dirInfo.markdownlintConfig = markdownlintConfig;
  }

  // Apply configuration overrides
  /** @type {DirInfo[]} */
  const overrideDirInfos = [];
  for (const dirInfo of dirInfos) {
    const overrides = dirInfo.markdownlintOptions?.overrides || [];
    for (const override of overrides) {
      const { filter, config, combine } = override;
      // eslint-disable-next-line unicorn/prefer-continue
      if (filter && config && (filter.length > 0) && ((combine === "merge") || (combine === "replace"))) {
        const filteredFiles = filterByGlobs(dirInfo.dir, dirInfo.files, filter);
        if (filteredFiles.length > 0) {
          dirInfo.files = dirInfo.files.filter((file) => !filteredFiles.includes(file));
          const overrideConfig = (combine === "merge") ? { ...dirInfo.markdownlintOptions?.config, ...config } : config;
          const overrideDirInfo = {
            ...dirInfo,
            "files": filteredFiles,
            "markdownlintOptions": { ...dirInfo.markdownlintOptions, "config": overrideConfig }
          };
          overrideDirInfos.push(overrideDirInfo);
        }
      }
    }
  }
  appendToArray(dirInfos, overrideDirInfos);

  // Return results
  return dirInfos;
};

// Lint files in groups by shared configuration
const lintFiles = (
  /** @type {ExecutionContext} */ context,
  /** @type {DirInfo[]} */ dirInfos,
  /** @type {Record<string, string>} */ fileContents,
  /** @type {FormattingContext} */ formattingContext
) => {
  const { fs, parsers } = context;
  /** @type {Promise<LintTaskResult>[]} */
  const tasks = [];
  // For each dirInfo
  for (const dirInfo of dirInfos) {
    const { dir, files, markdownlintConfig, markdownlintOptions } = dirInfo;
    // Filter file/string inputs to only those in the dirInfo
    let filesAfterIgnores = files;
    if (
      markdownlintOptions &&
      markdownlintOptions.ignores &&
      (markdownlintOptions.ignores.length > 0)
    ) {
      // eslint-disable-next-line unicorn/no-array-callback-reference
      const ignores = markdownlintOptions.ignores.map(negateGlob);
      filesAfterIgnores = filterByGlobs(dir, files, ignores);
    }
    const filteredFiles = filesAfterIgnores.filter(
      (file) => fileContents[file] === undefined
    );
    /** @type {Record<string, string>} */
    const filteredStrings = {};
    for (const file of filesAfterIgnores) {
      if (fileContents[file] !== undefined) {
        filteredStrings[file] = fileContents[file];
      }
    }
    // Create markdown-it factory
    const markdownItFactory = async () => {
      // eslint-disable-next-line no-inline-comments
      const module = await import(/* webpackMode: "eager" */ "markdown-it");
      const markdownIt = module.default({ "html": true });
      const plugins = markdownlintOptions?.markdownItPlugins || [];
      for (const plugin of plugins) {
        // @ts-ignore
        markdownIt.use(...plugin);
      }
      return markdownIt;
    };
    // Create markdownlint options object
    /** @type {import("markdownlint").Options} */
    const options = {
      "files": filteredFiles,
      "strings": filteredStrings,
      "config": markdownlintConfig || markdownlintOptions?.config,
      "configParsers": parsers,
      // @ts-ignore
      "customRules": markdownlintOptions.customRules,
      "frontMatter": markdownlintOptions?.frontMatter
        ? new RegExp(markdownlintOptions?.frontMatter, "u")
        : undefined,
      "handleRuleFailures": true,
      markdownItFactory,
      "noInlineConfig": Boolean(markdownlintOptions?.noInlineConfig),
      fs
    };
    // Invoke markdownlint
    /** @type {Promise<LintTaskResult>} */
    let task = lint(options).then((results) => ({
      results,
      "filesAttempted": 0,
      "issuesAttempted": 0
    }));
    if (formattingContext.formatting) {
      // Apply fixes to stdin input
      task = task.then((taskResult) => {
        const { results } = taskResult;
        const [ [ id, original ] ] = Object.entries(filteredStrings);
        const errorInfos = results[id];
        formattingContext.formatted = applyFixes(original, errorInfos);
        return {
          ...taskResult,
          "results": {}
        };
      });
    } else if (markdownlintOptions?.fix) {
      // For any fixable errors, read file, apply fixes, write it back, and re-lint
      task = task.then((taskResult) => {
        const { results } = taskResult;
        let issuesToFix = 0;
        /** @type {string[]} */
        const filesToFix = [];
        options.files = filesToFix;
        const subTasks = [];
        const errorFiles = Object.keys(results).filter((result) => filteredFiles.includes(result));
        for (const fileName of errorFiles) {
          const errorInfos = results[fileName].filter((errorInfo) => errorInfo.fixInfo);
          // eslint-disable-next-line unicorn/prefer-continue
          if (errorInfos.length > 0) {
            issuesToFix += errorInfos.length;
            filesToFix.push(fileName);
            subTasks.push(fs.promises.readFile(fileName, utf8).
              then((/** @type {string} */ original) => {
                const fixed = applyFixes(original, errorInfos);
                return fs.promises.writeFile(fileName, fixed, utf8);
              })
            );
          }
        }
        return Promise.all(subTasks).
          then(() => lint(options)).
          then((fixResults) => ({
            "results": {
              ...results,
              ...fixResults
            },
            "filesAttempted": filesToFix.length,
            "issuesAttempted": issuesToFix
          }));
      });
    }
    // Queue tasks for this dirInfo
    tasks.push(task);
  }
  // Return result of all tasks
  return Promise.all(tasks);
};

// Create flat list of results
const flattenTaskResults = (/** @type {string} */ baseDir, /** @type {LintTaskResult[]} */ taskResults) => {
  /** @type {LintResult[]} */
  const lintResults = [];
  let totalIssuesReported = 0;
  let totalFilesReported = 0;
  let totalIssuesAttempted = 0;
  let totalFilesAttempted = 0;
  /** @type {Map<LintResult, number>} */
  const resultToCounter = new Map();
  for (const taskResult of taskResults) {
    const { results, filesAttempted, issuesAttempted } = taskResult;
    const resultsEntries = Object.entries(results).
      filter(([ , errorInfos ]) => errorInfos.length > 0);
    for (const [ fileName, errorInfos ] of resultsEntries) {
      for (const errorInfo of errorInfos) {
        const fileNameRelative = pathPosix.relative(baseDir, fileName);
        const result = {
          "fileName": fileNameRelative,
          ...errorInfo
        };
        lintResults.push(result);
        resultToCounter.set(result, totalIssuesReported);
        totalIssuesReported++;
      }
    }
    totalFilesReported += resultsEntries.length;
    totalIssuesAttempted += issuesAttempted;
    totalFilesAttempted += filesAttempted;
  }
  lintResults.sort((a, b) => (
    a.fileName.localeCompare(b.fileName) ||
    (a.lineNumber - b.lineNumber) ||
    a.ruleNames[0].localeCompare(b.ruleNames[0]) ||
    // @ts-ignore
    (resultToCounter.get(a) - resultToCounter.get(b))
  ));
  return {
    lintResults,
    "issuesReported": totalIssuesReported,
    "filesReported": totalFilesReported,
    "issuesAttempted": totalIssuesAttempted,
    "filesAttempted": totalFilesAttempted
  };
};

// Output summary via formatters
const outputResults = async (
  /** @type {ExecutionContext} */ context,
  /** @type {string | null} */ relativeDir,
  /** @type {LintResult[]} */ results,
  /** @type {OutputFormatterConfiguration[] | undefined} */ outputFormatters,
  /** @type {string[]} */ modulePaths,
  /** @type {Logger} */ logMessage,
  /** @type {Logger} */ logError,
  /** @type {boolean} */ noImport
) => {
  // eslint-disable-next-line unicorn/prefer-early-return
  if (outputFormatters || (results.length > 0)) {
    const { baseDir, fs } = context;
    /** @type {FsPromisesLike} */
    const fsPromises = {
      "readFile": fs.promises.readFile,
      "writeFile": fs.promises.writeFile
    };
    /** @type {OutputFormatterOptions} */
    const formatterOptions = {
      "directory": baseDir,
      results,
      logMessage,
      logError,
      fsPromises
    };
    const dir = relativeDir || baseDir;
    const dirs = [ dir, ...modulePaths ];
    const formattersAndParams = outputFormatters
      ? await importModuleIdsAndParams(dirs, outputFormatters, noImport)
      // eslint-disable-next-line no-inline-comments, unicorn/no-await-expression-member
      : [ [ (await import(/* webpackMode: "eager" */ "markdownlint-cli2-formatter-default")).default ] ];
    await Promise.all(formattersAndParams.map((formatterAndParams) => {
      const [ formatter, ...formatterParams ] = formatterAndParams;
      return formatter(formatterOptions, ...formatterParams);
    }));
  }
};

// Main function
export const main = async (/** @type {Parameters} */ params) => {
  // Capture parameters
  const {
    directory,
    argv,
    optionsDefault,
    optionsOverride,
    fileContents,
    allowStdin
  } = params;
  let {
    noGlobs,
    nonFileContents
  } = params;
  const logMessage = params.logMessage || noop;
  const logError = params.logError || noop;
  const fs = params.fs || fsNode;
  const noImport = Boolean(params.noImport);
  const baseDirSystem =
    (directory && pathDefault.resolve(directory)) ||
    process.cwd();
  const baseDir = posixPath(baseDirSystem);
  /** @type {FormattingContext} */
  const formattingContext = {};
  // Merge and process args/argv
  let fixDefault = false;
  /** @type {undefined | null | string} */
  // eslint-disable-next-line unicorn/no-useless-undefined
  let configPath = undefined;
  /** @type {undefined | null | string} */
  // eslint-disable-next-line unicorn/no-useless-undefined
  let configPointer = undefined;
  let useStdin = false;
  let sawDashDash = false;
  let shouldShowHelp = false;
  const argvFiltered = (argv || []).filter((arg) => {
    if (sawDashDash) {
      return true;
    // eslint-disable-next-line unicorn/no-useless-else
    } else if (configPath === null) {
      configPath = arg;
    } else if (configPointer === null) {
      configPointer = arg;
    } else if ((arg === "-") && allowStdin) {
      useStdin = true;
      // eslint-disable-next-line unicorn/prefer-switch
    } else if (arg === "--") {
      sawDashDash = true;
    } else if (arg === "--config") {
      configPath = null;
    } else if (arg === "--configPointer") {
      configPointer = null;
    } else if (arg === "--fix") {
      fixDefault = true;
    } else if (arg === "--format") {
      formattingContext.formatting = true;
      useStdin = true;
    } else if (arg === "--help") {
      shouldShowHelp = true;
    } else if (arg === "--no-globs") {
      noGlobs = true;
    } else {
      return true;
    }
    return false;
  });
  if (shouldShowHelp) {
    return showHelp(logMessage, true);
  }
  /** @type {ExecutionContext} */
  const context = { baseDir, baseDirSystem, fs, noImport, "parsers": allParsers };
  // Read argv configuration file (if relevant and present)
  let optionsArgv = null;
  let relativeDir = null;
  let globPatterns = null;
  let baseOptions = null;
  try {
    if (configPath) {
      const resolvedConfigPath = posixPath(pathDefault.resolve(baseDirSystem, configPath));
      optionsArgv = await readOptionsOrConfig(context, resolvedConfigPath, configPointer);
      relativeDir = pathPosix.dirname(resolvedConfigPath);
    }
    // Process arguments and get base options
    globPatterns = processArgv(argvFiltered);
    baseOptions = await getBaseOptions(
      context,
      relativeDir,
      globPatterns,
      optionsArgv || optionsDefault,
      fixDefault,
      Boolean(noGlobs)
    );
  } finally {
    if (!baseOptions?.baseMarkdownlintOptions.noBanner && !formattingContext.formatting) {
      logMessage(bannerMessage);
    }
  }
  if (
    (configPath === null) ||
    (!useStdin && !nonFileContents && (globPatterns.length === 0))
  ) {
    return showHelp(logMessage, false);
  }
  // Add stdin as a non-file input if necessary
  if (useStdin) {
    const key = pathPosix.join(baseDir, "stdin");
    const { text } = await import("node:stream/consumers");
    nonFileContents = {
      ...nonFileContents,
      [key]: await text(process.stdin)
    };
  }
  // Include any file overrides or non-file content
  /** @type {Record<string, string>} */
  const resolvedFileContents = {};
  for (const file in fileContents) {
    const resolvedFile = posixPath(pathDefault.resolve(baseDirSystem, file));
    resolvedFileContents[resolvedFile] = fileContents[file];
  }
  for (const nonFile in nonFileContents) {
    resolvedFileContents[nonFile] = nonFileContents[nonFile];
  }
  const { baseMarkdownlintOptions, dirToDirInfo } = baseOptions;
  appendToArray(
    dirToDirInfo[baseDir].files,
    Object.keys(nonFileContents || {})
  );
  // Output finding status
  const showProgress = !baseMarkdownlintOptions.noProgress && !formattingContext.formatting;
  if (showProgress) {
    logMessage(`Finding: ${globPatterns.join(" ")}`);
  }
  // Create linting tasks
  const gitignore = (baseMarkdownlintOptions.gitignore === true);
  const ignoreFiles = (typeof baseMarkdownlintOptions.gitignore === "string")
    ? baseMarkdownlintOptions.gitignore
    : undefined;
  const dirInfos =
    await createDirInfos(
      context,
      globPatterns,
      dirToDirInfo,
      optionsOverride,
      gitignore,
      ignoreFiles
    );
  // Output linting status
  if (showProgress) {
    const fileNames = dirInfos.flatMap((dirInfo) => {
      const { files } = dirInfo;
      return files.map((file) => pathPosix.relative(baseDir, file));
    });
    const fileCount = fileNames.length;
    if (baseMarkdownlintOptions.showFound) {
      fileNames.push("");
      // eslint-disable-next-line unicorn/require-array-sort-compare
      fileNames.sort();
      logMessage(`Found:${fileNames.join("\n ")}`);
    }
    logMessage(`Linting: ${pluralize(fileCount, "file")}`);
  }
  // Lint files
  const taskResults = await lintFiles(context, dirInfos, resolvedFileContents, formattingContext);
  // Output summary
  const { lintResults, issuesReported, filesReported, filesAttempted, issuesAttempted } = flattenTaskResults(baseDir, taskResults);
  if (showProgress) {
    if (issuesAttempted > 0) {
      logMessage(`Attempted: ${pluralize(issuesAttempted, "fix")} in ${pluralize(filesAttempted, "file")}`);
    }
    logMessage(`Summary: ${pluralize(issuesReported, "issue")} in ${pluralize(filesReported, "file")}`);
  }
  if (formattingContext.formatting) {
    const { pipeline } = await import("node:stream/promises");
    await pipeline(
      String(formattingContext.formatted),
      process.stdout
    );
  } else {
    const outputFormatters =
      (optionsOverride && optionsOverride.outputFormatters) ||
      baseMarkdownlintOptions.outputFormatters;
    const modulePaths = resolveModulePaths(
      baseDir,
      baseMarkdownlintOptions.modulePaths || []
    );
    await outputResults(
      context,
      relativeDir,
      lintResults,
      outputFormatters,
      modulePaths,
      logMessage,
      logError,
      noImport
    );
  }
  // Return result
  const errorsPresent = taskResults.flatMap(
    (taskResult) => Object.values(taskResult.results).flatMap(
      (lintErrors) => lintErrors.filter(
        (lintError) => lintError.severity !== "warning"
      )
    )
  ).length > 0;
  return errorsPresent ? 1 : 0;
};

/** @typedef {any} FsLike */

/** @typedef {Promise<any>} Task */

/**
 * @typedef ExecutionContext
 * @property {string} baseDir Base directory (POSIX).
 * @property {string} baseDirSystem Base directory (non-POSIX).
 * @property {FsLike} fs File system object.
 * @property {boolean} noImport No import.
 * @property {ConfigurationParser[]} parsers Configuration file parsers.
 */

/**
 * @typedef Parameters
 * @property {boolean} [allowStdin] Allow stdin.
 * @property {string[]} [argv] Arguments.
 * @property {string} [directory] Directory.
 * @property {Record<string, string>} [fileContents] File contents.
 * @property {FsLike} [fs] File system object.
 * @property {Logger} [logError] Log error.
 * @property {Logger} [logMessage] Log message.
 * @property {boolean} [noGlobs] No globs.
 * @property {boolean} [noImport] No import.
 * @property {Record<string, string>} [nonFileContents] Non-file contents.
 * @property {Options} [optionsDefault] Options default.
 * @property {Options} [optionsOverride] Options override.
 */

/** @typedef {import("markdownlint").Configuration} Configuration */

/** @typedef {import("markdownlint").ConfigurationParser} ConfigurationParser */

/**
 * @typedef ConfigurationHandlerParams
 * @property {ExecutionContext} context Execution context.
 * @property {string} dir Configuration file directory.
 * @property {string} file Configuration file.
 * @property {FsLike} fs File system object.
 * @property {ConfigurationParser[]} parsers Configuration file parsers.
 * @property {boolean} noImport No import.
 */

/** @typedef {[ string, (params: ConfigurationHandlerParams) => Promise<any> ] } ConfigurationFileAndHandler */

/**
 * @typedef Override
 * @property {string[]} filter Globs to filter.
 * @property {Configuration} config Configuration object.
 * @property {"merge"|"replace"} combine Combine strategy.
 */

/**
 * @typedef DirInfo
 * @property {string} dir Directory.
 * @property {string | null} relativeDir Relative directory.
 * @property {DirInfo | null} parent Parent.
 * @property {string[]} files Files.
 * @property {Configuration | null} markdownlintConfig Configuration.
 * @property {Options | null} markdownlintOptions Options.
 */

/** @typedef {Record<string, DirInfo>} DirToDirInfo */

/** @typedef {[string]} MarkdownItPluginConfiguration */

/** @typedef {[OutputFormatter, ...any]} OutputFormatterConfiguration */

/** @typedef {import("markdownlint").Rule} Rule */

/** @typedef {{ "results": LintResults, "filesAttempted": number, "issuesAttempted": number }} LintTaskResult */

/**
 * @typedef Options
 * @property {Configuration} [config] Configuration object.
 * @property {Override[]} [overrides] Configuration overrides.
 * @property {Rule[] | string[]} [customRules] Custom rules.
 * @property {boolean} [fix] Fix supported violations.
 * @property {string} [frontMatter] Front matter regular expression.
 * @property {boolean | string} [gitignore] Switch or glob for .gitignore.
 * @property {string[]} [globs] Globs to lint.
 * @property {string[]} [ignores] Globs to ignore.
 * @property {MarkdownItPluginConfiguration[]} [markdownItPlugins] Markdown-it plugins.
 * @property {string[]} [modulePaths] Additional module paths.
 * @property {boolean} [noBanner] Disable banner display.
 * @property {boolean} [noInlineConfig] Disable inline config.
 * @property {boolean} [noProgress] Disable progress display.
 * @property {OutputFormatterConfiguration[]} [outputFormatters] Output formatters.
 * @property {boolean} [showFound] Show found files.
 */

/**
 * @typedef LintContext
 * @property {string} fileName File name.
 */

/** @typedef {import("markdownlint").LintError & LintContext} LintResult */

/** @typedef {import("markdownlint").LintResults} LintResults */

/**
 * @typedef FormattingContext
 * @property {boolean} [formatting] True iff formatting.
 * @property {string} [formatted] Formatted content.
 */

/**
 * @callback Logger
 * @param {string} msg Message.
 * @returns {void}
 */

/**
 * @callback OutputFormatter
 * @param {OutputFormatterOptions} options
 * @param {...any} parameters
 * @returns {Promise<void> | void}
 */

/**
 * @typedef {object} OutputFormatterOptions
 * @property {string} directory Base directory.
 * @property {LintResult[]} results Lint results.
 * @property {Logger} logMessage Message logger.
 * @property {Logger} logError Error logger.
 * @property {FsPromisesLike} fsPromises File system promises object.
 */

/** @typedef {(file: string, options: "utf8") => Promise<string>} FsPromisesReadFileLike */

/** @typedef {(file: string, data: string, options: "utf8") => Promise<void>} FsPromisesWriteFileLike */

/**
 * @typedef {object} FsPromisesLike
 * @property {FsPromisesReadFileLike} readFile Implementation of node:fs/promises.readFile.
 * @property {FsPromisesWriteFileLike} writeFile Implementation of node:fs/promises.writeFile.
 */
