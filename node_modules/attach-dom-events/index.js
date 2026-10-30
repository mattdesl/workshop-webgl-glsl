var domEvents = require('dom-events')

function helper(func, element, events) {
	events = events||{}
	for (var k in events) {
		if (events.hasOwnProperty(k)) 
			func(element, k, events[k])
	}
}

var on = helper.bind(this, domEvents.on)

module.exports = on
module.exports.on = on
module.exports.off = helper.bind(this, domEvents.off)
module.exports.once = helper.bind(this, domEvents.once)