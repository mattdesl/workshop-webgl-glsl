const slugify = require('slugify');

module.exports = createContents;

function createContents ({ pages = [], home }) {
  pages = [].concat(pages).filter(Boolean);

  const tree = [];
  const nodes = [];
  const map = {};
  walk(tree, pages);

  let homeNode;
  if (home) {
    home = unwrapModule(home);
    homeNode = toLeaf(home, [], [], '/');
    tree.unshift({ node: homeNode, children: [] });
    nodes.unshift(homeNode);
    map[homeNode.pathname] = homeNode;
  }

  return {
    home: homeNode,
    first () {
      return nodes[0];
    },
    get (path) {
      return map[path];
    },
    relative (node, dir = 1, opt = {}) {
      const {
        withBody = true,
        onlySiblings = false
      } = opt;

      if (dir === 0 || !isFinite(dir)) throw new Error('relative direction must not be zero');
      const idx = nodes.indexOf(node);
      if (idx < 0) return null;

      const keyLength = node.key.length;
      const parentKeyStr = node.key.slice(0, keyLength - 1).join('/');

      let newIdx = idx + dir;
      while (newIdx >= 0 && newIdx < nodes.length) {
        const newNode = nodes[newIdx];
        const newParentKeyStr = newNode.key.slice(0, keyLength - 1).join('/');
        // we broke out of a node
        if (onlySiblings && newParentKeyStr !== parentKeyStr) {
          return null;
        }
        if (!withBody || ('body' in newNode)) {
          return newNode;
        }
        newIdx += dir;
      }
      return null;
    },
    nextSiblingWithBody (node, dir = 1) {
      const idx = nodes.indexOf(node);
      if (idx < 0) return null;


    },
    has (path) {
      return path in map && this.get(path) != null;
    },
    tree
  };

  function findNodeInTree (tree, node) {
    for (let i = 0; i < tree.length; i++) {
      const item = tree[i];
      if (item.node === node) {
        return {
          ...item,
          parent: tree
        };
      }
      const found = findNodeInTree(item.children, node);
      if (found) return found;
    }
    return null;
  }

  function toPathname (path) {
    return `/${path.join('/')}`;
  }

  function toLeaf (node, key, index, id) {
    const obj = {
      ...node,
      key,
      pathname: toPathname(key),
      index,
      id
    };
    delete obj.children;
    return obj;
  }

  function unwrapModule (node) {
    let result = node;
    if (node && node.__esModule) {
      result = {
        ...node.metadata || {},
        body: node.default
      };
      delete result.__esModule;
      delete result.default;
    }
    if (result.body && result.body.__esModule) {
      const esModule = result.body;
      if (esModule.default) result.body = esModule.default;
      if (esModule.metadata) Object.assign(result, esModule.metadata);
    }
    return result;
  }

  function walk (output, inputList, path = [], indices = []) {
    inputList.forEach((node, i) => {
      node = unwrapModule(node);

      if (!node.id && !node.title) throw new Error('Must specify id or title for content node');
      const id = node.id || slugify(node.title.toLowerCase(), {
        remove: /[({})[\]]/g
      });
      const key = [ ...path, id ];
      const index = [ ...indices, i ];
      const pathname = toPathname(key);
      if (nodes.find(n => toPathname(n.key) === pathname)) {
        throw new Error(`Already a key at ${pathname}`);
      }
      const leafNode = toLeaf(node, key, index, id);
      nodes.push(leafNode);
      map[pathname] = leafNode;

      const treeNode = {
        node: leafNode,
        children: []
      };
      output.push(treeNode);

      if (node.children) {
        walk(treeNode.children, node.children, key, index);
      }
    });
  }
}