/**
 * Official Flappy Bill renderer — sprites, sky, monuments, columns, pixel font.
 * Lifted from the public White House arcade page
 * https://www.whitehouse.gov/arcade/flappy-bill/ (inline IIFE, 2026-09-03).
 * Pixel art and draw routines are unchanged; this file only exposes them.
 */
(function (global) {
var b, ge, St, ql, Vl, $l, Kl;
var L = 256, ye = 224;
var Ge = { far: 0.16, near: 0.42, trees: 0.78 };
var Rt = 0.26;

function S(e, l) {
    let n = e.length,
        t = n > 0 ? e[0].length : 0;
    for (let a of e)
        if (a.length !== t) throw new Error(`sprite rows must be equal length (expected ${t}, got ${a.length})`);
    let o = document.createElement("canvas");
    o.width = Math.max(1, t), o.height = Math.max(1, n);
    let r = o.getContext("2d");
    r.imageSmoothingEnabled = !1;
    for (let a = 0; a < n; a += 1)
        for (let k = 0; k < t; k += 1) {
            let i = e[a][k];
            if (i === "." || i === " ") continue;
            let s = l[i];
            s && (r.fillStyle = s, r.fillRect(k, a, 1, 1))
        }
    return {
        width: t,
        height: n,
        image: o
    }
}
var W = 16,
    Ue = new WeakMap;

function Gt(e) {
    let l = Math.ceil(Math.sqrt(e.width ** 2 + e.height ** 2)) + 1,
        n = l + l % 2,
        t = [];
    for (let o = 0; o < W; o += 1) {
        let r = document.createElement("canvas");
        r.width = n, r.height = n;
        let a = r.getContext("2d");
        a.imageSmoothingEnabled = !1, a.translate(n / 2, n / 2), a.rotate(o / W * Math.PI * 2), a.drawImage(e.image, -e.width / 2, -e.height / 2), t.push(r)
    }
    return t
}

function We(e, l, n, t, o, r = !1) {
    if (Math.abs(o) < 1e-4) {
        C(e, l, n, t, r);
        return
    }
    let a = Ue.get(l);
    a || (a = Gt(l), Ue.set(l, a));
    let k = Math.PI * 2 / W,
        i = (Math.round(o / k) % W + W) % W;
    if (i === 0) {
        C(e, l, n, t, r);
        return
    }
    let s = a[i],
        h = Math.round(n + l.width / 2),
        f = Math.round(t + l.height / 2),
        p = s.width / 2;
    if (!r) {
        e.drawImage(s, Math.round(h - p), Math.round(f - p));
        return
    }
    e.save(), e.translate(h, f), e.scale(-1, 1), e.drawImage(s, -p, -p), e.restore()
}

function C(e, l, n, t, o = !1) {
    let r = Math.floor(n),
        a = Math.floor(t);
    if (!o) {
        e.drawImage(l.image, r, a);
        return
    }
    e.save(), e.translate(r + l.width, a), e.scale(-1, 1), e.drawImage(l.image, 0, 0), e.restore()
}
var Ht = {
        A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
        B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
        C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
        D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
        E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
        F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
        G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
        H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
        I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
        J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
        K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
        L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
        M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
        N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
        O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
        P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
        Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
        R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
        S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
        T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
        U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
        V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
        W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
        X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
        Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
        Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
        0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
        1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
        2: [".###.", "#...#", "....#", "..##.", ".#...", "#....", "#####"],
        3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
        4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
        5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
        6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
        7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
        8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
        9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
        $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
        ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
        ",": [".....", ".....", ".....", ".....", ".##..", "..#..", ".#..."],
        ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
        "\xB7": [".....", ".....", ".....", "..#..", ".....", ".....", "....."],
        "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
        "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
        "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
        "'": ["..#..", "..#..", ".....", ".....", ".....", ".....", "....."],
        "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
        "?": [".###.", "#...#", "....#", "..##.", "..#..", ".....", "..#.."],
        "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", ".#.##", "#..##"]
    },
    Ee = new Map(Object.entries(Ht));

function N(e, l = 1) {
    return e.length === 0 ? 0 : (e.length * 6 - 1) * l
}
var O = 7,
    Nt = 32,
    xe = new Map,
    qe = null;

function Ot() {
    return qe || (typeof document < "u" && typeof document.createElement == "function" ? () => document.createElement("canvas") : null)
}

function Ft(e, l) {
    let n = Ot();
    if (!n) return null;
    let t = n();
    if (!t || typeof t.getContext != "function") return null;
    let o = [...Ee.keys()],
        r = 5 * l,
        a = 7 * l;
    t.width = r * o.length, t.height = a;
    let k = t.getContext("2d");
    if (!k || typeof k.fillRect != "function") return null;
    k.fillStyle = e;
    let i = new Map;
    for (let s = 0; s < o.length; s += 1) {
        let h = o[s],
            f = s * r;
        i.set(h, f);
        let p = Ee.get(h);
        for (let c = 0; c < 7; c += 1) {
            let d = p[c];
            for (let u = 0; u < 5; u += 1) d[u] === "#" && k.fillRect(f + u * l, c * l, l, l)
        }
    }
    return {
        canvas: t,
        offsets: i,
        gw: r,
        gh: a
    }
}

function Bt(e, l, n) {
    if (!Number.isInteger(n) || n < 1 || typeof e.drawImage != "function") return null;
    let t = `${n}|${l}`,
        o = xe.get(t);
    if (o) return o;
    if (xe.size >= Nt) return null;
    let r = Ft(l, n);
    return r && xe.set(t, r), r
}

function G(e, l, n, t, o, r = 1) {
    e.fillStyle = o;
    let a = Math.round(n),
        k = Math.round(t),
        i = Bt(e, o, r);
    for (let s of String(l).toUpperCase()) {
        if (s === " ") {
            a += 6 * r;
            continue
        }
        if (i) {
            let h = i.offsets.get(s);
            h !== void 0 && e.drawImage(i.canvas, h, 0, i.gw, i.gh, a, k, i.gw, i.gh)
        } else {
            let h = Ee.get(s);
            if (h)
                for (let f = 0; f < 7; f += 1) {
                    let p = h[f];
                    for (let c = 0; c < 5; c += 1) p[c] === "#" && e.fillRect(a + c * r, k + f * r, r, r)
                }
        }
        a += 6 * r
    }
    return a
}

function H(e, l, n, t, o, r = 1) {
    G(e, l, Math.round(n - N(l, r) / 2), t, o, r)
}

function et(e, l, n, t, o = {}) {
    let r = o.top ?? 78,
        a = o.height ?? 54;
    e.fillStyle = o.background ?? "rgba(8, 12, 20, 0.82)", e.fillRect(0, r, l, a), H(e, n, l / 2, r + 8, o.titleColour ?? "#ffe680", 2), H(e, t, l / 2, r + 30, o.subtitleColour ?? "#e8edf5")
}
var Yt = 10,
    tt = 12,
    Ut = 12,
    $ = 5,
    ce = 10;

function Se({
    lines: e = [],
    prompt: l,
    best: n,
    titleScale: t = 2
}) {
    let o = tt + O * t;
    return e.length > 0 && (o += ce + e.length * (O + $) - $), l && (o += ce + O), n && (o += $ + O), o + Ut
}

function lt(e, l, n, t) {
    let {
        title: o,
        lines: r = [],
        prompt: a,
        best: k,
        titleScale: i = 2,
        fade: s = 1,
        top: h
    } = t;
    e.fillStyle = `rgba(8, 12, 20, ${(.72*s).toFixed(3)})`, e.fillRect(0, 0, l, n);
    let f = Math.max(N(o, i), ...r.map(v => N(v)), a ? N(a) : 0, k ? N(k) : 0),
        p = Math.min(l - 8, f + Yt * 2 + 8),
        c = Se({
            lines: r,
            prompt: a,
            best: k,
            titleScale: i
        }),
        d = Math.round((l - p) / 2),
        u = Math.round(h ?? (n - c) / 2);
    e.globalAlpha = s, e.fillStyle = "#0b1020", e.fillRect(d, u, p, c), e.fillStyle = "#18233f", e.fillRect(d + 1, u + 1, p - 2, c - 2), e.fillStyle = "#0d1326", e.fillRect(d + 3, u + 3, p - 6, c - 6), e.fillStyle = "#2c3a5e", e.fillRect(d + 1, u + 1, p - 2, 1), e.fillRect(d + 1, u + 1, 1, c - 2);
    let w = u + tt;
    for (let [v, g] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ]) H(e, o, l / 2 + v, w + g, "#0b1020", i);
    if (H(e, o, l / 2, w, "#ffe680", i), w += O * i, r.length > 0) {
        w += ce;
        for (let v of r) H(e, v, l / 2, w, "#9fb4c8"), w += O + $;
        w -= $
    }
    a && (w += ce, H(e, a, l / 2, w, "#ffe680"), w += O), k && (w += $, H(e, k, l / 2, w, "#c9a227")), e.globalAlpha = 1
}

