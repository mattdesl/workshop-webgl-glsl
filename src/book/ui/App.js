/** @jsx h */
const { h, Component } = require("preact");
const { Router, route } = require("preact-router");
const { Link } = require("preact-router/match");
const screenfull = require("screenfull");
const Article = require("./Article");
const menuButtonSVG = require("../assets/image/baseline-menu-24px.svg");
const closeMenuButtonSVG = require("../assets/image/baseline-arrow_back-24px-white.svg");
const previousSVG = require("../assets/image/baseline-keyboard_arrow_left-24px.svg");
const nextSVG = require("../assets/image/baseline-keyboard_arrow_right-24px.svg");
const toggleLargeSizeSVG = require("../assets/image/zoom-24px.svg");
const { createHashHistory } = require("history");

require("./App.scss");

const ContentsListHeader = ({ onCloseContents }) => {
  return (
    <div class="ContentsListHeader">
      <div class="CloseContentsButton" onClick={onCloseContents}>
        <img src={closeMenuButtonSVG} />
      </div>
      <div class="ContentsListHeaderTitle">Contents</div>
    </div>
  );
};

const toTitle = node => {
  return [node.index ? node.index.join(".") : false, node.title]
    .filter(Boolean)
    .join(" — ");
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
    <div class="ContentsList">
      <ContentsListHeader onCloseContents={onCloseContents} />
      {createList(contents, onCloseContents)}
    </div>
  );
};

const ContentsListModal = ({ onCloseContents }) => {
  return <div class="ContentsListModal" onClick={onCloseContents} />;
};

const NavButton = ({ onClick }) => {
  return (
    <div onClick={onClick} class="OpenContentsButton">
      <img src={menuButtonSVG} />
    </div>
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
    screenfull.on("change", this._handleFullscreenChange);
  }

  componentWillUnmount() {
    screenfull.off("change", this._handleFullscreenChange);
  }

  async toggleFullscreen() {
    if (screenfull.enabled) {
      await screenfull.toggle();
    }
  }

  render(props) {
    const {
      currentNode,
      previousNode,
      nextNode,
      onToggleLargeSize,
      onOpenContents
    } = props;
    return (
      <header class="Nav">
        <NavButton onClick={onOpenContents} />
        {currentNode && (
          <div class="NavTitle">
            {
              <Link
                class="NextPreviousLink"
                disabled={previousNode ? undefined : true}
                href={previousNode ? previousNode.pathname : undefined}
              >
                <img src={previousSVG} />
              </Link>
            }
            {
              <Link
                class="NextPreviousLink"
                disabled={nextNode ? undefined : true}
                href={nextNode ? nextNode.pathname : undefined}
              >
                <img src={nextSVG} />
              </Link>
            }
            <div class="NavSeparator" />
            <div class="NavTitleText">{toTitle(currentNode)}</div>
          </div>
        )}
        <div class="NavSpacer" />
        <div class="ToggleLargeSizeButton" onClick={onToggleLargeSize}>
          <img src={toggleLargeSizeSVG} />
        </div>
        {/* <div class='NavBarFullscreenButton' onClick={() => this.toggleFullscreen()}>
        <img src={screenfull.isFullscreen ? exitFullcreenSVG : enterFullcreenSVG} />
      </div> */}
      </header>
    );
  }
}

const Page = props => {
  const { id, contents } = props;
  const curPathname = `/${id}`;

  let node = contents.has(curPathname) ? contents.get(curPathname) : null;
  if (!node) {
    const firstNode = contents.first();
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
      onlySiblings: true
    });
    return route(nextSibling.pathname, true);
  }

  let { body, demo, title } = node;
  if (!body) {
    body = `The page <code>${node.pathname}</code> has no content.`;
  }
  if (typeof body === "string") {
    return (
      <Article
        previousNode={previousNode}
        nextNode={nextNode}
        title={title}
        body={body}
        demo={demo}
      />
    );
  }
  if (typeof body === "function") {
    const PageBody = body;
    return (
      <Article
        previousNode={previousNode}
        nextNode={nextNode}
        title={title}
        demo={demo}
      >
        <PageBody {...props} />
      </Article>
    );
  }
  throw new Error("Unknown type of content: " + body);
};

class Main extends Component {
  constructor(props) {
    super(props);
    this._onKeyDown = ev => {
      const { contents, id } = this.props;

      const curPathname = `/${id}`;
      const currentNode = contents.has(curPathname)
        ? contents.get(curPathname)
        : null;
      const previousNode = contents.relative(currentNode, -1);
      const nextNode = contents.relative(currentNode, 1);
      if (ev.keyCode === 8 && ev.metaKey) {
        ev.preventDefault();
        if (previousNode) route(previousNode.pathname);
      } else if (ev.keyCode === 13 && ev.metaKey) {
        ev.preventDefault();
        if (nextNode) route(nextNode.pathname);
      }
    };
  }
  componentDidMount() {
    window.addEventListener("keydown", this._onKeyDown);
  }
  componentWillUnmount() {
    window.removeEventListener("keydown", this._onKeyDown);
  }
  render() {
    const props = this.props;
    const {
      contents,
      id,
      isContentsOpen,
      onOpenContents,
      onCloseContents,
      isLargeSize,
      onToggleLargeSize
    } = props;

    const curPathname = `/${id}`;
    const currentNode = contents.has(curPathname)
      ? contents.get(curPathname)
      : null;
    const previousNode = contents.relative(currentNode, -1);
    const nextNode = contents.relative(currentNode, 1);

    return (
      <main class="Main">
        <Nav
          onToggleLargeSize={onToggleLargeSize}
          onOpenContents={onOpenContents}
          currentNode={currentNode}
          previousNode={previousNode}
          nextNode={nextNode}
          isLargeSize={isLargeSize}
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
    const isLargeSize = window.localStorage.getItem("large-size") === "true";
    this.state = {
      isLargeSize,
      isContentsOpen: false
    };
  }

  _setContentsVisible(visible) {
    this.setState({
      isContentsOpen: visible
    });
  }

  onToggleLargeSize() {
    this.setState({
      isLargeSize: !this.state.isLargeSize
    });
  }

  componentWillUpdate(newProps, newState) {
    console.log(String(Boolean(newState.isLargeSize)));
    window.localStorage.setItem(
      "large-size",
      String(Boolean(newState.isLargeSize))
    );
  }

  render() {
    const { isContentsOpen } = this.state;
    const {} = this.props;
    const classnames = ["App", this.state.isLargeSize ? "large" : false]
      .filter(Boolean)
      .join(" ");
    return (
      <div class={classnames}>
        <Router history={createHashHistory()}>
          <Main
            {...this.props}
            isContentsOpen={isContentsOpen}
            path="/:id*"
            isLargeSize={this.state.isLargeSize}
            onToggleLargeSize={() => this.onToggleLargeSize()}
            onOpenContents={() => this._setContentsVisible(true)}
            onCloseContents={() => this._setContentsVisible(false)}
          />
        </Router>
      </div>
    );
  }
}

App.defaultProps = {};

module.exports = App;
