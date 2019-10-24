/** @jsx h */
const { h } = require('preact');
const { Link } = require('preact-router/match');
const previousSVG = require('../assets/image/baseline-keyboard_arrow_left-24px.svg');
const nextSVG = require('../assets/image/baseline-keyboard_arrow_right-24px.svg');
require('./Article.scss');
require('github-markdown-css');

const NextPrev = (props) => {
  const {
    pathname,
    title,
    type = 'Next'
  } = props;
  return <Link class={`${type}Link`} href={pathname}>
    <img src={type === 'Next' ? nextSVG : previousSVG} />
    <span>{title}</span>
  </Link>;
};

const Article = (props) => {
  const { nextNode, previousNode } = props;
  const articleProps = {};
  if (props.body) {
    articleProps.dangerouslySetInnerHTML = {
      __html: props.body
    };
  }
  const Demo = props.demo;
  return <div class='ArticleContainer'>
    <div class='ArticleInnerWrapper'>
      {/* {props.title ? <h1 class='ArticleTitle'>{props.title}</h1> : null} */}
      <article {...articleProps} class='Article markdown-body'>
        {props.children}
      </article>
      {Demo ? <div class='ArticleDemoContainer'>
        <Demo />
      </div> : null}
    </div>
    {(previousNode || nextNode) && <div class='NextPreviousContainer'>
      {previousNode && <NextPrev type='Previous' title={previousNode.title} pathname={previousNode.pathname} />}
      {nextNode && <NextPrev type='Next' title={nextNode.title} pathname={nextNode.pathname} />}
    </div>}
  </div>;
};

module.exports = Article;
