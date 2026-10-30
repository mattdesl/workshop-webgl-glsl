var assert = require('assert');

var event = require('../');
var dom = require('./dom');

test('change', function(done) {
    var el = dom.create('input');
    dom.on(el, 'change', function(ev) {
        assert.equal(ev.type, 'change');
        done();
    });
    dom.emit(el, event('change'));
});

test('blur', function(done) {
    var el = dom.create('input');
    dom.on(el, 'blur', function(ev) {
        assert.equal(ev.type, 'blur');
        done();
    });
    dom.emit(el, event('blur'));
});

