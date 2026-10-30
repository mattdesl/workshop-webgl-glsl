# vite-plugin-commonjs

Support commonJS to esm in `vite`

## Install
```shell
npm install @originjs/vite-plugin-commonjs --save-dev
```
or
```shell
yarn add @originjs/vite-plugin-commonjs --dev
```

## Usage
```js
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

export default {
    plugins: [
        viteCommonjs()
    ]
}
```

#### Options

- `exclude: string[]`
  Dependencies to exclude from transform.

-  `include: string[]`
  Dependencies that only need to be transform.

### CommonJS module in node_modules
```js
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'

export default {
    optimizeDeps:{
    esbuildOptions:{
      plugins:[
        esbuildCommonjs(['react-calendar','react-date-picker']) 
      ]
    }
  }
}
```
#### Options

- `include: string[]`
  Dependent modules need to be transform.
