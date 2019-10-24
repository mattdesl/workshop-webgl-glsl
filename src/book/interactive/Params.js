/** @jsx h */
const { h, Component } = require("preact");
const UI = require("../util/UI");
const { lerp } = require("canvas-sketch-util/math");
const titleCase = require("title-case");
const numberEditor = require("number-editor");
const Color = require("canvas-sketch-util/color");
const debounce = require("lodash.debounce");
require("./Params.scss");
require("./material-checkbox.css");
require("./material-slider.css");

const evaluateControl = (control, state) => {
  return Object.keys(control).reduce((dict, key) => {
    if (typeof control[key] === "function") {
      dict[key] = control[key](state, key, control);
    } else {
      dict[key] = control[key];
    }
    return dict;
  }, {});
};

function getPrecision(a) {
  if (!isFinite(a)) return 0;
  var e = 1,
    p = 0;
  while (Math.round(a * e) / e !== a) {
    e *= 10;
    p++;
  }
  return p;
}

function roundToDecimals(value, decimals) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

const ComponentContainer = props => {
  return (
    <div
      {...props}
      class={`ComponentContainer ${props.left ? "left" : "right"}`}
    >
      {props.children}
    </div>
  );
};

class Spinner extends Component {
  constructor(props) {
    super(props);
    this._handleChange = value => {
      this.props.onChange(value);
    };
  }

  componentWillUnmount() {
    this.editor.dispose();
  }

  componentDidMount() {
    const {
      min = -Infinity,
      max = Infinity,
      step = 0.01,
      value,
      onChange
    } = this.props;
    this.editor = numberEditor({
      value,
      min,
      max,
      step,
      decimals: getPrecision(step)
    });
    this.container.appendChild(this.editor.element);
    this.editor.on("change", this._handleChange);
  }
  render() {
    return (
      <ComponentContainer>
        <span
          ref={c => {
            this.container = c;
          }}
        ></span>
      </ComponentContainer>
    );
  }
}

const quickParseColor = (color, defaultValue = "#000000") => {
  let parsed = Color.parse(color);
  if (!parsed) parsed = Color.parse(`#${color}`);
  return parsed ? parsed.hex : defaultValue;
};

const ColorPicker = props => {
  const { value, enabled = true, readOnly = false, onChange } = props;
  const parsedValue = quickParseColor(value);

  return (
    <ComponentContainer>
      <input
        type="color"
        value={parsedValue}
        disabled={!enabled}
        readOnly={readOnly}
        onInput={ev => {
          onChange(quickParseColor(ev.target.value));
        }}
      />
      <input
        type="text"
        class="ComponentInput"
        value={parsedValue}
        disabled={!enabled}
        readOnly={readOnly}
        onChange={debounce(ev => {
          let parsed = Color.parse(ev.target.value);
          if (!parsed) parsed = Color.parse(`#${ev.target.value}`);
          if (parsed) onChange(parsed.hex);
        }, 250)}
      />
    </ComponentContainer>
  );
};

const Select = props => {
  const { enabled = true, readOnly = false, onChange } = props;
  let options = props.options || [];
  let map;
  let value = props.value;

  if (options && !Array.isArray(options) && typeof options === "object") {
    throw new Error("not yet supported");
    // map = options;
    // options = Object.keys(options).map(key => {
    //   return { key, value: options[key] };
    // });
    // if (!(value in map)) {
    //   console.warn(`The key ${value} doesn't exist in the options object`);
    // }
  }
  return (
    <ComponentContainer>
      <select
        value={value}
        disabled={!enabled}
        readOnly={readOnly}
        onChange={ev => {
          onChange(ev.target.value);
        }}
      >
        {options.map(option => {
          if (typeof option === "string") {
            return <option value={option}>{option}</option>;
          } else if (option && typeof option === "object") {
            const label = option.label || option.key;
            return <option value={option.key}>{label}</option>;
          } else {
            throw new Error("Invalid or null option in Select UI");
          }
        })}
        ;
      </select>
    </ComponentContainer>
  );
};

