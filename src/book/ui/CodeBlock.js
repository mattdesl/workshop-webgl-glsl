/** @jsx h */
import * as THREE from "three";
import { h } from "preact";
// CRITICAL FIX: Use the accurate component name exported by the library
import { Highlight } from "prism-react-renderer";
import { Prism } from "prism-react-renderer";
import CopyButton from "./CopyButton";
import Indices from "../interactive/Indices";
import Vertices from "../interactive/Vertices";
import NoiseGrid from "../interactive/NoiseGrid";
import CubeVisualizer from "../interactive/CubeVisualizer";
import Waves from "../interactive/Waves";
import Scene from "../interactive/Scene";
import Mesh from "../interactive/Mesh";
import RawShader from "../interactive/RawShader";
import "./prism-bash";

Prism.languages.glsl = {
  comment: [/\/\*[\s\S]*?\*\//, /\/\/[^\r\n]*/],
  preprocessor: { pattern: /^[ \t]*#.*$/m, alias: "builtin" },
  string: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/,
  number: /(?:\b0x[\da-f]+|\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?[uif]?\b/i,
  boolean: /\b(?:true|false)\b/,
  type: /\b(?:void|float|double|int|uint|bool|[biu]?vec[234]|mat[234](?:x[234])?|[iu]?sampler\w*)\b/,
  keyword:
    /\b(?:attribute|const|uniform|varying|buffer|shared|layout|centroid|flat|smooth|noperspective|invariant|precise|discard|return|break|continue|do|for|while|switch|case|default|if|else|in|out|inout|struct|precision|highp|mediump|lowp|readonly|writeonly)\b/,
  function: /\b[a-zA-Z_]\w*(?=\s*\()/,
  variable: /\b[a-zA-Z_]\w*\b/,
  operator: /[+\-*\/%=<>!&|^~?:]+/,
  punctuation: /[{}\[\];(),.]/,
};

const renderGLSLTokens = (tokens, path = "") =>
  tokens.map((token, index) => {
    if (typeof token === "string") return token;
    const aliases = token.alias
      ? Array.isArray(token.alias)
        ? token.alias
        : [token.alias]
      : [];
    const content = Array.isArray(token.content)
      ? renderGLSLTokens(token.content, `${path}${index}-`)
      : token.content;
    return (
      <span
        key={`${path}${index}`}
        class={`token ${token.type} ${aliases.join(" ")}`}
      >
        {content}
      </span>
    );
  });

const CopyableCodeBlock = ({ code, children }) => {
  const handleKeyDown = (event) => {
    if (
      event.key.toLowerCase() === "c" &&
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.repeat
    ) {
      event.preventDefault();
      event.currentTarget.querySelector(".CopyCodeButton")?.click();
    }
  };

  return (
    <div
      class="CopyableCodeBlock"
      role="group"
      aria-label="Code sample. Focus and press Alt+C to copy."
      tabIndex={0}
      onClick={(event) => {
        if (!event.target.closest(".CopyCodeButton")) {
          event.currentTarget.focus({ preventScroll: true });
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <CopyButton getText={() => code} />
      {children}
    </div>
  );
};

const componentMap = {
  Indices,
  CubeVisualizer,
  Waves,
  Scene,
  Mesh,
  Varyings: (props) => <RawShader {...props} geometryType={"box"} material />,
  ShaderMaterial: (props) => (
    <RawShader {...props} geometryType={"torus"} material />
  ),
  VertexShader: (props) => (
    <RawShader {...props} geometryType={"cylinder"} vertex />
  ),
  FragmentShader: (props) => (
    <RawShader {...props} geometryType={"plane"} vertex={false} />
  ),
  Noise1D: (props) => <Waves {...props} functionName="noise1D" />,
  Noise2D: NoiseGrid,
  Noise3DSphere: (props) => <NoiseGrid {...props} sphere />,
  Noise3D: (props) => <NoiseGrid {...props} time />,
  CubeVisualizerRotation: (props) => (
    <CubeVisualizer {...props} extent={Math.PI / 2} defaultScale={0.5} />
  ),
  CubeVisualizerScale: (props) => (
    <CubeVisualizer
      {...props}
      minExtent={0.01}
      maxExtent={1}
      defaultScale={1}
      defaultValue={0.5}
    />
  ),
  Faces: (props) => <Indices {...props} fill />,
  Vertices,
};

const workshopSyntaxTheme = {
  plain: {
    color: "var(--editor-text)",
    backgroundColor: "var(--editor-bg)",
    fontWeight: 500,
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "var(--token-comment)", fontStyle: "italic" },
    },
    { types: ["punctuation"], style: { color: "var(--token-property)" } },
    {
      types: ["property", "tag", "constant", "symbol", "deleted"],
      style: { color: "var(--token-number)" },
    },
    { types: ["boolean", "number"], style: { color: "var(--token-number)" } },
    {
      types: ["selector", "attr-name", "string", "char", "builtin", "inserted"],
      style: { color: "var(--token-string)" },
    },
    {
      types: ["operator", "entity", "url", "variable"],
      style: { color: "var(--token-operator)" },
    },
    {
      types: ["atrule", "attr-value", "function"],
      style: { color: "var(--token-function)", fontWeight: 600 },
    },
    {
      types: ["type", "class-name"],
      style: { color: "var(--token-type)", fontWeight: 600 },
    },
    {
      types: ["keyword"],
      style: { color: "var(--token-keyword)", fontWeight: 600 },
    },
    { types: ["regex", "important"], style: { color: "var(--token-type)" } },
    { types: ["important", "bold"], style: { fontWeight: 700 } },
    { types: ["italic"], style: { fontStyle: "italic" } },
  ],
};

const CodeBlock = ({ children, className }) => {
  if (
    Array.isArray(children) &&
    children.every((child) => typeof child === "string")
  ) {
    children = children.join("");
  }
  if (!className) return <code>{children}</code>;

  const language = className.replace(/^language-/, "").toLowerCase();
  if (typeof children === "string") {
    children = children.trim();
  }

  if (language in componentMap && typeof children === "string") {
    const CodeComponent = componentMap[language];
    return <CodeComponent code={children} />;
  }

  if (language === "glsl" && typeof children === "string") {
    const tokens = Prism.tokenize(children, Prism.languages.glsl);
    return (
      <CopyableCodeBlock code={children}>
        <pre class="prism-code language-glsl">
          <code>{renderGLSLTokens(tokens)}</code>
        </pre>
      </CopyableCodeBlock>
    );
  }

  return (
    <CopyableCodeBlock code={typeof children === "string" ? children : ""}>
      <Highlight
        code={children}
        language={language}
        theme={workshopSyntaxTheme}
        prism={Prism}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              color: "var(--editor-text)",
              textShadow: "none",
              fontWeight: 500,
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </CopyableCodeBlock>
  );
};

export const GLSLCode = ({ code, children }) => (
  <CodeBlock className="language-glsl">
    {code == null ? children : code}
  </CodeBlock>
);

export default CodeBlock;
