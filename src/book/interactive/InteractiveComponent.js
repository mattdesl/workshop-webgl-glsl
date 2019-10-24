/** @jsx h */
const { h, Component } = require("preact");
const CodeEditor = require("./CodeEditor");
const defined = require("defined");
const canvasSketch = require("canvas-sketch");
const screenfull = require("screenfull");
const Params = require("./Params");
const cloneDeep = require("lodash.clonedeep");
const merge = require("lodash.merge");
const UI = require("../util/UI");
const fastDeepEqual = require("fast-deep-equal");
const resetSVG = require("../assets/image/baseline-refresh-24px.svg");
const enterFullcreenSVG = require("../assets/image/baseline-fullscreen-24px.svg");
const exitFullcreenSVG = require("../assets/image/baseline-fullscreen_exit-24px.svg");
const noop = () => {};

require("./InteractiveComponent.scss");

class Canvas extends Component {
  constructor(props) {
    super(props);
    this._disposed = false;
  }

  componentDidMount() {
    this.setup();
    this._updateError();
  }

  async setup() {
    this.unload();
    this._disposed = false;

    try {
      this.manager = await canvasSketch(this.props.sketch, {
        ...this.props.settings,
        hotkeys: false,
        data: {
          params: this.props.params,
          evaluateError: this.props.evaluateError,
          evaluateResult: this.props.evaluateResult
        },
        maxPixelRatio: 2,
        canvas: this.canvas,
        parent: this.canvasContainer
      });
      await document.fonts.ready;
      this.handleParamsChange(this.props);
      this.handleCodeChange(this.props);
      this.manager.update(); // re-render after fonts are ready
      if (this.manager.sketch && this.manager.sketch.compileError) {
        throw this.manager.sketch.compileError;
      }
      this._onRuntimeSuccess();
    } catch (err) {
      this._onRuntimeError(err);
    }
  }

  componentWillUnmount() {
    this.unload();
  }

  unload() {
    if (!this._disposed) {
      this._disposed = true;
      if (this.manager) {
        this.manager.stop();
        this.manager.unload();
        this.manager = null;
      }
    }
  }

  reset() {
    this.handleParamsChange(this.props);
    this.handleCodeChange(this.props);
    if (
      this.manager &&
      this.manager.sketch &&
      typeof this.manager.sketch.reset === "function"
    ) {
      this.manager.sketch.reset(this.manager.props);
      this.manager.update();
    }
  }

  handleCodeChange(state) {
    if (
      this.manager &&
      this.manager.sketch &&
      typeof this.manager.sketch.onCodeUpdate === "function"
    ) {
      this.manager.sketch.onCodeUpdate({
        ...this.manager.props,
        data: {
          ...this.manager.props.data,
          params: state.params,
          evaluateError: state.evaluateError,
          evaluateResult: state.evaluateResult
        }
      });
      this.manager.update();
    }
  }

  handleParamsChange(state) {
    if (
      this.manager &&
      this.manager.sketch &&
      typeof this.manager.sketch.onParamsUpdate === "function"
    ) {
      this.manager.sketch.onParamsUpdate({
        ...this.manager.props,
        data: {
          ...this.manager.props.data,
          params: state.params,
          evaluateError: state.evaluateError,
          evaluateResult: state.evaluateResult
        }
      });
      this.manager.update();
    }
  }

  _onRuntimeSuccess() {
    this._runtimeError = null;
    this._updateError();
  }

  _onRuntimeError(err) {
    this._runtimeError = err;
    this._updateError();
    if (
      this.manager &&
      this.manager.sketch &&
      this.manager.sketch.onRuntimeError
    ) {
      this.manager.sketch.onRuntimeError();
    }
  }

