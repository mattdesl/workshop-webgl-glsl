export const metadata = {
  title: 'glslify'
};

# `glslify`

Built into `canvas-sketch` is a tool called [glslify](https://www.npmjs.com/package/glslify) that can enable importing GLSL snippets from npm.

To use it, you have to replace your template strings with `glslify(shaderStr)` function calls like so:

```js
// Require glslify at the top of your file
const glslify = require('glslify');

// Wrap template strings with the function
const vertexShader = glslify(`
  void main () {
    // ... usual shader code
  }
`);
```

Now, you can `npm install` a GLSL module such as:

- [glsl-noise](https://www.npmjs.com/package/glsl-noise)
- [glsl-random](https://www.npmjs.com/package/glsl-random)
- [glsl-dither](https://www.npmjs.com/package/glsl-dither)

You use the `#pragma` syntax to import modules, like so:

```glsl
#pragma glslify: noise = require('glsl-noise/simplex/3d');
#pragma glslify: random = require('glsl-random');
#pragma glslify: myUtil = require('./path/to/my-function.glsl');
```

Here's how it looks in a shader:

```js
// Wrap template strings with the function
const vertexShader = glslify(`
  #pragma glslify: noise = require('glsl-noise/simplex/3d');

  void main () {
    float n = noise(position.xyz);
    // do something with n...
  }
`);
```

You can also move your shader to a new file, like `.glsl`, `.vert` or `.frag`, and require it like so in JavaScript:

```js
// glslify still works here
const myShader = require('./someShader.glsl');
```

## Modules

You can make your own modules like so. First create the module and export a single function from it:

`red.glsl`

```glsl
vec3 red () {
  return vec3(1.0, 0.0, 0.0);
}

#pragma glslify: export(red);
```

Now you can import the file from another shader:

`main.glsl`

```glsl
#pragma glslify: red = require('./red.glsl');

void main () {
  vec3 r = red(); // should be (1,0,0)
}
```