function R(e) {
    let l = e.reduce((n, t) => Math.max(n, t.length), 0);
    return e.map(n => n.padEnd(l, "."))
}
var Ae = {
        k: "#241a12",
        b: "#6b4a2a",
        d: "#4a3219",
        t: "#8f6837",
        w: "#f7f4ec",
        s: "#d5cfc0",
        y: "#f2b705",
        e: "#101010",
        p: "#faf4e4",
        i: "#4a5260",
        r: "#a83232"
    },
    Wt = R([".........kkkk", "........ktttk", ".......kttttk", "......kttttdk", ".....ktttttdk..kkkk", "....kttttttdk.kwwwwk", "....kttttttdk.kwewwkyy", ".....kkttttdkkwwwwwkyy", ".kkkkbbbbbbbbbwwwwwkk", "kwwwsbbbbbbbbbbbwwkk", "kwwwsbbbbbbbbbbbkk", ".kwwsbbbbbbbbbbkk", "..kkkbbbbbbbbkk", "......kyykkyyk", ".......yy..yy", "......kkkkkkkkk", "......kpppppppk", "......kpiiiiipk", "......kpppppppk", "......kpiiiirrk", "......kpppppppk", "......kpiiiprrk", "......kpppppppk", "......kkkkkkkkk"]),
    qt = R(["", "", "", "", "...............kkkk", "..............kwwwwk", ".....kkkkkkkk.kwewwkyy", "....kttttttdkkwwwwwkyy", ".kkkkttttdddkbwwwwwkk", "kwwwskkddddkkbbbwwkk", "kwwwsbbbbbbbbbbbkk", ".kwwsbbbbbbbbbbkk", "..kkkbbbbbbbbkk", "......kyykkyyk", ".......yy..yy", "......kkkkkkkkk", "......kpppppppk", "......kpiiiiipk", "......kpppppppk", "......kpiiiirrk", "......kpppppppk", "......kpiiiprrk", "......kpppppppk", "......kkkkkkkkk"]),
    Vt = R(["", "", "", "", "...............kkkk", "..............kwwwwk", "..............kwewwkyy", "........kkkkkkwwwwwkyy", ".kkkkbbbbbbbbbwwwwwkk", "kwwwsbbbbbbbbbbbwwkk", "kwwwsbbbbbbbbbbbkk", ".kwwskkkkkbbbbbkk", "..kkkttttkkbbkk", "....kttttdkyyk", ".....kkddk.yy", "......kkkkkkkkk", "......kpppppppk", "......kpiiiiipk", "......kpppppppk", "......kpiiiirrk", "......kpppppppk", "......kpiiiprrk", "......kpppppppk", "......kkkkkkkkk"]),
    D = {
        k: "#4e5666",
        l: "#eef1f7",
        s: "#cdd4e0",
        d: "#9aa4b6",
        w: "#75809a",
        g: "#c8a24a"
    },
    ot = D.l,
    rt = D.s,
    $t = R(["...ll...", "..llss..", "..llss..", ".lllsss.", ".lllsss.", "llllssss"]),
    Kt = R(["..........ll..........", ".........kllk.........", "........kllllk........", ".......kllllllk.......", "......klllllllsk......", "......klllllllsk......", ".....kslllllllssk.....", ".....kslllllllssk.....", "....kkslllllllsskk....", "...kslllwlllwllllsk...", "..ksllllllllllllllsk..", ".kslllllllllllllllssk.", "kslwlwlwlwlwlwlwlwlssk", "kslllllllllllllllllsdk", "kslwlwlwlwlwlwlwlwlsdk", "kslllllllllllllllllsdk", "kkkkkkkkkkkkkkkkkkkkkk"]),
    Xt = {
        k: "#8a7f74",
        l: "#ffffff",
        s: "#f2ece2",
        d: "#d8cfc2",
        w: "#a8967f",
        g: "#c8a24a"
    },
    Jt = R([".....................g", ".....................g", "....................kllk", "...................kllllk", "..................kllllllk", ".................kllllllllk", "................kllllllllllk", "................kkkkkkkkkkkk", ".............kllkllllllllllkllk", ".............kllklwwlwwlwwlkllk", ".............kllklwwlwwlwwlkllk", ".............kllklwwlwwlwwlkllk", "kkkkkkkkkkkkkkllklwwlwwlwwlkllkkkkkkkkkkkkkk", "klllllllllllkkllklwwlwwlwwlkllkklllllllllllk", "klwlwlwlwlwlkkllklwwlwwlwwlkllkklwlwlwlwlwlk", "klllllllllllkkllklwwlwwlwwlkllkklllllllllllk", "klwlwlwlwlwlkkllklwwlwwlwwlkllkklwlwlwlwlwlk", "kdddddddddddkkddddddddddddddddkkdddddddddddk", "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk"]),
    zt = R(["...........ll", "..........kllk", ".........kkllkk", "........klllllllk", ".......klllllllsk", "......ksllllllllsk", "......ksllllllllsk", ".....kkslllllllsskk", "....kkkkkkkkkkkkkkkkk", "...kslslslslslslslslsk", "...kslslslslslslslslsk", "...kslslslslslslslslsk", "..kkkkkkkkkkkkkkkkkkkkk", ".kdddddddddddddddddddddk", "kkkkkkkkkkkkkkkkkkkkkkkkk"]),
    jt = R(["kkkkkkkkkkkkkkkkkkkk", "kllllllllllllllllllk", "kddddddddddddddddddk", "klwlwlwlwlwlwlwlwllk", "klwlwlwlwlwlwlwlwllk", "klwlwlwlwlwlwlwlwllk", "klwlwlwlwlwlwlwlwllk", "kllllllllllllllllllk", "kddddddddddddddddddk", "kkkkkkkkkkkkkkkkkkkk"]),
    Qt = {
        k: "#3b201a",
        r: "#9c5241",
        m: "#6d3629",
        l: "#c47a5f",
        w: "#2a1a1e",
        g: "#c8a24a"
    },
    Zt = R(["....g..........g", "...kkk........kkk", "...krk........krk", "..kkrkk......kkrkk", "..krrrk......krrrk", "..klrmk......klrmk", "..krwrk......krwrk", "..klrmk.kkk..klrmk", "..krrrkkkrkkkkrrrk", "..klrmkkrrrkkklrmk", "kkkkrwrkklrmkkrwrkkk", "krrklrmkkrwrkklrmkrk", "krwkrrrkklrmkkrrrkwk", "krrklwrkkrwrkklwrkrk", "kmmkmmmkkmmmkkmmmkmk", "kkkkkkkkkkkkkkkkkkkk"]),
    el = R(["kkkkkkkkkkkk", "kllllllllllk", "klwlwlwlwlwk", "kllllllllllk", "klwlwlwlwlwk", "kllllllllllk", "klwlwlwlwlwk", "kddddddddddk", "kkkkkkkkkkkk"]),
    I = {
        outline: "#2b2f3a",
        light: "#fffdf6",
        face: "#ece5d4",
        shade: "#c3b79c",
        flute: "#d3c8ae",
        gold: "#d8a930"
    },
    tl = {
        k: I.outline,
        l: I.light,
        s: I.face,
        d: I.shade,
        g: I.gold
    },
    ll = R(["..kkkkkkkkkkkkkkkkkk..", "..klllllllllllllllsk..", "..kssssssssssssssssk..", ".kllllllllllllllllllk.", ".kgggggggggggggggggdk.", "klllllllllllllllllllsk", "kssssssssssssssssssssk", "kkkkkkkkkkkkkkkkkkkkkk"]),
    nt = {
        k: "#123320",
        g: "#1d5c31",
        l: "#2c8440",
        t: "#4a3a24",
        p: "#f0a8bd",
        q: "#d97f9c"
    },
    nl = R(["..kkkk..", ".kgllgk.", "kglllllk", "kgllllgk", ".kgllgk.", "...tt...", "...tt..."]),
    ol = R(["..kppk..", ".kpqqpk.", "kppqqppk", ".kpqqpk.", "...tk...", "...tt..."]),
    at = {
        feather: ["#f7f4ec", "#d5cfc0", "#8f6837", "#6b4a2a"],
        bill: ["#faf4e4", "#e2d8bf", "#a83232", "#4a5260"]
    },
    M = {};

