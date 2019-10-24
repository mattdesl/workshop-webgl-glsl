/** @jsx h */
global.THREE = require('three');
require('three/examples/js/controls/OrbitControls');

require('normalize.css');

const { render, h } = require('preact');
const App = require('./ui/App');
const createContents = require('./util/createContents');
const appContents = require('./contents');
const { MDXProvider } = require('@mdx-js/react');
const CodeBlock = require('./ui/CodeBlock');

const contents = createContents(appContents);

// Some global utilities for the eval() functions
window.DrawCodeUtils = {
  Random: require('canvas-sketch-util/random'),
  Math: require('canvas-sketch-util/math'),
  Color: require('canvas-sketch-util/color')
};

const components = {
  pre: props => <div {...props} />,
  code: CodeBlock,
  a: props => {
    const isAbsolute = /https?\:\/\//i.test(props.href || '');
    const target = isAbsolute ? '_blank' : undefined;
    return <a target={target} href={props.href}>{props.children}</a>;
  }
};

render(
  <MDXProvider components={components}>
    <App contents={contents} />
  </MDXProvider>,
  document.body.querySelector('#app')
);
