var assert = require('assert');
var eve = require('./');

// need to append to body for IE testing
var create = function(what) {
    var el = document.createElement(what);
    document.body.appendChild(el);
    return el;
};

test('on', function(done) {
    var div = create('div');
    eve.on(div, 'click', function(ev) {
        assert.ok(ev);
        done();
    });

    eve.emit(div, 'click');
});

test('off', function(done) {
    var div = create('div');

    var fn = function(ev) {
        assert.ok(ev);

        eve.off(div, 'click', fn);
        eve.emit(div, 'click');
        done();
    };

    eve.on(div, 'click', fn);
    eve.emit(div, 'click');
});

test('once', function(done) {
    var div = create('div');
    eve.once(div, 'click', function(ev) {
        assert.ok(ev);
        done();
    });

    eve.emit(div, 'click');
    eve.emit(div, 'click');
});
