#### <sup>:closed_book: [workshop-webgl-glsl](../README.md) → Intro to GLSL Syntax</sup>

---

# Intro to GLSL Syntax

Shaders will always have a `main` function, like so:

```glsl
void main () {
  // ... shader functionality ...
}
```

When you create variables, you have to specify their type:

- `float` - a simple float value, e.g. `0.75`

- `vec2`, `vec3`, `vec4` - vectors like `(x, y)` or `(r, g, b)`

- `int` - integer, e.g. `4`

- `bool` - boolean `true` or `false`

- `sampler2D` — holds a WebGL texture

- `mat2`, `mat3`, `mat4` - matrix data types

For example:

```glsl
void  main () {
  float a = 25.0;
  int i = 5;
  bool b = true;
}
```

The *vec* types accept other vectors as parameters, but you have to make sure the number of components match:

```glsl 
float alpha = 0.5;
vec3 rgb = vec3(1.0); // (1, 1, 1)
vec4 myRGBA = vec4(rgb, alpha); // (1, 1, 1, 0.5)
```

You can access vectors with `.xyzw` or `.rgba`:

```glsl
vec2 xy = myRGBA.xy;
vec2 rgb = myRGBA.rgb;
float alpha = myRGBA.a;
```

## 

#### <sup>[← Back to README](../README.md)