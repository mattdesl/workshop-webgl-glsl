# attach-dom-events

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Utility to attach multiple dom events to an element. Uses [dom-events](https://www.npmjs.org/package/dom-events).

```js
var attach = require('attach-dom-events')

attach(element, {
	mousemove: function(ev) {
		//..
	},
	keydown: function(ev) {
		//..
	}
})
```

## Usage

[![NPM](https://nodei.co/npm/attach-dom-events.png)](https://nodei.co/npm/attach-dom-events/)

#### ```attach(element[, events])```
#### ```attach.on(element[, events])```

Attaches the dictionary of `events` to `element`, using the keys as event names for `addEventListener`. 

The main exported method is the same as `on`.

#### ```attach.off(element[, events])```

Detaches all the given events.

#### ```attach.once(element[, events])```

Attaches all the given events using `once` instead of `on`.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/attach-dom-events/blob/master/LICENSE.md) for details.
