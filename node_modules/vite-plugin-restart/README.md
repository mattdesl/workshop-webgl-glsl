<h2 align='center'><samp>vite-plugin-restart</samp></h2>

<p align='center'>Custom files/globs to restart Vite server</p>

<p align='center'>
<a href='https://www.npmjs.com/package/vite-plugin-restart'>
<img src='https://img.shields.io/npm/v/vite-plugin-restart?color=222&style=flat-square'>
</a>
</p>

<br>

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

<br>

## Usage

Install

```bash
npm i vite-plugin-restart -D # yarn add vite-plugin-restart -D
```

Add it to `vite.config.js`

```ts
// vite.config.js
import ViteRestart from 'vite-plugin-restart'

export default {
  plugins: [
    ViteRestart({
      restart: [
        'my.config.[jt]s',
      ]
    })
  ],
}
```

Changes to `my.config.js` or `my.config.ts` will now restart the server automatically.

## Options

```ts
export interface VitePluginRestartOptions {
  /**
   * Enable glob support for watcher (it's disabled by Vite, but add this plugin will turn it on by default)
   * @default true
   */
  glob?: boolean
  /**
   * Delay in ms before restarting the server
   * @default 500
   */
  delay?: number
  /**
   * Array of files to watch, changes to those file will trigger a server restart
   */
  restart?: string | string[]
  /**
   * Array of files to watch, changes to those file will trigger a client full page reload
   */
  reload?: string | string[]
  /**
   * Enable content-based change detection to prevent unnecessary restarts
   * when file metadata changes but content remains the same
   * @default true
   */
  contentCheck?: boolean
}
```

### Content-Based Change Detection

By default, the plugin now uses content-based change detection (`contentCheck: true`). This prevents infinite restart loops when watching auto-generated files that may be rewritten with the same content.

For example, when watching `.eslintrc-auto-import.json`:

```ts
export default {
  plugins: [
    ViteRestart({
      restart: [
        '.eslintrc-auto-import.json',
      ],
      // Content check is enabled by default
      // Only restarts if file content actually changes
      contentCheck: true,
    })
  ],
}
```

The plugin calculates a SHA-256 hash of the file content and only triggers a restart if the hash changes. This solves the problem of:
- Auto-generated files being rewritten during the build process
- File modification timestamps changing without actual content changes
- Infinite restart loops caused by files being regenerated on every server restart

You can disable this feature if needed:

```ts
export default {
  plugins: [
    ViteRestart({
      restart: ['my.config.js'],
      contentCheck: false, // Disable content-based detection
    })
  ],
}
```

## Motivation

Byebye `nodemon -w my.config.js -x 'vite'`

## License

MIT License © 2021 [Anthony Fu](https://github.com/antfu)
