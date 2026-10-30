/** @jsx h */
import "normalize.css";
import { render, h } from "preact";
import App from "./ui/App";
import createContents from "./util/createContents";
import appContents from "./contents";
import { MDXProvider } from "@mdx-js/react";
import CodeBlock from "./ui/CodeBlock";
const contents = createContents(appContents);

const renderMarkdownPre = (props) => {
  const { children, ...preProps } = props;
  const codeNode = Array.isArray(children)
    ? children.find(
        (child) => child && typeof child === "object" && child.props,
      )
    : children;
  const codeProps =
    codeNode && typeof codeNode === "object" ? codeNode.props : null;
  const languageClass = codeProps && (codeProps.className || codeProps.class);

  if (languageClass && codeProps.children != null) {
    return (
      <div {...preProps}>
        <CodeBlock className={languageClass}>{codeProps.children}</CodeBlock>
      </div>
    );
  }

  return <div {...preProps}>{children}</div>;
};

const components = {
  pre: renderMarkdownPre,
  code: (props) => <code {...props}>{props.children}</code>,
  a: (props) => {
    const isAbsolute = /https?\:\/\//i.test(props.href || "");
    const target = isAbsolute ? "_blank" : undefined;
    return (
      <a target={target} href={props.href}>
        {props.children}
      </a>
    );
  },
};

render(
  <MDXProvider components={components}>
    <App contents={contents} />
  </MDXProvider>,
  document.body.querySelector("#app"),
);
