var domval = require('dom-value')
var keycode = require('keycode')

function numeric(code, decimals) {
    if ((code >= 48 && code <= 57) 
        || (code >= 96 && code <= 105))
        return true
    if (code === 43 || code === 45
        || code === 189 || code === 187)
        return true
    return decimals && code === 190
}

module.exports.keydown = function(ev) {
    var k = keycode(ev)
    var step = this.step
    if (ev.metaKey||ev.controlKey)
        step = this.step / this.stepModifier
    else if (ev.shiftKey)
        step = this.step * this.stepModifier

    var old = this.value
    if (k === 'up') {
        ev.preventDefault()
        old += step
        this._setValue(old)
    } else if (k === 'down') {
        ev.preventDefault()
        old -= step
        this._setValue(old)
    } else if (k === 'enter') {
        if (!this.dragEnabled) {
            this.stopEdit()
        } else {
            this.startEdit()
            this.emit('edit')
        }
    }
}

module.exports.touchKeydown = function(ev) {
    var code = ev.which || ev.keyCode
    if (code !== 8 && !numeric(code, this.decimals > 0)) {
        // console.log("HELLO"
        ev.preventDefault()
        ev.stopPropagation()
    }
}

module.exports.dragStart = function(ev) {
    if (this.dragEnabled) {
        this.dragStartValue = this.value
    }
}

module.exports.dblclick = function(opt, ev) {
    if (this.dragEnabled) {
        ev.preventDefault()
        this.startEdit()
        this.emit('edit')
    }
}

module.exports.change = function(opt, ev) {
    this.dragEnabled = true
    if (this.cursor)
        this.element.style.cursor = 'ew-resize'
    this.element.setAttribute('readonly', 'readonly')
    this._setValue( this._parse() )
}

module.exports.blur = function(opt, ev) {
    if (!this.dragEnabled) {
        this.stopEdit()
        this.emit('blur')
    }
} 

module.exports.dragEnd = function(opt, ev) {
    ev.preventDefault()
    if (this.cursor && opt.cursorParent && opt.cursorParent.style)
        opt.cursorParent.style.cursor = 'auto'
}

module.exports.dragMove = function(opt, ev, offset, delta) {        
    if (this.dragEnabled) {
        ev.preventDefault()

        if (this.cursor && opt.cursorParent && opt.cursorParent.style)
            opt.cursorParent.style.cursor = 'ew-resize'

        var step = 1
        if (ev.metaKey||ev.controlKey)
            step = 1/this.stepModifier
        else if (ev.shiftKey)
            step = this.stepModifier

        var newVal = (this.dragStartValue + delta.x * this.dragScale * step)
        this._setValue(newVal)
    }
}