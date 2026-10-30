/** @typedef {Promise<string> | string} MinifyResult */
type OnCompleteOutput = Promise<string> | string;

/**
 * @typedef {((shader: string, path: string) => OnCompleteOutput) | undefined} OnComplete
 *
 * @param {string} shader Shader code with included chunks
 * @param {string} path   Shader's absolute path
 *
 * @returns {string} Must return the complete shader
 */
type OnComplete = ((shader: string, path: string) => OnCompleteOutput) | undefined;

/** @typedef {string | string[]} GlobPattern */
type GlobPattern = string | string[];

/**
 * @typedef {Object} LoadingOptions
 * @description Shader loading config object
 * 
 * @property {string}     defaultExtension        Shader suffix to use when no extension is specified
 * @property {boolean}    warnDuplicatedImports   Warn if the same chunk was imported multiple times
 * @property {boolean}    removeDuplicatedImports Automatically remove an already imported chunk
 * @property {string[]}   importKeywords          Keywords used to import shader chunks
 * @property {OnComplete} onComplete              Function to call with output shader
 * @property {boolean}    minify                  Minify/optimize output shader code
 * @property {string}     root                    Directory for root imports
 */
export type LoadingOptions = {
  warnDuplicatedImports: boolean;
  removeDuplicatedImports: boolean;
  defaultExtension: string;
  importKeywords: string[];
  onComplete: OnComplete;
  minify: boolean;
  root: string;
};

/**
 * @since 0.2.0
 * @extends LoadingOptions
 * @typedef {Object} PluginOptions
 * @description Plugin config object
 * 
 * @property {GlobPattern} include Glob pattern(s array) to import
 * @property {GlobPattern} exclude Glob pattern(s array) to ignore
 * @property {boolean}     watch   Recompile shader on change
 * 
 * @default {
 *   include: Object.freeze([
 *     '**\/*.glsl', '**\/*.wgsl',
 *     '**\/*.vert', '**\/*.frag',
 *     '**\/*.vs', '**\/*.fs'
 *   ]),
 *   exclude: undefined,
 *   defaultExtension: 'glsl',
 *   warnDuplicatedImports: true,
 *   removeDuplicatedImports: false,
 *   importKeywords: ['#include'],
 *   onComplete: undefined,
 *   minify: false,
 *   watch: true,
 *   root: '/'
 * }
 */
export type PluginOptions = Partial<LoadingOptions> & {
  include?: GlobPattern;
  exclude?: GlobPattern;
  watch?: boolean;
};

/**
 * @since 1.1.2
 * @typedef {Object} LoadingOutput
 * 
 * @returns {LoadingOutput} Loaded, parsed (and minified)
 * shader output and Map of shaders that import other chunks
 * 
 * @property {Map<string, string[]>} dependentChunks Map of shaders that import other chunks
 * @property {string}                outputShader    Shader file with included chunks
 */
export type LoadingOutput = {
  dependentChunks: Map<string, string[]>;
  outputShader: string;
};
