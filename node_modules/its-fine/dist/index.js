import r from "react";
const v = /* @__PURE__ */ (() => {
  var e, t;
  return typeof window != "undefined" && (((e = window.document) == null ? void 0 : e.createElement) || ((t = window.navigator) == null ? void 0 : t.product) === "ReactNative");
})() ? r.useLayoutEffect : r.useEffect;
function l(e, t, i) {
  if (!e) return;
  if (i(e) === !0) return e;
  let n = t ? e.return : e.child;
  for (; n; ) {
    const o = l(n, t, i);
    if (o) return o;
    n = t ? null : n.sibling;
  }
}
function b(e) {
  try {
    return Object.defineProperties(e, {
      _currentRenderer: {
        get() {
          return null;
        },
        set() {
        }
      },
      _currentRenderer2: {
        get() {
          return null;
        },
        set() {
        }
      }
    });
  } catch (t) {
    return e;
  }
}
const p = /* @__PURE__ */ b(/* @__PURE__ */ r.createContext(null));
class h extends r.Component {
  render() {
    return /* @__PURE__ */ r.createElement(p.Provider, { value: this._reactInternals }, this.props.children);
  }
}
function m() {
  const e = r.useContext(p);
  if (e === null) throw new Error("its-fine: useFiber must be called within a <FiberProvider />!");
  const t = r.useId();
  return r.useMemo(() => {
    for (const n of [e, e == null ? void 0 : e.alternate]) {
      if (!n) continue;
      const o = l(n, !1, (d) => {
        let s = d.memoizedState;
        for (; s; ) {
          if (s.memoizedState === t) return !0;
          s = s.next;
        }
      });
      if (o) return o;
    }
  }, [e, t]);
}
function C() {
  const e = m(), t = r.useMemo(
    () => l(e, !0, (i) => {
      var n;
      return ((n = i.stateNode) == null ? void 0 : n.containerInfo) != null;
    }),
    [e]
  );
  return t == null ? void 0 : t.stateNode.containerInfo;
}
function F(e) {
  const t = m(), i = r.useRef(void 0);
  return v(() => {
    var n;
    i.current = (n = l(
      t,
      !1,
      (o) => typeof o.type == "string" && (e === void 0 || o.type === e)
    )) == null ? void 0 : n.stateNode;
  }, [t]), i;
}
function R(e) {
  const t = m(), i = r.useRef(void 0);
  return v(() => {
    var n;
    i.current = (n = l(
      t,
      !0,
      (o) => typeof o.type == "string" && (e === void 0 || o.type === e)
    )) == null ? void 0 : n.stateNode;
  }, [t]), i;
}
const w = Symbol.for("react.context"), E = (e) => e !== null && typeof e == "object" && "$$typeof" in e && e.$$typeof === w;
function g() {
  const e = m(), [t] = r.useState(() => /* @__PURE__ */ new Map());
  t.clear();
  let i = e;
  for (; i; ) {
    const n = i.type;
    E(n) && n !== p && !t.has(n) && t.set(n, r.use(b(n))), i = i.return;
  }
  return t;
}
function M() {
  const e = g();
  return r.useMemo(
    () => Array.from(e.keys()).reduce(
      (t, i) => (n) => /* @__PURE__ */ r.createElement(t, null, /* @__PURE__ */ r.createElement(i.Provider, { ...n, value: e.get(i) })),
      (t) => /* @__PURE__ */ r.createElement(h, { ...t })
    ),
    [e]
  );
}
function x(e) {
  if (typeof requestAnimationFrame == "function") {
    const i = requestAnimationFrame(e);
    return () => cancelAnimationFrame(i);
  }
  const t = setTimeout(e, 16);
  return () => clearTimeout(t);
}
function N() {
  if (!r.Activity) throw new Error("its-fine: useActivityBridge requires React 19.2 or later!");
  const e = m(), [t] = r.useState(() => {
    const i = [];
    let n = !1;
    l(e, !0, (u) => {
      var c, a;
      if (u.elementType === r.Activity) {
        const y = ((c = u.child) == null ? void 0 : c.tag) === 22 ? u.child.stateNode : null;
        if (typeof (y == null ? void 0 : y._visibility) != "number")
          throw new Error("its-fine: unsupported React Activity internals!");
        i.push(y);
      } else u.tag === 22 && ((a = u.return) == null ? void 0 : a.elementType) !== r.Activity && (n = !0);
    });
    let o = "hidden";
    const d = /* @__PURE__ */ new Set();
    let s;
    const f = {
      mounted: !1,
      connected: !1,
      subscribe(u) {
        return d.add(u), () => {
          d.delete(u);
        };
      },
      sync(u) {
        f.mounted && !f.connected && n && i.length > 0 ? s || (s = x(() => {
          s = void 0, f.sync(!0);
        })) : (s == null || s(), s = void 0);
        let c = o;
        if (f.mounted ? f.connected ? c = "visible" : u && (c = i.every((a) => (a._visibility & 1) !== 0) ? "visible" : "hidden") : c = "hidden", o !== c) {
          o = c;
          for (const a of d) a();
        }
      },
      Bridge({ children: u }) {
        return /* @__PURE__ */ r.createElement(
          r.Activity,
          {
            mode: r.useSyncExternalStore(
              f.subscribe,
              () => o,
              () => "hidden"
            )
          },
          u
        );
      }
    };
    return f;
  });
  return r.useInsertionEffect(() => (t.mounted = !0, queueMicrotask(() => t.sync(!1)), () => {
    t.mounted = !1, queueMicrotask(() => t.sync(!1));
  }), [t]), r.useLayoutEffect(() => (t.connected = !0, t.sync(!1), () => {
    t.connected = !1, t.sync(!0);
  }), [t]), t.Bridge;
}
export {
  h as FiberProvider,
  l as traverseFiber,
  N as useActivityBridge,
  C as useContainer,
  M as useContextBridge,
  g as useContextMap,
  m as useFiber,
  F as useNearestChild,
  R as useNearestParent
};
//# sourceMappingURL=index.js.map
