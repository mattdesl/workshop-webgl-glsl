# clickdrag

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Generic low-level click and drag utility for DOM events.

```js
var drag = require('clickdrag')(element)

drag.on('start', startHandler) //mousedown
drag.on('move', moveHandler)   //mousemove + mousemove outside
drag.on('end', stopHandler)    //mouseup
```

## Usage

[![NPM](https://nodei.co/npm/clickdrag.png)](https://nodei.co/npm/clickdrag/)

#### `drag = clickdrag(element[, options])`

Creates a new draggable emitter for the given element.

Options:

- `parent` the element or document to attach mouse outside events, defaults to `document`. This can also be an instance of `EventEmitter` (which emits `mousemove` and `mouseup` with MouseEvent as parameter) to avoid duplicating mouse events on the document.

## events

#### `drag.on('start')`
#### `drag.on('move')`
#### `drag.on('end')`

The start (mousedown), move (mousemove and mousemove outside), and end (mouseup) events. 

Each is emitted with the parameters `(event, offset, delta)`. The `event` is the original MouseEvent. The `offset` is an object with `x` and `y` values, relative to the element you passed at constructor. The `delta` has `x` and `y` delta from where the drag start originated.

*Note:* Keep in mind that the MouseEvent's `target` may not match the element passed to the constructor, since the mousemove/mouseup events need to be triggered on its parent (or the document).

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/clickdrag/blob/master/LICENSE.md) for details.
