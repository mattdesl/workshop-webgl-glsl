/**
 * @module vite-plugin-glsl
 * @author Ustym Ukhman <ustym.ukhman@gmail.com>
 * @description Import, inline (and minify) GLSL/WGSL/Slang shader files
 * @version 1.6.2
 * @license MIT
 */

export { minifyShader as minify } from './loadShader.js';
import loadShader from './loadShader.js';
import { emitWarning } from 'process';
import * as Vite from 'vite';

/**
 * @async
 * @function
 * @name glsl
 * @description Plugin entry point to import,
 * inline, (and minify) GLSL/WGSL/Slang shader files
 *
 * @see {@link https://vitejs.dev/guide/api-plugin.html}
 * @link https://github.com/UstymUkhman/vite-plugin-glsl
 *
 * @param {import('./types').PluginOptions} options Plugin config object
 *
 * @returns {import('vite').Plugin} Vite plugin that converts shader code
 */
export default async function ({
    include = Object.freeze([
      '**/*.glsl', '**/*.wgsl',
      '**/*.vert', '**/*.frag',
      '**/*.vs', '**/*.fs'
    ]),
    exclude = undefined,
    defaultExtension = 'glsl',
    warnDuplicatedImports = true,
    removeDuplicatedImports = false,
    importKeywords = ['#include'],
    onComplete = undefined,
    minify = false,
    watch = true,
    root = '/'
  } = {}
) {
  let filter, sourcemap = false;
  const prod = process.env.NODE_ENV === 'production';
  const oxc = typeof Vite.transformWithOxc === 'function';
  const esbuild = typeof Vite.transformWithEsbuild === 'function';

  if (esbuild && !oxc) {
    try { await import('esbuild'); }

    catch {
      emitWarning(`'esbuild' was not found.`, {
        code: 'vite-plugin-glsl',
        detail: 'Please install it as a dev dependency if your vite version does not use rolldown.'
      });
    }

    const [major, minor] = Vite.version.split('.').map(v => +v);

    if (major < 6 || major === 6 && minor < 3) {
      try {
        filter = (await import('@rollup/pluginutils'))
          .createFilter(include, exclude);
      }

      catch {
        emitWarning(`'@rollup/pluginutils' was not found.`, {
          code: 'vite-plugin-glsl',
          detail: 'Please install it as a dev dependency if your vite version is < 6.3.'
        });
      }
    }
  }

  return {
    enforce: 'pre',
    name: 'vite-plugin-glsl',

    configResolved (resolvedConfig) {
      sourcemap = !!resolvedConfig.build.sourcemap;
    },

    transform: {
      filter: { id: { include, exclude } },

      async handler (source, shader) {
        if (filter && !filter(shader)) return;

        const { dependentChunks, outputShader } = await loadShader(source, shader, {
          removeDuplicatedImports,
          warnDuplicatedImports,
          defaultExtension,
          importKeywords,
          onComplete,
          minify,
          root
        });

        watch && !prod && Array.from(dependentChunks.values())
          .flat().forEach(chunk => this.addWatchFile(chunk));

        return await (oxc
          ? Vite.transformWithOxc(`export default ${JSON.stringify(outputShader)};`, shader, { sourcemap })
          : Vite.transformWithEsbuild(outputShader, shader, {
            sourcemap: sourcemap && 'external',
            loader: 'text', format: 'esm',
            minifyWhitespace: prod
          })
        );
      }
    }
  };
}
