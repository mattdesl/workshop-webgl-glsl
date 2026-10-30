# an-array
![](http://img.shields.io/badge/stability-stable-green.svg?style=flat)
![](http://img.shields.io/npm/v/an-array.svg?style=flat)
![](http://img.shields.io/npm/dm/an-array.svg?style=flat)
![](http://img.shields.io/npm/l/an-array.svg?style=flat)

Check if an object is an array or a typed array.

## Usage

[![NPM](https://nodei.co/npm/an-array.png)](https://nodei.co/npm/an-array/)

### `is = anArray(array)`

Returns `true` if the object is one of the following:

* `Float32Array`
* `Float64Array`
* `Uint8ClampedArray`
* `Uint8Array`
* `Uint16Array`
* `Uint32Array`
* `Int8Array`
* `Int16Array`
* `Int32Array`
* `Array`

Otherwise, will return `false`.

## License

MIT. See [LICENSE.md](http://github.com/hughsk/an-array/blob/master/LICENSE.md) for details.