function kt() {
    M.eagleUp = S(Wt, Ae), M.eagleMid = S(qt, Ae), M.eagleDown = S(Vt, Ae), M.monumentCap = S($t, D), M.capitol = S(Kt, D), M.whiteHouse = S(Jt, Xt), M.jefferson = S(zt, D), M.lincoln = S(jt, D), M.castle = S(Zt, Qt), M.fedBlock = S(el, D), M.columnCap = S(ll, tl), M.elm = S(nl, nt), M.cherry = S(ol, nt)
}
var rl = "#12417c",
    al = "#4f8ec9",
    kl = "#c6dfef",
    fe = 208,
    ue = 40;

function st(e, l, n) {
    let t = e.createLinearGradient(0, 0, 0, n);
    t.addColorStop(0, rl), t.addColorStop(.55, al), t.addColorStop(1, kl), e.fillStyle = t, e.fillRect(0, 0, l, n);
    let o = e.createRadialGradient(fe, ue, 0, fe, ue, 52);
    o.addColorStop(0, "rgba(255, 244, 214, 0.5)"), o.addColorStop(1, "rgba(255, 244, 214, 0)"), e.fillStyle = o, e.fillRect(fe - 52, ue - 52, 104, 104), e.fillStyle = "#fff6d8", e.beginPath(), e.arc(fe, ue, 6, 0, Math.PI * 2), e.fill()
}
var F = ["..####....", ".########.", "##########", ".########."],
    il = [{
        x: .05,
        y: 20,
        scale: 2,
        speed: 3.1,
        alpha: .9
    }, {
        x: .32,
        y: 46,
        scale: 1,
        speed: 4.4,
        alpha: .75
    }, {
        x: .55,
        y: 14,
        scale: 3,
        speed: 2.2,
        alpha: .8
    }, {
        x: .78,
        y: 58,
        scale: 2,
        speed: 3.6,
        alpha: .65
    }, {
        x: .9,
        y: 34,
        scale: 1,
        speed: 5,
        alpha: .6
    }];

