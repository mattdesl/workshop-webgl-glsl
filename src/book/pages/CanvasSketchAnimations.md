export const metadata = {
  title: 'canvas-sketch Animations'
};

# `canvas-sketch` — Animations

This is a little reminder about how to export animations with `canvas-sketch-cli`.

## Hotkey

The hotkey for toggling on/off the animation export is `Cmd + Shift + S` on macOS or `Ctrl + Shift + S` on Windows. You may need to make sure the canvas is in focus by clicking on it prior to using the hotkey.

## Frame Sequences

You can use an output directory so that you don't pollute your Downloads folder, like so:

```sh
canvas-sketch my-sketch.js --output=tmp
```

Now you can hit `Cmd + Shit + S` to export into the `tmp/` folder, relative to your sketch directory.

## FFMPEG Export

If you haven't got `ffmpeg` installed already, you can install this utility module globally:

```sh
npm install @ffmpeg-installer/ffmpeg --global
```

Then, you should be able to use the `--stream` option to stream directly into MP4 files:

```sh
canvas-sketch my-sketch.js --stream
```

Using `Cmd/Ctrl + Shift + S` will export an MP4 file in your Downloads once all frames are rendered.

You can export GIF like so:

```sh
canvas-sketch my-sketch.js --stream=gif
```

Another tip: if you render at `[ 1024, 1024 ]` dimensions, but scale down the GIF while encoding, you might end up with more crisp lines:

```sh
canvas-sketch my-sketch.js --stream [ gif --scale=512:-1 ]
```