const fastParseNumber = (value, min, max) => {
  let parsedNumber = parseFloat(value);
  if (isFinite(parsedNumber)) return parsedNumber;

  let defaultValue;
  if (isFinite(min)) defaultValue = min;
  else if (isFinite(max)) defaultValue = max;
  else defaultValue = 0;
  return defaultValue;
};

const Slider = props => {
  const {
    min = -Infinity,
    max = Infinity,
    step,
    value,
    enabled = true,
    readOnly = false,
    onChange
  } = props;
  const parsedNumber = fastParseNumber(value, min, max);
  const decimalPlaces = isFinite(step) ? getPrecision(step) : 0;
  return (
    <ComponentContainer>
      <div class="MaterialSlider">
        <input
          type="range"
          value={parsedNumber}
          min={min}
          max={max}
          step={step}
          disabled={!enabled}
          readOnly={readOnly}
          onInput={ev => {
            onChange(fastParseNumber(ev.target.value, min, max));
          }}
          onChange={ev => {
            onChange(fastParseNumber(ev.target.value, min, max));
          }}
        />
      </div>
      <input
        type="text"
        class="ComponentInput"
        value={parsedNumber.toFixed(decimalPlaces)}
        min={min}
        max={max}
        step={step}
        disabled={!enabled}
        readOnly={readOnly}
        onChange={debounce(ev => {
          const newNum = parseFloat(ev.target.value);
          if (isFinite(newNum)) {
            onChange(newNum);
          }
        }, 250)}
      />
    </ComponentContainer>
  );
};

const Checkbox = props => {
  const { value, enabled = true, readOnly = false, onChange } = props;
  return (
    <ComponentContainer left>
      <label class="MaterialCheckbox">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={!enabled}
          readOnly={readOnly}
          onChange={ev => {
            onChange(ev.target.checked);
          }}
        />
        <span>{props.label}</span>
      </label>
    </ComponentContainer>
  );
};

const controlMap = {
  slider: Slider,
  color: ColorPicker,
  checkbox: Checkbox,
  spinner: Spinner,
  select: Select
};

const ParamsComponent = props => {
  const { enabled = true } = props;
  const labelClasses = [
    "ParamsComponentLabel",
    props.variable ? "variable" : false
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div class="ParamsComponent" disabled={!enabled}>
      {props.type !== "checkbox" ? (
        <label class={labelClasses} disabled={!enabled}>
          {props.label}
        </label>
      ) : null}
      {props.children}
    </div>
  );
};

class Params extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    if (this.props.params) {
      this.paramsChanged(this.props.params);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params !== this.props.params) {
      this.paramsChanged(nextProps.params, this.props.params);
    }
  }

  paramsChanged(newParams, oldParams) {
    if (oldParams) {
      UI.unregister(oldParams);
    }
    if (newParams) {
      UI.register(newParams, this.props.onChange);
    }
  }

  render() {
    const { params, onChange } = this.props;

    const controls = Object.keys(params)
      .map(key => {
        if (!UI.hasControlData(params, key)) return null;
        const control = UI.getControlData(params, key);
        if (!control || control.visible === false) return null;
        const evaluatedControl = evaluateControl(control, params);
        const defaultLabel = evaluatedControl.variable ? key : titleCase(key);
        const label = evaluatedControl.label || defaultLabel;
        if (evaluatedControl.type in controlMap) {
          const Component = controlMap[evaluatedControl.type];
          const onControlChange = value => {
            onChange({
              ...params,
              [key]: value
            });
          };
          // if (evaluatedControl.type === 'checkbox') {
          //   return <Component {...evaluatedControl} value={params[key]} key={key} onChange={onControlChange} />;
          // }
          return (
            <ParamsComponent {...evaluatedControl} label={label}>
              <Component
                {...evaluatedControl}
                label={label}
                value={params[key]}
                key={key}
                onChange={onControlChange}
              />
            </ParamsComponent>
          );
        } else {
          console.warn(`Type ${evaluatedControl.type} not recognized`);
        }
      })
      .filter(Boolean);
    return <div class="InteractiveComponentParams">{controls}</div>;
  }
}

Params.defaultProps = {
  onChange: () => {}
};

module.exports = Params;