  _updateError() {
    if (!this.canvasContainer) return;

    this.canvasContainer.classList.remove("has-runtime-error");
    if (this._runtimeError) {
      this.canvasContainer.classList.add("has-runtime-error");
    }
    if (this.errorContainer && this.errorLabel) {
      this.errorContainer.style.display = this._runtimeError ? "flex" : "none";
      this.errorLabel.textContent = this._runtimeError
        ? this._runtimeError.message
        : "";
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps(nextProps) {
    if (this.manager) {
      try {
        this.manager.update({
          data: {
            params: nextProps.params,
            evaluateError: nextProps.evaluateError,
            evaluateResult: nextProps.evaluateResult
          }
        });
        if (this.manager.sketch && this.manager.sketch.compileError) {
          throw this.manager.sketch.compileError;
        }
        this._onRuntimeSuccess();
      } catch (err) {
        this._onRuntimeError(err);
      }
    }
  }

  render() {
    return (
      <div
        class="InteractiveComponentCanvasContainer"
        ref={c => {
          this.canvasContainer = c;
        }}
      >
        <canvas
          class="InteractiveComponentCanvas"
          ref={c => {
            this.canvas = c;
          }}
        />
        <div
          class="InteractiveComponentCanvasError"
          ref={c => {
            this.errorContainer = c;
          }}
        >
          <label class="InteractiveComponentCanvasErrorHeader">
            Runtime Error
          </label>
          <label
            ref={c => {
              this.errorLabel = c;
            }}
          />
        </div>
      </div>
    );
  }
}

class InteractiveComponent extends Component {
  constructor(props) {
    super(props);
    const params = this.props.params || {};
    this.initialProps = cloneDeep(this.props);
    this.initialParams = this.initialProps.params || {};

    const evalState = this.getNewEvaluatedState(this.props.code, params);
    this.state = {
      params,
      ...evalState
    };

    this._handleFullscreenChange = () => {
      this.forceUpdate();
    };
  }

  componentDidMount() {
    // console.log('mount', this.initialParams, this.props.params)
    screenfull.on("change", this._handleFullscreenChange);
  }

  async toggleFullscreen() {
    if (screenfull.enabled) {
      await screenfull.toggle(this.container);
    }
  }

  resetState() {
    this._reset();
  }

  _reset(ev) {
    merge(this.state.params, this.initialParams);
    this.handleParamsChange(this.state.params, this.initialProps.code, () => {
      if (this.editor) this.editor.reset();
      if (this.canvas) this.canvas.reset();
    });
  }

  componentWillUnmount() {
    merge(this.state.params, this.initialParams);
    this.handleParamsChange(this.state.params, this.initialProps.code, () => {
      if (this.editor) this.editor.unload();
      if (this.canvas) this.canvas.unload();
    });
    screenfull.off("change", this._handleFullscreenChange);
  }

  handleParamsChange(params, code = this.state.code, cb = noop) {
    // Mutate object rather than createa copy,
    // as it holds the UI metadata
    const newParams = Object.assign(this.state.params, params);
    const newCodeState = this.getNewEvaluatedState(code, newParams);
    const newState = {
      ...newCodeState,
      params: newParams
    };
    if (this.canvas) {
      this.canvas.handleParamsChange({
        ...this.state,
        ...newState
      });
    }
    this.setState(newState, () => {
      cb();
    });
  }

  handleCodeChange(code) {
    const newState = this.getNewEvaluatedState(code, this.state.params);
    if (this.canvas) {
      this.canvas.handleCodeChange({
        ...this.state,
        ...newState
      });
    }
    this.setState(newState, () => {});
  }

  getNewEvaluatedState(code, params) {
    let evaluateResult, evaluateError;
    try {
      evaluateResult = this.props.evaluate(code, params);
      evaluateError = undefined;
    } catch (err) {
      evaluateError = err;
      evaluateResult = undefined;
    }
    return {
      code,
      evaluateResult,
      evaluateError
    };
  }

  render() {
    const {
      showCanvas,
      showParams,
      showCode,
      settings,
      evaluate,
      glsl,
      sketch
    } = this.props;
    const els = [
      showCanvas && (
        <Canvas
          ref={c => {
            this.canvas = c;
          }}
          sketch={sketch}
          settings={settings}
          evaluateError={this.state.evaluateError}
          evaluateResult={this.state.evaluateResult}
          params={this.state.params}
        />
      ),
      showParams && (
        <Params
          ref={c => {
            this.params = c;
          }}
          onChange={e => this.handleParamsChange(e)}
          params={this.state.params}
        />
      )
    ].filter(Boolean);
    let size = defined(this.props.size, "medium");
    const classname = ["InteractiveComponent", size].join(" ");
    const dynamicParams = Object.keys(this.state.params)
      .map(key => {
        const control = UI.getControlData(this.state.params, key);
        if (!control) return null;
        if (control.variable === true) {
          return key;
        }
      })
      .filter(Boolean);

    return (
      <div
        class={classname}
        ref={c => {
          this.container = c;
        }}
      >
        {showCanvas && showParams && showCode ? (
          <div class="InteractiveComponentPanel">{els}</div>
        ) : (
          els
        )}
        {showCode && (
          <div class="InteractiveComponentCode">
            <CodeEditor
              thirdPartyKeywords={this.props.thirdPartyKeywords}
              dynamicKeywords={dynamicParams}
              ref={c => {
                this.editor = c;
              }}
              evaluateError={this.state.evaluateError}
              evaluate={evaluate}
              code={this.state.code}
              glsl={glsl}
              onChange={code => this.handleCodeChange(code)}
            />
          </div>
        )}
        <div class="InteractiveComponentToolbar">
          <div
            class="InteractiveComponentToolbarButton"
            onClick={() => this.resetState()}
          >
            <img src={resetSVG} />
          </div>
          <div
            class="InteractiveComponentToolbarButton"
            onClick={() => this.toggleFullscreen()}
          >
            <img
              src={
                screenfull.isFullscreen ? exitFullcreenSVG : enterFullcreenSVG
              }
            />
          </div>
        </div>
      </div>
    );
  }
}

InteractiveComponent.defaultProps = {
  showCanvas: true,
  showParams: false,
  showCode: false,
  evaluate: code => {
    /* eslint no-eval: 0 */
    return window.eval(code);
  },
  sketch: () => {
    return ({ context, width, height }) => {
      // console.log(width, height);
      context.fillStyle = "red";
      context.fillRect(0, 0, width, height);
      const margin = width * 0.01;
      context.fillStyle = "blue";
      context.fillRect(margin, margin, width - margin * 2, height - margin * 2);
    };
  },
  settings: {}
};

module.exports = InteractiveComponent;
