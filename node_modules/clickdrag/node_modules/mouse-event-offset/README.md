# mouse-event-offset

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Gets the offsetX/offsetY from a mouse event, relative to the top left of the target (i.e. clicked) element. This uses `currentTarget` (i.e. the element that you specified for the event) and falls back to `srcElement`.

```js 
var offset = require('mouse-event-offset')
var events = require('dom-events')

events.on(element, 'click', function(e) {
	var pos = offset(e)
	console.log(pos.x, pos.y)
})
```
## Usage

[![NPM](https://nodei.co/npm/mouse-event-offset.png)](https://nodei.co/npm/mouse-event-offset/)

### `offset(event[, options])`

Pass an event object to the function, and a position with `{ x, y }` is returned. The options:

- `clientRect` is a pre-computed bounding client rect or offset (e.g. to avoid reflows), defaults to use the target's `getBoundingClientRect()` (or offset `(0, 0)` in the case of window/body)
- `clientX` is the client x position, defaults to `event.clientX`
- `clientY` is the client y position, defaults to `event.clientY`

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/mouse-event-offset/blob/master/LICENSE.md) for details.
