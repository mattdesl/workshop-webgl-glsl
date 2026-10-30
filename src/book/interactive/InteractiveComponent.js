/** @jsx h */
import { h, Component } from 'preact';
import CodeEditor from './CodeEditor';
import defined from 'defined';
import canvasSketch from 'canvas-sketch';
import screenfull from 'screenfull';
import Params from './Params';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import UI from '../util/UI';
import fastDeepEqual from 'fast-deep-equal';
import resetSVG from '../assets/image/baseline-refresh-24px.svg';
import enterFullcreenSVG from '../assets/image/baseline-fullscreen-24px.svg';
import exitFullcreenSVG from '../assets/image/baseline-fullscreen_exit-24px.svg';

const noop = () => {};
const mountedInteractiveComponents = new Set();
let activeInteractiveComponent = null;

import './InteractiveComponent.scss';

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
      const manager = await canvasSketch(this.props.sketch, {
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
      if (this._disposed) {
        manager.stop();
        manager.unload();
        this._releaseContext();
        return;
      }
      this.manager = manager;
      if (typeof ResizeObserver !== "undefined") {
        this._resizeObserver = new ResizeObserver(entries => {
          const entry = entries[entries.length - 1];
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && this.manager) {
            // canvas-sketch updates its backing store on resize, but static
            // sketches also need a draw call after that store is cleared.
            if (this.manager.resize()) this.manager.render();
          }
        });
        this._resizeObserver.observe(this.canvasContainer);
      } else {
        this._handleWindowResize = () => {
          if (this.manager && this.manager.resize()) this.manager.render();
        };
        window.addEventListener("resize", this._handleWindowResize);
      }
      await document.fonts.ready;
      if (this._disposed || !this.manager) return;
      this.handleParamsChange(this.props);
      this.handleCodeChange(this.props);
      this.manager.update(); // re-render after fonts are ready
      if (this.manager.sketch && this.manager.sketch.compileError) {
        throw this.manager.sketch.compileError;
      }
      this._onRuntimeSuccess();
    } catch (err) {
      if (this._disposed) return;
      if (!this.manager) this._releaseContext();
      this._onRuntimeError(err);
    }
  }

  componentWillUnmount() {
    this.unload();
  }

  resize() {
    if (this.manager) {
      this.manager.resize();
      this.manager.render();
    }
  }

  unload() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._handleWindowResize) {
      window.removeEventListener("resize", this._handleWindowResize);
      this._handleWindowResize = null;
    }
    if (!this._disposed) {
      this._disposed = true;
      const hasManager = Boolean(this.manager);
      if (hasManager) {
        this.manager.stop();
        this.manager.unload();
        this.manager = null;
      }
      // getContext() creates a context on a fresh canvas, so only release it
      // after canvasSketch has successfully created a manager for this canvas.
      if (hasManager) this._releaseContext();
    }
  }

  _releaseContext() {
    const gl = this.canvas && this.canvas.getContext("webgl2");
    const extension = gl && gl.getExtension("WEBGL_lose_context");
    if (extension) extension.loseContext();
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
    this._paramsRevision = 0;

    const evalState = this.getNewEvaluatedState(this.props.code, params);
    this.state = {
      params,
      paramsRevision: 0,
      isFullscreenFallback: false,
      ...evalState
    };

    this._handleFullscreenChange = () => {
      this.forceUpdate();
      this._refreshCanvasSize();
    };
    this._handleWindowKeyDown = ev => {
      if (ev.key === "Escape" && this.state.isFullscreenFallback) {
        ev.preventDefault();
        this.setState({ isFullscreenFallback: false }, this._refreshCanvasSize);
        return;
      }

      if (
        ev.key.toLowerCase() === "x" &&
        ev.altKey &&
        !ev.ctrlKey &&
        !ev.metaKey &&
        !ev.shiftKey &&
        !ev.repeat
      ) {
        const target = ev.target;
        const eventIsInsideThisComponent =
          this.container && this.container.contains(target);
        if (
          activeInteractiveComponent !== this &&
          !eventIsInsideThisComponent
        ) return;

        ev.preventDefault();
        this.resetState();
        return;
      }

      if (
        ev.code !== "Space" ||
        ev.repeat ||
        ev.altKey ||
        ev.ctrlKey ||
        ev.metaKey
      ) return;

      const target = ev.target;
      const isInteractiveTarget = Boolean(
        target &&
          typeof target.closest === "function" &&
          target.closest(
            'button, a[href], input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], .cm-editor'
          )
      );
      const eventIsInsideThisComponent = this.container && this.container.contains(target);
      if (
        isInteractiveTarget ||
        (activeInteractiveComponent !== this && !eventIsInsideThisComponent)
      ) return;

      ev.preventDefault();
      this.toggleFullscreen();
    };
    this._handlePointerEnter = () => {
      activeInteractiveComponent = this;
    };
    this._refreshCanvasSize = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.canvas) this.canvas.resize();
        });
      });
    };
  }

  componentDidMount() {
    // console.log('mount', this.initialParams, this.props.params)
    mountedInteractiveComponents.add(this);
    if (!activeInteractiveComponent) activeInteractiveComponent = this;
    if (this.container) {
      this.container.addEventListener("pointerenter", this._handlePointerEnter);
    }
    if (screenfull.isEnabled) {
      screenfull.on("change", this._handleFullscreenChange);
    }
    window.addEventListener("keydown", this._handleWindowKeyDown);
  }

  async toggleFullscreen() {
    if (this.state.isFullscreenFallback) {
      this.setState({ isFullscreenFallback: false }, this._refreshCanvasSize);
      return;
    }
    if (screenfull.isEnabled) {
      try {
        await screenfull.toggle(this.container);
        this._refreshCanvasSize();
        return;
      } catch (error) {
        // Some browsers expose the fullscreen API but reject it for embedded
        // or otherwise restricted documents; use the viewport overlay below.
      }
    }
    this.setState({ isFullscreenFallback: true }, this._refreshCanvasSize);
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
    if (screenfull.isEnabled) {
      screenfull.off("change", this._handleFullscreenChange);
    }
    window.removeEventListener("keydown", this._handleWindowKeyDown);
    if (this.container) {
      this.container.removeEventListener("pointerenter", this._handlePointerEnter);
    }
    mountedInteractiveComponents.delete(this);
    if (activeInteractiveComponent === this) {
      activeInteractiveComponent = mountedInteractiveComponents.values().next().value || null;
    }
  }

  handleParamsChange(params, code = this.state.code, cb = noop) {
    // Mutate object rather than createa copy,
    // as it holds the UI metadata
    const newParams = Object.assign(this.state.params, params);
    const newCodeState =
      this.props.evaluateOnParamsChange === false && code === this.state.code
        ? {
            code,
            evaluateResult: this.state.evaluateResult,
            evaluateError: this.state.evaluateError
          }
        : this.getNewEvaluatedState(code, newParams);
    const newState = {
      ...newCodeState,
      params: newParams,
      paramsRevision: ++this._paramsRevision
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
          paramsRevision={this.state.paramsRevision}
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
    const classname = [
      "InteractiveComponent",
      size,
      this.state.isFullscreenFallback ? "is-fullscreen-fallback" : ""
    ].filter(Boolean).join(" ");
    const isFullscreen = this.state.isFullscreenFallback ||
      (screenfull.isFullscreen && screenfull.element === this.container);
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
          <button
            type="button"
            class="InteractiveComponentToolbarButton"
            onClick={() => this.resetState()}
            aria-label="Reset example (Alt+X)"
            title="Reset example (Alt+X)"
          >
            <img src={resetSVG} alt="" />
          </button>
          <button
            type="button"
            class="InteractiveComponentToolbarButton"
            onClick={() => this.toggleFullscreen()}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <img
              alt=""
              src={
                isFullscreen ? exitFullcreenSVG : enterFullcreenSVG
              }
            />
          </button>
        </div>
      </div>
    );
  }
}

InteractiveComponent.defaultProps = {
  showCanvas: true,
  showParams: false,
  showCode: false,
  evaluate: code => code,
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

export default InteractiveComponent;
