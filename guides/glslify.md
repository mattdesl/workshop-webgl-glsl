# glslify

[glslify](https://github.com/glslify/glslify) is a module system and
preprocessor for composing GLSL files. It can resolve shader modules from
npm packages and combine them at build time.

glslify is optional. Installing a GLSL package alone does not make its
`#pragma glslify` directives work: a glslify transform must process the shader.

## Use glslify from its CLI

In a separate shader project, install the preprocessor and a shader module:

```sh
npm install --save-dev glslify glsl-noise
```

For example, save this as `src/shaders/fragment.glsl`:

```glsl
#pragma glslify: snoise = require(glsl-noise/simplex/2d)

precision highp float;

varying vec2 vUv;

void main() {
  float noise = snoise(vUv);
  gl_FragColor = vec4(vec3(noise * 0.5 + 0.5), 1.0);
}
```

Compile the source into a file your app can load:

```sh
npx glslify src/shaders/fragment.glsl -o src/shaders/fragment.bundle.glsl
```

The generated file contains the imported code. See the
[glslify documentation](https://github.com/glslify/glslify) for its API,
CLI, and examples.

## This workshop's Vite setup

The project uses `vite-plugin-glsl` to import shader files. Its default
`importKeywords` setting handles `#include` directives. That syntax is
different from glslify's `#pragma glslify` syntax.

The current `vite.config.js` does not configure a glslify transform.
Therefore, glslify pragmas in a shader are not resolved automatically. To use
glslify modules here, add a build step or configure a compatible transform,
then import the generated shader. See the
[vite-plugin-glsl documentation][vite-plugin-glsl] for the syntax supported
by this project's Vite plugin.

[vite-plugin-glsl]: https://github.com/UstymUkhman/vite-plugin-glsl
