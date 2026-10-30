#### <sup>:closed_book: [canvas-sketch-util](../README.md) → [Documentation](./README.md) → `color`</sup>

---

### `canvas-sketch-util/color`

A set of utilities around RGB and HSL colors, including CSS color string handling.

### Example

```js
const Color = require('canvas-sketch-util/color');

// Parse HSL values from a named CSS color
const [ h, s, l ] = Color.parse('crimson').hsl;
//> [ 348, 83, 47 ]

// Offset the H, S, L components of a color
const newColor = Color.offsetHSL('#f0e68c', 5, 10, -15).hex;
//> '#f2ef40'

// Compare two colors to get the contrast ratio
const ratio = Color.contrastRatio('red', 'hsl(200, 0%, 0%)')
//> 5.252

// Blend two colors together with transparency
const background = 'white';
const foreground = 'rgba(250, 0, 0, 0.5)';
const result = Color.blend(background, foreground);
```

### Functions

- [parse](#parse)
- [style](#style)
- [relativeLuminance](#relative-luminance)
- [contrastRatio](#contrast-ratio)
- [offsetHSL](#offset-hsl)
- [blend](#blend)

### Members

- [names](#names)

<a name="parse"></a>

### `result = Color.parse(input)`

Parses the `input` into a "color" object, which provides hex, RGBA and HSLA data. The input can be of the following formats:

- An array which provides `[ red, green, blue ]` or `[ red, green, blue, alpha ]` components

  - The RGB are in 0-255, and the alpha is in 0-1 space

- A CSS color string which is a hex color, named color, RGB(A) or HSL(A) function

- An object with `hex`, `rgba`, `hsla`, `rgb`, or `hsl` properties

- A `'transparent'` color name which equates to `rgba(0, 0, 0, 0)`

For example, all of the following are valid:

```js
Color.parse('rgba(0, 255, 0, 0.25)');
Color.parse([ 0, 255, 0, 0.25 ]);
Color.parse('#00ff0040');
Color.parse('hsla(120, 100, 50, 0.25)');
Color.parse({ hsla: [ 120, 100, 50, 0.25 ] });
```

The above colors all produce the same color `result`, a semi-transparent green:

```js
{
  hex: '#00ff0040',
  alpha: 0.25,
  rgb: [ 0, 255, 0 ],
  rgba: [ 0, 255, 0, 0.25 ],
  hsl: [ 120, 100, 50 ],
  hsla: [ 120, 100, 50, 0.25 ]
}
```

*Note:* Hue values will wrap around to fit within 0-360 degrees.

<a name="style"></a>

### `result = Color.style(input)`

Takes a color input (string, object or array) and returns a CSS color string in the form of `rgb(r, g, b)` or `rgba(r, g, b, a)`.

This is useful to get a consistent string format out of various color input types.

```js
document.body.style.background = Color.style([ 255, 120, 50, 0.25 ]);
```

<a name="relative-luminance"></a>

### `luminance = Color.relativeLuminance(input)`

Gets a [relative luminance](https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef) number from an input color (string, object or array).

<a name="contrast-ratio"></a>

### `ratio = Color.contrastRatio(inputA, inputB)`

Gets a WCAG [contrast ratio](https://www.w3.org/TR/WCAG20-TECHS/G18.html) between two color inputs (either can be strings, objects or arrays).

### `result = Color.offsetHSL(input, h = 0, s = 0, l = 0)`

Parses `input` as a color, then offsets its hue, saturation and lightness by the specified parameters, and returns a newly parsed color object.

```js
const base = '#d28879';

console.log(Color.parse(base).hsl);
//> [ 10, 50, 65 ]

const result = Color.offsetHSL(base, 15, 5, -10);
console.log(result.hsl);
//> [ 25, 55, 55 ]

console.log(result.hex);
//> '#cb824d'
```

Hue will wrap around between 0-360, and saturation and lightness will be clamped between 0 and 100.

<a name="blend"></a>

### `result = Color.blend(background, foreground, opacity = 1.0)`

Blends the `foreground` color on top of the `background`, applying the specified `opacity` to the foreground while blending. Either color input can be as strings, objects or arrays. The `result` is a new color object after blending.

<a name="names"></a>

### `map = Color.names`

A dictionary of CSS color names mapped to their corresponding hex colors.

```js
const hex = Color.names['peachpuff'];
//> '#ffdab9'
```

## 

#### <sup>[← Back to Documentation](./README.md)