/** @jsx h */
import { h, Component } from "preact";
import { Router, route } from "preact-router";
import { Link } from "preact-router/match";
import screenfull from "screenfull";
import Article from "./Article";
import { createHashHistory } from "history";

// Modern Asset URL imports resolved directly by Vite 7
import menuButtonSVG from "../assets/image/baseline-menu-24px.svg";
import closeMenuButtonSVG from "../assets/image/baseline-arrow_back-24px-white.svg";
import previousSVG from "../assets/image/baseline-keyboard_arrow_left-24px.svg";
import nextSVG from "../assets/image/baseline-keyboard_arrow_right-24px.svg";

import "./App.scss";

const ContentsListHeader = ({ onCloseContents }) => {
  return (
    <div class="ContentsListHeader">
      <button
        type="button"
        class="CloseContentsButton"
        onClick={onCloseContents}
        aria-label="Close contents"
      >
        <img src={closeMenuButtonSVG} alt="" />
      </button>
      <div class="ContentsListHeaderTitle">Contents</div>
    </div>
  );
};

const toTitle = (node) => {
  return [node.index ? node.index.join(".") : false, node.title]
    .filter(Boolean)
    .join(" — ");
};

const isEditableTarget = (target) => {
  return Boolean(
    target &&
    typeof target.closest === "function" &&
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], .cm-editor',
    ),
  );
};


const updateFavicon = (theme) => {
  const favicon = document.getElementById("site-favicon");

  if (!favicon) return;

  const icon = theme === "night" ? "webgl-dark.svg" : "webgl-light.svg";
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  const url = new URL(`${base}${icon}`, window.location.origin);

  // Change the URL when switching themes to encourage a fresh favicon load.
  url.searchParams.set("theme", theme);

  favicon.href = url.href;
};



function createList(contents, onClick) {
  return walk(contents.tree);

  function walk(list) {
    return (
      <ul class="ContentsListItems">
        {list.map(({ children, node }) => {
          const title = toTitle(node);
          return (
            <li key={node.id}>
              {"body" in node ? (
                <Link
                  onClick={onClick}
                  activeClassName="active"
                  class="ContentsLink"
                  href={node.pathname}
                >
                  {title}
                </Link>
              ) : (
                <span class="ContentsNoLink">{title}</span>
              )}
              {children.length > 0 && walk(children)}
            </li>
          );
        })}
      </ul>
    );
  }
}

const ContentsList = ({ contents, onCloseContents }) => {
  return (
    <aside
      class="ContentsList"
      role="dialog"
      aria-modal="true"
      aria-label="Contents"
    >
      <ContentsListHeader onCloseContents={onCloseContents} />
      {createList(contents, onCloseContents)}
    </aside>
  );
};

const ContentsListModal = ({ onCloseContents }) => {
  return (
    <button
      type="button"
      class="ContentsListModal"
      onClick={onCloseContents}
      aria-label="Close contents"
    />
  );
};

const NavButton = ({ onClick, isOpen }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      class="OpenContentsButton"
      aria-label="Open contents"
      aria-expanded={isOpen}
    >
      <img src={menuButtonSVG} alt="" />
    </button>
  );
};

const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onZoomChange }) => {
  return (
    <div class="ZoomControls" role="group" aria-label="Reading zoom">
      <button
        type="button"
        class="ZoomButton"
        onClick={() => zoom > 50 && onZoomOut()}
        aria-disabled={zoom <= 50}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <span aria-hidden="true">-</span>
      </button>
      <input
        class="ZoomSlider"
        type="range"
        min="50"
        max="200"
        step="5"
        value={zoom}
        onInput={(event) => onZoomChange(Number(event.currentTarget.value))}
        aria-label="Custom reading zoom"
        aria-valuetext={`${zoom}%`}
      />
      <span class="ZoomLevel" aria-live="polite">
        {zoom}%
      </span>
      <button
        type="button"
        class="ZoomButton"
        onClick={() => zoom < 200 && onZoomIn()}
        aria-disabled={zoom >= 200}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
};

const ThemeToggle = ({ theme, onToggle }) => {
  const isNight = theme === "night";
  return (
    <button
      type="button"
      class="ThemeToggleButton"
      onClick={onToggle}
      aria-label={isNight ? "Switch to day mode" : "Switch to night mode"}
      title={isNight ? "Switch to day mode" : "Switch to night mode"}
      aria-pressed={isNight}
    >
      {isNight ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.6 15.2A8.2 8.2 0 0 1 8.8 3.4 8.3 8.3 0 1 0 20.6 15.2Z" />
        </svg>
      )}
    </button>
  );
};

class Nav extends Component {
  constructor(props) {
    super(props);
    this._handleFullscreenChange = () => {
      this.forceUpdate();
    };
  }

  componentDidMount() {
    if (screenfull.isEnabled) {
      screenfull.on("change", this._handleFullscreenChange);
    }
  }