function ct(e, l, n) {
    for (let t of il) {
        let o = l + F[0].length * t.scale,
            r = (t.x * o + n * t.speed) % o,
            a = Math.round(l - r);
        e.globalAlpha = t.alpha, e.fillStyle = "#ffffff";
        for (let k = 0; k < F.length; k += 1)
            for (let i = 0; i < F[k].length; i += 1) F[k][i] === "#" && e.fillRect(a + i * t.scale, t.y + k * t.scale, t.scale, t.scale);
        e.globalAlpha = t.alpha * .45, e.fillStyle = "#bcd2e6";
        for (let k = 0; k < F[0].length; k += 1) F[F.length - 1][k] === "#" && e.fillRect(a + k * t.scale, t.y + F.length * t.scale, t.scale, t.scale)
    }
    e.globalAlpha = 1
}

function _e(e, l, n, t = 0) {
    let o = document.createElement("canvas");
    o.width = e, o.height = l;
    let r = o.getContext("2d");
    return r.imageSmoothingEnabled = !1, n(r), t > 0 && (r.globalCompositeOperation = "source-atop", r.fillStyle = `rgba(198, 223, 239, ${t})`, r.fillRect(0, 0, e, l), r.globalCompositeOperation = "source-over"), o
}

function pe(e, l, n, t, o) {
    let r = l.width,
        a = -((t % r + r) % r);
    for (let k = a; k < n; k += r) e.drawImage(l, Math.round(k), o)
}
var sl = 288,
    Q = 40;

