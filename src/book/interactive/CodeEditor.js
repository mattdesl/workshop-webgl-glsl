/** @jsx h */
const { h, Component } = require('preact');
const Debounce = require('lodash.debounce');

const CodeMirror = require('codemirror');

require('./mode-javascript');
require('./mode-clike.js');

require('codemirror/lib/codemirror.css');
require('codemirror/addon/lint/lint.js');
require('codemirror/addon/lint/lint.css');
require('codemirror/addon/lint/javascript-lint.js');
require('codemirror/keymap/sublime.js');
require('codemirror/addon/comment/comment.js');
require('codemirror/addon/edit/matchbrackets');
require('codemirror/addon/edit/closebrackets');

// require('codemirror/theme/seti.css');
require('codemirror/theme/xq-light.css');
// require('codemirror/theme/tomorrow-night-eighties.css');
// require('codemirror/theme/vibrant-ink.css');
// require('./github-theme.css');
// require('codemirror/theme/monokai.css');
require('./CodeEditor.scss');

window.JSHINT = require('jshint').JSHINT;

class CodeEditor extends Component {
  constructor (props) {
    super(props);
    this._initialCode = this.props.code;
    this._onChange = (_, { origin }) => {
      const newValue = this.editor.getValue();
      if (this.props.code !== newValue) {
        this.props.onChange(newValue);
      }
    };
  }

  componentDidMount () {
    const isGLSL = this.props.glsl;
    this.editor = CodeMirror(this.container, {
      // lineNumbers: true,
      // gutters: [ 'CodeMirror-lint-markers' ],
      lint: isGLSL ? undefined : { es3: false, esversion: 9 },
      keyMap: 'sublime',
      dynamicKeywords: this.props.dynamicKeywords,
      thirdPartyKeywords: this.props.thirdPartyKeywords,
      // theme: 'github',
      mode: isGLSL ? 'x-shader/x-fragment' : 'javascript',
      value: this._initialCode,
      extraKeys: {
        Tab: (cm) => cm.execCommand('indentMore'),
        'Shift-Tab': (cm) => cm.execCommand('indentLess')
      },
      // viewportMargin: Infinity,
      matchBrackets: true,
      autoCloseBrackets: true,
      showCursorWhenSelecting: true,
      dragDrop: false,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false
    });
    this.editor.setSize('100%', '100%');
    const debounce = 200;
    const _onChange = debounce > 0 ? Debounce(this._onChange, debounce, {
      trailing: true,
      leading: false,
      maxWait: 300
    }) : this._onChange;
    this.editor.on('change', _onChange);
    this.wrapper = this.editor.display.wrapper;
    this._updateProps(this.props);
  }

  componentWillReceiveProps (newProps) {
    this._updateProps(newProps);
    if (!newProps.evaluateError && this.props.evaluateError) {
      const newValue = this.editor.getValue();
      this.props.onChange(newValue);
    }
    // if (newProps.code !== this.props.code) {
    //   this.editor.setValue(newProps.code);
    // }
  }

  _updateProps (newProps) {
    if (this.wrapper) {
      this.wrapper.classList.remove('has-runtime-error');
      if (newProps.evaluateError) {
        this.wrapper.classList.add('has-runtime-error');
      }
    }
  }

  reset () {
    this.editor.setValue(this._initialCode);
  }

  componentWillUnmount () {
    this.editor.off('change', this._onChange);
    window.removeEventListener('resize', this._onResize);
  }

  unload () {

  }

  render () {
    if (this.props.evaluateError) {
      console.error(this.props.evaluateError);
    }
    return <div class='CodeEditor'>
      <div class='CodeEditorContainer' ref={c => { this.container = c; }} />
      {this.props.evaluateError && <div class='CodeEditorErrorToast'>{
        `Error: ${this.props.evaluateError.message}`
      }</div>}
    </div>;
  }
}

CodeEditor.defaultProps = {
  onChange: () => {}
};

module.exports = CodeEditor;
