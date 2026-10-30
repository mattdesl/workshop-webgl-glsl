---
title: "canvas-sketch"
---

## For the purpose of the workshop, we'll be using a framework called [canvas-sketch](https://github.com/mattdesl/canvas-sketch) to scaffold our generative artworks and interactive projects

- [canvas-sketch Docs](https://github.com/mattdesl/canvas-sketch/tree/master/docs)
- [canvas-sketch Examples](https://github.com/mattdesl/canvas-sketch/tree/master/examples)
- [canvas-sketch-util](https://github.com/mattdesl/canvas-sketch-util)
utilities for math, randomness, etc

You can install it with npm:

```sh
npm install canvas-sketch-cli -g
```

Then, go into a new directory:

```sh
mkdir genart-workshop
cd genart-workshop
```

And scaffold out our first artwork with the `three` template:

```sh
canvas-sketch src/sketch.js --new --template=three
```

Now open [http://localhost:9966/](http://localhost:9966/) to edit
`src/sketch.js`, and the browser should live-reload.
