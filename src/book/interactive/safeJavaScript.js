import { parse } from "acorn";
import * as THREE from "three";

const SAFE_THREE = Object.freeze({
  BoxGeometry: THREE.BoxGeometry,
  Color: THREE.Color,
  ConeGeometry: THREE.ConeGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  DoubleSide: THREE.DoubleSide,
  GLSL3: THREE.GLSL3,
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  MeshLambertMaterial: THREE.MeshLambertMaterial,
  MeshPhongMaterial: THREE.MeshPhongMaterial,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  Object3D: THREE.Object3D,
  PlaneGeometry: THREE.PlaneGeometry,
  RawShaderMaterial: THREE.RawShaderMaterial,
  Scene: THREE.Scene,
  ShaderMaterial: THREE.ShaderMaterial,
  SphereGeometry: THREE.SphereGeometry,
  TorusGeometry: THREE.TorusGeometry,
  Vector2: THREE.Vector2,
  Vector3: THREE.Vector3,
  Vector4: THREE.Vector4,
});

const SAFE_MATH = Object.freeze({
  E: Math.E,
  PI: Math.PI,
  abs: Math.abs,
  ceil: Math.ceil,
  cos: Math.cos,
  exp: Math.exp,
  floor: Math.floor,
  log: Math.log,
  max: Math.max,
  min: Math.min,
  pow: Math.pow,
  round: Math.round,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
});

const SAFE_CONSTRUCTORS = new Set([
  THREE.BoxGeometry,
  THREE.Color,
  THREE.ConeGeometry,
  THREE.CylinderGeometry,
  THREE.Group,
  THREE.Mesh,
  THREE.MeshBasicMaterial,
  THREE.MeshLambertMaterial,
  THREE.MeshPhongMaterial,
  THREE.MeshStandardMaterial,
  THREE.Object3D,
  THREE.PlaneGeometry,
  THREE.RawShaderMaterial,
  THREE.Scene,
  THREE.ShaderMaterial,
  THREE.SphereGeometry,
  THREE.TorusGeometry,
  THREE.Vector2,
  THREE.Vector3,
  THREE.Vector4,
]);

const FORBIDDEN_PROPERTIES = new Set(["__proto__", "prototype", "constructor"]);
const NOISE_FUNCTIONS = new Set(["noise1D", "noise2D", "noise3D", "noise4D"]);
const MATH_FUNCTIONS = new Set([
  "abs", "ceil", "cos", "exp", "floor", "log", "max", "min", "pow",
  "round", "sin", "sqrt", "tan",
]);

export { SAFE_MATH as safeMath, SAFE_THREE as safeThree };

/**
 * @typedef {{ type: string, [key: string]: any }} AstNode
 */

/**
 * Parse and interpret the limited JavaScript used by the interactive examples.
 * It supports data literals, declarations, arithmetic, allowlisted Three.js
 * constructors and methods, and the named noise functions. It has no access to
 * browser globals, arbitrary properties, loops, or function construction.
 *
 * @param {string} source User-authored example code.
 * @returns {(bindings?: Record<string, unknown>) => Record<string, unknown>}
 *   A function that executes the parsed example with the supplied bindings.
 */
export function compileSafeJavaScript(source) {
  if (source.length > 50000) throw new Error("Interactive code is too large");
  const program = parse(source, { ecmaVersion: "latest", sourceType: "script" });
  if (program.body.length > 1000) throw new Error("Interactive code has too many statements");

  return (bindings = {}) => {
    /** @type {Record<string, unknown>} */
    const scope = Object.create(null);
    Object.entries(bindings).forEach(([name, value]) => {
      Object.defineProperty(scope, name, { value, writable: true, enumerable: true });
    });

    program.body.forEach((statement) => executeStatement(statement, scope));
    return scope;
  };
}

/**
 * Parse and interpret the limited JavaScript used by the interactive examples.
 *
 * @param {string} source User-authored example code.
 * @param {Record<string, unknown>} [bindings] Values exposed to the example.
 * @returns {Record<string, unknown>} Example bindings after execution.
 */
export function executeSafeJavaScript(source, bindings = {}) {
  return compileSafeJavaScript(source)(bindings);
}

