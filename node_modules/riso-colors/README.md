# riso-colors

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

A list of popular colors for Risograph printers, sourced from [stencil.wiki/colors](http://stencil.wiki/colors). Only includes colors with HEX, Pantone and Z-Type codes.

```js
const colors = require('riso-colors');

// Print a random color
const color = colors[Math.floor(Math.random() * colors.length)];
console.log(color);
```

Each "color" is an object, like so:

```js
{
  name: 'Marine Red',
  hex: '#d2515e',
  pantone: '186 U',
  zType: 'S-4281'
}
```

*Last Updated:* Feb 25, 2019

## Install

Use [npm](https://npmjs.com/) to install.

```sh
npm install riso-colors --save
```

## Scraping

You can scrape the JSON yourself from the [stencil.wiki/colors](http://stencil.wiki/colors) website by pasting this in the console and executing it:

```js
var result = Array.from($$('.color-meta')).map(el => {
  const hex = el.querySelector('.views-field-field-ink-color-hex .field-content').textContent.replace(/#/, '').toLowerCase();
  const pantoneEl = el.querySelector('.views-field-field-ink-color-pantone .field-content');
  const zTypeEl = el.querySelector('.views-field-field-article-z-type-part-number .field-content');
  const name = el.querySelector('.views-field-name a').textContent;
  if (!hex || !zTypeEl || !pantoneEl) return false;
  const pantone = pantoneEl ? pantoneEl.textContent.toUpperCase() : undefined;
  const zType = zTypeEl ? zTypeEl.textContent.toUpperCase() : undefined;
  return { name, hex: `#${hex}`, pantone, zType };
}).filter(Boolean);
console.dir(result);
copy(JSON.stringify(result, undefined, 2));
```

This will copy the formatted JSON to your clipboard.

*Note:* This snippet may eventually break if stencil.wiki decides to update its HTML code.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/riso-colors/blob/master/LICENSE.md) for details.
