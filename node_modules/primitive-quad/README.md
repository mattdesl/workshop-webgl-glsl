# primitive-quad

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

[![screen](http://i.imgur.com/pp1CRXf.png)](http://glo-js.github.io/primitive-quad/)

[(demo)](http://glo-js.github.io/primitive-quad/)

<!-- iframe: http://glo-js.github.io/primitive-quad/index.html -->

Creates an indexed quad mesh (two triangles), with normals and UVs. It sits on the XY plane with `Z=0`, and positions ranging from `-1.0` to `1.0`.

## Example

```js
var mesh = require('primitive-quad')()

// the simplicial complex
console.log(mesh.positions, mesh.cells)

// rendering attributes
console.log(mesh.uvs)
console.log(mesh.normals)
```

## Usage

[![NPM](https://nodei.co/npm/primitive-quad.png)](https://www.npmjs.com/package/primitive-quad)

#### `mesh = quad([scale])`

Creates a new indexed quad along the XY plane, with an optional `scale` number (defaults to 1).

`scale` can also be an `[x, y]` array to scale each axes independently.

The vertices are in counter-clockwise order, the UV origin is top-left (0 - 1 range), and the normals are negative along the Z axis.

The returned mesh is an object with the following data:

```
{
  positions: [ [x, y, z], [x, y, z], ... ],
  cells: [ [a, b, c], [a, b, c], ... ],
  uvs: [ [u, v], [u, v], ... ],
  normals: [ [x, y, z], [x, y, z], ... ]
}
```

## License

MIT, see [LICENSE.md](http://github.com/glo-js/primitive-quad/blob/master/LICENSE.md) for details.
