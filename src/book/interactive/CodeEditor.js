/** @jsx h */
import * as THREE from "three";
import { h, Component } from "preact";
import Debounce from "lodash.debounce";

// CodeMirror 6 Modular Engines
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  keymap,
  drawSelection,
  ViewPlugin,
} from "@codemirror/view";
import {
  history,
  undo,
  redo,
  indentMore,
  indentLess,
} from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import {
  bracketMatching,
  HighlightStyle,
  StreamLanguage,
  syntaxHighlighting,
} from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";
import CopyButton from "../ui/CopyButton";

import "./CodeEditor.scss";

const glslKeywords = new Set([
  "break",
  "case",
  "const",
  "continue",
  "default",
  "discard",
  "do",
  "else",
  "for",
  "if",
  "in",
  "inout",
  "layout",
  "out",
  "precision",
  "return",
  "struct",
  "switch",
  "uniform",
  "varying",
  "while",
  "highp",
  "mediump",
  "lowp",
  "flat",
  "smooth",
  "centroid",
  "invariant",
  "readonly",
  "writeonly",
]);
const glslTypes = new Set([
  "attribute",
  "bool",
  "bvec2",
  "bvec3",
  "bvec4",
  "float",
  "int",
  "ivec2",
  "ivec3",
  "ivec4",
  "mat2",
  "mat3",
  "mat4",
  "sampler2D",
  "samplerCube",
  "sampler2DShadow",
  "isampler2D",
  "usampler2D",
  "uint",
  "uvec2",
  "uvec3",
  "uvec4",
  "vec2",
  "vec3",
  "vec4",
  "void",
]);

