/**
 * Plugin to compile MDX w/ rollup.
 *
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @return {Plugin}
 *   Rollup plugin.
 */
export function rollup(options?: Readonly<Options> | null | undefined): Plugin;
/**
 * Applicable compile configuration.
 */
export type ApplicableOptions = Omit<CompileOptions, "SourceMapGenerator">;
/**
 * Extra configuration.
 */
export type ExtraOptions = {
    /**
     * Picomatch patterns to exclude (optional).
     */
    exclude?: FilterPattern | null | undefined;
    /**
     * Picomatch patterns to include (optional).
     */
    include?: FilterPattern | null | undefined;
};
/**
 * Configuration.
 */
export type Options = ApplicableOptions & ExtraOptions;
/**
 * Plugin that is compatible with both Rollup and Vite.
 */
export type Plugin = {
    /**
     *   The name of the plugin
     */
    name: string;
    /**
     *   Function used by Vite to set additional configuration options.
     */
    config: ViteConfig;
    /**
     *   Function to transform the source content.
     */
    transform: Transform;
};
/**
 * Callback called by Rollup and Vite to transform.
 */
export type Transform = (value: string, id: string) => Promise<SourceDescription | undefined>;
/**
 * Callback called by Vite to set additional configuration options.
 */
export type ViteConfig = (config: unknown, env: ViteEnv) => undefined;
/**
 * Environment variables used by Vite.
 */
export type ViteEnv = {
    /**
     *   Mode.
     */
    mode: string;
};
import type { CompileOptions } from '@mdx-js/mdx';
import type { FilterPattern } from '@rollup/pluginutils';
import type { SourceDescription } from 'rollup';
//# sourceMappingURL=index.d.ts.map