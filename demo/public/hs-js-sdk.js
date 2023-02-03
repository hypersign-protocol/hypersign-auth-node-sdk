(() => {
    var t, e, n, r, o, i, s, u, a;
    let c;
    e = function() { return "function" == typeof Promise && Promise.prototype && Promise.prototype.then };
    const h = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706];
    var l, f, d, g, p, w;
    r = function(t) { if (!t) throw new Error('"version" cannot be null or undefined'); if (t < 1 || t > 40) throw new Error('"version" should be in range from 1 to 40'); return 4 * t + 17 }, o = function(t) { return h[t] }, i = function(t) { let e = 0; for (; 0 !== t;) e++, t >>>= 1; return e }, s = function(t) {
        if ("function" != typeof t) throw new Error('"toSJISFunc" is not a valid function.');
        c = t
    }, u = function() { return void 0 !== c }, a = function(t) { return c(t) }, l = { bit: 1 }, f = { bit: 0 }, d = { bit: 3 }, g = { bit: 2 }, p = function(t) { return t && void 0 !== t.bit && t.bit >= 0 && t.bit < 4 }, w = function(t, e) {
        if (p(t)) return t;
        try {
            return function(t) {
                if ("string" != typeof t) throw new Error("Param is not a string");
                switch (t.toLowerCase()) {
                    case "l":
                    case "low":
                        return l;
                    case "m":
                    case "medium":
                        return f;
                    case "q":
                    case "quartile":
                        return d;
                    case "h":
                    case "high":
                        return g;
                    default:
                        throw new Error("Unknown EC Level: " + t)
                }
            }(t)
        } catch (t) { return e }
    };
    var m = {};

    function E() { this.buffer = [], this.length = 0 }
    E.prototype = {
        get: function(t) { const e = Math.floor(t / 8); return 1 == (this.buffer[e] >>> 7 - t % 8 & 1) },
        put: function(t, e) { for (let n = 0; n < e; n++) this.putBit(1 == (t >>> e - n - 1 & 1)) },
        getLengthInBits: function() { return this.length },
        putBit: function(t) {
            const e = Math.floor(this.length / 8);
            this.buffer.length <= e && this.buffer.push(0), t && (this.buffer[e] |= 128 >>> this.length % 8), this.length++
        }
    }, m = E;
    var v, y, L = {};

    function R(t) {
        if (!t || t < 1) throw new Error("BitMatrix size must be defined and greater than 0");
        this.size = t, this.data = new Uint8Array(t * t), this.reservedBit = new Uint8Array(t * t)
    }
    R.prototype.set = function(t, e, n, r) {
        const o = t * this.size + e;
        this.data[o] = n, r && (this.reservedBit[o] = !0)
    }, R.prototype.get = function(t, e) { return this.data[t * this.size + e] }, R.prototype.xor = function(t, e, n) { this.data[t * this.size + e] ^= n }, R.prototype.isReserved = function(t, e) { return this.reservedBit[t * this.size + e] }, L = R;
    var b, A = r;
    v = function(t) {
        if (1 === t) return [];
        const e = Math.floor(t / 7) + 2,
            n = A(t),
            r = 145 === n ? 26 : 2 * Math.ceil((n - 13) / (2 * e - 2)),
            o = [n - 7];
        for (let t = 1; t < e - 1; t++) o[t] = o[t - 1] - r;
        return o.push(6), o.reverse()
    }, y = function(t) {
        const e = [],
            n = v(t),
            r = n.length;
        for (let t = 0; t < r; t++)
            for (let o = 0; o < r; o++) 0 === t && 0 === o || 0 === t && o === r - 1 || t === r - 1 && 0 === o || e.push([n[t], n[o]]);
        return e
    };
    var T = r;
    var B, S, P, M, U, _, I, k, N;
    b = function(t) {
        const e = T(t);
        return [
            [0, 0],
            [e - 7, 0],
            [0, e - 7]
        ]
    }, B = { PATTERN000: 0, PATTERN001: 1, PATTERN010: 2, PATTERN011: 3, PATTERN100: 4, PATTERN101: 5, PATTERN110: 6, PATTERN111: 7 };
    const O = 3,
        x = 3,
        C = 40,
        D = 10;

    function z(t, e, n) {
        switch (t) {
            case B.PATTERN000:
                return (e + n) % 2 == 0;
            case B.PATTERN001:
                return e % 2 == 0;
            case B.PATTERN010:
                return n % 3 == 0;
            case B.PATTERN011:
                return (e + n) % 3 == 0;
            case B.PATTERN100:
                return (Math.floor(e / 2) + Math.floor(n / 3)) % 2 == 0;
            case B.PATTERN101:
                return e * n % 2 + e * n % 3 == 0;
            case B.PATTERN110:
                return (e * n % 2 + e * n % 3) % 2 == 0;
            case B.PATTERN111:
                return (e * n % 3 + (e + n) % 2) % 2 == 0;
            default:
                throw new Error("bad maskPattern:" + t)
        }
    }
    var W, F;
    S = function(t) { return null != t && "" !== t && !isNaN(t) && t >= 0 && t <= 7 }, P = function(t) { return S(t) ? parseInt(t, 10) : void 0 }, M = function(t) {
        const e = t.size;
        let n = 0,
            r = 0,
            o = 0,
            i = null,
            s = null;
        for (let u = 0; u < e; u++) {
            r = o = 0, i = s = null;
            for (let a = 0; a < e; a++) {
                let e = t.get(u, a);
                e === i ? r++ : (r >= 5 && (n += O + (r - 5)), i = e, r = 1), e = t.get(a, u), e === s ? o++ : (o >= 5 && (n += O + (o - 5)), s = e, o = 1)
            }
            r >= 5 && (n += O + (r - 5)), o >= 5 && (n += O + (o - 5))
        }
        return n
    }, U = function(t) {
        const e = t.size;
        let n = 0;
        for (let r = 0; r < e - 1; r++)
            for (let o = 0; o < e - 1; o++) {
                const e = t.get(r, o) + t.get(r, o + 1) + t.get(r + 1, o) + t.get(r + 1, o + 1);
                4 !== e && 0 !== e || n++
            }
        return n * x
    }, _ = function(t) {
        const e = t.size;
        let n = 0,
            r = 0,
            o = 0;
        for (let i = 0; i < e; i++) { r = o = 0; for (let s = 0; s < e; s++) r = r << 1 & 2047 | t.get(i, s), s >= 10 && (1488 === r || 93 === r) && n++, o = o << 1 & 2047 | t.get(s, i), s >= 10 && (1488 === o || 93 === o) && n++ }
        return n * C
    }, I = function(t) { let e = 0; const n = t.data.length; for (let r = 0; r < n; r++) e += t.data[r]; return Math.abs(Math.ceil(100 * e / n / 5) - 10) * D }, k = function(t, e) {
        const n = e.size;
        for (let r = 0; r < n; r++)
            for (let o = 0; o < n; o++) e.isReserved(o, r) || e.xor(o, r, z(t, o, r))
    }, N = function(t, e) {
        const n = Object.keys(B).length;
        let r = 0,
            o = 1 / 0;
        for (let i = 0; i < n; i++) {
            e(i), k(i, t);
            const n = M(t) + U(t) + _(t) + I(t);
            k(i, t), n < o && (o = n, r = i)
        }
        return r
    };
    const H = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2, 2, 4, 1, 2, 4, 4, 2, 4, 4, 4, 2, 4, 6, 5, 2, 4, 6, 6, 2, 5, 8, 8, 4, 5, 8, 8, 4, 5, 8, 11, 4, 8, 10, 11, 4, 9, 12, 16, 4, 9, 16, 16, 6, 10, 12, 18, 6, 10, 17, 16, 6, 11, 16, 19, 6, 13, 18, 21, 7, 14, 21, 25, 8, 16, 20, 25, 8, 17, 23, 25, 9, 17, 23, 34, 9, 18, 25, 30, 10, 20, 27, 32, 12, 21, 29, 35, 12, 23, 34, 37, 12, 25, 34, 40, 13, 26, 35, 42, 14, 28, 38, 45, 15, 29, 40, 48, 16, 31, 43, 51, 17, 33, 45, 54, 18, 35, 48, 57, 19, 37, 51, 60, 19, 38, 53, 63, 20, 40, 56, 66, 21, 43, 59, 70, 22, 45, 62, 74, 24, 47, 65, 77, 25, 49, 68, 81],
        q = [7, 10, 13, 17, 10, 16, 22, 28, 15, 26, 36, 44, 20, 36, 52, 64, 26, 48, 72, 88, 36, 64, 96, 112, 40, 72, 108, 130, 48, 88, 132, 156, 60, 110, 160, 192, 72, 130, 192, 224, 80, 150, 224, 264, 96, 176, 260, 308, 104, 198, 288, 352, 120, 216, 320, 384, 132, 240, 360, 432, 144, 280, 408, 480, 168, 308, 448, 532, 180, 338, 504, 588, 196, 364, 546, 650, 224, 416, 600, 700, 224, 442, 644, 750, 252, 476, 690, 816, 270, 504, 750, 900, 300, 560, 810, 960, 312, 588, 870, 1050, 336, 644, 952, 1110, 360, 700, 1020, 1200, 390, 728, 1050, 1260, 420, 784, 1140, 1350, 450, 812, 1200, 1440, 480, 868, 1290, 1530, 510, 924, 1350, 1620, 540, 980, 1440, 1710, 570, 1036, 1530, 1800, 570, 1064, 1590, 1890, 600, 1120, 1680, 1980, 630, 1204, 1770, 2100, 660, 1260, 1860, 2220, 720, 1316, 1950, 2310, 750, 1372, 2040, 2430];
    W = function(t, e) {
        switch (e) {
            case l:
                return H[4 * (t - 1) + 0];
            case f:
                return H[4 * (t - 1) + 1];
            case d:
                return H[4 * (t - 1) + 2];
            case g:
                return H[4 * (t - 1) + 3];
            default:
                return
        }
    }, F = function(t, e) {
        switch (e) {
            case l:
                return q[4 * (t - 1) + 0];
            case f:
                return q[4 * (t - 1) + 1];
            case d:
                return q[4 * (t - 1) + 2];
            case g:
                return q[4 * (t - 1) + 3];
            default:
                return
        }
    };
    var Q, $, G, j, J, K = {};
    const V = new Uint8Array(512),
        Z = new Uint8Array(256);

    function X(t) { this.genPoly = void 0, this.degree = t, this.degree && this.initialize(this.degree) }
    var Y, tt, et, nt, rt, ot, it, st, ut, at, ct, ht, lt, ft, dt, gt, pt, wt, mt, Et, vt, yt, Lt;
    ! function() { let t = 1; for (let e = 0; e < 255; e++) V[e] = t, Z[t] = e, t <<= 1, 256 & t && (t ^= 285); for (let t = 255; t < 512; t++) V[t] = V[t - 255] }(), j = function(t) { return V[t] }, J = function(t, e) { return 0 === t || 0 === e ? 0 : V[Z[t] + Z[e]] }, Q = function(t, e) {
        const n = new Uint8Array(t.length + e.length - 1);
        for (let r = 0; r < t.length; r++)
            for (let o = 0; o < e.length; o++) n[r + o] ^= J(t[r], e[o]);
        return n
    }, $ = function(t, e) {
        let n = new Uint8Array(t);
        for (; n.length - e.length >= 0;) {
            const t = n[0];
            for (let r = 0; r < e.length; r++) n[r] ^= J(e[r], t);
            let r = 0;
            for (; r < n.length && 0 === n[r];) r++;
            n = n.slice(r)
        }
        return n
    }, G = function(t) { let e = new Uint8Array([1]); for (let n = 0; n < t; n++) e = Q(e, new Uint8Array([1, j(n)])); return e }, X.prototype.initialize = function(t) { this.degree = t, this.genPoly = G(this.degree) }, X.prototype.encode = function(t) {
        if (!this.genPoly) throw new Error("Encoder not initialized");
        const e = new Uint8Array(t.length + this.degree);
        e.set(t);
        const n = $(e, this.genPoly),
            r = this.degree - n.length;
        if (r > 0) { const t = new Uint8Array(this.degree); return t.set(n, r), t }
        return n
    }, K = X, dt = function(t) { return !isNaN(t) && t >= 1 && t <= 40 };
    const Rt = "[0-9]+";
    let bt = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    bt = bt.replace(/u/g, "\\u");
    const At = "(?:(?![A-Z0-9 $%*+\\-./:]|" + bt + ")(?:.|[\r\n]))+";
    gt = new RegExp(bt, "g"), pt = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g"), wt = new RegExp(At, "g"), mt = new RegExp(Rt, "g"), Et = new RegExp("[A-Z $%*+\\-./:]+", "g");
    const Tt = new RegExp("^" + bt + "$"),
        Bt = new RegExp("^[0-9]+$"),
        St = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    vt = function(t) { return Tt.test(t) }, yt = function(t) { return Bt.test(t) }, Lt = function(t) { return St.test(t) }, rt = { id: "Numeric", bit: 1, ccBits: [10, 12, 14] }, ot = { id: "Alphanumeric", bit: 2, ccBits: [9, 11, 13] }, it = { id: "Byte", bit: 4, ccBits: [8, 16, 16] }, st = { id: "Kanji", bit: 8, ccBits: [8, 10, 12] }, ut = { bit: -1 }, at = function(t, e) { if (!t.ccBits) throw new Error("Invalid mode: " + t); if (!dt(e)) throw new Error("Invalid version: " + e); return e >= 1 && e < 10 ? t.ccBits[0] : e < 27 ? t.ccBits[1] : t.ccBits[2] }, ct = function(t) { return yt(t) ? rt : Lt(t) ? ot : vt(t) ? st : it }, ht = function(t) { if (t && t.id) return t.id; throw new Error("Invalid mode") }, lt = function(t) { return t && t.bit && t.ccBits }, ft = function(t, e) {
        if (lt(t)) return t;
        try {
            return function(t) {
                if ("string" != typeof t) throw new Error("Param is not a string");
                switch (t.toLowerCase()) {
                    case "numeric":
                        return rt;
                    case "alphanumeric":
                        return ot;
                    case "kanji":
                        return st;
                    case "byte":
                        return it;
                    default:
                        throw new Error("Unknown mode: " + t)
                }
            }(t)
        } catch (t) { return e }
    };
    const Pt = i(7973);

    function Mt(t, e) { return at(t, e) + 4 }

    function Ut(t, e) {
        let n = 0;
        return t.forEach((function(t) {
            const r = Mt(t.mode, e);
            n += r + t.getBitsLength()
        })), n
    }
    var _t;
    Y = function(t, e) { return dt(t) ? parseInt(t, 10) : e }, tt = function(t, e, n) {
        if (!dt(t)) throw new Error("Invalid QR Code version");
        void 0 === n && (n = it);
        const r = 8 * (o(t) - F(t, e));
        if (n === ut) return r;
        const i = r - Mt(n, t);
        switch (n) {
            case rt:
                return Math.floor(i / 10 * 3);
            case ot:
                return Math.floor(i / 11 * 2);
            case st:
                return Math.floor(i / 13);
            default:
                return Math.floor(i / 8)
        }
    }, et = function(t, e) {
        let n;
        const r = w(e, f);
        if (Array.isArray(t)) {
            if (t.length > 1) return function(t, e) {
                for (let n = 1; n <= 40; n++)
                    if (Ut(t, n) <= tt(n, e, ut)) return n
            }(t, r);
            if (0 === t.length) return 1;
            n = t[0]
        } else n = t;
        return function(t, e, n) {
            for (let r = 1; r <= 40; r++)
                if (e <= tt(r, n, t)) return r
        }(n.mode, n.getLength(), r)
    }, nt = function(t) { if (!dt(t) || t < 7) throw new Error("Invalid QR Code version"); let e = t << 12; for (; i(e) - Pt >= 0;) e ^= 7973 << i(e) - Pt; return t << 12 | e };
    const It = i(1335);
    var kt, Nt, Ot;
    _t = function(t, e) { const n = t.bit << 3 | e; let r = n << 10; for (; i(r) - It >= 0;) r ^= 1335 << i(r) - It; return 21522 ^ (n << 10 | r) };
    var xt = {};

    function Ct(t) { this.mode = rt, this.data = t.toString() }
    Ct.getBitsLength = function(t) { return 10 * Math.floor(t / 3) + (t % 3 ? t % 3 * 3 + 1 : 0) }, Ct.prototype.getLength = function() { return this.data.length }, Ct.prototype.getBitsLength = function() { return Ct.getBitsLength(this.data.length) }, Ct.prototype.write = function(t) {
        let e, n, r;
        for (e = 0; e + 3 <= this.data.length; e += 3) n = this.data.substr(e, 3), r = parseInt(n, 10), t.put(r, 10);
        const o = this.data.length - e;
        o > 0 && (n = this.data.substr(e), r = parseInt(n, 10), t.put(r, 3 * o + 1))
    }, xt = Ct;
    var Dt = {};
    const zt = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", " ", "$", "%", "*", "+", "-", ".", "/", ":"];

    function Wt(t) { this.mode = ot, this.data = t }
    Wt.getBitsLength = function(t) { return 11 * Math.floor(t / 2) + t % 2 * 6 }, Wt.prototype.getLength = function() { return this.data.length }, Wt.prototype.getBitsLength = function() { return Wt.getBitsLength(this.data.length) }, Wt.prototype.write = function(t) {
        let e;
        for (e = 0; e + 2 <= this.data.length; e += 2) {
            let n = 45 * zt.indexOf(this.data[e]);
            n += zt.indexOf(this.data[e + 1]), t.put(n, 11)
        }
        this.data.length % 2 && t.put(zt.indexOf(this.data[e]), 6)
    }, Dt = Wt;
    var Ft, Ht = {};

    function qt(t) { this.mode = it, this.data = new Uint8Array(Ft(t)) }
    Ft = function(t) {
        for (var e = [], n = t.length, r = 0; r < n; r++) {
            var o = t.charCodeAt(r);
            if (o >= 55296 && o <= 56319 && n > r + 1) {
                var i = t.charCodeAt(r + 1);
                i >= 56320 && i <= 57343 && (o = 1024 * (o - 55296) + i - 56320 + 65536, r += 1)
            }
            o < 128 ? e.push(o) : o < 2048 ? (e.push(o >> 6 | 192), e.push(63 & o | 128)) : o < 55296 || o >= 57344 && o < 65536 ? (e.push(o >> 12 | 224), e.push(o >> 6 & 63 | 128), e.push(63 & o | 128)) : o >= 65536 && o <= 1114111 ? (e.push(o >> 18 | 240), e.push(o >> 12 & 63 | 128), e.push(o >> 6 & 63 | 128), e.push(63 & o | 128)) : e.push(239, 191, 189)
        }
        return new Uint8Array(e).buffer
    }, qt.getBitsLength = function(t) { return 8 * t }, qt.prototype.getLength = function() { return this.data.length }, qt.prototype.getBitsLength = function() { return qt.getBitsLength(this.data.length) }, qt.prototype.write = function(t) { for (let e = 0, n = this.data.length; e < n; e++) t.put(this.data[e], 8) }, Ht = qt;
    var Qt = {};

    function $t(t) { this.mode = st, this.data = t }
    $t.getBitsLength = function(t) { return 13 * t }, $t.prototype.getLength = function() { return this.data.length }, $t.prototype.getBitsLength = function() { return $t.getBitsLength(this.data.length) }, $t.prototype.write = function(t) {
        let e;
        for (e = 0; e < this.data.length; e++) {
            let n = a(this.data[e]);
            if (n >= 33088 && n <= 40956) n -= 33088;
            else {
                if (!(n >= 57408 && n <= 60351)) throw new Error("Invalid SJIS character: " + this.data[e] + "\nMake sure your charset is UTF-8");
                n -= 49472
            }
            n = 192 * (n >>> 8 & 255) + (255 & n), t.put(n, 13)
        }
    }, Qt = $t;
    var Gt, jt, Jt, Kt, Vt, Zt, Xt, Yt = {},
        te = {
            single_source_shortest_paths: function(t, e, n) {
                var r = {},
                    o = {};
                o[e] = 0;
                var i, s, u, a, c, h, l, f = te.PriorityQueue.make();
                for (f.push(e, 0); !f.empty();)
                    for (u in s = (i = f.pop()).value, a = i.cost, c = t[s] || {}) c.hasOwnProperty(u) && (h = a + c[u], l = o[u], (void 0 === o[u] || l > h) && (o[u] = h, f.push(u, h), r[u] = s));
                if (void 0 !== n && void 0 === o[n]) { var d = ["Could not find a path from ", e, " to ", n, "."].join(""); throw new Error(d) }
                return r
            },
            extract_shortest_path_from_predecessor_list: function(t, e) { for (var n = [], r = e; r;) n.push(r), t[r], r = t[r]; return n.reverse(), n },
            find_path: function(t, e, n) { var r = te.single_source_shortest_paths(t, e, n); return te.extract_shortest_path_from_predecessor_list(r, n) },
            PriorityQueue: {
                make: function(t) {
                    var e, n = te.PriorityQueue,
                        r = {};
                    for (e in t = t || {}, n) n.hasOwnProperty(e) && (r[e] = n[e]);
                    return r.queue = [], r.sorter = t.sorter || n.default_sorter, r
                },
                default_sorter: function(t, e) { return t.cost - e.cost },
                push: function(t, e) {
                    var n = { value: t, cost: e };
                    this.queue.push(n), this.queue.sort(this.sorter)
                },
                pop: function() { return this.queue.shift() },
                empty: function() { return 0 === this.queue.length }
            }
        };

    function ee(t) { return unescape(encodeURIComponent(t)).length }

    function ne(t, e, n) { const r = []; let o; for (; null !== (o = t.exec(n));) r.push({ data: o[0], index: o.index, mode: e, length: o[0].length }); return r }

    function re(t) {
        const e = ne(mt, rt, t),
            n = ne(Et, ot, t);
        let r, o;
        u() ? (r = ne(wt, it, t), o = ne(gt, st, t)) : (r = ne(pt, it, t), o = []);
        return e.concat(n, r, o).sort((function(t, e) { return t.index - e.index })).map((function(t) { return { data: t.data, mode: t.mode, length: t.length } }))
    }

    function oe(t, e) {
        switch (e) {
            case rt:
                return xt.getBitsLength(t);
            case ot:
                return Dt.getBitsLength(t);
            case st:
                return Qt.getBitsLength(t);
            case it:
                return Ht.getBitsLength(t)
        }
    }

    function ie(t, e) {
        let n;
        const r = ct(t);
        if (n = ft(e, r), n !== it && n.bit < r.bit) throw new Error('"' + t + '" cannot be encoded with mode ' + ht(n) + ".\n Suggested mode is: " + ht(r));
        switch (n !== st || u() || (n = it), n) {
            case rt:
                return new xt(t);
            case ot:
                return new Dt(t);
            case st:
                return new Qt(t);
            case it:
                return new Ht(t)
        }
    }

    function se(t, e, n) {
        const r = t.size,
            o = _t(e, n);
        let i, s;
        for (i = 0; i < 15; i++) s = 1 == (o >> i & 1), i < 6 ? t.set(i, 8, s, !0) : i < 8 ? t.set(i + 1, 8, s, !0) : t.set(r - 15 + i, 8, s, !0), i < 8 ? t.set(8, r - i - 1, s, !0) : i < 9 ? t.set(8, 15 - i - 1 + 1, s, !0) : t.set(8, 15 - i - 1, s, !0);
        t.set(r - 8, 8, 1, !0)
    }

    function ue(t, e, n) {
        const r = new m;
        n.forEach((function(e) { r.put(e.mode.bit, 4), r.put(e.getLength(), at(e.mode, t)), e.write(r) }));
        const i = 8 * (o(t) - F(t, e));
        for (r.getLengthInBits() + 4 <= i && r.put(0, 4); r.getLengthInBits() % 8 != 0;) r.putBit(0);
        const s = (i - r.getLengthInBits()) / 8;
        for (let t = 0; t < s; t++) r.put(t % 2 ? 17 : 236, 8);
        return function(t, e, n) {
            const r = o(e),
                i = F(e, n),
                s = r - i,
                u = W(e, n),
                a = u - r % u,
                c = Math.floor(r / u),
                h = Math.floor(s / u),
                l = h + 1,
                f = c - h,
                d = new K(f);
            let g = 0;
            const p = new Array(u),
                w = new Array(u);
            let m = 0;
            const E = new Uint8Array(t.buffer);
            for (let t = 0; t < u; t++) {
                const e = t < a ? h : l;
                p[t] = E.slice(g, g + e), w[t] = d.encode(p[t]), g += e, m = Math.max(m, e)
            }
            const v = new Uint8Array(r);
            let y, L, R = 0;
            for (y = 0; y < m; y++)
                for (L = 0; L < u; L++) y < p[L].length && (v[R++] = p[L][y]);
            for (y = 0; y < f; y++)
                for (L = 0; L < u; L++) v[R++] = w[L][y];
            return v
        }(r, t, e)
    }

    function ae(t, e, n, o) {
        let i;
        if (Array.isArray(t)) i = kt(t);
        else {
            if ("string" != typeof t) throw new Error("Invalid data"); {
                let r = e;
                if (!r) {
                    const e = Ot(t);
                    r = et(e, n)
                }
                i = Nt(t, r || 40)
            }
        }
        const s = et(i, n);
        if (!s) throw new Error("The amount of data is too big to be stored in a QR Code");
        if (e) { if (e < s) throw new Error("\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + s + ".\n") } else e = s;
        const u = ue(e, n, i),
            a = r(e),
            c = new L(a);
        return function(t, e) {
                const n = t.size,
                    r = b(e);
                for (let e = 0; e < r.length; e++) {
                    const o = r[e][0],
                        i = r[e][1];
                    for (let e = -1; e <= 7; e++)
                        if (!(o + e <= -1 || n <= o + e))
                            for (let r = -1; r <= 7; r++) i + r <= -1 || n <= i + r || (e >= 0 && e <= 6 && (0 === r || 6 === r) || r >= 0 && r <= 6 && (0 === e || 6 === e) || e >= 2 && e <= 4 && r >= 2 && r <= 4 ? t.set(o + e, i + r, !0, !0) : t.set(o + e, i + r, !1, !0))
                }
            }(c, e),
            function(t) {
                const e = t.size;
                for (let n = 8; n < e - 8; n++) {
                    const e = n % 2 == 0;
                    t.set(n, 6, e, !0), t.set(6, n, e, !0)
                }
            }(c),
            function(t, e) {
                const n = y(e);
                for (let e = 0; e < n.length; e++) {
                    const r = n[e][0],
                        o = n[e][1];
                    for (let e = -2; e <= 2; e++)
                        for (let n = -2; n <= 2; n++) - 2 === e || 2 === e || -2 === n || 2 === n || 0 === e && 0 === n ? t.set(r + e, o + n, !0, !0) : t.set(r + e, o + n, !1, !0)
                }
            }(c, e), se(c, n, 0), e >= 7 && function(t, e) {
                const n = t.size,
                    r = nt(e);
                let o, i, s;
                for (let e = 0; e < 18; e++) o = Math.floor(e / 3), i = e % 3 + n - 8 - 3, s = 1 == (r >> e & 1), t.set(o, i, s, !0), t.set(i, o, s, !0)
            }(c, e),
            function(t, e) {
                const n = t.size;
                let r = -1,
                    o = n - 1,
                    i = 7,
                    s = 0;
                for (let u = n - 1; u > 0; u -= 2)
                    for (6 === u && u--;;) {
                        for (let n = 0; n < 2; n++)
                            if (!t.isReserved(o, u - n)) {
                                let r = !1;
                                s < e.length && (r = 1 == (e[s] >>> i & 1)), t.set(o, u - n, r), i--, -1 === i && (s++, i = 7)
                            }
                        if (o += r, o < 0 || n <= o) { o -= r, r = -r; break }
                    }
            }(c, u), isNaN(o) && (o = N(c, se.bind(null, c, n))), k(o, c), se(c, n, o), { modules: c, version: e, errorCorrectionLevel: n, maskPattern: o, segments: i }
    }

    function ce(t) {
        if ("number" == typeof t && (t = t.toString()), "string" != typeof t) throw new Error("Color should be defined as hex string");
        let e = t.slice().replace("#", "").split("");
        if (e.length < 3 || 5 === e.length || e.length > 8) throw new Error("Invalid hex color: " + t);
        3 !== e.length && 4 !== e.length || (e = Array.prototype.concat.apply([], e.map((function(t) { return [t, t] })))), 6 === e.length && e.push("F", "F");
        const n = parseInt(e.join(""), 16);
        return { r: n >> 24 & 255, g: n >> 16 & 255, b: n >> 8 & 255, a: 255 & n, hex: "#" + e.slice(0, 6).join("") }
    }

    function he(t, e) {
        const n = t.a / 255,
            r = e + '="' + t.hex + '"';
        return n < 1 ? r + " " + e + '-opacity="' + n.toFixed(2).slice(1) + '"' : r
    }

    function le(t, e, n) { let r = t + e; return void 0 !== n && (r += " " + n), r }

    function fe(t, r, o, i, s) {
        const u = [].slice.call(arguments, 1),
            a = u.length,
            c = "function" == typeof u[a - 1];
        if (!c && !e()) throw new Error("Callback required as last argument");
        if (!c) {
            if (a < 1) throw new Error("Too few arguments provided");
            return 1 === a ? (o = r, r = i = void 0) : 2 !== a || r.getContext || (i = o, o = r, r = void 0), new Promise((function(e, s) {
                try {
                    const s = n(o, i);
                    e(t(s, r, i))
                } catch (t) { s(t) }
            }))
        }
        if (a < 2) throw new Error("Too few arguments provided");
        2 === a ? (s = o, o = r, r = i = void 0) : 3 === a && (r.getContext && void 0 === s ? (s = i, i = void 0) : (s = i, i = o, o = r, r = void 0));
        try {
            const e = n(o, i);
            s(null, t(e, r, i))
        } catch (t) { s(t) }
    }
    Yt = te, kt = function(t) { return t.reduce((function(t, e) { return "string" == typeof e ? t.push(ie(e, null)) : e.data && t.push(ie(e.data, e.mode)), t }), []) }, Nt = function(t, e) {
        const n = function(t) {
                const e = [];
                for (let n = 0; n < t.length; n++) {
                    const r = t[n];
                    switch (r.mode) {
                        case rt:
                            e.push([r, { data: r.data, mode: ot, length: r.length }, { data: r.data, mode: it, length: r.length }]);
                            break;
                        case ot:
                            e.push([r, { data: r.data, mode: it, length: r.length }]);
                            break;
                        case st:
                            e.push([r, { data: r.data, mode: it, length: ee(r.data) }]);
                            break;
                        case it:
                            e.push([{ data: r.data, mode: it, length: ee(r.data) }])
                    }
                }
                return e
            }(re(t, u())),
            r = function(t, e) {
                const n = {},
                    r = { start: {} };
                let o = ["start"];
                for (let i = 0; i < t.length; i++) {
                    const s = t[i],
                        u = [];
                    for (let t = 0; t < s.length; t++) {
                        const a = s[t],
                            c = "" + i + t;
                        u.push(c), n[c] = { node: a, lastCount: 0 }, r[c] = {};
                        for (let t = 0; t < o.length; t++) {
                            const i = o[t];
                            n[i] && n[i].node.mode === a.mode ? (r[i][c] = oe(n[i].lastCount + a.length, a.mode) - oe(n[i].lastCount, a.mode), n[i].lastCount += a.length) : (n[i] && (n[i].lastCount = a.length), r[i][c] = oe(a.length, a.mode) + 4 + at(a.mode, e))
                        }
                    }
                    o = u
                }
                for (let t = 0; t < o.length; t++) r[o[t]].end = 0;
                return { map: r, table: n }
            }(n, e),
            o = Yt.find_path(r.map, "start", "end"),
            i = [];
        for (let t = 1; t < o.length - 1; t++) i.push(r.table[o[t]].node);
        return kt(function(t) { return t.reduce((function(t, e) { const n = t.length - 1 >= 0 ? t[t.length - 1] : null; return n && n.mode === e.mode ? (t[t.length - 1].data += e.data, t) : (t.push(e), t) }), []) }(i))
    }, Ot = function(t) { return kt(re(t, u())) }, Jt = function(t) {
        t || (t = {}), t.color || (t.color = {});
        const e = void 0 === t.margin || null === t.margin || t.margin < 0 ? 4 : t.margin,
            n = t.width && t.width >= 21 ? t.width : void 0,
            r = t.scale || 4;
        return { width: n, scale: n ? 4 : r, margin: e, color: { dark: ce(t.color.dark || "#000000ff"), light: ce(t.color.light || "#ffffffff") }, type: t.type, rendererOpts: t.rendererOpts || {} }
    }, Kt = function(t, e) { return e.width && e.width >= t + 2 * e.margin ? e.width / (t + 2 * e.margin) : e.scale }, Vt = function(t, e) { const n = Kt(t, e); return Math.floor((t + 2 * e.margin) * n) }, Zt = function(t, e, n) {
        const r = e.modules.size,
            o = e.modules.data,
            i = Kt(r, n),
            s = Math.floor((r + 2 * n.margin) * i),
            u = n.margin * i,
            a = [n.color.light, n.color.dark];
        for (let e = 0; e < s; e++)
            for (let c = 0; c < s; c++) {
                let h = 4 * (e * s + c),
                    l = n.color.light;
                if (e >= u && c >= u && e < s - u && c < s - u) { l = a[o[Math.floor((e - u) / i) * r + Math.floor((c - u) / i)] ? 1 : 0] }
                t[h++] = l.r, t[h++] = l.g, t[h++] = l.b, t[h] = l.a
            }
    }, Gt = function(t, e, n) {
        let r = n,
            o = e;
        void 0 !== r || e && e.getContext || (r = e, e = void 0), e || (o = function() { try { return document.createElement("canvas") } catch (t) { throw new Error("You need to specify a canvas element") } }()), r = Jt(r);
        const i = Vt(t.modules.size, r),
            s = o.getContext("2d"),
            u = s.createImageData(i, i);
        return Zt(u.data, t, r),
            function(t, e, n) { t.clearRect(0, 0, e.width, e.height), e.style || (e.style = {}), e.height = n, e.width = n, e.style.height = n + "px", e.style.width = n + "px" }(s, o, i), s.putImageData(u, 0, 0), o
    }, jt = function(t, e, n) {
        let r = n;
        void 0 !== r || e && e.getContext || (r = e, e = void 0), r || (r = {});
        const o = Gt(t, e, r),
            i = r.type || "image/png",
            s = r.rendererOpts || {};
        return o.toDataURL(i, s.quality)
    }, Xt = function(t, e, n) {
        const r = Jt(e),
            o = t.modules.size,
            i = t.modules.data,
            s = o + 2 * r.margin,
            u = r.color.light.a ? "<path " + he(r.color.light, "fill") + ' d="M0 0h' + s + "v" + s + 'H0z"/>' : "",
            a = "<path " + he(r.color.dark, "stroke") + ' d="' + function(t, e, n) {
                let r = "",
                    o = 0,
                    i = !1,
                    s = 0;
                for (let u = 0; u < t.length; u++) {
                    const a = Math.floor(u % e),
                        c = Math.floor(u / e);
                    a || i || (i = !0), t[u] ? (s++, u > 0 && a > 0 && t[u - 1] || (r += i ? le("M", a + n, .5 + c + n) : le("m", o, 0), o = 0, i = !1), a + 1 < e && t[u + 1] || (r += le("h", s), s = 0)) : o++
                }
                return r
            }(i, o, r.margin) + '"/>',
            c = 'viewBox="0 0 ' + s + " " + s + '"',
            h = '<svg xmlns="http://www.w3.org/2000/svg" ' + (r.width ? 'width="' + r.width + '" height="' + r.width + '" ' : "") + c + ' shape-rendering="crispEdges">' + u + a + "</svg>\n";
        return "function" == typeof n && n(null, h), h
    }, n = function(t, e) { if (void 0 === t || "" === t) throw new Error("No input text"); let n, r, o = f; return void 0 !== e && (o = w(e.errorCorrectionLevel, f), n = Y(e.version), r = P(e.maskPattern), e.toSJISFunc && s(e.toSJISFunc)), ae(t, n, o, r) }, t = fe.bind(null, Gt), fe.bind(null, jt), fe.bind(null, (function(t, e, n) { return Xt(t, n) }));
    const de = "hs-error",
        ge = "hs-success",
        pe = "POLLING",
        we = "SOCKET",
        me = "TEST",
        Ee = "MAIN";

    function ve({ accessToken: t, refreshToken: e }) {
        if (!t || !e) return document.dispatchEvent(new CustomEvent(de, { detail: "Could not fetch accessToken or refreshToken after authentication", bubbles: !0 }));
        document.dispatchEvent(new CustomEvent(ge, { detail: { accessToken: t, refreshToken: e }, bubbles: !0 }))
    }

    function ye({ hsWalletBaseURL: e, hsLoginBtnDOM: n, hsLoginQRDOM: r, qrDataStr: o, hsloginBtnText: i }) {
        if (n) {
            const t = encodeURI(e + "/deeplink?url=" + o);
            n.innerHTML = `<button onclick="window.open('${t}', 'popUpWindow','height=800,width=400,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');">${i}</button>`
        }
        r && t(r, o, (function(t) { if (t) throw new Error(t) }))
    }
    async function Le({ rpBaseURL: t, hsLoginBtnDOM: e, hsLoginQRDOM: n, hsloginBtnText: r, hsWalletBaseURL: o, hsPollingInterval: i, rpChallengeResource: s, rpPollResource: u }) {
        const a = t.endsWith("/") ? t.substr(0, t.length - 1) : t,
            c = s.startsWith("/") ? s.substr(1, s.length) : s,
            h = u.startsWith("/") ? u.substr(1, u.length) : u,
            l = `${a}/${c}`,
            f = await fetch(l, { method: "POST", headers: { "Content-type": "application/json" } }),
            d = await f.json(),
            { hypersign: g } = d,
            { data: p } = g,
            { challenge: w } = p;
        if (ye({ hsWalletBaseURL: o, hsLoginBtnDOM: e, hsLoginQRDOM: n, qrDataStr: JSON.stringify(p), hsloginBtnText: r }), !w) throw new Error("HSAuth:: Could Not Fetch New Challenge from API"); {
            const t = await

            function({ hsPollingInterval: t, challenge: e, sanitizeBaseUrl: n, sanitizePollResource: r }) {
                return new Promise((function(o, i) {
                    const s = setInterval((function() {
                        return fetch(`${n}/${r}?challenge=${e}`).then((t => t.json())).then((t => {
                            const { hypersign: e } = t, { success: n, data: r } = e;
                            n && !0 === n && (clearInterval(s), o(r))
                        })).catch((t => { i(t) }))
                    }), t)
                }))
            }({ hsPollingInterval: i, challenge: w, sanitizeBaseUrl: a, sanitizePollResource: h }), { accessToken: e, refreshToken: n } = t;
            ve({ accessToken: e, refreshToken: n })
        }
    }! function() {
        try {
            let t = { LISTENER_MODE: document.currentScript.getAttribute("data-listener-mode") ? document.currentScript.getAttribute("data-listener-mode") : we, RP_SOCKET_URL: document.currentScript.getAttribute("data-rp-socket-url"), RP_SERVER_BASEURL: document.currentScript.getAttribute("data-rp-server-base-url"), RP_CHALLENGE_RESOURCE: document.currentScript.getAttribute("data-rp-challege-resource") ? document.currentScript.getAttribute("data-rp-challege-resource") : "/api/v1/auth/challenge", RP_POLLING_RESOURCE: document.currentScript.getAttribute("data-rp-polling-resource") ? document.currentScript.getAttribute("data-rp-polling-resource") : "/api/v1/auth/poll", LOGIN_BUTTON_TEXT: document.currentScript.getAttribute("data-login-button-text") ? document.currentScript.getAttribute("data-login-button-text") : "LOGIN USING HYPERSIGN", NETWORK_MODE: document.currentScript.getAttribute("data-network-mode") ? document.currentScript.getAttribute("data-network-mode") : me, POLLING_INTERVAL: document.currentScript.getAttribute("data-polling-interval") ? parseInt(document.currentScript.getAttribute("data-polling-interval")) : 5e3, HS_WALLET_BASEURL: "" };
            switch (t.NETWORK_MODE) {
                case me:
                    t.HS_WALLET_BASEURL = "http://localhost:4999/chrome/popup/popup#";
                    break;
                case Ee:
                    throw new Error("HSAuth:: MAIN Network is not supported yet")
                    t.HS_WALLET_BASEURL = "https://wallet-stage.hypersign.id";
                    break;
                default:
                    throw new Error("HSAuth:: Invalid Network Mode")
            }
            const { LISTENER_MODE: e } = t, n = document.getElementById("hs-auth-btn"), r = document.getElementById("hs-auth-qr");
            if (!n && !r) throw new Error("HSAuth:: No DOM Element Found With Id 'hs-auth-btn' or 'hs-auth-qr'");
            switch (e) {
                case we:
                    {
                        if (window.WebSocket = window.WebSocket || window.MozWebSocket, !window.WebSocket) throw new Error("HSAuth:: Sorry, Your Browser Doesn't Support WebSocket. Use Polling Instead.");
                        const { RP_SOCKET_URL: e } = t;
                        if (!e) throw new Error("HSAuth:: Relying Party Socket URL Must Be Passed for Websocket Mode");! function({ rpServerSocketURL: t, hsLoginBtnDOM: e, hsLoginQRDOM: n, hsloginBtnText: r, hsWalletBaseURL: o }) {
                            if (!t) throw new Error("HSAuth:: Relying Party Websocket URL must passed");
                            let i = new WebSocket(t);
                            i.onopen = function() {}, i.onmessage = function({ data: t }) {
                                let s = JSON.parse(t);
                                if ("init" == s.op) ye({ hsWalletBaseURL: o, hsLoginBtnDOM: e, hsLoginQRDOM: n, qrDataStr: JSON.stringify(s.data), hsloginBtnText: r });
                                else if ("end" == s.op) {
                                    i.close();
                                    const { accessToken: t, refreshToken: e } = s.data.hypersign.data;
                                    ve({ accessToken: t, refreshToken: e })
                                }
                            }, i.onerror = function(t) { document.dispatchEvent(new CustomEvent("hs-error", { detail: t.message })) }, i.close = function() {}
                        }({ rpServerSocketURL: new URL(e).href, hsLoginBtnDOM: n, hsLoginQRDOM: r, hsloginBtnText: t.LOGIN_BUTTON_TEXT, hsWalletBaseURL: t.HS_WALLET_BASEURL });
                        break
                    }
                case pe:
                    { let { RP_SERVER_BASEURL: e, POLLING_INTERVAL: o } = t; if (!e) throw new Error("HSAuth:: Relying Party Base Url Must Be Passed For Polling Mode");Le({ rpBaseURL: new URL(e).href, hsLoginBtnDOM: n, hsLoginQRDOM: r, hsloginBtnText: t.LOGIN_BUTTON_TEXT, hsWalletBaseURL: t.HS_WALLET_BASEURL, hsPollingInterval: o, rpChallengeResource: t.RP_CHALLENGE_RESOURCE, rpPollResource: t.RP_POLLING_RESOURCE }); break }
                default:
                    throw new Error("HSAuth:: Invalid Listener Mode")
            }
        } catch (t) { console.error(t.message) }
    }()
})();
//# sourceMappingURL=index.js.map