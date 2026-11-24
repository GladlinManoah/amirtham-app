/* அமிர்தம் — போலி backend (சோதனை + demo) · fake-2 · 24-11-2026
 * app.js-ன் MD(n,t) இதை அழைக்கும்: window.__AMFAKE(n,t) → {get, watchDoc, watchColl, run, onUser, login, logout, redirectResult}
 * தரவு: window.__AMSEED (path → data) அல்லது demo seed; window.__AMKEEP = "key" என்றால் localStorage-ல் சேமிக்கும் (demo).
 * உண்மையான Firebase-ஐத் தொடாது. */
(function () {
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
  function isDel(x) { return isObj(x) && x.__del; }
  function deepMerge(a, b) {
    var o = isObj(a) ? a : {};
    Object.keys(b).forEach(function (k) {
      var v = b[k];
      if (isDel(v)) delete o[k];
      else if (isObj(v) && v.__inc !== undefined) o[k] = (Number(o[k]) || 0) + Number(v.__inc);
      else if (isObj(v)) o[k] = deepMerge(isObj(o[k]) ? o[k] : {}, v);
      else o[k] = clone(v);
    });
    return o;
  }
  function strip(v) {      // set (merge இல்லாமல்) — __del நீக்கம்
    if (isObj(v)) { if (v.__inc !== undefined) return Number(v.__inc); var o = {}; Object.keys(v).forEach(function (k) { if (!isDel(v[k])) o[k] = strip(v[k]); }); return o; }
    if (Array.isArray(v)) return v.map(strip);
    return v;
  }
  function setPath(o, dotted, v) {
    var ks = dotted.split("."), cur = o;
    for (var i = 0; i < ks.length - 1; i++) { if (!isObj(cur[ks[i]])) cur[ks[i]] = {}; cur = cur[ks[i]]; }
    var last = ks[ks.length - 1];
    if (isDel(v)) delete cur[last];
    else if (isObj(v) && v.__inc !== undefined) cur[last] = (Number(cur[last]) || 0) + Number(v.__inc);
    else cur[last] = strip(v);
  }
  function cmp(a, op, b) {
    if (op === "==") return a === b;
    if (op === "!=") return a !== b;
    if (op === "in") return (b || []).indexOf(a) >= 0;
    if (op === "array-contains") return Array.isArray(a) && a.indexOf(b) >= 0;
    if (a === undefined || a === null) return false;
    if (op === ">=") return a >= b;
    if (op === "<=") return a <= b;
    if (op === ">") return a > b;
    if (op === "<") return a < b;
    return false;
  }

  window.__AMFAKE = function (onPending, onErr) {
    var KEEP = window.__AMKEEP || "", db = {};
    try { if (KEEP) db = JSON.parse(localStorage.getItem(KEEP) || "null") || null; } catch (e) { db = null; }
    if (!db || !Object.keys(db).length) db = clone(window.__AMSEED || (window.__amDemoSeed ? window.__amDemoSeed(window.__AMSEEDOPTS || {}) : {})) || {};
    var subs = [], nid = 0, saveT = 0;
    window.__AMDB = db; window.__AMAPI = null;
    function save() { if (!KEEP) return; clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEEP, JSON.stringify(db)); } catch (e) {} }, 300); }
    function collOf(path) { var p = path.split("/"); return p.slice(0, -1).join("/"); }
    function notify(paths) {
      subs.slice().forEach(function (s) {
        if (s.dead) return;
        var hit = paths.some(function (p) { return s.doc ? s.doc === p : collOf(p) === s.coll; });
        if (hit) setTimeout(function () { if (!s.dead) s.fire(); }, 5);
      });
    }
    function docsOf(coll, filters) {
      var out = {};
      Object.keys(db).forEach(function (p) {
        if (collOf(p) !== coll) return;
        var d = db[p], ok = (filters || []).every(function (f) { return cmp(d[f[0]], f[1], f[2]); });
        if (ok) out[p.split("/").pop()] = clone(d);
      });
      return out;
    }
    var api = {
      db: null, auth: null, fake: true,
      get: function (path) { return Promise.resolve(db[path] ? clone(db[path]) : null); },
      watchDoc: function (path, cb) {
        var s = { doc: path, fire: function () { cb(db[path] ? clone(db[path]) : null); } };
        subs.push(s); setTimeout(s.fire, 8);
        return function () { s.dead = true; };
      },
      watchColl: function (coll, filters, cb) {
        var s = { coll: coll, fire: function () { cb(docsOf(coll, filters)); } };
        subs.push(s); setTimeout(s.fire, 8);
        return function () { s.dead = true; };
      },
      run: function (ops) {
        var touched = [];
        (ops || []).forEach(function (o) {
          var path = o.path;
          if (o.op === "add") { path = o.path + "/" + "x" + Date.now().toString(36) + (nid++); db[path] = strip(o.data); }
          else if (o.op === "set") db[path] = o.merge ? deepMerge(clone(db[path]) || {}, o.data) : strip(o.data);
          else if (o.op === "update") { if (!db[path]) { onErr && onErr({ code: "not-found", message: "No document: " + path }); return; } var d = clone(db[path]); Object.keys(o.data).forEach(function (k) { setPath(d, k, o.data[k]); }); db[path] = d; }
          else if (o.op === "delete") delete db[path];
          touched.push(path);
        });
        window.__AMOPS = (window.__AMOPS || []).concat(clone(ops));
        save(); notify(touched);
        return Promise.resolve();
      },
      onUser: function (cb) {
        var em = window.__AMUSER || (KEEP ? localStorage.getItem(KEEP + ".u") : "") || "";
        setTimeout(function () { cb(em ? { email: em, uid: em } : null); }, 10);
        api._cb = cb;
        return function () {};
      },
      login: function () { var em = window.__AMUSER || "owner@demo.app"; try { KEEP && localStorage.setItem(KEEP + ".u", em); } catch (e) {} api._cb && api._cb({ email: em, uid: em }); return Promise.resolve(); },
      redirectResult: function () { return Promise.resolve(null); },
      logout: function () { try { KEEP && localStorage.removeItem(KEEP + ".u"); } catch (e) {} return Promise.resolve(); }
    };
    window.__AMAPI = api;
    return api;
  };
})();
