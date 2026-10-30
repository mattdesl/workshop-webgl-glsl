# Vite Plugin GLSL #

> Import, inline (and minify) GLSL/WGSL/Slang shader files

![npm](https://img.shields.io/npm/dt/vite-plugin-glsl?style=flat-square)
![GitHub package.json version](https://img.shields.io/github/package-json/v/UstymUkhman/vite-plugin-glsl?color=brightgreen&style=flat-square)
![GitHub](https://img.shields.io/github/license/UstymUkhman/vite-plugin-glsl?color=brightgreen&style=flat-square)

_Inspired by [threejs-glsl-loader](https://github.com/MONOGRID/threejs-glsl-loader) and [vite-plugin-string](https://github.com/aweikalee/vite-plugin-string), compatible with [Babylon.js](https://www.babylonjs.com/), [three.js](https://threejs.org/) and [lygia](https://lygia.xyz/)._

## Installation ##

```sh
npm i vite-plugin-glsl --save-dev
# or
yarn add vite-plugin-glsl --dev
# or
pnpm add -D vite-plugin-glsl
# or
bun add vite-plugin-glsl --dev
```

## Usage ##

```js
// vite.config.js
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()]
});
```

### With TypeScript ###

Add extension declarations to your [`types`](https://www.typescriptlang.org/tsconfig#types) in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": [
      "vite-plugin-glsl/ext"
    ]
  }
}
```

or as a [package dependency directive](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-types-) to your global types:

```ts
/// <reference types="vite-plugin-glsl/ext" />
```

### With Slang Shaders ###

Slang shaders are not supported out of the box; however, starting from version `1.6.0`, it's quite easy to use them with this plugin. You'll need some minimal setup you can find [here](https://github.com/UstymUkhman/vite-plugin-glsl/blob/main/vite.slang.js) to copy-paste in your `vite.config` file. The idea is to use multiple `importKeywords` to include Slang shader chunks and convert the output shader to a web-friendly format (like `WGSL`) by using the `onComplete` option and the Slang compiler.

## Default Options ##

```js
glsl({
  include: [                      // Glob pattern, or array of glob patterns to import
    '**/*.glsl', '**/*.wgsl',
    '**/*.vert', '**/*.frag',
    '**/*.vs', '**/*.fs'
  ],
  exclude: undefined,             // Glob pattern, or array of glob patterns to ignore
  defaultExtension: 'glsl',       // Shader suffix to use when no extension is specified
  warnDuplicatedImports: true,    // Warn if the same chunk was imported multiple times
  removeDuplicatedImports: false, // Automatically remove an already imported chunk
  importKeywords: ['#include'],   // Keywords used to import shader chunks
  onComplete: undefined,          // Function to call with output shader
  minify: false,                  // Minify/optimize output shader code
  watch: true,                    // Recompile shader on change
  root: '/'                       // Directory for root imports
})
```

## Example ##

```
root
├── src/
│   ├── glsl/
│   │   ├── chunk0.frag
│   │   ├── chunk3.frag
│   │   ├── main.frag
│   │   ├── main.vert
│   │   └── utils/
│   │       ├── chunk1.glsl
│   │       └── chunk2.frag
│   └── main.js
├── vite.config.js
└── package.json
```

```js
// main.js
import fragment from './glsl/main.frag';
```

```glsl
// main.frag
#version 300 es

#ifndef GL_FRAGMENT_PRECISION_HIGH
  precision mediump float;
#else
  precision highp float;
#endif

out vec4 fragColor;

#include chunk0.frag;

void main (void) {
  fragColor = chunkFn();
}
```

```glsl
// chunk0.frag

// ".glsl" extension will be added automatically:
#include utils/chunk1;

vec4 chunkFn () {
  return vec4(chunkRGB(), 1.0);
}
```

```glsl
// utils/chunk1.glsl

#include chunk2.frag;
#include ../chunk3.frag;

vec3 chunkRGB () {
  return vec3(chunkRed(), chunkGreen(), 0.0);
}
```

```glsl
// utils/chunk2.frag

float chunkRed () {
  return 0.0;
}
```

```glsl
// chunk3.frag

float chunkGreen () {
  return 0.8;
}
```

Will result in:

```glsl
// main.frag
#version 300 es

#ifndef GL_FRAGMENT_PRECISION_HIGH
  precision mediump float;
#else
  precision highp float;
#endif

out vec4 fragColor;

float chunkRed () {
  return 0.0;
}

float chunkGreen () {
  return 0.8;
}

vec3 chunkRGB () {
  return vec3(chunkRed(), chunkGreen(), 0.0);
}

vec4 chunkFn () {
  return vec4(chunkRGB(), 1.0);
}

void main (void) {
  fragColor = chunkFn();
}
```

## Change Log ##

- Starting from `v1.6.0` this plugin supports `onComplete` callback function to customize output shaders.

- Starting from `v1.5.2` this plugin uses `vite.transformWithOxc` function when available.

- Starting from `v1.5.1` this plugin is fully compatible with `vite^7.0.0`.

- Starting from `v1.5.0` this plugin supports a custom `importKeyword` to include shader chunks.

- Starting from `v1.4.0` `compress` option was renamed to `minify` and now it allows a promise callback.

- Starting from `v1.3.2` this plugin allows to automatically remove already imported chunks with the `removeDuplicatedImports` option set to `true`.

- Starting from `v1.3.1` this plugin is fully compatible with `vite^6.0.0`.

- Starting from `v1.3.0` this plugin will not remove comments starting with `///`, unless `compress` option is set to `true`.

- Starting from `v1.2.0` this plugin is fully compatible with `vite^5.0.0`.

- Starting from `v1.1.1` this plugin has a complete TypeScript support. Check "Usage" > "With TypeScript" for more info.

- Starting from `v1.0.0` this plugin is fully compatible with `vite^4.0.0`.

- Starting from `v0.5.4` this plugin supports custom `compress` callback function to optimize output shader length after all shader chunks have been included.

- Starting from `v0.5.0` this plugin supports shaders hot reloading when `watch` option is set to `true`.

- Starting from `v0.4.0` this plugin supports chunk imports from project root and `root` option to override the default root directory.

- Starting from `v0.3.0` this plugin is pure [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). Consider updating your project to an ESM module by adding `"type": "module"` in your `package.json` or consult [this](https://github.com/UstymUkhman/vite-plugin-glsl/issues/16) issue for possible workarounds.

- Starting from `v0.2.2` this plugin supports `compress` option to optimize output shader length. You might consider setting this to `true` in production environment.

- Starting from `v0.2.0` this plugin uses a config object as a single argument to `glsl` function and allows to disable import warnings with the `warnDuplicatedImports` param set to `false`.

- Starting from `v0.1.5` this plugin warns about duplicated chunks imports and throws an error when a recursive loop occurres.

- Starting from `v0.1.2` this plugin generates sourcemaps using vite esbuild when the `sourcemap` [option](https://github.com/UstymUkhman/vite-plugin-glsl/blob/main/vite.config.js#L5) is set to `true`.

- Starting from `v0.1.0` this plugin supports WebGPU shaders with `.wgsl` extension.

- Starting from `v0.0.9` this plugin supports optional semicolons at the end of `#include` statements.

- Starting from `v0.0.7` this plugin supports optional single and double quotation marks around file names.

### Note: ###

When used with [three.js](https://github.com/mrdoob/three.js) r0.99 and higher, it's possible to include shader chunks as specified in the [documentation](https://threejs.org/docs/index.html?q=Shader#api/en/materials/ShaderMaterial), those imports will be ignored by `vite-plugin-glsl` since they are handled internally by the library itself:

```glsl
#include <common>

vec3 randVec3 (const in vec2 uv) {
  return vec3(
    rand(uv * 0.1), rand(uv * 2.5), rand(uv)
  );
}
```
