/* அமிர்தம் — demo link (நண்பர்களுக்குக் காட்ட) · demo-1 · 24-11-2026
 * உண்மையான Firebase / தரவு எதையும் தொடாது: போலி backend (fake.js) + கற்பனைக் கிராமம் (seed.js).
 * இந்த phone-ல் உண்மை app இருந்தாலும் அதன் சேமிப்பைத் தொடாது — எல்லா localStorage சாவிகளும் "amdemo:" முன்னொட்டுடன்.
 * மேலே சிறு பட்டை: உரிமையாளர் / பணியாளர் பார்வை, மீட்டமை. பணியாளர் "தொடங்கு" அழுத்தியதும் போலி GPS வழியில் நகரும். */
(function () {
  var PFX = "amdemo:", real = window.localStorage;
  var store = {
    getItem: function (k) { return real.getItem(PFX + k); },
    setItem: function (k, v) { real.setItem(PFX + k, String(v)); },
    removeItem: function (k) { real.removeItem(PFX + k); },
    key: function (i) { var ks = []; for (var j = 0; j < real.length; j++) { var x = real.key(j); x && x.indexOf(PFX) === 0 && ks.push(x.slice(PFX.length)); } return ks[i] || null; },
    clear: function () { var ks = []; for (var j = 0; j < real.length; j++) { var x = real.key(j); x && x.indexOf(PFX) === 0 && ks.push(x); } ks.forEach(function (x) { real.removeItem(x); }); },
    get length() { var n = 0; for (var j = 0; j < real.length; j++) { var x = real.key(j); x && x.indexOf(PFX) === 0 && n++; } return n; }
  };
  try { Object.defineProperty(window, "localStorage", { value: store, configurable: true }); } catch (e) {}
  window.__AMKEEP = "db"; window.__AMNOCLK = 1; window.__AMDEMO = 1;
  window.__AMSEEDOPTS = { demo: true };
  var role = store.getItem("role") || "owner";
  window.__AMUSER = role === "staff" ? "staff@demo.app" : "owner@demo.app";
  // demo நாள் மாறினால் (பழைய தரவு) — புதிதாக
  var today = new Date(), ds = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
  if (store.getItem("day") !== ds) { store.removeItem("db"); store.setItem("day", ds); }

  /* --- போலி GPS: பண்ணையில் நிற்கும்; இன்றைய விநியோகம் தொடங்கியதும் வழியில் (வேகம் ×2), வீட்டில் 7 வினாடி நிற்கும் --- */
  var G = { m: 0, dw: 0, seen: {}, ws: {}, n: 0, t: 0 };
  function geo() { return window.__amDemoGeo; }
  function curRun() {
    var db = window.__AMDB || {}, F = ["FN", "AN"], out = null;
    F.forEach(function (f) { var w = db["work/" + ds + "_" + f]; if (w && w.start && !w.end) out = { f: f, r: db["routes/" + ds + "_" + f] }; });
    return out;
  }
  function pos() {
    var g = geo(); if (!g) return [10.7905, 78.7047];
    var run = curRun();
    if (!run) { G.m = 0; G.dw = 0; G.seen = {}; var f = g.P(0, 0); return f; }
    var p = g.along(G.m), ll = g.P(p.e, p.n), db = window.__AMDB || {};
    if (G.dw > 0) { G.dw--; return [G.at[0] + (G.dw % 2) * 0.000004, G.at[1]]; }
    var ids = (run.r && run.r.stops || []).map(function (s) { return s.id; }), hit = null;
    ids.forEach(function (id) { var h = db["homes/" + id]; if (!hit && h && !G.seen[id] && Math.hypot((h.lat - ll[0]) * 111320, (h.lng - ll[1]) * 109000) < 16) hit = { id: id, h: h }; });
    if (hit) { G.seen[hit.id] = 1; G.dw = 7; G.at = [hit.h.lat, hit.h.lng]; return G.at; }
    G.m = Math.min(G.m + 12, g.C[g.C.length - 1]);
    return ll;
  }
  function fix() { var p = pos(); return { coords: { latitude: p[0], longitude: p[1], accuracy: 6, speed: null, heading: null, altitude: null, altitudeAccuracy: null }, timestamp: Date.now() }; }
  var fake = {
    getCurrentPosition: function (ok) { setTimeout(function () { ok(fix()); }, 300); },
    watchPosition: function (ok) { var id = ++G.n; G.ws[id] = setInterval(function () { ok(fix()); }, 1000); setTimeout(function () { ok(fix()); }, 200); return id; },
    clearWatch: function (id) { clearInterval(G.ws[id]); delete G.ws[id]; }
  };
  try { Object.defineProperty(navigator, "geolocation", { value: fake, configurable: true }); } catch (e) {}

  /* --- மேல் பட்டை --- */
  function bar() {
    var b = document.createElement("div");
    b.id = "demobar";
    b.innerHTML = '<b>DEMO</b><button data-r="owner" class="' + (role === "owner" ? "on" : "") + '">👤 உரிமையாளர்</button><button data-r="staff" class="' + (role === "staff" ? "on" : "") + '">🛵 பணியாளர்</button><button data-reset>↺</button>';
    b.onclick = function (e) {
      var x = e.target.closest("button"); if (!x) return;
      if (x.dataset.reset !== undefined) { if (confirm("Demo தரவை மீட்டமைக்கவா?")) { store.clear(); location.reload(); } return; }
      store.setItem("role", x.dataset.r); location.reload();
    };
    document.body.appendChild(b);
    var st = document.createElement("style");
    st.textContent = "#demobar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(64px + env(safe-area-inset-bottom));z-index:950;display:flex;gap:4px;align-items:center;background:rgba(20,30,35,.88);color:#fff;border-radius:20px;padding:4px 6px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)}#demobar b{padding:0 6px;color:#FFD54F}#demobar button{border:0;border-radius:14px;background:transparent;color:#fff;font:inherit;padding:5px 9px}#demobar button.on{background:#fff;color:#17485A;font-weight:700}";
    document.head.appendChild(st);
    if (!store.getItem("hello")) {
      store.setItem("hello", "1");
      setTimeout(function () {
        var t = document.getElementById("toast");
        if (t) { t.textContent = "இது demo — கற்பனைத் தரவு. 🛵 பணியாளர் ▸ வருகை ▸ தொடங்கு அழுத்தினால் வண்டி வழியில் நகரும். உரிமையாளர் ▸ 🛵 விநியோகம் ▸ வழி ▸ ▶ replay."; t.className = "toast show"; setTimeout(function () { t.className = "toast"; }, 9000); }
      }, 2500);
    }
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", bar) : bar();
})();
