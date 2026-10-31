# JavaScript and shader modules

A module packages code or data so another part of a project can reuse it.
JavaScript packages are commonly installed from npm. GLSL packages may need
a shader preprocessor or build plugin before the browser can use them.

## Add a JavaScript package

Run npm commands from your project folder. Add a package used by the app:

```sh
npm install package-name
```

Add a package used only by development or the build:

```sh
npm install --save-dev package-name
```

npm updates `package.json` and `package-lock.json`. Commit both files so the
project's dependencies and exact versions stay reproducible. For a fresh
checkout with a lockfile, run `npm ci`.

## Use an installed package

This workshop already uses packages such as Three.js and gl-matrix. Import
them from JavaScript modules:

```js
import * as THREE from 'three';
import { mat4 } from 'gl-matrix';

const scene = new THREE.Scene();
const transform = mat4.create();
```

Check `package.json` before installing a package; it may already be present.
Use `npm ls package-name` to inspect the installed version.

## Choose a package carefully

Before adding a dependency, check:

- Whether it supports the project's current JavaScript and Three.js versions.
- Whether its API and documentation match the version you will install.
- Whether it is actively maintained enough for your needs.
- Its license and required peer dependencies.
- Whether the same feature is already provided by the browser or Three.js.

Use the package's official documentation for version-specific setup. Avoid
copying old tutorials without checking their package versions and import
syntax.

## Shader modules

A GLSL file is not a JavaScript package. It must be imported as shader text
or processed by a tool that understands its syntax.

This repository uses `vite-plugin-glsl` to load GLSL files and `#include`
imports. glslify uses `#pragma glslify` directives and requires its own
transform. See [GLSL syntax](glsl-syntax.md) and [glslify](glslify.md) for
details.