/** @param {AstNode} node @param {Record<string, unknown>} scope */
function executeStatement(node, scope) {
  if (node.type === "EmptyStatement") return;
  if (node.type === "ExpressionStatement") {
    evaluateExpression(node.expression, scope);
    return;
  }
  if (node.type === "VariableDeclaration") {
    node.declarations.forEach((declaration) => {
      if (declaration.id.type !== "Identifier" || !declaration.init) {
        throw new Error("Only initialized variables with simple names are supported");
      }
      const name = declaration.id.name;
      if (FORBIDDEN_PROPERTIES.has(name) || Object.prototype.hasOwnProperty.call(scope, name)) {
        throw new Error(`Cannot declare '${name}' in this example`);
      }
      Object.defineProperty(scope, name, {
        value: evaluateExpression(declaration.init, scope),
        writable: true,
        enumerable: true,
      });
    });
    return;
  }
  throw new Error(`Statement '${node.type}' is not supported in interactive code`);
}

/** @param {AstNode} node @param {Record<string, unknown>} scope @param {number} depth */
function evaluateExpression(node, scope, depth = 0) {
  if (depth > 100) throw new Error("Interactive expression is too deeply nested");
  const evaluate = (child) => evaluateExpression(child, scope, depth + 1);

  switch (node.type) {
    case "Literal":
      if (node.regex || typeof node.value === "bigint") {
        throw new Error("Regular expressions and BigInt values are not supported");
      }
      return node.value;
    case "Identifier":
      if (!Object.prototype.hasOwnProperty.call(scope, node.name)) {
        throw new Error(`Unknown name '${node.name}'`);
      }
      return scope[node.name];
    case "ThisExpression":
      throw new Error("'this' is not available in interactive code");
    case "ArrayExpression":
      if (node.elements.length > 10000) throw new Error("Array is too large");
      return node.elements.map((element) => {
        if (!element) return undefined;
        if (element.type === "SpreadElement") throw new Error("Spread syntax is not supported");
        return evaluate(element);
      });
    case "ObjectExpression":
      return evaluateObject(node, scope, evaluate);
    case "TemplateLiteral":
      return evaluateTemplate(node, evaluate);
    case "UnaryExpression": {
      const value = evaluate(node.argument);
      if (node.operator === "-") return -requireNumber(value);
      if (node.operator === "+") return requireNumber(value);
      if (node.operator === "!") return !value;
      throw new Error(`Unary operator '${node.operator}' is not supported`);
    }
    case "BinaryExpression":
      return evaluateBinary(node, evaluate);
    case "MemberExpression": {
      const object = evaluate(node.object);
      const property = readPropertyName(node, evaluate);
      return readSafeProperty(object, property);
    }
    case "AssignmentExpression":
      if (node.operator !== "=") throw new Error("Only '=' assignments are supported");
      return assignTarget(node.left, evaluate(node.right), scope, evaluate);
    case "CallExpression":
      return callAllowlisted(node, scope, evaluate);
    case "NewExpression":
      return constructAllowlisted(node, evaluate);
    case "ChainExpression":
      return evaluate(node.expression);
    default:
      throw new Error(`Expression '${node.type}' is not supported in interactive code`);
  }
}

