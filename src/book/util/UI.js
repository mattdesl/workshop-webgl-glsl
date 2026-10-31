const metadata = new WeakMap();
const listeners = new WeakMap();

const setControlData = (obj, key, value) => {
  let map;
  if (metadata.has(obj)) {
    map = metadata.get(obj);
  }

  if (map == null) {
    map = new Map();
    metadata.set(obj, map);
  }

  const prevValue = (map.has(key) ? map.get(key) : null) || {};
  map.set(key, Object.assign({}, prevValue, value));
};

const getControlMap = (obj) => {
  let current = obj;
  while (current != null) {
    const map = metadata.get(current);
    if (map) return map;
    current = Object.getPrototypeOf(current);
  }
  return null;
};

const Control = (value) => (obj, key) => setControlData(obj, key, value);

const hasControlData = (obj, key) => {
  const map = getControlMap(obj);
  return map ? map.has(key) : false;
};

const getControlData = (obj, key) => {
  const map = getControlMap(obj);
  return map ? map.get(key) : null;
};

const typed = (type) => (value) => Control({ ...value, type });

const UI = {};
Object.assign(UI, {
  getControlData,
  hasControlData,
  setControlData,
  update(params) {
    if (listeners.has(params)) {
      const listener = listeners.get(params);
      if (listener) listener();
    }
  },
  unregister(params) {
    if (listeners.has(params)) listeners.delete(params);
  },
  register(params, listener) {
    if (typeof listener !== "function") {
      throw new Error("Must specify a listener function to register()");
    }
    listeners.set(params, listener);
  },
  Control,
  Spinner: typed("spinner"),
  Slider: typed("slider"),
  Checkbox: typed("checkbox"),
  Color: typed("color"),
  Select: typed("select"),
  Folder: typed("folder"),
  Vector: typed("vector"),
  Euler: typed("euler"),
});

// Modern ES Default Export replacing module.exports
export default UI;
