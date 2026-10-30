var test = require('tape').test;
var luminance = require('./');

//test cases
test('luminance functions exist', function(t) {
    var R = 12,
        G = 41,
        B = 62;

    t.equal( luminance(R, G, B), 34.723, 'should export rec601 by default' );
    t.equal( luminance.rec709(R, G, B), 36.3508, 'should export rec709 as a method' );
    t.equal( luminance.rec601(R, G, B), 34.723, 'should export rec601 as a method' );

    t.equal( luminance.rec709([R, G, B]), 36.3508, 'accepts arrays' );
    t.equal( luminance.rec601([R, G, B, 1]), 34.723, 'accepts arrays' );
    t.end();
});