# number-editor

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

![img](http://i.imgur.com/JEQp2Br.gif)

A simple number editor or spinner that acts like those in After Effects and similar software. You can click and drag to slide the value, or double-click to enter a new value. You can use up/down while editing to increment and decrement the value. Holding command/control will step by smaller values, and holding shift will step by larger values.

```js
var opts = {
    min: 0,
    max: 1,
    step: 0.01,
    decimals: 2
}

require('domready')(function() {
	var spinner = require('number-editor')(opts)
    document.body.appendChild(spinner.element)
})
```

For one that accepts units (like `%` or `px`) see [number-unit-editor](https://nodei.co/npm/number-unit-editor/).

## Usage

[![NPM](https://nodei.co/npm/number-editor.png)](https://nodei.co/npm/number-editor/)


#### `editor = createEditor([options])`

Creates a new number editor with the given options.

- `min` the minimum value, default no minimum 
- `max` the maximum value, default no maximum
- `step` the step to increment when sliding and with up/down arrows. Default 1.
- `decimals` the number of decimals to show, default none (i.e. round to whole numbers)
- `value` the default value to show
- `element` the input element, default creates a new one
- `stepModifier` how much to multiply/divide with the modifier keys (shift and control/meta). Default is 10. 
- `dragScale` how much to multiply sliding when dragging. Default is half the step. 
- `cursor` a boolean, whether to change cursor style (default true)
- `parent` the parent container which receives out-of-element mouse events. Default is `document`. This is passed onto [clickdrag](https://www.npmjs.org/package/clickdrag) and can be an instance of EventEmitter if you want to avoid duplicate document events.
- `cursorParent` the parent container that changes cursors during out-of-element mouse events. Default is `document.body`. 
- `touch` prepare the element for mobile/touch devices (acts like a simple number box)

#### `editor.on('change', listener)`

Handle an event when the number changes. The new value is passed as the parameter.

#### `editor.on('edit-start')`
#### `editor.on('edit-stop')`

Events for start and stop of editing (manual typing). 

#### `editor.editing`

A read-only value that returns true if the box is being edited (i.e. user is typing manually).

#### `editor.dispose()`

Removes this element from its parent node and dispoess the drag events on the parent element.

## demo

To run the demo from source, clone this repo and follow these steps:


```sh
git clone https://github.com/mattdesl/number-editor.git
cd number-editor
npm install

## now run the demo 
npm run demo
```

Open `localhost:9966` to see the result.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/number-editor/blob/master/LICENSE.md) for details.
