import * as THREE from "three";
import slugify from "slugify";
import pageDemos from "../pageDemos";

export default createContents;

function createContents({ pages = [], home }) {
  pages = [].concat(pages).filter(Boolean);

  const tree = [];
  const nodes = [];
  const map = {};
  walk(tree, pages);

  let homeNode;
  if (home) {
    home = unwrapModule(home);
    homeNode = toLeaf(home, [], [], "/");
    tree.unshift({ node: homeNode, children: [] });
    nodes.unshift(homeNode);
    map[homeNode.pathname] = homeNode;
  }

  return {
    home: homeNode,
    first() {
      return nodes;
    },
    get(path) {
      return map[path];
    },
    relative(node, dir = 1, opt = {}) {
      const { withBody = true, onlySiblings = false } = opt;

      if (dir === 0 || !isFinite(dir))
        throw new Error("relative direction must not be zero");
      const idx = nodes.indexOf(node);
      if (idx < 0) return null;

      const keyLength = node.key.length;
      const parentKeyStr = node.key.slice(0, keyLength - 1).join("/");

      let newIdx = idx + dir;
      while (newIdx >= 0 && newIdx < nodes.length) {
        const newNode = nodes[newIdx];
        const newParentKeyStr = newNode.key.slice(0, keyLength - 1).join("/");
        if (onlySiblings && newParentKeyStr !== parentKeyStr) {
          return null;
        }
        if (!withBody || "body" in newNode) {
          return newNode;
        }
        newIdx += dir;
      }
      return null;
    },
    nextSiblingWithBody(node, dir = 1) {
      const idx = nodes.indexOf(node);
      if (idx < 0) return null;
    },
    has(path) {
      return path in map && this.get(path) != null;
    },
    tree,
  };

  function findNodeInTree(tree, node) {
    for (let i = 0; i < tree.length; i++) {
      const item = tree[i];
      if (item.node === node) {
        return {
          ...item,
          parent: tree,
        };
      }
      const found = findNodeInTree(item.children, node);
      if (found) return found;
    }
    return null;
  }

  function toPathname(path) {
    return `/${path.join("/")}`;
  }

  function toLeaf(node, key, index, id) {
    const obj = {
      ...node,
      key,
      pathname: toPathname(key),
      index,
      id,
    };
    delete obj.children;
    return obj;
  }

  function isModule(value) {
    return Boolean(
      value && (value.__esModule || value[Symbol.toStringTag] === "Module"),
    );
  }

  function moduleToNode(module) {
    const body = module.default || module;
    const metadata =
      module.metadata ||
      (body && body.metadata) ||
      module.frontmatter ||
      (body && body.frontmatter) ||
      {};
    const normalizedMetadata = { ...metadata };

    if (typeof normalizedMetadata.demo === "string") {
      const demo = pageDemos[normalizedMetadata.demo];
      if (!demo) {
        throw new Error(`Unknown page demo "${normalizedMetadata.demo}"`);
      }
      normalizedMetadata.demo = demo;
    }

    return { ...normalizedMetadata, body };
  }

  function unwrapModule(node) {
    if (!node) return node;

    if (isModule(node)) {
      return moduleToNode(node);
    }

    if (typeof node === "function") {
      return {
        ...(node.metadata || node.frontmatter || {}),
        body: node,
      };
    }

    if (typeof node !== "object" || Array.isArray(node)) {
      return node;
    }

    // Parent entries can wrap an MDX module in `body`; normalize that module
    // while retaining the entry's own title and child list.
    if (isModule(node.body)) {
      return {
        ...moduleToNode(node.body),
        ...node,
        body: node.body.default || node.body,
      };
    }

    if (typeof node.body === "function") {
      return {
        ...(node.body.metadata || node.body.frontmatter || {}),
        ...node,
        body: node.body,
      };
    }

    return { ...node };
  }

  function walk(output, inputList, path = [], indices = []) {
    inputList.forEach((rawNode, i) => {
      const node = unwrapModule(rawNode);

      // EXTENDED FIXED RECOVERY MATRIX: Check static parameters mapped on the raw node function references
      let targetId =
        node.id || rawNode.id || (rawNode.default && rawNode.default.id);
      let targetTitle =
        node.title ||
        rawNode.title ||
        (rawNode.default && rawNode.default.title);

      // Final fallback layer: If the object structure is completely bare, extract identifiers from function naming conventions or array indices
      if (!targetId && !targetTitle) {
        const inferredName =
          (node.body && node.body.name) ||
          (typeof rawNode === "function" && rawNode.name);
        if (
          inferredName &&
          inferredName !== "default" &&
          inferredName !== "MDXContent"
        ) {
          targetTitle = inferredName;
        } else {
          targetId = `page-${[...indices, i].join("-")}`;
          targetTitle = `Page ${i + 1}`;
        }
      }

      const id =
        targetId ||
        slugify(targetTitle.toLowerCase(), {
          remove: /[({})[\]]/g,
        });

      const key = [...path, id];
      const index = [...indices, i];
      const pathname = toPathname(key);

      if (nodes.find((n) => toPathname(n.key) === pathname)) {
        throw new Error(`Already a key at ${pathname}`);
      }

      const leafNode = toLeaf(node, key, index, id);
      nodes.push(leafNode);
      map[pathname] = leafNode;

      const treeNode = {
        node: leafNode,
        children: [],
      };
      output.push(treeNode);

      const children =
        node.children ||
        rawNode.children ||
        (rawNode.default && rawNode.default.children);
      if (children) {
        walk(treeNode.children, children, key, index);
      }
    });
  }
}
