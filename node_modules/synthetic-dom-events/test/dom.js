// helper methods for dom

var on = function(el, type, fn, capture) {
    if (el.addEventListener) {
        el.addEventListener(type, fn, capture || false);
    } else {
        var res = el.attachEvent('on' + type, fn);
        if (!res) {
            throw new Error('unable to bind event: ' + type);
        }
    }

    return fn;
};

var create = function(str) {
    var el = document.createElement(str);
    document.body.appendChild(el);
    return el;
};

var emit = function(element, event) {
    if (element.dispatchEvent) {
        element.dispatchEvent(event);
    }
    else {
        element.fireEvent('on' + event.type, event);
    }
};

module.exports.on = on;
module.exports.create = create;
module.exports.emit = emit;