  componentWillUnmount() {
    if (screenfull.isEnabled) {
      screenfull.off("change", this._handleFullscreenChange);
    }
  }

  async toggleFullscreen() {
    if (screenfull.isEnabled) {
      await screenfull.toggle();
    }
  }

  render(props) {
    const {
      currentNode,
      previousNode,
      nextNode,
      onZoomIn,
      onZoomOut,
      onZoomChange,
      onOpenContents,
      isContentsOpen,
      zoom,
      theme,
      onToggleTheme,
    } = props;
    return (
      <header class="Nav">
        <NavButton onClick={onOpenContents} isOpen={isContentsOpen} />
        {currentNode && (
          <div class="NavTitle">
            <Link
              class="NextPreviousLink"
              disabled={previousNode ? undefined : true}
              href={previousNode ? previousNode.pathname : undefined}
              aria-label={
                previousNode
                  ? `Previous: ${previousNode.title}`
                  : "No previous chapter"
              }
            >
              <img src={previousSVG} alt="" />
            </Link>
            <Link
              class="NextPreviousLink"
              disabled={nextNode ? undefined : true}
              href={nextNode ? nextNode.pathname : undefined}
              aria-label={
                nextNode ? `Next: ${nextNode.title}` : "No next chapter"
              }
            >
              <img src={nextSVG} alt="" />
            </Link>
            <div class="NavSeparator" />
            <div class="NavTitleText">{toTitle(currentNode)}</div>
          </div>
        )}
        <div class="NavSpacer" />
        <ZoomControls
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomChange={onZoomChange}
        />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>
    );
  }
}
const Page = (props) => {
  const { id, contents } = props;
  const curPathname = id ? `/${id}` : "/";

  let node = contents.has(curPathname) ? contents.get(curPathname) : null;
  if (!node) {
    const firstNode =
      contents.home || contents.first().find((item) => "body" in item);
    const firstEl = firstNode ? (
      <Link href={firstNode.pathname}>{firstNode.title}</Link>
    ) : null;
    return (
      <Article>
        <p>
          Oops! The page at <code>#{curPathname}</code> doesn't exist.
        </p>
        {firstEl && (
          <p>
            You can go back to {firstEl}, or click the nav button to explore
            other chapters.
          </p>
        )}
      </Article>
    );
  }
  const previousNode = contents.relative(node, -1);
  const nextNode = contents.relative(node, 1);

  if (!("body" in node)) {
    const nextSibling = contents.relative(node, 1, {
      onlySiblings: true,
    });
    return route(nextSibling.pathname, true);
  }

  let { body, demo, title, heading } = node;
  if (!body) {
    body = `The page <code>${node.pathname}</code> has no content.`;
  }

  // 1. STABILIZATION UNWRAP: Extract deep components from custom bundle wrapper variations
  if (body && typeof body === "object") {
    if (body.default) {
      body = body.default;
    } else if (body.body) {
      body = body.body;
    }
  }

  // 2. String Fallback Route
  if (typeof body === "string") {
    return (
      <Article
        previousNode={previousNode}
        nextNode={nextNode}
        title={title}
        heading={heading}
        body={body}
        demo={demo}
      />
    );
  }

  // 3. Functional Component Route (e.g., modern MDXContent function)
  if (typeof body === "function") {
    const PageBody = body;
    return (
      <Article
        previousNode={previousNode}
        nextNode={nextNode}
        title={title}
        heading={heading}
        demo={demo}
      >
        <PageBody {...props} />
      </Article>
    );
  }

  // 4. Precompiled VNode/Object Component Check
  if (body && typeof body === "object") {
    // If it's a pre-rendered virtual node or an object with children properties
    if (body.$$typeof || body.type || "props" in body || "children" in body) {
      return (
        <Article
          previousNode={previousNode}
          nextNode={nextNode}
          title={title}
          heading={heading}
          demo={demo}
        >
          {body.props && body.props.children
            ? body.props.children
            : body.children || body}
        </Article>
      );
    }
  }

  throw new Error("Unknown type of content: " + body);
};

