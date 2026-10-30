# Node.js and npm

Node.js runs JavaScript tools outside the browser. npm installs and manages
packages. This repository uses Vite 7 and JavaScript ES modules.

## Install Node.js

Use a supported Node.js LTS release. Node.js 24 LTS is a conservative choice
for this project. Vite 7 requires Node.js 20.19 or newer

- [Download Node.js](https://nodejs.org/en/download)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
- [Vite guide](https://vite.dev/guide/)

On Windows, the official installer is the simplest option. On macOS or Linux,
a Node version manager makes it easier to switch between Node.js versions.
After installation, open a new terminal.

Check that Node.js and npm are available:

```sh
node --version
npm --version
```

## Run this project

Open a terminal in the repository folder. Install the exact dependency
versions recorded in the lockfile, then start the development server:

```sh
npm ci
npm run dev
```

Vite prints a local address in the terminal. Open that address in a browser.
Keep the terminal open while working; press `Ctrl+C` to stop the server.

To create a production build:

```sh
npm run build
```

This project uses the scripts in `package.json`. Use `npm run` to see them.

## Install packages

Run package commands from the project folder. npm records dependencies in
`package.json` and updates `package-lock.json`.

Install a package needed by the running app:

```sh
npm install package-name
```

Install a development tool used during development or builds:

```sh
npm install --save-dev package-name
```

Use `npm ci` when setting up a project from its lockfile. Use `npm install`
when adding or updating dependencies. Commit the lockfile with the manifest
so other contributors can install the same dependency tree.

Use `npm exec` to run a package command without installing it globally:

```sh
npm exec -- package-command
```

## JavaScript modules

This repository declares `"type": "module"` in `package.json`. Use
`import` and `export` syntax in its JavaScript files:

```js
import * as THREE from 'three';

export function makeScene() {
  return new THREE.Scene();
}
```

For more, see the [Node.js documentation](https://nodejs.org/en/learn).