function ft(e) {
    return _e(sl, Q, l => {
        let n = e.fedBlock,
            t = [0, 5, 2, 8, 1, 6, 3, 7, 0, 4, 9, 2];
        for (let o = 0; o < t.length; o += 1) {
            let r = o * 24;
            C(l, n, r, Q - n.height - t[o]), C(l, n, r + 12, Q - n.height - (t[o] + 3) % 6)
        }
    }, .5)
}
var K = 512,
    de = 108,
    Re = 92,
    ve = 8,
    cl = [{
        x: 240,
        height: 30,
        phase: 0
    }, {
        x: 356,
        height: 26,
        phase: 1.7
    }];

function ut(e) {
    return _e(K, de, l => {
        let n = de,
            t = (a, k) => C(l, a, k, n - a.height);
        t(e.lincoln, 14), t(e.fedBlock, 48), t(e.jefferson, 74);
        let o = e.monumentCap,
            r = n - Re;
        C(l, o, 132, r), l.fillStyle = ot, l.fillRect(132, r + o.height, ve / 2, Re - o.height), l.fillStyle = rt, l.fillRect(132 + ve / 2, r + o.height, ve / 2, Re - o.height), t(e.fedBlock, 158), t(e.castle, 186), t(e.fedBlock, 222), t(e.whiteHouse, 248), t(e.fedBlock, 310), t(e.fedBlock, 334), t(e.capitol, 366), t(e.fedBlock, 404), t(e.jefferson, 430), t(e.fedBlock, 470), l.fillStyle = "rgba(30, 48, 70, 0.22)", l.fillRect(0, n - 2, K, 2)
    }, .22)
}
var Le = 288,
    Z = 12;