class Main extends Component {
  constructor(props) {
    super(props);
    this._shiftShortcutUsed = false;
    this._onKeyDown = (ev) => {
      if (ev.key === "Shift") {
        if (!ev.repeat) this._shiftShortcutUsed = false;
        return;
      }

      if (ev.shiftKey) this._shiftShortcutUsed = true;
      if (isEditableTarget(ev.target)) return;

      const { contents, id } = this.props;

      const curPathname = id ? `/${id}` : "/";
      const currentNode = contents.has(curPathname)
        ? contents.get(curPathname)
        : null;
      const previousNode = contents.relative(currentNode, -1);
      const nextNode = contents.relative(currentNode, 1);

      if (ev.key === "ArrowLeft" || ev.key.toLowerCase() === "a") {
        if (
          !ev.altKey &&
          !ev.ctrlKey &&
          !ev.metaKey &&
          !ev.shiftKey &&
          previousNode
        ) {
          ev.preventDefault();
          route(previousNode.pathname);
        }
      } else if (ev.key === "ArrowRight" || ev.key.toLowerCase() === "d") {
        if (
          !ev.altKey &&
          !ev.ctrlKey &&
          !ev.metaKey &&
          !ev.shiftKey &&
          nextNode
        ) {
          ev.preventDefault();
          route(nextNode.pathname);
        }
      } else if (ev.keyCode === 8 && ev.metaKey) {
        ev.preventDefault();
        if (previousNode) route(previousNode.pathname);
      } else if (ev.keyCode === 13 && ev.metaKey) {
        ev.preventDefault();
        if (nextNode) route(nextNode.pathname);
      }
    };
    this._onKeyUp = (ev) => {
      if (ev.key !== "Shift") return;

      if (!this._shiftShortcutUsed && !isEditableTarget(ev.target)) {
        const { isContentsOpen, onOpenContents, onCloseContents } = this.props;
        (isContentsOpen ? onCloseContents : onOpenContents)();
      }

      this._shiftShortcutUsed = false;
    };
  }
  componentDidMount() {
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }
  componentWillUnmount() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
  render() {
    const props = this.props;
    const {
      contents,
      id,
      isContentsOpen,
      onOpenContents,
      onCloseContents,
      zoom,
      onZoomIn,
      onZoomOut,
      onZoomChange,
      theme,
      onToggleTheme,
    } = props;

    const curPathname = id ? `/${id}` : "/";
    const currentNode = contents.has(curPathname)
      ? contents.get(curPathname)
      : null;
    const previousNode = contents.relative(currentNode, -1);
    const nextNode = contents.relative(currentNode, 1);

    return (
      <main class="Main">
        <Nav
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomChange={onZoomChange}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onOpenContents={onOpenContents}
          currentNode={currentNode}
          previousNode={previousNode}
          nextNode={nextNode}
          zoom={zoom}
          isContentsOpen={isContentsOpen}
        />
        <Page {...props} />
        {isContentsOpen && (
          <ContentsListModal onCloseContents={onCloseContents} />
        )}
        {isContentsOpen && (
          <ContentsList contents={contents} onCloseContents={onCloseContents} />
        )}
      </main>
    );
  }
}

class App extends Component {
  constructor() {
    super();
    this._zoomPersistTimer = null;
    const savedZoom = Number(window.localStorage.getItem("reading-zoom"));
    const oldLargeSize = window.localStorage.getItem("large-size") === "true";
    const zoom =
      Number.isFinite(savedZoom) && savedZoom >= 50 && savedZoom <= 200
        ? savedZoom
        : oldLargeSize
          ? 120
          : 100;
    const theme =
      window.localStorage.getItem("color-theme") === "night" ? "night" : "day";
    document.documentElement.dataset.theme = theme;
    updateFavicon(theme);
    this.state = {
      zoom,
      theme,
      isContentsOpen: false,
    };
  }

  _setContentsVisible(visible) {
    this.setState({
      isContentsOpen: visible,
    });
  }

  onZoomIn() {
    this.onZoomChange(this.state.zoom + 5);
  }

  onZoomOut() {
    this.onZoomChange(this.state.zoom - 5);
  }

  onZoomChange(zoom) {
    const nextZoom = Math.max(50, Math.min(200, zoom));
    this.setState({ zoom: nextZoom });
    window.clearTimeout(this._zoomPersistTimer);
    this._zoomPersistTimer = window.setTimeout(() => {
      window.localStorage.setItem("reading-zoom", String(nextZoom));
    }, 120);
  }

  onToggleTheme() {
    const theme = this.state.theme === "night" ? "day" : "night";
    this.setState({ theme });
  }

componentDidUpdate(prevState) {
  if (prevState.theme !== this.state.theme) {
    const theme = this.state.theme;

    window.localStorage.setItem("color-theme", theme);
    document.documentElement.dataset.theme = theme;
    updateFavicon(theme);
  }
}

  componentWillUnmount() {
    window.clearTimeout(this._zoomPersistTimer);
  }

  render() {
    const { isContentsOpen } = this.state;
    return (
      <div
        class="App"
        data-reading-scale={this.state.zoom >= 150 ? "large" : "normal"}
        style={{ fontSize: `${this.state.zoom}%` }}
      >
        <Router history={createHashHistory()}>
          <Main
            {...this.props}
            isContentsOpen={isContentsOpen}
            theme={this.state.theme}
            path="/:id*"
            zoom={this.state.zoom}
            onZoomIn={() => this.onZoomIn()}
            onZoomOut={() => this.onZoomOut()}
            onZoomChange={(zoom) => this.onZoomChange(zoom)}
            onToggleTheme={() => this.onToggleTheme()}
            onOpenContents={() => this._setContentsVisible(true)}
            onCloseContents={() => this._setContentsVisible(false)}
          />
        </Router>
      </div>
    );
  }
}

App.defaultProps = {};

export default App;