/** @param {AstNode} node @param {Record<string, unknown>} scope @param {(node: AstNode) => unknown} evaluate */
function evaluateObject(node, scope, evaluate) {
  const value = {};
  node.properties.forEach((property) => {
    if (property.type !== "Property" || property.kind !== "init" || property.method) {
      throw new Error("Only plain object properties are supported");
    }
    const key = property.computed
      ? requirePropertyKey(evaluate(property.key))
      : property.key.type === "Identifier"
        ? property.key.name
        : String(property.key.value);
    if (FORBIDDEN_PROPERTIES.has(key)) throw new Error(`Property '${key}' is not allowed`);
    Object.defineProperty(value, key, {
      value: property.shorthand && !property.computed
        ? readBinding(property.value.name, scope)
        : evaluate(property.value),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  });
  return value;
}

/** @param {AstNode} node @param {(node: AstNode) => unknown} evaluate */
function evaluateTemplate(node, evaluate) {
  let value = node.quasis[0].value.cooked || "";
  node.expressions.forEach((expression, index) => {
    const part = evaluate(expression);
    if (!["string", "number", "boolean"].includes(typeof part)) {
      throw new Error("Template substitutions must be strings or numbers");
    }
    value += String(part) + (node.quasis[index + 1].value.cooked || "");
  });
  return value;
}

/** @param {AstNode} node @param {(node: AstNode) => unknown} evaluate */
function evaluateBinary(node, evaluate) {
  const left = evaluate(node.left);
  const right = evaluate(node.right);
  if (node.operator === "+" && (typeof left === "string" || typeof right === "string")) {
    return String(left) + String(right);
  }
  const a = requireNumber(left);
  const b = requireNumber(right);
  switch (node.operator) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return a / b;
    case "%": return a % b;
    case "**": return a ** b;
    default: throw new Error(`Binary operator '${node.operator}' is not supported`);
  }
}

/** @param {AstNode} node @param {Record<string, unknown>} scope @param {(node: AstNode) => unknown} evaluate */
function assignTarget(node, value, scope, evaluate) {
  if (node.type === "Identifier") {
    if (
      FORBIDDEN_PROPERTIES.has(node.name) ||
      node.name === "THREE" ||
      node.name === "Math" ||
      NOISE_FUNCTIONS.has(node.name)
    ) {
      throw new Error(`Cannot assign '${node.name}'`);
    }
    if (!Object.prototype.hasOwnProperty.call(scope, node.name)) {
      Object.defineProperty(scope, node.name, { value, writable: true, enumerable: true });
    } else {
      scope[node.name] = value;
    }
    return value;
  }
  if (node.type === "MemberExpression") {
    const object = evaluate(node.object);
    const property = readPropertyName(node, evaluate);
    writeSafeProperty(object, property, value);
    return value;
  }
  throw new Error("Assignment target is not supported");
}

/** @param {AstNode} node @param {Record<string, unknown>} scope @param {(node: AstNode) => unknown} evaluate */
function callAllowlisted(node, scope, evaluate) {
  const args = node.arguments.map((argument) => {
    if (argument.type === "SpreadElement") throw new Error("Spread syntax is not supported");
    return evaluate(argument);
  });
  if (node.callee.type === "Identifier") {
    const name = node.callee.name;
    if (!NOISE_FUNCTIONS.has(name) || typeof scope[name] !== "function") {
      throw new Error(`Function '${name}' is not allowed`);
    }
    return scope[name](...args.map(requireNumber));
  }
  if (node.callee.type !== "MemberExpression") {
    throw new Error("Only allowlisted functions and methods can be called");
  }

  const receiver = evaluate(node.callee.object);
  const method = readPropertyName(node.callee, evaluate);
  if (receiver === SAFE_MATH) {
    if (!MATH_FUNCTIONS.has(method) || typeof SAFE_MATH[method] !== "function") {
      throw new Error(`Math function '${method}' is not allowed`);
    }
    return SAFE_MATH[method](...args.map(requireNumber));
  }
  const safeMethod = getSafeMethod(receiver, method);
  if (!safeMethod) throw new Error(`Method '${method}' is not allowed`);
  return safeMethod(...args);
}

/** @param {AstNode} node @param {(node: AstNode) => unknown} evaluate */
function constructAllowlisted(node, evaluate) {
  const constructor = readConstructor(node.callee, evaluate);
  if (!SAFE_CONSTRUCTORS.has(constructor)) {
    throw new Error("This constructor is not available in interactive code");
  }
  const args = node.arguments.map((argument) => {
    if (argument.type === "SpreadElement") throw new Error("Spread syntax is not supported");
    return evaluate(argument);
  });
  if (args.length > 12) throw new Error("Too many constructor arguments");
  if ([THREE.SphereGeometry, THREE.BoxGeometry, THREE.PlaneGeometry,
    THREE.CylinderGeometry, THREE.ConeGeometry, THREE.TorusGeometry].includes(constructor)) {
    validateGeometryArguments(constructor, args);
  }
  return Reflect.construct(constructor, args);
}

/** @param {AstNode} node @param {(node: AstNode) => unknown} evaluate */
function readConstructor(node, evaluate) {
  if (node.type !== "MemberExpression" || node.object.type !== "Identifier" || node.object.name !== "THREE") {
    throw new Error("Only constructors in the Three.js allowlist can be used");
  }
  const name = readPropertyName(node, evaluate);
  const constructor = readSafeProperty(SAFE_THREE, name);
  if (typeof constructor !== "function") throw new Error(`Three.js constructor '${name}' is not allowed`);
  return constructor;
}

/** @param {Function} constructor @param {unknown[]} args */
function validateGeometryArguments(constructor, args) {
  args.forEach((argument) => {
    if (typeof argument !== "number" || !Number.isFinite(argument) || Math.abs(argument) > 10000) {
      throw new Error("Geometry arguments must be finite numbers within the supported range");
    }
  });
  const segmentIndexes = constructor === THREE.SphereGeometry ? [1, 2]
    : constructor === THREE.BoxGeometry ? [3, 4, 5]
      : constructor === THREE.PlaneGeometry ? [2, 3]
        : constructor === THREE.CylinderGeometry || constructor === THREE.ConeGeometry ? [2, 3]
          : [2, 3];
  segmentIndexes.forEach((index) => {
    if (args[index] !== undefined && args[index] > 512) {
      throw new Error("Geometry segment counts cannot exceed 512");
    }
  });
}

/** @param {unknown} receiver @param {string} name @returns {((...args: any[]) => any) | null} */
function getSafeMethod(receiver, name) {
  if (Array.isArray(receiver) && name === "reverse") {
    return (...args) => {
      if (args.length) throw new Error("Array.reverse does not take arguments here");
      return Array.prototype.reverse.call(receiver);
    };
  }
  let prototype = null;
  let methods = [];
  if (receiver instanceof THREE.Vector3) {
    prototype = THREE.Vector3.prototype;
    methods = ["add", "addScaledVector", "clone", "copy", "fromArray", "multiplyScalar", "normalize", "set", "setScalar", "toArray"];
  } else if (receiver instanceof THREE.Euler) {
    prototype = THREE.Euler.prototype;
    methods = ["set"];
  } else if (receiver instanceof THREE.Color) {
    prototype = THREE.Color.prototype;
    methods = ["copy", "set", "setHSL", "setStyle"];
  } else if (receiver instanceof THREE.Object3D) {
    prototype = THREE.Object3D.prototype;
    methods = ["add", "updateMatrix", "updateMatrixWorld"];
  }
  if (!methods.includes(name)) return null;
  const method = prototype[name];
  return (...args) => method.apply(receiver, args);
}

/** @param {unknown} value */
function requireNumber(value) {
  if (typeof value !== "number") throw new Error("This operation requires numeric values");
  return value;
}

/** @param {unknown} value */
function requirePropertyKey(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error("Object property keys must be strings or numbers");
  }
  const key = String(value);
  if (FORBIDDEN_PROPERTIES.has(key)) throw new Error(`Property '${key}' is not allowed`);
  return key;
}

