var assert = require('assert');

var event = require('../');
var dom = require('./dom');

test('click', function(done) {
    var el = dom.create('div');
    dom.on(el, 'click', function(ev) {
        assert.equal(ev.type, 'click');
        assert.equal(ev.button, 0);
        done();
    });
    dom.emit(el, event('click'));
});

test('click - button 2', function(done) {
    var el = dom.create('div');
    dom.on(el, 'click', function(ev) {
        assert.equal(ev.button, 2);
        done();
    });
    dom.emit(el, event('click', { button: 2 }));
});