const glsl = StreamLanguage.define({
  startState: () => ({ blockComment: false }),
  token(stream, state) {
    if (state.blockComment) {
      if (stream.match(/.*?\*\//)) state.blockComment = false;
      else stream.skipToEnd();
      return "comment";
    }
    if (stream.eatSpace()) return null;
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/*")) {
      state.blockComment = true;
      if (stream.match(/.*?\*\//)) state.blockComment = false;
      return "comment";
    }
    if (stream.match(/^#.*$/)) return "meta";
    if (stream.match(/^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/)) return "string";
    if (stream.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i)) return "number";
    if (stream.match(/^[A-Za-z_]\w*/)) {
      const word = stream.current();
      if (glslKeywords.has(word)) return "keyword";
      if (glslTypes.has(word)) return "typeName";
      if (word === "true" || word === "false") return "atom";
      if (/^\s*\(/.test(stream.string.slice(stream.pos)))
        return "variableName.function";
      return "variableName";
    }
    if (stream.match(/^[+\-*\/%=<>!&|^~?:]+/)) return "operator";
    stream.next();
    return null;
  },
});

const workshopHighlight = HighlightStyle.define([
  { tag: tags.keyword, class: "cm-token-keyword" },
  { tag: tags.typeName, class: "cm-token-type" },
  { tag: tags.function(tags.variableName), class: "cm-token-function" },
  { tag: tags.variableName, class: "cm-token-variable" },
  { tag: tags.propertyName, class: "cm-token-property" },
  { tag: tags.operator, class: "cm-token-operator" },
  { tag: tags.number, class: "cm-token-number" },
  { tag: tags.atom, class: "cm-token-atom" },
  { tag: tags.string, class: "cm-token-string" },
  { tag: tags.comment, class: "cm-token-comment" },
  { tag: tags.meta, class: "cm-token-meta" },
]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

const keywordMarks = (dynamicKeywords = [], thirdPartyKeywords = []) => {
  const groups = [
    ["cm-dynamic-variable", dynamicKeywords],
    ["cm-third-party", thirdPartyKeywords],
  ].filter(([, words]) => words && words.length);

  if (!groups.length) return [];

  const plugin = ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = this.build(view);
      }

      update(update) {
        if (update.docChanged) this.decorations = this.build(update.view);
      }

      build(view) {
        const text = view.state.doc.toString();
        const ranges = [];
        for (const [className, words] of groups) {
          const expression = new RegExp(
            `\\b(?:${words.map(escapeRegExp).join("|")})\\b`,
            "g",
          );
          let match;
          while ((match = expression.exec(text))) {
            ranges.push(
              Decoration.mark({ class: className }).range(
                match.index,
                match.index + match[0].length,
              ),
            );
          }
        }
        ranges.sort((a, b) => a.from - b.from || a.to - b.to);
        return Decoration.set(ranges, true);
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  );

  return [plugin];
};

export default class CodeEditor extends Component {
  constructor(props) {
    super(props);
    this.containerRef = null;
    this.view = null;
    this.copyButton = null;
    this._initialCode = this.props.code;
    this._clearEditorSelection = () => {
      if (!this.view) return;

      const selection = this.view.state.selection;
      if (selection.ranges.some((range) => !range.empty)) {
        this.view.dispatch({
          selection: EditorSelection.single(selection.main.head),
        });
      }

      const browserSelection = window.getSelection();
      if (
        browserSelection?.anchorNode &&
        browserSelection?.focusNode &&
        this.view.dom.contains(browserSelection.anchorNode) &&
        this.view.dom.contains(browserSelection.focusNode)
      ) {
        browserSelection.removeAllRanges();
      }
    };
    this._handleBlur = () => this._clearEditorSelection();
    this._handleOutsidePointerDown = (event) => {
      if (this.view && !this.view.dom.contains(event.target)) {
        this._clearEditorSelection();
      }
    };

    // Standardized debounced state wrapper updates matching legacy behaviors
    this._handleDocChange = (update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        this._debouncedChange(newValue);
      }
    };

    this._debouncedChange = Debounce(
      (newValue) => {
        if (this.props.code !== newValue) {
          this.props.onChange(newValue);
        }
      },
      200,
      { trailing: true, leading: false, maxWait: 300 },
    );
  }

  componentDidMount() {
    const isGLSL = this.props.glsl;

    // Re-bind customizable tab spacing controls
    const customKeymap = [
      { key: "Tab", run: indentMore },
      { key: "Shift-Tab", run: indentLess },
      {
        key: "Alt-c",
        run: () => {
          this.copyButton?.copyText();
          return true;
        },
      },
      { key: "Mod-z", run: undo },
      { key: "Mod-y", run: redo },
    ];

    // Build the CodeMirror 6 core extensions stack array configuration layout
    const extensions = [
      history(),
      bracketMatching(),
      closeBrackets(),
      drawSelection(),
      keymap.of(customKeymap),
      isGLSL ? glsl : javascript(),
      syntaxHighlighting(workshopHighlight),
      ...keywordMarks(
        this.props.dynamicKeywords,
        this.props.thirdPartyKeywords,
      ),
      EditorView.lineWrapping,
      EditorView.updateListener.of(this._handleDocChange),
    ];

    // Setup custom base skin matching modern components specifications
    const themeExtension = EditorView.theme({
      "&": { height: "100%", width: "100%" },
      ".cm-content": {
        fontFamily: "inherit",
        padding: "18px 20px",
        caretColor: "var(--white)",
      },
      ".cm-scroller": {
        overflow: "auto",
        backgroundColor: "var(--editor-bg)",
        color: "var(--editor-text)",
      },
      "&.cm-focused": {
        outline: "1px solid var(--white)",
        outlineOffset: "-1px",
      },
      "&.cm-focused .cm-cursor": { borderLeftColor: "var(--white)" },
      ".cm-selectionBackground": { backgroundColor: "transparent" },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--editor-selection)",
      },
    });
    extensions.push(themeExtension);

    const startState = EditorState.create({
      doc: this._initialCode || "",
      extensions,
    });

    this.view = new EditorView({
      state: startState,
      parent: this.container,
    });
    this.view.dom.addEventListener("blur", this._handleBlur, true);
    document.addEventListener("pointerdown", this._handleOutsidePointerDown, true);

    this._updateProps(this.props);
  }

  componentWillReceiveProps(newProps) {
    this._updateProps(newProps);
    if (!newProps.evaluateError && this.props.evaluateError) {
      if (this.view) {
        const newValue = this.view.state.doc.toString();
        this.props.onChange(newValue);
      }
    }
  }

  _updateProps(newProps) {
    if (this.view && this.view.dom) {
      this.view.dom.classList.remove("has-runtime-error");
      if (newProps.evaluateError) {
        this.view.dom.classList.add("has-runtime-error");
      }
    }
  }

  reset() {
    if (this.view) {
      this.view.dispatch({
        changes: {
          from: 0,
          to: this.view.state.doc.length,
          insert: this._initialCode || "",
        },
      });
    }
  }

  componentWillUnmount() {
    if (this._debouncedChange.cancel) {
      this._debouncedChange.cancel();
    }
    if (this.view) {
      document.removeEventListener("pointerdown", this._handleOutsidePointerDown, true);
      this.view.dom.removeEventListener("blur", this._handleBlur, true);
      this.view.destroy();
    }
  }

  render() {
    if (this.props.evaluateError) {
      console.error(this.props.evaluateError);
    }
    return (
      <div className="CodeEditor">
        <div
          className="CodeEditorContainer"
          ref={(c) => {
            this.container = c;
          }}
        />
        <CopyButton
          ref={(button) => {
            this.copyButton = button;
          }}
          getText={() =>
            this.view ? this.view.state.doc.toString() : this._initialCode || ""
          }
        />
        {this.props.evaluateError && (
          <div className="CodeEditorErrorToast">
            {`Error: ${this.props.evaluateError.message}`}
          </div>
        )}
      </div>
    );
  }
}

CodeEditor.defaultProps = {
  onChange: () => {},
};
