import { defineConfig } from 'vite';
import restart from 'vite-plugin-restart';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import glsl from 'vite-plugin-glsl';
import { transformSync } from '@babel/core';
import path from 'path';

export default defineConfig({
  publicDir: 'Public/workshop-webgl2-glsl-es-3.00',
  base: '/workshop-webgl2-glsl-es-3.00/',
  server: {
    host: true,
    open: true
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 2000
  },
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'preact-emotion': 'goober',
      'glsl-aastep': path.resolve(import.meta.dirname, 'node_modules/glsl-aastep/index.glsl')
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.md']
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify('development')
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    },
    include: [
      'three',
      'preact',
      'preact/compat',
      'chromotome',
      '@mdx-js/react',
      'canvas-sketch-util/random',
      'canvas-sketch-util/math',
      'canvas-sketch-util/color',
      'prism-react-renderer'
    ]
  },
  plugins: [
    mdx({
      jsxImportSource: 'preact',
      // Let MDX use the CodeBlock overrides registered by MDXProvider.
      providerImportSource: '@mdx-js/react',
      format: 'mdx',
      mdxExtensions: ['.md', '.mdx'],
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter]
    }),
    restart({ restart: ['vite.config.js'] }),
    glsl(),
    {
      name: 'legacy-decorator-and-jsx-transformer',
      enforce: 'pre',
      transform(code, id) {
        if (id.includes('node_modules')) return null;
        const filename = id.split('?')[0];
        if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
          const result = transformSync(code, {
            filename,
            presets: [],
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-transform-class-properties', { loose: true }],
              ['@babel/plugin-transform-react-jsx', { pragma: 'h', pragmaFrag: 'Fragment' }]
            ],
            sourceMaps: true,
            configFile: false,
            babelrc: false
          });
          return {
            code: result.code,
            map: result.map
          };
        }
        return null;
      }
    }
  ]
});
