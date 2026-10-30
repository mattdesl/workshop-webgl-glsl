# synthetic-dom-events

[![browser support](https://ci.testling.com/shtylman/synthetic-dom-events.png)](https://ci.testling.com/shtylman/synthetic-dom-events)

## example

```js
var event = require('synthetic-dom-events');

// event just returns a correctly created dom event object
// you are responsible for emitting it
var ev = event('click', { button: 2 });

var element = document.createElement('button');
element.dispatchEvent(ev);

// or legacy IE
//element.fireEvent('on' + ev.type, ev);
```
