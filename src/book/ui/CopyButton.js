/** @jsx h */
import { h, Component } from "preact";

const writeClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Clipboard copy failed");
};

export default class CopyButton extends Component {
  constructor(props) {
    super(props);
    this.state = { status: "idle" };
    this._resetTimer = null;
  }

  componentWillUnmount() {
    window.clearTimeout(this._resetTimer);
  }

  async copyText() {
    const text = this.props.getText();

    try {
      await writeClipboard(text);
      this.setState({ status: "copied" });
    } catch {
      this.setState({ status: "error" });
    }

    window.clearTimeout(this._resetTimer);
    this._resetTimer = window.setTimeout(
      () => this.setState({ status: "idle" }),
      1400,
    );
  }

  copyCode(event) {
    event.stopPropagation();
    return this.copyText();
  }

  render() {
    const { status } = this.state;
    const label =
      status === "copied"
        ? "Copied"
        : status === "error"
          ? "Copy failed"
          : "Copy";

    return (
      <button
        type="button"
        class="CopyCodeButton"
        onClick={(event) => this.copyCode(event)}
        title="Copy code (Alt+C)"
        aria-label={status === "copied" ? "Code copied" : "Copy code"}
      >
        {status !== "copied" && (
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="7" y="3" width="10" height="12" rx="1" />
            <path d="M13 17H4a1 1 0 0 1-1-1V6" />
          </svg>
        )}
        <span>{label}</span>
      </button>
    );
  }
}