function dt(e) {
    return _e(Le, Z, l => {
        for (let n = 0; n * 18 < Le; n += 1) {
            let t = n * 18,
                o = n % 4 === 1 ? e.cherry : e.elm;
            C(l, o, t, Z - o.height)
        }
        l.fillStyle = "#153d24", l.fillRect(0, Z - 3, Le, 3)
    })
}
var fl = "#b22234",
    ul = "#ffffff",
    dl = "#3c3b6e";

function pt(e, l, n = 7) {
    let t = document.createElement("canvas");
    t.width = e, t.height = l;
    let o = t.getContext("2d");
    o.imageSmoothingEnabled = !1;
    for (let r = 0; r < n; r += 1) {
        let a = Math.round(r * l / n),
            k = Math.round((r + 1) * l / n);
        o.fillStyle = r % 2 === 0 ? fl : ul, o.fillRect(0, a, e, Math.max(1, k - a))
    }
    return o.fillStyle = dl, o.fillRect(0, 0, Math.round(e * .4), Math.round(l * 4 / n)), t
}

function pl(e, l, n, t, o, r, a) {
    e.fillStyle = "#dfe4ec", e.fillRect(n, t, 1, o), e.fillStyle = "#e8b93a", e.fillRect(n, t - 1, 1, 1);
    for (let k = 0; k < l.width; k += 1) {
        let i = k / l.width,
            s = Math.sin(i * 5 - r * 4 + a) * i * 1.8;
        e.drawImage(l, k, 0, 1, l.height, n + 1 + k, Math.round(t + s), 1, l.height)
    }
}

function mt(e, l, n, t, o, r) {
    let a = -((t % K + K) % K);
    for (let k = a; k < n; k += K)
        for (let i of cl) {
            let s = Math.round(k + i.x);
            s < -12 || s > n + 12 || pl(e, l, s, o - i.height, i.height, r, i.phase)
        }
}
var ml = "#cfc4a8",
    it = "#a89c80",
    hl = "#3c6a33",
    wl = "#4a7d3e",
    gl = "#2c5026";

function ht(e, l, n, t, o) {
    e.fillStyle = ml, e.fillRect(0, t, l, 6), e.fillStyle = it, e.fillRect(0, t + 6, l, 1), e.fillStyle = hl, e.fillRect(0, t + 7, l, n - t - 7), e.fillStyle = wl;
    let r = 26,
        a = -((o % r + r) % r);
    for (let s = a; s < l; s += r) e.fillRect(Math.round(s), t + 7, 13, n - t - 7);
    e.fillStyle = it;
    let k = 7,
        i = -((o % k + k) % k);
    for (let s = i; s < l; s += k) e.fillRect(Math.round(s), t + 2, 1, 1), e.fillRect(Math.round(s) + 3, t + 4, 1, 1);
    e.fillStyle = gl, e.fillRect(0, n - 3, l, 3)
}

var E = 194,
    Y = 66,
    ee = 22;
var gt = 5,
    yl = 6,
    bl = 8,
    me = 20,
    Ml = 640,
    xl = -196,
    El = 268,
    he = 22,
    Tl = 112,
    Sl = 72,
    Al = 56,
    Rl = 60,
    vl = 94,
    Mt = 20,
    Ll = 24,
    _l = 30,
    Cl = 44,
    Il = 60,
    Pl = 82,
    Gl = -70;

function Ie(e) {
    let l = e.gapY + e.gap;
    return {
        top: {
            x: e.x,
            y: 0,
            w: he,
            h: e.gapY
        },
        bottom: {
            x: e.x,
            y: l,
            w: he,
            h: E - l
        }
    }
}

