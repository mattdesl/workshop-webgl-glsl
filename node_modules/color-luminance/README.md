[![browser support](https://ci.testling.com/mattdesl/color-luminance.png)](https://ci.testling.com/mattdesl/color-luminance)


# color-luminance 

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Functions for calculating the relative luminance of a RGB color. 
Since this is just a weighted sum, you can pass components in the range
0-255 or 0-1. 

```js
var luminance = require('color-luminance');

//example for RGB inputs in the range 0-255
var Y = luminance(255, 25, 125);

//or with RGB arrays
var Y = luminance([ 255, 25, 125 ]);
```

## coefficients

The exported function uses the [Rec. 601 standard](http://en.wikipedia.org/wiki/Rec._601) for coefficients (used in most digital video formats). 

More details [here](http://haugk.co.uk/2012/11/22/luma-rec-601-vs-rec-709/).

You can instead use the more explicit functions like so, depending on your needs:

```js
var luminance = require('color-luminance');

//Uses Rec. 709 (HDTV) coefficients
//R * 0.2126 + G * 0.7152 + B * 0.0722
var y1 = luminance.rec709(r, g, b);

//Uses Rec. 601 (PAL/NTSC) coefficients
//R * 0.299 + G * 0.587 + B * 0.114
var y2 = luminance.rec601(r, g, b);
```

# license

BSD-3-Clause