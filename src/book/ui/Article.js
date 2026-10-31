/** @jsx h */
import * as THREE from "three";
import { h } from "preact";
import { Link } from "preact-router/match";

// Modern Asset Imports: Vite resolves these to direct URL strings automatically
import previousSVG from "../assets/image/baseline-keyboard_arrow_left-24px.svg";
import nextSVG from "../assets/image/baseline-keyboard_arrow_right-24px.svg";

import "./Article.scss";
import "github-markdown-css";

const NextPrev = (props) => {
  const { pathname, title, type = "Next" } = props;
  return (
    <Link class={`${type}Link`} href={pathname}>
      <img
        src={type === "Next" ? nextSVG : previousSVG}
        alt=""
        draggable={false}
      />
      <span>{title}</span>
    </Link>
  );
};

const Article = (props) => {
  const { nextNode, previousNode, title, heading, body, demo } = props;
  const Demo = demo;
  return (
    <div class="ArticleContainer">
      <div class="ArticleInnerWrapper">
        <article class="Article markdown-body">
          {title && <h1>{heading || title}</h1>}
          {body ? (
            <div dangerouslySetInnerHTML={{ __html: body }} />
          ) : (
            props.children
          )}
        </article>
        {Demo ? (
          <div class="ArticleDemoContainer">
            <Demo />
          </div>
        ) : null}
      </div>
      {(previousNode || nextNode) && (
        <div class="NextPreviousContainer">
          {previousNode && (
            <NextPrev
              type="Previous"
              title={previousNode.title}
              pathname={previousNode.pathname}
            />
          )}
          {nextNode && (
            <NextPrev
              type="Next"
              title={nextNode.title}
              pathname={nextNode.pathname}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Modern ES Default Export replacing module.exports
export default Article;
