
module.exports = function offset(ev, options) {
    ev = ev || window.event;

    var target = ev.currentTarget || ev.srcElement

    var rect = (options && options.clientRect) || getOffset(target),
        clientX = options && options.clientX,
        clientY = options && options.clientY

    clientX = typeof clientX === 'number' ? clientX : ev.clientX
    clientY = typeof clientY === 'number' ? clientY : ev.clientY
    
    return { x: clientX - rect.left, y: clientY - rect.top }
}


var tmpRect = { left: 0, top: 0 }

function getOffset(element) {
    if (element === document.body || element === window) {
        tmpRect.left = 0
        tmpRect.top = 0
    } else {
        var r = element.getBoundingClientRect()
        tmpRect.left = r.left
        tmpRect.top = r.top
    }
    return tmpRect
}