/** @param {AstNode} node @param {(node: AstNode) => unknown} evaluate */
function readPropertyName(node, evaluate) {
  if (!node.computed) {
    if (node.property.type !== "Identifier") throw new Error("Invalid property access");
    return requirePropertyKey(node.property.name);
  }
  return requirePropertyKey(evaluate(node.property));
}

/** @param {unknown} object @param {string} property */
function readSafeProperty(object, property) {
  if (FORBIDDEN_PROPERTIES.has(property)) throw new Error(`Property '${property}' is not allowed`);
  if (object === SAFE_THREE || object === SAFE_MATH) {
    if (!Object.prototype.hasOwnProperty.call(object, property)) {
      throw new Error(`Property '${property}' is not available`);
    }
    return object[property];
  }
  if (object === null || object === undefined) throw new Error(`Cannot read '${property}'`);
  if (typeof object === "string" && property === "length") return object.length;
  const descriptor = Object.getOwnPropertyDescriptor(object, property);
  if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, "value")) {
    throw new Error(`Property '${property}' is not available`);
  }
  return descriptor.value;
}

/** @param {unknown} object @param {string} property @param {unknown} value */
function writeSafeProperty(object, property, value) {
  if (FORBIDDEN_PROPERTIES.has(property)) throw new Error(`Property '${property}' is not allowed`);
  if (object instanceof THREE.Vector3 && ["x", "y", "z"].includes(property)) {
    object[property] = requireNumber(value);
    return;
  }
  if (object instanceof THREE.Euler && ["x", "y", "z"].includes(property)) {
    object[property] = requireNumber(value);
    return;
  }
  if (object instanceof THREE.Color && ["r", "g", "b"].includes(property)) {
    object[property] = requireNumber(value);
    return;
  }
  if (object && typeof object === "object" && Object.getPrototypeOf(object) === Object.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(object, property);
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, "value")) {
      throw new Error(`Cannot assign property '${property}'`);
    }
    object[property] = value;
    return;
  }
  throw new Error(`Assignment to '${property}' is not allowed`);
}

/** @param {string} name @param {Record<string, unknown>} scope */
function readBinding(name, scope) {
  if (!Object.prototype.hasOwnProperty.call(scope, name)) throw new Error(`Unknown name '${name}'`);
  return scope[name];
}
