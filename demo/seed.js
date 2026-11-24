/* அமிர்தம் — demo / சோதனைத் தரவு · seed-1 · 24-11-2026
 * ஒரு கற்பனைக் கிராமம்: பண்ணை, முதன்மைச் சாலை (இருபக்க வீடுகள்), ஒரு முட்டுச் சந்து (3 வீடு), வளைந்து திரும்பும் வழி.
 * உண்மையான வாடிக்கையாளர் பெயர் / இடம் எதுவும் இல்லை. window.__amDemoSeed(opts) → {path: data} */
(function () {
  var LAT0 = 10.79050, LNG0 = 78.70470;          // கற்பனை இடம்
  var KM = 111320, CS = Math.cos(LAT0 * Math.PI / 180);
  function P(e, n) { return [+(LAT0 + n / KM).toFixed(6), +(LNG0 + e / (KM * CS)).toFixed(6)]; }   // கிழக்கு / வடக்கு மீட்டரில்
  function pad(x) { return ("0" + x).slice(-2); }
  function ds(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addD(s, k) { var p = s.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + k); return ds(d); }
  function encode(pts) {
    var out = "", pla = 0, plo = 0;
    function one(v) { v = v < 0 ? ~(v << 1) : (v << 1); var s = ""; while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); }
    pts.forEach(function (p) { var a = Math.round(p[0] * 1e5), b = Math.round(p[1] * 1e5); out += one(a - pla) + one(b - plo); pla = a; plo = b; });
    return out;
  }
  // சாலை வழி (கிழக்கு, வடக்கு மீட்டர்): பண்ணை → வடக்கு 420 → சந்து கிழக்கு 160 → திரும்ப → வடக்கு 1100 → கிழக்கு 320 → தெற்கு 80 → மேற்கு → பண்ணை
  var ROAD = [[0, 0], [0, 420], [160, 420], [0, 420], [0, 1100], [320, 1100], [320, 80], [0, 80], [0, 0]];
  // வீடுகள்: [சாலையில் எத்தனை மீட்டர், பக்கம் (+1 வலது / -1 இடது, பயண திசைப்படி), பெயர், அளவு, packs]
  var NAMES = ["முருகன்", "லட்சுமி", "செல்வம்", "கவிதா", "ராஜா", "மீனா", "சுப்பிரமணி", "தேவி", "கணேசன்", "பார்வதி", "அருள்", "சாந்தி",
    "வேலு", "ரேவதி", "பாண்டியன்", "ஜோதி", "கண்ணன்", "அம்பிகா", "சேகர்", "வள்ளி", "மணி", "சரோஜா", "பிரபு", "கலா"];
  var Q = [[1, [1, 0, 0]], [0.5, [0, 0, 1]], [1, [0, 0, 2]], [1.5, [1, 0, 1]], [0.7, [0, 1, 0]], [2, [2, 0, 0]], [1, [1, 0, 0]], [0.5, [0, 0, 1]]];
  var AT = [60, 130, 150, 230, 300, 380, 470, 520, 560, 690, 760, 840, 980, 1110, 1260, 1350, 1520, 1640, 1760, 1900, 2050, 2230, 2380, 2470];
  var SIDE = [-1, -1, 1, -1, 1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1];
  function cum() { var c = [0]; for (var i = 1; i < ROAD.length; i++) { var a = ROAD[i - 1], b = ROAD[i]; c.push(c[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); } return c; }
  var C = cum();
  function along(m) {      // சாலையில் m மீட்டரில் உள்ள புள்ளியும் திசையும்
    for (var i = 1; i < ROAD.length; i++) if (m <= C[i] || i === ROAD.length - 1) {
      var a = ROAD[i - 1], b = ROAD[i], L = C[i] - C[i - 1] || 1, f = Math.max(0, Math.min(1, (m - C[i - 1]) / L));
      return { e: a[0] + (b[0] - a[0]) * f, n: a[1] + (b[1] - a[1]) * f, dx: (b[0] - a[0]) / L, dy: (b[1] - a[1]) / L };
    }
  }
  function house(i) { var g = along(AT[i]), s = SIDE[i] * 13; return P(g.e + g.dy * s, g.n - g.dx * s); }   // வலது = (dy, -dx)
  // பயணம்: சாலையில் 6 மீ/வி, ஒவ்வொரு வீட்டிலும் 15–25 வி நிற்பு; shortcut = 1110–1350 இடையே வேறு சாலை (புதிய வழி சோதனை)
  function trip(day, opt) {
    opt = opt || {};
    var pts = [], ts = [], t = 0, vis = {}, marks = {}, nextH = 0, ids = opt.ids, rnd = opt.seed || 1;
    function rn() { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280 - 0.5; }
    function push(e, n) { var p = P(e + rn() * 3, n + rn() * 3); pts.push(p); ts.push(Math.round(t)); }
    for (var m = 0; m <= C[C.length - 1]; m += 6) {
      var g = along(m), e = g.e, n = g.n;
      if (opt.short && m > 1120 && m < 1340) e = 45 * Math.sin((m - 1120) / 220 * Math.PI);    // கிழக்கே வளைந்த குறுக்கு வழி
      push(e, n); t += 1;
      while (nextH < AT.length && m >= AT[nextH] - 3) {
        var h = house(nextH), id = ids[nextH], off = opt.offset && opt.offset[id] ? opt.offset[id] : [0, 0];
        var w = 15 + (nextH % 3) * 5, tin = t;
        for (var k = 0; k < 4; k++) { pts.push([+(h[0] + off[1] / KM + rn() * 2 / KM).toFixed(6), +(h[1] + off[0] / (KM * CS)).toFixed(6)]); ts.push(Math.round(t)); t += w / 4; }
        vis[id] = [Math.round(tin), Math.round(t), +(h[0] + off[1] / KM).toFixed(6), +(h[1] + off[0] / (KM * CS)).toFixed(6)];
        marks[id] = Math.round(t - 2);
        nextH++;
      }
    }
    var km = 0; for (var j = 1; j < pts.length; j++) { var a = pts[j - 1], b = pts[j]; km += Math.hypot((b[0] - a[0]) * KM, (b[1] - a[1]) * KM * CS); }
    var d = 0, tsd = ts.map(function (x) { var r = x - d; d = x; return r.toString(36); }).join(",");
    return { trk: { v: 1, enc: encode(pts), ts: tsd, n: pts.length, km: Math.round(km / 100) / 10, sec: Math.round(t), vis: vis }, marks: marks, sec: Math.round(t) };
  }

  window.__amDemoSeed = function (opts) {
    opts = opts || {};
    var now = opts.now ? new Date(opts.now) : new Date(), today = ds(now), ym = today.slice(0, 7), db = {};
    var farm = P(0, 0), farmS = farm[0] + ", " + farm[1], staffName = opts.staffName || "முருகேசன்";
    db["users/owner@demo.app"] = { email: "owner@demo.app", role: "owner", active: true };
    db["users/staff@demo.app"] = { email: "staff@demo.app", role: "staff", pid: "P1", active: true };
    db["people/P1"] = { id: "P1", n: staffName, en: "Murugesan", ph: "9000000001", type: "full", job: "delivery", join: "2026-01-01", act: true, email: "staff@demo.app" };
    db["people/P2"] = { id: "P2", n: "ரவி (மாற்று)", en: "Ravi", ph: "9000000002", type: "sub", job: "delivery", join: "2026-06-01", act: true, email: "" };
    db["pub/staff"] = { farmLoc: farmS, farmR: 150, startFN: "05:45", startAN: "15:45", grace: 10, nearM: 30, dwellR: 10, kg1: 1.035 };
    if (opts.demo) { db["pub/staff"].grace = 1440; db["pub/staff"].farmR = 1000000; }
    db["pub/main"] = { name: "அமிர்தம் (demo)" };
    db["settings/main"] = { farm: farmS, vehOn: false };
    db["asg/A1"] = { id: "A1", from: addD(today, -40), to: "", f: "FD", p: "P1", note: "", at: now.toISOString(), del: false };
    var ids = [], homes = {};
    NAMES.forEach(function (nm, i) {
      var id = "G" + (101 + i), q = Q[i % Q.length], h = house(i);
      ids.push(id);
      var c = { id: id, n: nm, en: "", f: "FN", rt: i + 1, q: q[0], p: q[1], combo: "", st: "act", rate: 56, ph: "", lat: h[0], lng: h[1],
        addr: i % 4 === 0 ? "நீல கேட், வலது பக்கம்" : i % 5 === 1 ? "கடை பின்புறம்" : "", photo: "", stv: "", min: 0.5, ccat: "normal", upd: now.toISOString() };
      db["customers/" + id] = c;
      homes[id] = { id: id, n: nm, rt: i + 1, lat: h[0], lng: h[1], addr: c.addr, photo: "", stv: "", temp: null };
      db["homes/" + id] = homes[id];
      db["months/" + ym + "/rows/" + id] = { q: {}, w: {}, rate: 56, old: 0, red: 0, can: 0 };
    });
    // மாலை: 8 வீடு (தனி ID)
    [1, 4, 7, 10, 13, 16, 19, 22].forEach(function (i, k) {
      var id = "G" + (201 + k), h = house(i), nm = NAMES[i] + " (மாலை)";
      db["customers/" + id] = { id: id, n: nm, f: "AN", rt: k + 1, q: 0.5, p: [0, 0, 1], st: "act", rate: 56, lat: h[0], lng: h[1], addr: "", photo: "", stv: "", min: 0.5, ccat: "normal" };
      db["homes/" + id] = { id: id, n: nm, rt: k + 1, lat: h[0], lng: h[1], addr: "", photo: "", stv: "", temp: null };
      db["months/" + ym + "/rows/" + id] = { q: {}, w: {}, rate: 56, old: 0 };
    });
    // இன்றைய / நாளைய வழிப் பட்டியல் (owner app மீண்டும் வெளியிடும்)
    function route(d, F) {
      var st = [], pk = [0, 0, 0];
      Object.keys(db).filter(function (p) { return p.indexOf("customers/") === 0 && db[p].f === F; }).map(function (p) { return db[p]; })
        .sort(function (a, b) { return a.rt - b.rt; }).forEach(function (c) {
          st.push({ id: c.id, rt: c.rt, n: c.n, en: c.en || "", q: c.q, req: c.q, pk: c.p.slice(), k: "ok", ask: false });
          pk[0] += c.p[0]; pk[1] += c.p[1]; pk[2] += c.p[2];
        });
      return { date: d, f: F, pid: "P1", pname: staffName, stops: st, moved: [], pk: pk, veh: true, vehOn: false, milk: F === "FN" ? "05:50" : "15:50", farm: farmS, upd: now.toISOString() };
    }
    [today, addD(today, 1)].forEach(function (d) { ["FN", "AN"].forEach(function (F) { db["routes/" + d + "_" + F] = route(d, F); }); });
    // கடந்த நாட்கள்: வருகை, ✓, பயணப் பதிவு (trk). நேற்றும் முந்தைய நாளும் குறுக்கு வழி (புதிய வழி ஒப்பீடு); G107 வீட்டு இடம் 14 மீ தள்ளி (இடம் சரிசெய்தல்)
    var days = opts.days === undefined ? 6 : opts.days;
    for (var k = days; k >= 1; k--) {
      var d = addD(today, -k), short = k <= 2 && opts.short !== false, T = trip(d, { ids: ids, short: short, seed: k * 7, offset: k <= 4 ? { G107: [14, 0] } : null });
      var t0 = new Date(d + "T06:02:00"), iso = function (s) { return new Date(t0.getTime() + s * 1000).toISOString(); }, mk = {};
      Object.keys(T.marks).forEach(function (id) { mk[id] = { t: iso(T.marks[id]), k: "ok", why: "" }; });
      var tk = Object.assign({}, T.trk, { t0: t0.toISOString() });
      db["work/" + d + "_FN"] = { date: d, f: "FN", pid: k === 3 ? "P2" : "P1", arrive: new Date(d + "T05:47:00").toISOString(), arriveLoc: farmS, start: t0.toISOString(), end: iso(T.sec + 30), marks: mk, trk: tk, ok: k > 1 };
      db["days/" + d] = { date: d, milk: { FN: "05:52", AN: "15:50" } };
      db["routes/" + d + "_FN"] = route(d, "FN");
      if (k === 3) db["routes/" + d + "_FN"].pid = "P2";
      db["work/" + d + "_AN"] = { date: d, f: "AN", pid: "P1", arrive: new Date(d + "T15:44:00").toISOString(), start: new Date(d + "T16:00:00").toISOString(), end: new Date(d + "T16:40:00").toISOString(), marks: {} };
    }
    db["days/" + today] = { date: today, milk: { FN: "05:52" } };
    if (opts.extra) Object.keys(opts.extra).forEach(function (p) { db[p] = opts.extra[p]; });
    return db;
  };
  window.__amDemoGeo = { P: P, house: house, along: along, ROAD: ROAD, AT: AT, C: C };
})();
