module.exports = function offset(ev, options) {
    ev = ev || window.event;

    var target = ev.target || ev.srcElement
    var rect = (options && options.clientRect) || target.getBoundingClientRect(),
        clientX = options && options.clientX,
        clientY = options && options.clientY

    clientX = typeof clientX === 'number' ? clientX : ev.clientX
    clientY = typeof clientY === 'number' ? clientY : ev.clientY
    
    return { x: clientX - rect.left, y: clientY - rect.top }
}