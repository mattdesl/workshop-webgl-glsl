# Chromotome

A collection of color palettes used in order to easily colorize new creative coding projects. New palettes will be continuously added, and all existing ones are subject to change.

Installation:

```
npm install -save chromotome
```

Basic usage:

```javascript
// Can both use ES6 import and CommonJS require.
import * as tome from 'chromotome';

// Palettes can be acquired randomly...
let palette = tome.get(); // tome.getRandom() also works.

// ...or by name!
palette = tome.get('miradors'); // tome.getNames() gets you a list of all the different palette names.

// A palette consists of an array of colors together with (usually) a stroke color and a background color.
console.log(palette.colors); // --> ['#ff6936', '#fddc3f', '#0075ca', '#00bb70']
console.log(palette.stroke); // --> '#ffffff'
console.log(palette.background); // --> '#020202'
```

Palette overview:

https://kgolid.github.io/chromotome-site/