function Wl(e) {
    let l = document.createElement("canvas");
    l.width = e.width, l.height = e.height;
    let n = l.getContext("2d");
    return n.imageSmoothingEnabled = !1, n.translate(0, e.height), n.scale(1, -1), n.drawImage(e.image, 0, 0), {
        width: e.width,
        height: e.height,
        image: l
    }
}

function At(e, l, n) {
    if (n <= 0) return;
    let t = Math.round(l),
        o = Math.round(n);
    b.fillStyle = I.outline, b.fillRect(e + 2, t, 18, o), b.fillStyle = I.light, b.fillRect(e + 3, t, 5, o), b.fillStyle = I.face, b.fillRect(e + 8, t, 6, o), b.fillStyle = I.shade, b.fillRect(e + 14, t, 5, o), b.fillStyle = I.flute;
    for (let r of [5, 9, 13, 17]) b.fillRect(e + r, t, 1, o)
}

function ln(e) {
    let l = Math.round(e.x),
        {
            top: n,
            bottom: t
        } = Ie(e),
        o = n.h - St.height;
    At(l, 0, o), C(b, St, l, o), C(b, ge, l, t.y), At(l, t.y + ge.height, E - t.y - ge.height)
}

var Official = {};
Official.W = L;
Official.H = ye;
Official.GROUND = E;
Official.sprites = function () { return M; };

Official.init = function () {
  kt();
  ge = M.columnCap;
  St = Wl(ge);
  ql = ft(M);
  Vl = ut(M);
  $l = dt(M);
  Kl = pt(11, 7);
};

function eagleFrame(vy, flapT) {
  if (flapT > 0) {
    var e = 1 - flapT / Rt;
    if (e < 0.35) return M.eagleDown;
    if (e < 0.7) return M.eagleMid;
    return M.eagleUp;
  }
  return vy > 150 ? M.eagleUp : M.eagleMid;
}

function eagleAngle(vy) {
  return Math.min(1.3, Math.max(-0.45, vy / 380));
}

Official.draw = function (ctx, state) {
  b = ctx;
  b.imageSmoothingEnabled = false;
  var time = state.time || 0;
  var scroll = state.scroll || 0;
  var columns = state.columns || [];
  var birds = state.birds || [];
  var score = state.score || 0;
  var best = state.best || 0;

  st(b, L, E);
  ct(b, L, time);
  pe(b, ql, L, scroll * Ge.far, E - Q);
  var skylineY = E - de;
  var near = scroll * Ge.near;
  pe(b, Vl, L, near, skylineY);
  mt(b, Kl, L, near, E, time);
  pe(b, $l, L, scroll * Ge.trees, E - Z + 1);
  for (var i = 0; i < columns.length; i += 1) ln(columns[i]);
  ht(b, L, ye, E, scroll);

  for (var j = 0; j < birds.length; j += 1) {
    var bird = birds[j];
    if (!bird) continue;
    b.globalAlpha = bird.alpha == null ? 1 : bird.alpha;
    We(b, eagleFrame(bird.vy, bird.flapT || 0), Y, bird.y, eagleAngle(bird.vy));
  }
  b.globalAlpha = 1;

  if (state.showHud !== false) {
    var label = String(score);
    var scale = 3;
    var sx = Math.round((L - N(label, scale)) / 2);
    G(b, label, sx + 1, 15, "rgba(10, 20, 34, 0.55)", scale);
    G(b, label, sx, 14, "#ffffff", scale);
    if (best > 0) {
      G(b, "BEST " + best, 5, 6, "rgba(10, 20, 34, 0.5)");
      G(b, "BEST " + best, 4, 5, "#ffe680");
    }
  }

  if (state.title) {
    lt(b, L, ye, {
      title: "FLAPPY BILL",
      lines: ["KEEP THE BILL IN THE AIR", "WHILE FLYING THROUGH MONUMENTS"],
      prompt: state.titlePrompt || "50 BRAINS LEARNING TO FLY",
      top: Math.round((E - Se({
        lines: ["KEEP THE BILL IN THE AIR", "WHILE FLYING THROUGH MONUMENTS"],
        prompt: "50 BRAINS LEARNING TO FLY"
      })) / 2)
    });
  }
};

global.Official = Official;
})(window);
