//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t, n) => () => {
	if (n) throw n[0];
	try {
		return e && (t = e(e = 0)), t;
	} catch (e) {
		throw n = [e], e;
	}
}, s = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), c = (e, n) => {
	let r = {};
	for (var i in e) t(r, i, {
		get: e[i],
		enumerable: !0
	});
	return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
}, l = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, u = (n, r, o) => (o = n == null ? {} : e(i(n)), l(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), d = (e) => a.call(e, "module.exports") ? e["module.exports"] : l(t({}, "__esModule", { value: !0 }), e), f = /* @__PURE__ */ s(((e) => {
	e.byteLength = c, e.toByteArray = u, e.fromByteArray = p;
	for (var t = [], n = [], r = typeof Uint8Array < "u" ? Uint8Array : Array, i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", a = 0, o = i.length; a < o; ++a) t[a] = i[a], n[i.charCodeAt(a)] = a;
	n[45] = 62, n[95] = 63;
	function s(e) {
		var t = e.length;
		if (t % 4 > 0) throw Error("Invalid string. Length must be a multiple of 4");
		var n = e.indexOf("=");
		n === -1 && (n = t);
		var r = n === t ? 0 : 4 - n % 4;
		return [n, r];
	}
	function c(e) {
		var t = s(e), n = t[0], r = t[1];
		return (n + r) * 3 / 4 - r;
	}
	function l(e, t, n) {
		return (t + n) * 3 / 4 - n;
	}
	function u(e) {
		var t, i = s(e), a = i[0], o = i[1], c = new r(l(e, a, o)), u = 0, d = o > 0 ? a - 4 : a, f;
		for (f = 0; f < d; f += 4) t = n[e.charCodeAt(f)] << 18 | n[e.charCodeAt(f + 1)] << 12 | n[e.charCodeAt(f + 2)] << 6 | n[e.charCodeAt(f + 3)], c[u++] = t >> 16 & 255, c[u++] = t >> 8 & 255, c[u++] = t & 255;
		return o === 2 && (t = n[e.charCodeAt(f)] << 2 | n[e.charCodeAt(f + 1)] >> 4, c[u++] = t & 255), o === 1 && (t = n[e.charCodeAt(f)] << 10 | n[e.charCodeAt(f + 1)] << 4 | n[e.charCodeAt(f + 2)] >> 2, c[u++] = t >> 8 & 255, c[u++] = t & 255), c;
	}
	function d(e) {
		return t[e >> 18 & 63] + t[e >> 12 & 63] + t[e >> 6 & 63] + t[e & 63];
	}
	function f(e, t, n) {
		for (var r, i = [], a = t; a < n; a += 3) r = (e[a] << 16 & 16711680) + (e[a + 1] << 8 & 65280) + (e[a + 2] & 255), i.push(d(r));
		return i.join("");
	}
	function p(e) {
		for (var n, r = e.length, i = r % 3, a = [], o = 16383, s = 0, c = r - i; s < c; s += o) a.push(f(e, s, s + o > c ? c : s + o));
		return i === 1 ? (n = e[r - 1], a.push(t[n >> 2] + t[n << 4 & 63] + "==")) : i === 2 && (n = (e[r - 2] << 8) + e[r - 1], a.push(t[n >> 10] + t[n >> 4 & 63] + t[n << 2 & 63] + "=")), a.join("");
	}
})), p = /* @__PURE__ */ s(((e) => {
	e.read = function(e, t, n, r, i) {
		var a, o, s = i * 8 - r - 1, c = (1 << s) - 1, l = c >> 1, u = -7, d = n ? i - 1 : 0, f = n ? -1 : 1, p = e[t + d];
		for (d += f, a = p & (1 << -u) - 1, p >>= -u, u += s; u > 0; a = a * 256 + e[t + d], d += f, u -= 8);
		for (o = a & (1 << -u) - 1, a >>= -u, u += r; u > 0; o = o * 256 + e[t + d], d += f, u -= 8);
		if (a === 0) a = 1 - l;
		else if (a === c) return o ? NaN : (p ? -1 : 1) * Infinity;
		else o += 2 ** r, a -= l;
		return (p ? -1 : 1) * o * 2 ** (a - r);
	}, e.write = function(e, t, n, r, i, a) {
		var o, s, c, l = a * 8 - i - 1, u = (1 << l) - 1, d = u >> 1, f = i === 23 ? 2 ** -24 - 2 ** -77 : 0, p = r ? 0 : a - 1, m = r ? 1 : -1, h = +(t < 0 || t === 0 && 1 / t < 0);
		for (t = Math.abs(t), isNaN(t) || t === Infinity ? (s = +!!isNaN(t), o = u) : (o = Math.floor(Math.log(t) / Math.LN2), t * (c = 2 ** -o) < 1 && (o--, c *= 2), o + d >= 1 ? t += f / c : t += f * 2 ** (1 - d), t * c >= 2 && (o++, c /= 2), o + d >= u ? (s = 0, o = u) : o + d >= 1 ? (s = (t * c - 1) * 2 ** i, o += d) : (s = t * 2 ** (d - 1) * 2 ** i, o = 0)); i >= 8; e[n + p] = s & 255, p += m, s /= 256, i -= 8);
		for (o = o << i | s, l += i; l > 0; e[n + p] = o & 255, p += m, o /= 256, l -= 8);
		e[n + p - m] |= h * 128;
	};
})), m = /* @__PURE__ */ s(((e) => {
	var t = f(), n = p(), r = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
	e.Buffer = s, e.SlowBuffer = b, e.INSPECT_MAX_BYTES = 50;
	var i = 2147483647;
	e.kMaxLength = i, s.TYPED_ARRAY_SUPPORT = a(), !s.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
	function a() {
		try {
			let e = /* @__PURE__ */ new Uint8Array(1), t = { foo: function() {
				return 42;
			} };
			return Object.setPrototypeOf(t, Uint8Array.prototype), Object.setPrototypeOf(e, t), e.foo() === 42;
		} catch {
			return !1;
		}
	}
	Object.defineProperty(s.prototype, "parent", {
		enumerable: !0,
		get: function() {
			if (s.isBuffer(this)) return this.buffer;
		}
	}), Object.defineProperty(s.prototype, "offset", {
		enumerable: !0,
		get: function() {
			if (s.isBuffer(this)) return this.byteOffset;
		}
	});
	function o(e) {
		if (e > i) throw RangeError("The value \"" + e + "\" is invalid for option \"size\"");
		let t = new Uint8Array(e);
		return Object.setPrototypeOf(t, s.prototype), t;
	}
	function s(e, t, n) {
		if (typeof e == "number") {
			if (typeof t == "string") throw TypeError("The \"string\" argument must be of type string. Received type number");
			return d(e);
		}
		return c(e, t, n);
	}
	s.poolSize = 8192;
	function c(e, t, n) {
		if (typeof e == "string") return m(e, t);
		if (ArrayBuffer.isView(e)) return g(e);
		if (e == null) throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e);
		if ($(e, ArrayBuffer) || e && $(e.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && ($(e, SharedArrayBuffer) || e && $(e.buffer, SharedArrayBuffer))) return _(e, t, n);
		if (typeof e == "number") throw TypeError("The \"value\" argument must not be of type number. Received type number");
		let r = e.valueOf && e.valueOf();
		if (r != null && r !== e) return s.from(r, t, n);
		let i = v(e);
		if (i) return i;
		if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof e[Symbol.toPrimitive] == "function") return s.from(e[Symbol.toPrimitive]("string"), t, n);
		throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e);
	}
	s.from = function(e, t, n) {
		return c(e, t, n);
	}, Object.setPrototypeOf(s.prototype, Uint8Array.prototype), Object.setPrototypeOf(s, Uint8Array);
	function l(e) {
		if (typeof e != "number") throw TypeError("\"size\" argument must be of type number");
		if (e < 0) throw RangeError("The value \"" + e + "\" is invalid for option \"size\"");
	}
	function u(e, t, n) {
		return l(e), e <= 0 || t === void 0 ? o(e) : typeof n == "string" ? o(e).fill(t, n) : o(e).fill(t);
	}
	s.alloc = function(e, t, n) {
		return u(e, t, n);
	};
	function d(e) {
		return l(e), o(e < 0 ? 0 : y(e) | 0);
	}
	s.allocUnsafe = function(e) {
		return d(e);
	}, s.allocUnsafeSlow = function(e) {
		return d(e);
	};
	function m(e, t) {
		if ((typeof t != "string" || t === "") && (t = "utf8"), !s.isEncoding(t)) throw TypeError("Unknown encoding: " + t);
		let n = x(e, t) | 0, r = o(n), i = r.write(e, t);
		return i !== n && (r = r.slice(0, i)), r;
	}
	function h(e) {
		let t = e.length < 0 ? 0 : y(e.length) | 0, n = o(t);
		for (let r = 0; r < t; r += 1) n[r] = e[r] & 255;
		return n;
	}
	function g(e) {
		if ($(e, Uint8Array)) {
			let t = new Uint8Array(e);
			return _(t.buffer, t.byteOffset, t.byteLength);
		}
		return h(e);
	}
	function _(e, t, n) {
		if (t < 0 || e.byteLength < t) throw RangeError("\"offset\" is outside of buffer bounds");
		if (e.byteLength < t + (n || 0)) throw RangeError("\"length\" is outside of buffer bounds");
		let r;
		return r = t === void 0 && n === void 0 ? new Uint8Array(e) : n === void 0 ? new Uint8Array(e, t) : new Uint8Array(e, t, n), Object.setPrototypeOf(r, s.prototype), r;
	}
	function v(e) {
		if (s.isBuffer(e)) {
			let t = y(e.length) | 0, n = o(t);
			return n.length === 0 || e.copy(n, 0, 0, t), n;
		}
		if (e.length !== void 0) return typeof e.length != "number" || se(e.length) ? o(0) : h(e);
		if (e.type === "Buffer" && Array.isArray(e.data)) return h(e.data);
	}
	function y(e) {
		if (e >= i) throw RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + i.toString(16) + " bytes");
		return e | 0;
	}
	function b(e) {
		return +e != e && (e = 0), s.alloc(+e);
	}
	s.isBuffer = function(e) {
		return e != null && e._isBuffer === !0 && e !== s.prototype;
	}, s.compare = function(e, t) {
		if ($(e, Uint8Array) && (e = s.from(e, e.offset, e.byteLength)), $(t, Uint8Array) && (t = s.from(t, t.offset, t.byteLength)), !s.isBuffer(e) || !s.isBuffer(t)) throw TypeError("The \"buf1\", \"buf2\" arguments must be one of type Buffer or Uint8Array");
		if (e === t) return 0;
		let n = e.length, r = t.length;
		for (let i = 0, a = Math.min(n, r); i < a; ++i) if (e[i] !== t[i]) {
			n = e[i], r = t[i];
			break;
		}
		return n < r ? -1 : +(r < n);
	}, s.isEncoding = function(e) {
		switch (String(e).toLowerCase()) {
			case "hex":
			case "utf8":
			case "utf-8":
			case "ascii":
			case "latin1":
			case "binary":
			case "base64":
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return !0;
			default: return !1;
		}
	}, s.concat = function(e, t) {
		if (!Array.isArray(e)) throw TypeError("\"list\" argument must be an Array of Buffers");
		if (e.length === 0) return s.alloc(0);
		let n;
		if (t === void 0) for (t = 0, n = 0; n < e.length; ++n) t += e[n].length;
		let r = s.allocUnsafe(t), i = 0;
		for (n = 0; n < e.length; ++n) {
			let t = e[n];
			if ($(t, Uint8Array)) i + t.length > r.length ? (s.isBuffer(t) || (t = s.from(t)), t.copy(r, i)) : Uint8Array.prototype.set.call(r, t, i);
			else if (s.isBuffer(t)) t.copy(r, i);
			else throw TypeError("\"list\" argument must be an Array of Buffers");
			i += t.length;
		}
		return r;
	};
	function x(e, t) {
		if (s.isBuffer(e)) return e.length;
		if (ArrayBuffer.isView(e) || $(e, ArrayBuffer)) return e.byteLength;
		if (typeof e != "string") throw TypeError("The \"string\" argument must be one of type string, Buffer, or ArrayBuffer. Received type " + typeof e);
		let n = e.length, r = arguments.length > 2 && arguments[2] === !0;
		if (!r && n === 0) return 0;
		let i = !1;
		for (;;) switch (t) {
			case "ascii":
			case "latin1":
			case "binary": return n;
			case "utf8":
			case "utf-8": return ne(e).length;
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return n * 2;
			case "hex": return n >>> 1;
			case "base64": return ae(e).length;
			default:
				if (i) return r ? -1 : ne(e).length;
				t = ("" + t).toLowerCase(), i = !0;
		}
	}
	s.byteLength = x;
	function S(e, t, n) {
		let r = !1;
		if ((t === void 0 || t < 0) && (t = 0), t > this.length || ((n === void 0 || n > this.length) && (n = this.length), n <= 0) || (n >>>= 0, t >>>= 0, n <= t)) return "";
		for (e ||= "utf8";;) switch (e) {
			case "hex": return L(this, t, n);
			case "utf8":
			case "utf-8": return M(this, t, n);
			case "ascii": return F(this, t, n);
			case "latin1":
			case "binary": return I(this, t, n);
			case "base64": return j(this, t, n);
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return R(this, t, n);
			default:
				if (r) throw TypeError("Unknown encoding: " + e);
				e = (e + "").toLowerCase(), r = !0;
		}
	}
	s.prototype._isBuffer = !0;
	function C(e, t, n) {
		let r = e[t];
		e[t] = e[n], e[n] = r;
	}
	s.prototype.swap16 = function() {
		let e = this.length;
		if (e % 2 != 0) throw RangeError("Buffer size must be a multiple of 16-bits");
		for (let t = 0; t < e; t += 2) C(this, t, t + 1);
		return this;
	}, s.prototype.swap32 = function() {
		let e = this.length;
		if (e % 4 != 0) throw RangeError("Buffer size must be a multiple of 32-bits");
		for (let t = 0; t < e; t += 4) C(this, t, t + 3), C(this, t + 1, t + 2);
		return this;
	}, s.prototype.swap64 = function() {
		let e = this.length;
		if (e % 8 != 0) throw RangeError("Buffer size must be a multiple of 64-bits");
		for (let t = 0; t < e; t += 8) C(this, t, t + 7), C(this, t + 1, t + 6), C(this, t + 2, t + 5), C(this, t + 3, t + 4);
		return this;
	}, s.prototype.toString = function() {
		let e = this.length;
		return e === 0 ? "" : arguments.length === 0 ? M(this, 0, e) : S.apply(this, arguments);
	}, s.prototype.toLocaleString = s.prototype.toString, s.prototype.equals = function(e) {
		if (!s.isBuffer(e)) throw TypeError("Argument must be a Buffer");
		return this === e || s.compare(this, e) === 0;
	}, s.prototype.inspect = function() {
		let t = "", n = e.INSPECT_MAX_BYTES;
		return t = this.toString("hex", 0, n).replace(/(.{2})/g, "$1 ").trim(), this.length > n && (t += " ... "), "<Buffer " + t + ">";
	}, r && (s.prototype[r] = s.prototype.inspect), s.prototype.compare = function(e, t, n, r, i) {
		if ($(e, Uint8Array) && (e = s.from(e, e.offset, e.byteLength)), !s.isBuffer(e)) throw TypeError("The \"target\" argument must be one of type Buffer or Uint8Array. Received type " + typeof e);
		if (t === void 0 && (t = 0), n === void 0 && (n = e ? e.length : 0), r === void 0 && (r = 0), i === void 0 && (i = this.length), t < 0 || n > e.length || r < 0 || i > this.length) throw RangeError("out of range index");
		if (r >= i && t >= n) return 0;
		if (r >= i) return -1;
		if (t >= n) return 1;
		if (t >>>= 0, n >>>= 0, r >>>= 0, i >>>= 0, this === e) return 0;
		let a = i - r, o = n - t, c = Math.min(a, o), l = this.slice(r, i), u = e.slice(t, n);
		for (let e = 0; e < c; ++e) if (l[e] !== u[e]) {
			a = l[e], o = u[e];
			break;
		}
		return a < o ? -1 : +(o < a);
	};
	function w(e, t, n, r, i) {
		if (e.length === 0) return -1;
		if (typeof n == "string" ? (r = n, n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648), n = +n, se(n) && (n = i ? 0 : e.length - 1), n < 0 && (n = e.length + n), n >= e.length) {
			if (i) return -1;
			n = e.length - 1;
		} else if (n < 0) {
			if (i) n = 0;
			else return -1;
		}
		if (typeof t == "string" && (t = s.from(t, r)), s.isBuffer(t)) return t.length === 0 ? -1 : T(e, t, n, r, i);
		if (typeof t == "number") return t &= 255, typeof Uint8Array.prototype.indexOf == "function" ? i ? Uint8Array.prototype.indexOf.call(e, t, n) : Uint8Array.prototype.lastIndexOf.call(e, t, n) : T(e, [t], n, r, i);
		throw TypeError("val must be string, number or Buffer");
	}
	function T(e, t, n, r, i) {
		let a = 1, o = e.length, s = t.length;
		if (r !== void 0 && (r = String(r).toLowerCase(), r === "ucs2" || r === "ucs-2" || r === "utf16le" || r === "utf-16le")) {
			if (e.length < 2 || t.length < 2) return -1;
			a = 2, o /= 2, s /= 2, n /= 2;
		}
		function c(e, t) {
			return a === 1 ? e[t] : e.readUInt16BE(t * a);
		}
		let l;
		if (i) {
			let r = -1;
			for (l = n; l < o; l++) if (c(e, l) === c(t, r === -1 ? 0 : l - r)) {
				if (r === -1 && (r = l), l - r + 1 === s) return r * a;
			} else r !== -1 && (l -= l - r), r = -1;
		} else for (n + s > o && (n = o - s), l = n; l >= 0; l--) {
			let n = !0;
			for (let r = 0; r < s; r++) if (c(e, l + r) !== c(t, r)) {
				n = !1;
				break;
			}
			if (n) return l;
		}
		return -1;
	}
	s.prototype.includes = function(e, t, n) {
		return this.indexOf(e, t, n) !== -1;
	}, s.prototype.indexOf = function(e, t, n) {
		return w(this, e, t, n, !0);
	}, s.prototype.lastIndexOf = function(e, t, n) {
		return w(this, e, t, n, !1);
	};
	function E(e, t, n, r) {
		n = Number(n) || 0;
		let i = e.length - n;
		r ? (r = Number(r), r > i && (r = i)) : r = i;
		let a = t.length;
		r > a / 2 && (r = a / 2);
		let o;
		for (o = 0; o < r; ++o) {
			let r = parseInt(t.substr(o * 2, 2), 16);
			if (se(r)) return o;
			e[n + o] = r;
		}
		return o;
	}
	function D(e, t, n, r) {
		return oe(ne(t, e.length - n), e, n, r);
	}
	function O(e, t, n, r) {
		return oe(re(t), e, n, r);
	}
	function k(e, t, n, r) {
		return oe(ae(t), e, n, r);
	}
	function A(e, t, n, r) {
		return oe(ie(t, e.length - n), e, n, r);
	}
	s.prototype.write = function(e, t, n, r) {
		if (t === void 0) r = "utf8", n = this.length, t = 0;
		else if (n === void 0 && typeof t == "string") r = t, n = this.length, t = 0;
		else if (isFinite(t)) t >>>= 0, isFinite(n) ? (n >>>= 0, r === void 0 && (r = "utf8")) : (r = n, n = void 0);
		else throw Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
		let i = this.length - t;
		if ((n === void 0 || n > i) && (n = i), e.length > 0 && (n < 0 || t < 0) || t > this.length) throw RangeError("Attempt to write outside buffer bounds");
		r ||= "utf8";
		let a = !1;
		for (;;) switch (r) {
			case "hex": return E(this, e, t, n);
			case "utf8":
			case "utf-8": return D(this, e, t, n);
			case "ascii":
			case "latin1":
			case "binary": return O(this, e, t, n);
			case "base64": return k(this, e, t, n);
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return A(this, e, t, n);
			default:
				if (a) throw TypeError("Unknown encoding: " + r);
				r = ("" + r).toLowerCase(), a = !0;
		}
	}, s.prototype.toJSON = function() {
		return {
			type: "Buffer",
			data: Array.prototype.slice.call(this._arr || this, 0)
		};
	};
	function j(e, n, r) {
		return n === 0 && r === e.length ? t.fromByteArray(e) : t.fromByteArray(e.slice(n, r));
	}
	function M(e, t, n) {
		n = Math.min(e.length, n);
		let r = [], i = t;
		for (; i < n;) {
			let t = e[i], a = null, o = t > 239 ? 4 : t > 223 ? 3 : t > 191 ? 2 : 1;
			if (i + o <= n) {
				let n, r, s, c;
				switch (o) {
					case 1:
						t < 128 && (a = t);
						break;
					case 2:
						n = e[i + 1], (n & 192) == 128 && (c = (t & 31) << 6 | n & 63, c > 127 && (a = c));
						break;
					case 3:
						n = e[i + 1], r = e[i + 2], (n & 192) == 128 && (r & 192) == 128 && (c = (t & 15) << 12 | (n & 63) << 6 | r & 63, c > 2047 && (c < 55296 || c > 57343) && (a = c));
						break;
					case 4: n = e[i + 1], r = e[i + 2], s = e[i + 3], (n & 192) == 128 && (r & 192) == 128 && (s & 192) == 128 && (c = (t & 15) << 18 | (n & 63) << 12 | (r & 63) << 6 | s & 63, c > 65535 && c < 1114112 && (a = c));
				}
			}
			a === null ? (a = 65533, o = 1) : a > 65535 && (a -= 65536, r.push(a >>> 10 & 1023 | 55296), a = 56320 | a & 1023), r.push(a), i += o;
		}
		return P(r);
	}
	var N = 4096;
	function P(e) {
		let t = e.length;
		if (t <= N) return String.fromCharCode.apply(String, e);
		let n = "", r = 0;
		for (; r < t;) n += String.fromCharCode.apply(String, e.slice(r, r += N));
		return n;
	}
	function F(e, t, n) {
		let r = "";
		n = Math.min(e.length, n);
		for (let i = t; i < n; ++i) r += String.fromCharCode(e[i] & 127);
		return r;
	}
	function I(e, t, n) {
		let r = "";
		n = Math.min(e.length, n);
		for (let i = t; i < n; ++i) r += String.fromCharCode(e[i]);
		return r;
	}
	function L(e, t, n) {
		let r = e.length;
		(!t || t < 0) && (t = 0), (!n || n < 0 || n > r) && (n = r);
		let i = "";
		for (let r = t; r < n; ++r) i += ce[e[r]];
		return i;
	}
	function R(e, t, n) {
		let r = e.slice(t, n), i = "";
		for (let e = 0; e < r.length - 1; e += 2) i += String.fromCharCode(r[e] + r[e + 1] * 256);
		return i;
	}
	s.prototype.slice = function(e, t) {
		let n = this.length;
		e = ~~e, t = t === void 0 ? n : ~~t, e < 0 ? (e += n, e < 0 && (e = 0)) : e > n && (e = n), t < 0 ? (t += n, t < 0 && (t = 0)) : t > n && (t = n), t < e && (t = e);
		let r = this.subarray(e, t);
		return Object.setPrototypeOf(r, s.prototype), r;
	};
	function z(e, t, n) {
		if (e % 1 != 0 || e < 0) throw RangeError("offset is not uint");
		if (e + t > n) throw RangeError("Trying to access beyond buffer length");
	}
	s.prototype.readUintLE = s.prototype.readUIntLE = function(e, t, n) {
		e >>>= 0, t >>>= 0, n || z(e, t, this.length);
		let r = this[e], i = 1, a = 0;
		for (; ++a < t && (i *= 256);) r += this[e + a] * i;
		return r;
	}, s.prototype.readUintBE = s.prototype.readUIntBE = function(e, t, n) {
		e >>>= 0, t >>>= 0, n || z(e, t, this.length);
		let r = this[e + --t], i = 1;
		for (; t > 0 && (i *= 256);) r += this[e + --t] * i;
		return r;
	}, s.prototype.readUint8 = s.prototype.readUInt8 = function(e, t) {
		return e >>>= 0, t || z(e, 1, this.length), this[e];
	}, s.prototype.readUint16LE = s.prototype.readUInt16LE = function(e, t) {
		return e >>>= 0, t || z(e, 2, this.length), this[e] | this[e + 1] << 8;
	}, s.prototype.readUint16BE = s.prototype.readUInt16BE = function(e, t) {
		return e >>>= 0, t || z(e, 2, this.length), this[e] << 8 | this[e + 1];
	}, s.prototype.readUint32LE = s.prototype.readUInt32LE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + this[e + 3] * 16777216;
	}, s.prototype.readUint32BE = s.prototype.readUInt32BE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), this[e] * 16777216 + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]);
	}, s.prototype.readBigUInt64LE = le(function(e) {
		e >>>= 0, Y(e, "offset");
		let t = this[e], n = this[e + 7];
		(t === void 0 || n === void 0) && X(e, this.length - 8);
		let r = t + this[++e] * 256 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24, i = this[++e] + this[++e] * 256 + this[++e] * 2 ** 16 + n * 2 ** 24;
		return BigInt(r) + (BigInt(i) << BigInt(32));
	}), s.prototype.readBigUInt64BE = le(function(e) {
		e >>>= 0, Y(e, "offset");
		let t = this[e], n = this[e + 7];
		(t === void 0 || n === void 0) && X(e, this.length - 8);
		let r = t * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 256 + this[++e], i = this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 256 + n;
		return (BigInt(r) << BigInt(32)) + BigInt(i);
	}), s.prototype.readIntLE = function(e, t, n) {
		e >>>= 0, t >>>= 0, n || z(e, t, this.length);
		let r = this[e], i = 1, a = 0;
		for (; ++a < t && (i *= 256);) r += this[e + a] * i;
		return i *= 128, r >= i && (r -= 2 ** (8 * t)), r;
	}, s.prototype.readIntBE = function(e, t, n) {
		e >>>= 0, t >>>= 0, n || z(e, t, this.length);
		let r = t, i = 1, a = this[e + --r];
		for (; r > 0 && (i *= 256);) a += this[e + --r] * i;
		return i *= 128, a >= i && (a -= 2 ** (8 * t)), a;
	}, s.prototype.readInt8 = function(e, t) {
		return e >>>= 0, t || z(e, 1, this.length), this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e];
	}, s.prototype.readInt16LE = function(e, t) {
		e >>>= 0, t || z(e, 2, this.length);
		let n = this[e] | this[e + 1] << 8;
		return n & 32768 ? n | 4294901760 : n;
	}, s.prototype.readInt16BE = function(e, t) {
		e >>>= 0, t || z(e, 2, this.length);
		let n = this[e + 1] | this[e] << 8;
		return n & 32768 ? n | 4294901760 : n;
	}, s.prototype.readInt32LE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24;
	}, s.prototype.readInt32BE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3];
	}, s.prototype.readBigInt64LE = le(function(e) {
		e >>>= 0, Y(e, "offset");
		let t = this[e], n = this[e + 7];
		(t === void 0 || n === void 0) && X(e, this.length - 8);
		let r = this[e + 4] + this[e + 5] * 256 + this[e + 6] * 2 ** 16 + (n << 24);
		return (BigInt(r) << BigInt(32)) + BigInt(t + this[++e] * 256 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24);
	}), s.prototype.readBigInt64BE = le(function(e) {
		e >>>= 0, Y(e, "offset");
		let t = this[e], n = this[e + 7];
		(t === void 0 || n === void 0) && X(e, this.length - 8);
		let r = (t << 24) + this[++e] * 2 ** 16 + this[++e] * 256 + this[++e];
		return (BigInt(r) << BigInt(32)) + BigInt(this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 256 + n);
	}), s.prototype.readFloatLE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), n.read(this, e, !0, 23, 4);
	}, s.prototype.readFloatBE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), n.read(this, e, !1, 23, 4);
	}, s.prototype.readDoubleLE = function(e, t) {
		return e >>>= 0, t || z(e, 8, this.length), n.read(this, e, !0, 52, 8);
	}, s.prototype.readDoubleBE = function(e, t) {
		return e >>>= 0, t || z(e, 8, this.length), n.read(this, e, !1, 52, 8);
	};
	function B(e, t, n, r, i, a) {
		if (!s.isBuffer(e)) throw TypeError("\"buffer\" argument must be a Buffer instance");
		if (t > i || t < a) throw RangeError("\"value\" argument is out of bounds");
		if (n + r > e.length) throw RangeError("Index out of range");
	}
	s.prototype.writeUintLE = s.prototype.writeUIntLE = function(e, t, n, r) {
		if (e = +e, t >>>= 0, n >>>= 0, !r) {
			let r = 2 ** (8 * n) - 1;
			B(this, e, t, n, r, 0);
		}
		let i = 1, a = 0;
		for (this[t] = e & 255; ++a < n && (i *= 256);) this[t + a] = e / i & 255;
		return t + n;
	}, s.prototype.writeUintBE = s.prototype.writeUIntBE = function(e, t, n, r) {
		if (e = +e, t >>>= 0, n >>>= 0, !r) {
			let r = 2 ** (8 * n) - 1;
			B(this, e, t, n, r, 0);
		}
		let i = n - 1, a = 1;
		for (this[t + i] = e & 255; --i >= 0 && (a *= 256);) this[t + i] = e / a & 255;
		return t + n;
	}, s.prototype.writeUint8 = s.prototype.writeUInt8 = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 1, 255, 0), this[t] = e & 255, t + 1;
	}, s.prototype.writeUint16LE = s.prototype.writeUInt16LE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 2, 65535, 0), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
	}, s.prototype.writeUint16BE = s.prototype.writeUInt16BE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 2, 65535, 0), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
	}, s.prototype.writeUint32LE = s.prototype.writeUInt32LE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 4, 4294967295, 0), this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = e & 255, t + 4;
	}, s.prototype.writeUint32BE = s.prototype.writeUInt32BE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 4, 4294967295, 0), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
	};
	function V(e, t, n, r, i) {
		J(t, r, i, e, n, 7);
		let a = Number(t & BigInt(4294967295));
		e[n++] = a, a >>= 8, e[n++] = a, a >>= 8, e[n++] = a, a >>= 8, e[n++] = a;
		let o = Number(t >> BigInt(32) & BigInt(4294967295));
		return e[n++] = o, o >>= 8, e[n++] = o, o >>= 8, e[n++] = o, o >>= 8, e[n++] = o, n;
	}
	function H(e, t, n, r, i) {
		J(t, r, i, e, n, 7);
		let a = Number(t & BigInt(4294967295));
		e[n + 7] = a, a >>= 8, e[n + 6] = a, a >>= 8, e[n + 5] = a, a >>= 8, e[n + 4] = a;
		let o = Number(t >> BigInt(32) & BigInt(4294967295));
		return e[n + 3] = o, o >>= 8, e[n + 2] = o, o >>= 8, e[n + 1] = o, o >>= 8, e[n] = o, n + 8;
	}
	s.prototype.writeBigUInt64LE = le(function(e, t = 0) {
		return V(this, e, t, BigInt(0), BigInt("0xffffffffffffffff"));
	}), s.prototype.writeBigUInt64BE = le(function(e, t = 0) {
		return H(this, e, t, BigInt(0), BigInt("0xffffffffffffffff"));
	}), s.prototype.writeIntLE = function(e, t, n, r) {
		if (e = +e, t >>>= 0, !r) {
			let r = 2 ** (8 * n - 1);
			B(this, e, t, n, r - 1, -r);
		}
		let i = 0, a = 1, o = 0;
		for (this[t] = e & 255; ++i < n && (a *= 256);) e < 0 && o === 0 && this[t + i - 1] !== 0 && (o = 1), this[t + i] = (e / a >> 0) - o & 255;
		return t + n;
	}, s.prototype.writeIntBE = function(e, t, n, r) {
		if (e = +e, t >>>= 0, !r) {
			let r = 2 ** (8 * n - 1);
			B(this, e, t, n, r - 1, -r);
		}
		let i = n - 1, a = 1, o = 0;
		for (this[t + i] = e & 255; --i >= 0 && (a *= 256);) e < 0 && o === 0 && this[t + i + 1] !== 0 && (o = 1), this[t + i] = (e / a >> 0) - o & 255;
		return t + n;
	}, s.prototype.writeInt8 = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 1, 127, -128), e < 0 && (e = 255 + e + 1), this[t] = e & 255, t + 1;
	}, s.prototype.writeInt16LE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 2, 32767, -32768), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
	}, s.prototype.writeInt16BE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 2, 32767, -32768), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
	}, s.prototype.writeInt32LE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 4, 2147483647, -2147483648), this[t] = e & 255, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24, t + 4;
	}, s.prototype.writeInt32BE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 4, 2147483647, -2147483648), e < 0 && (e = 4294967295 + e + 1), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
	}, s.prototype.writeBigInt64LE = le(function(e, t = 0) {
		return V(this, e, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
	}), s.prototype.writeBigInt64BE = le(function(e, t = 0) {
		return H(this, e, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
	});
	function U(e, t, n, r, i, a) {
		if (n + r > e.length || n < 0) throw RangeError("Index out of range");
	}
	function ee(e, t, r, i, a) {
		return t = +t, r >>>= 0, a || U(e, t, r, 4, 34028234663852886e22, -34028234663852886e22), n.write(e, t, r, i, 23, 4), r + 4;
	}
	s.prototype.writeFloatLE = function(e, t, n) {
		return ee(this, e, t, !0, n);
	}, s.prototype.writeFloatBE = function(e, t, n) {
		return ee(this, e, t, !1, n);
	};
	function te(e, t, r, i, a) {
		return t = +t, r >>>= 0, a || U(e, t, r, 8, 17976931348623157e292, -17976931348623157e292), n.write(e, t, r, i, 52, 8), r + 8;
	}
	s.prototype.writeDoubleLE = function(e, t, n) {
		return te(this, e, t, !0, n);
	}, s.prototype.writeDoubleBE = function(e, t, n) {
		return te(this, e, t, !1, n);
	}, s.prototype.copy = function(e, t, n, r) {
		if (!s.isBuffer(e)) throw TypeError("argument should be a Buffer");
		if (n ||= 0, !r && r !== 0 && (r = this.length), t >= e.length && (t = e.length), t ||= 0, r > 0 && r < n && (r = n), r === n || e.length === 0 || this.length === 0) return 0;
		if (t < 0) throw RangeError("targetStart out of bounds");
		if (n < 0 || n >= this.length) throw RangeError("Index out of range");
		if (r < 0) throw RangeError("sourceEnd out of bounds");
		r > this.length && (r = this.length), e.length - t < r - n && (r = e.length - t + n);
		let i = r - n;
		return this === e && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(t, n, r) : Uint8Array.prototype.set.call(e, this.subarray(n, r), t), i;
	}, s.prototype.fill = function(e, t, n, r) {
		if (typeof e == "string") {
			if (typeof t == "string" ? (r = t, t = 0, n = this.length) : typeof n == "string" && (r = n, n = this.length), r !== void 0 && typeof r != "string") throw TypeError("encoding must be a string");
			if (typeof r == "string" && !s.isEncoding(r)) throw TypeError("Unknown encoding: " + r);
			if (e.length === 1) {
				let t = e.charCodeAt(0);
				(r === "utf8" && t < 128 || r === "latin1") && (e = t);
			}
		} else typeof e == "number" ? e &= 255 : typeof e == "boolean" && (e = Number(e));
		if (t < 0 || this.length < t || this.length < n) throw RangeError("Out of range index");
		if (n <= t) return this;
		t >>>= 0, n = n === void 0 ? this.length : n >>> 0, e ||= 0;
		let i;
		if (typeof e == "number") for (i = t; i < n; ++i) this[i] = e;
		else {
			let a = s.isBuffer(e) ? e : s.from(e, r), o = a.length;
			if (o === 0) throw TypeError("The value \"" + e + "\" is invalid for argument \"value\"");
			for (i = 0; i < n - t; ++i) this[i + t] = a[i % o];
		}
		return this;
	};
	var W = {};
	function G(e, t, n) {
		W[e] = class extends n {
			constructor() {
				super(), Object.defineProperty(this, "message", {
					value: t.apply(this, arguments),
					writable: !0,
					configurable: !0
				}), this.name = `${this.name} [${e}]`, this.stack, delete this.name;
			}
			get code() {
				return e;
			}
			set code(e) {
				Object.defineProperty(this, "code", {
					configurable: !0,
					enumerable: !0,
					value: e,
					writable: !0
				});
			}
			toString() {
				return `${this.name} [${e}]: ${this.message}`;
			}
		};
	}
	G("ERR_BUFFER_OUT_OF_BOUNDS", function(e) {
		return e ? `${e} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
	}, RangeError), G("ERR_INVALID_ARG_TYPE", function(e, t) {
		return `The "${e}" argument must be of type number. Received type ${typeof t}`;
	}, TypeError), G("ERR_OUT_OF_RANGE", function(e, t, n) {
		let r = `The value of "${e}" is out of range.`, i = n;
		return Number.isInteger(n) && Math.abs(n) > 2 ** 32 ? i = K(String(n)) : typeof n == "bigint" && (i = String(n), (n > BigInt(2) ** BigInt(32) || n < -(BigInt(2) ** BigInt(32))) && (i = K(i)), i += "n"), r += ` It must be ${t}. Received ${i}`, r;
	}, RangeError);
	function K(e) {
		let t = "", n = e.length, r = +(e[0] === "-");
		for (; n >= r + 4; n -= 3) t = `_${e.slice(n - 3, n)}${t}`;
		return `${e.slice(0, n)}${t}`;
	}
	function q(e, t, n) {
		Y(t, "offset"), (e[t] === void 0 || e[t + n] === void 0) && X(t, e.length - (n + 1));
	}
	function J(e, t, n, r, i, a) {
		if (e > n || e < t) {
			let r = typeof t == "bigint" ? "n" : "", i;
			throw i = a > 3 ? t === 0 || t === BigInt(0) ? `>= 0${r} and < 2${r} ** ${(a + 1) * 8}${r}` : `>= -(2${r} ** ${(a + 1) * 8 - 1}${r}) and < 2 ** ${(a + 1) * 8 - 1}${r}` : `>= ${t}${r} and <= ${n}${r}`, new W.ERR_OUT_OF_RANGE("value", i, e);
		}
		q(r, i, a);
	}
	function Y(e, t) {
		if (typeof e != "number") throw new W.ERR_INVALID_ARG_TYPE(t, "number", e);
	}
	function X(e, t, n) {
		throw Math.floor(e) === e ? t < 0 ? new W.ERR_BUFFER_OUT_OF_BOUNDS() : new W.ERR_OUT_OF_RANGE(n || "offset", `>= ${+!!n} and <= ${t}`, e) : (Y(e, n), new W.ERR_OUT_OF_RANGE(n || "offset", "an integer", e));
	}
	var Z = /[^+/0-9A-Za-z-_]/g;
	function Q(e) {
		if (e = e.split("=")[0], e = e.trim().replace(Z, ""), e.length < 2) return "";
		for (; e.length % 4 != 0;) e += "=";
		return e;
	}
	function ne(e, t) {
		t ||= Infinity;
		let n, r = e.length, i = null, a = [];
		for (let o = 0; o < r; ++o) {
			if (n = e.charCodeAt(o), n > 55295 && n < 57344) {
				if (!i) {
					if (n > 56319) {
						(t -= 3) > -1 && a.push(239, 191, 189);
						continue;
					}
					if (o + 1 === r) {
						(t -= 3) > -1 && a.push(239, 191, 189);
						continue;
					}
					i = n;
					continue;
				}
				if (n < 56320) {
					(t -= 3) > -1 && a.push(239, 191, 189), i = n;
					continue;
				}
				n = (i - 55296 << 10 | n - 56320) + 65536;
			} else i && (t -= 3) > -1 && a.push(239, 191, 189);
			if (i = null, n < 128) {
				if (--t < 0) break;
				a.push(n);
			} else if (n < 2048) {
				if ((t -= 2) < 0) break;
				a.push(n >> 6 | 192, n & 63 | 128);
			} else if (n < 65536) {
				if ((t -= 3) < 0) break;
				a.push(n >> 12 | 224, n >> 6 & 63 | 128, n & 63 | 128);
			} else if (n < 1114112) {
				if ((t -= 4) < 0) break;
				a.push(n >> 18 | 240, n >> 12 & 63 | 128, n >> 6 & 63 | 128, n & 63 | 128);
			} else throw Error("Invalid code point");
		}
		return a;
	}
	function re(e) {
		let t = [];
		for (let n = 0; n < e.length; ++n) t.push(e.charCodeAt(n) & 255);
		return t;
	}
	function ie(e, t) {
		let n, r, i, a = [];
		for (let o = 0; o < e.length && !((t -= 2) < 0); ++o) n = e.charCodeAt(o), r = n >> 8, i = n % 256, a.push(i), a.push(r);
		return a;
	}
	function ae(e) {
		return t.toByteArray(Q(e));
	}
	function oe(e, t, n, r) {
		let i;
		for (i = 0; i < r && !(i + n >= t.length || i >= e.length); ++i) t[i + n] = e[i];
		return i;
	}
	function $(e, t) {
		return e instanceof t || e != null && e.constructor != null && e.constructor.name != null && e.constructor.name === t.name;
	}
	function se(e) {
		return e !== e;
	}
	var ce = (function() {
		let e = "0123456789abcdef", t = Array(256);
		for (let n = 0; n < 16; ++n) {
			let r = n * 16;
			for (let i = 0; i < 16; ++i) t[r + i] = e[n] + e[i];
		}
		return t;
	})();
	function le(e) {
		return typeof BigInt > "u" ? ue : e;
	}
	function ue() {
		throw Error("BigInt not supported");
	}
})), h = /* @__PURE__ */ s(((e, t) => {
	var n = t.exports = {}, r, i;
	function a() {
		throw Error("setTimeout has not been defined");
	}
	function o() {
		throw Error("clearTimeout has not been defined");
	}
	(function() {
		try {
			r = typeof setTimeout == "function" ? setTimeout : a;
		} catch {
			r = a;
		}
		try {
			i = typeof clearTimeout == "function" ? clearTimeout : o;
		} catch {
			i = o;
		}
	})();
	function s(e) {
		if (r === setTimeout) return setTimeout(e, 0);
		if ((r === a || !r) && setTimeout) return r = setTimeout, setTimeout(e, 0);
		try {
			return r(e, 0);
		} catch {
			try {
				return r.call(null, e, 0);
			} catch {
				return r.call(this, e, 0);
			}
		}
	}
	function c(e) {
		if (i === clearTimeout) return clearTimeout(e);
		if ((i === o || !i) && clearTimeout) return i = clearTimeout, clearTimeout(e);
		try {
			return i(e);
		} catch {
			try {
				return i.call(null, e);
			} catch {
				return i.call(this, e);
			}
		}
	}
	var l = [], u = !1, d, f = -1;
	function p() {
		!u || !d || (u = !1, d.length ? l = d.concat(l) : f = -1, l.length && m());
	}
	function m() {
		if (!u) {
			var e = s(p);
			u = !0;
			for (var t = l.length; t;) {
				for (d = l, l = []; ++f < t;) d && d[f].run();
				f = -1, t = l.length;
			}
			d = null, u = !1, c(e);
		}
	}
	n.nextTick = function(e) {
		var t = Array(arguments.length - 1);
		if (arguments.length > 1) for (var n = 1; n < arguments.length; n++) t[n - 1] = arguments[n];
		l.push(new h(e, t)), l.length === 1 && !u && s(m);
	};
	function h(e, t) {
		this.fun = e, this.array = t;
	}
	h.prototype.run = function() {
		this.fun.apply(null, this.array);
	}, n.title = "browser", n.browser = !0, n.env = {}, n.argv = [], n.version = "", n.versions = {};
	function g() {}
	n.on = g, n.addListener = g, n.once = g, n.off = g, n.removeListener = g, n.removeAllListeners = g, n.emit = g, n.prependListener = g, n.prependOnceListener = g, n.listeners = function(e) {
		return [];
	}, n.binding = function(e) {
		throw Error("process.binding is not supported");
	}, n.cwd = function() {
		return "/";
	}, n.chdir = function(e) {
		throw Error("process.chdir is not supported");
	}, n.umask = function() {
		return 0;
	};
})), g = m(), _ = /* @__PURE__ */ u(h(), 1);
globalThis.Buffer === void 0 && (globalThis.Buffer = g.Buffer), globalThis.process === void 0 && (globalThis.process = _.default);
//#endregion
//#region node_modules/fflate/esm/browser.js
var v = Uint8Array, y = Uint16Array, b = Int32Array, x = new v([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	0,
	0,
	0,
	0
]), S = new v([
	0,
	0,
	0,
	0,
	1,
	1,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	5,
	6,
	6,
	7,
	7,
	8,
	8,
	9,
	9,
	10,
	10,
	11,
	11,
	12,
	12,
	13,
	13,
	0,
	0
]), C = new v([
	16,
	17,
	18,
	0,
	8,
	7,
	9,
	6,
	10,
	5,
	11,
	4,
	12,
	3,
	13,
	2,
	14,
	1,
	15
]), w = function(e, t) {
	for (var n = new y(31), r = 0; r < 31; ++r) n[r] = t += 1 << e[r - 1];
	for (var i = new b(n[30]), r = 1; r < 30; ++r) for (var a = n[r]; a < n[r + 1]; ++a) i[a] = a - n[r] << 5 | r;
	return {
		b: n,
		r: i
	};
}, T = w(x, 2), E = T.b, D = T.r;
E[28] = 258, D[258] = 28;
for (var O = w(S, 0), k = O.b, A = O.r, j = new y(32768), M = 0; M < 32768; ++M) {
	var N = (M & 43690) >> 1 | (M & 21845) << 1;
	N = (N & 52428) >> 2 | (N & 13107) << 2, N = (N & 61680) >> 4 | (N & 3855) << 4, j[M] = ((N & 65280) >> 8 | (N & 255) << 8) >> 1;
}
for (var P = (function(e, t, n) {
	for (var r = e.length, i = 0, a = new y(t); i < r; ++i) e[i] && ++a[e[i] - 1];
	var o = new y(t);
	for (i = 1; i < t; ++i) o[i] = o[i - 1] + a[i - 1] << 1;
	var s;
	if (n) {
		s = new y(1 << t);
		var c = 15 - t;
		for (i = 0; i < r; ++i) if (e[i]) for (var l = i << 4 | e[i], u = t - e[i], d = o[e[i] - 1]++ << u, f = d | (1 << u) - 1; d <= f; ++d) s[j[d] >> c] = l;
	} else for (s = new y(r), i = 0; i < r; ++i) e[i] && (s[i] = j[o[e[i] - 1]++] >> 15 - e[i]);
	return s;
}), F = new v(288), M = 0; M < 144; ++M) F[M] = 8;
for (var M = 144; M < 256; ++M) F[M] = 9;
for (var M = 256; M < 280; ++M) F[M] = 7;
for (var M = 280; M < 288; ++M) F[M] = 8;
for (var I = new v(32), M = 0; M < 32; ++M) I[M] = 5;
var L = /*#__PURE__*/ P(F, 9, 0), R = /*#__PURE__*/ P(F, 9, 1), z = /*#__PURE__*/ P(I, 5, 0), B = /*#__PURE__*/ P(I, 5, 1), V = function(e) {
	for (var t = e[0], n = 1; n < e.length; ++n) e[n] > t && (t = e[n]);
	return t;
}, H = function(e, t, n) {
	var r = t / 8 | 0;
	return (e[r] | e[r + 1] << 8) >> (t & 7) & n;
}, U = function(e, t) {
	var n = t / 8 | 0;
	return (e[n] | e[n + 1] << 8 | e[n + 2] << 16) >> (t & 7);
}, ee = function(e) {
	return (e + 7) / 8 | 0;
}, te = function(e, t, n) {
	return (t == null || t < 0) && (t = 0), (n == null || n > e.length) && (n = e.length), new v(e.subarray(t, n));
}, W = [
	"unexpected EOF",
	"invalid block type",
	"invalid length/literal",
	"invalid distance",
	"stream finished",
	"no stream handler",
	,
	"no callback",
	"invalid UTF-8 data",
	"extra field too long",
	"date not in range 1980-2099",
	"filename too long",
	"stream finishing",
	"invalid zip data"
], G = function(e, t, n) {
	var r = Error(t || W[e]);
	if (r.code = e, Error.captureStackTrace && Error.captureStackTrace(r, G), !n) throw r;
	return r;
}, K = function(e, t, n, r) {
	var i = e.length, a = r ? r.length : 0;
	if (!i || t.f && !t.l) return n || new v(0);
	var o = !n, s = o || t.i != 2, c = t.i;
	o && (n = new v(i * 3));
	var l = function(e) {
		var t = n.length;
		if (e > t) {
			var r = new v(Math.max(t * 2, e));
			r.set(n), n = r;
		}
	}, u = t.f || 0, d = t.p || 0, f = t.b || 0, p = t.l, m = t.d, h = t.m, g = t.n, _ = i * 8;
	do {
		if (!p) {
			u = H(e, d, 1);
			var y = H(e, d + 1, 3);
			if (d += 3, !y) {
				var b = ee(d) + 4, w = e[b - 4] | e[b - 3] << 8, T = b + w;
				if (T > i) {
					c && G(0);
					break;
				}
				s && l(f + w), n.set(e.subarray(b, T), f), t.b = f += w, t.p = d = T * 8, t.f = u;
				continue;
			}
			if (y == 1) p = R, m = B, h = 9, g = 5;
			else if (y == 2) {
				var D = H(e, d, 31) + 257, O = H(e, d + 10, 15) + 4, A = D + H(e, d + 5, 31) + 1;
				d += 14;
				for (var j = new v(A), M = new v(19), N = 0; N < O; ++N) M[C[N]] = H(e, d + N * 3, 7);
				d += O * 3;
				for (var F = V(M), I = (1 << F) - 1, L = P(M, F, 1), N = 0; N < A;) {
					var z = L[H(e, d, I)];
					d += z & 15;
					var b = z >> 4;
					if (b < 16) j[N++] = b;
					else {
						var W = 0, K = 0;
						for (b == 16 ? (K = 3 + H(e, d, 3), d += 2, W = j[N - 1]) : b == 17 ? (K = 3 + H(e, d, 7), d += 3) : b == 18 && (K = 11 + H(e, d, 127), d += 7); K--;) j[N++] = W;
					}
				}
				var q = j.subarray(0, D), J = j.subarray(D);
				h = V(q), g = V(J), p = P(q, h, 1), m = P(J, g, 1);
			} else G(1);
			if (d > _) {
				c && G(0);
				break;
			}
		}
		s && l(f + 131072);
		for (var Y = (1 << h) - 1, X = (1 << g) - 1, Z = d;; Z = d) {
			var W = p[U(e, d) & Y], Q = W >> 4;
			if (d += W & 15, d > _) {
				c && G(0);
				break;
			}
			if (W || G(2), Q < 256) n[f++] = Q;
			else if (Q == 256) {
				Z = d, p = null;
				break;
			} else {
				var ne = Q - 254;
				if (Q > 264) {
					var N = Q - 257, re = x[N];
					ne = H(e, d, (1 << re) - 1) + E[N], d += re;
				}
				var ie = m[U(e, d) & X], ae = ie >> 4;
				ie || G(3), d += ie & 15;
				var J = k[ae];
				if (ae > 3) {
					var re = S[ae];
					J += U(e, d) & (1 << re) - 1, d += re;
				}
				if (d > _) {
					c && G(0);
					break;
				}
				s && l(f + 131072);
				var oe = f + ne;
				if (f < J) {
					var $ = a - J, se = Math.min(J, oe);
					for ($ + f < 0 && G(3); f < se; ++f) n[f] = r[$ + f];
				}
				for (; f < oe; ++f) n[f] = n[f - J];
			}
		}
		t.l = p, t.p = Z, t.b = f, t.f = u, p && (u = 1, t.m = h, t.d = m, t.n = g);
	} while (!u);
	return f != n.length && o ? te(n, 0, f) : n.subarray(0, f);
}, q = function(e, t, n) {
	n <<= t & 7;
	var r = t / 8 | 0;
	e[r] |= n, e[r + 1] |= n >> 8;
}, J = function(e, t, n) {
	n <<= t & 7;
	var r = t / 8 | 0;
	e[r] |= n, e[r + 1] |= n >> 8, e[r + 2] |= n >> 16;
}, Y = function(e, t) {
	for (var n = [], r = 0; r < e.length; ++r) e[r] && n.push({
		s: r,
		f: e[r]
	});
	var i = n.length, a = n.slice();
	if (!i) return {
		t: ae,
		l: 0
	};
	if (i == 1) {
		var o = new v(n[0].s + 1);
		return o[n[0].s] = 1, {
			t: o,
			l: 1
		};
	}
	n.sort(function(e, t) {
		return e.f - t.f;
	}), n.push({
		s: -1,
		f: 25001
	});
	var s = n[0], c = n[1], l = 0, u = 1, d = 2;
	for (n[0] = {
		s: -1,
		f: s.f + c.f,
		l: s,
		r: c
	}; u != i - 1;) s = n[n[l].f < n[d].f ? l++ : d++], c = n[l != u && n[l].f < n[d].f ? l++ : d++], n[u++] = {
		s: -1,
		f: s.f + c.f,
		l: s,
		r: c
	};
	for (var f = a[0].s, r = 1; r < i; ++r) a[r].s > f && (f = a[r].s);
	var p = new y(f + 1), m = X(n[u - 1], p, 0);
	if (m > t) {
		var r = 0, h = 0, g = m - t, _ = 1 << g;
		for (a.sort(function(e, t) {
			return p[t.s] - p[e.s] || e.f - t.f;
		}); r < i; ++r) {
			var b = a[r].s;
			if (p[b] > t) h += _ - (1 << m - p[b]), p[b] = t;
			else break;
		}
		for (h >>= g; h > 0;) {
			var x = a[r].s;
			p[x] < t ? h -= 1 << t - p[x]++ - 1 : ++r;
		}
		for (; r >= 0 && h; --r) {
			var S = a[r].s;
			p[S] == t && (--p[S], ++h);
		}
		m = t;
	}
	return {
		t: new v(p),
		l: m
	};
}, X = function(e, t, n) {
	return e.s == -1 ? Math.max(X(e.l, t, n + 1), X(e.r, t, n + 1)) : t[e.s] = n;
}, Z = function(e) {
	for (var t = e.length; t && !e[--t];);
	for (var n = new y(++t), r = 0, i = e[0], a = 1, o = function(e) {
		n[r++] = e;
	}, s = 1; s <= t; ++s) if (e[s] == i && s != t) ++a;
	else {
		if (!i && a > 2) {
			for (; a > 138; a -= 138) o(32754);
			a > 2 && (o(a > 10 ? a - 11 << 5 | 28690 : a - 3 << 5 | 12305), a = 0);
		} else if (a > 3) {
			for (o(i), --a; a > 6; a -= 6) o(8304);
			a > 2 && (o(a - 3 << 5 | 8208), a = 0);
		}
		for (; a--;) o(i);
		a = 1, i = e[s];
	}
	return {
		c: n.subarray(0, r),
		n: t
	};
}, Q = function(e, t) {
	for (var n = 0, r = 0; r < t.length; ++r) n += e[r] * t[r];
	return n;
}, ne = function(e, t, n) {
	var r = n.length, i = ee(t + 2);
	e[i] = r & 255, e[i + 1] = r >> 8, e[i + 2] = e[i] ^ 255, e[i + 3] = e[i + 1] ^ 255;
	for (var a = 0; a < r; ++a) e[i + a + 4] = n[a];
	return (i + 4 + r) * 8;
}, re = function(e, t, n, r, i, a, o, s, c, l, u) {
	q(t, u++, n), ++i[256];
	for (var d = Y(i, 15), f = d.t, p = d.l, m = Y(a, 15), h = m.t, g = m.l, _ = Z(f), v = _.c, b = _.n, w = Z(h), T = w.c, E = w.n, D = new y(19), O = 0; O < v.length; ++O) ++D[v[O] & 31];
	for (var O = 0; O < T.length; ++O) ++D[T[O] & 31];
	for (var k = Y(D, 7), A = k.t, j = k.l, M = 19; M > 4 && !A[C[M - 1]]; --M);
	var N = l + 5 << 3, R = Q(i, F) + Q(a, I) + o, B = Q(i, f) + Q(a, h) + o + 14 + 3 * M + Q(D, A) + 2 * D[16] + 3 * D[17] + 7 * D[18];
	if (c >= 0 && N <= R && N <= B) return ne(t, u, e.subarray(c, c + l));
	var V, H, U, ee;
	if (q(t, u, 1 + (B < R)), u += 2, B < R) {
		V = P(f, p, 0), H = f, U = P(h, g, 0), ee = h;
		var te = P(A, j, 0);
		q(t, u, b - 257), q(t, u + 5, E - 1), q(t, u + 10, M - 4), u += 14;
		for (var O = 0; O < M; ++O) q(t, u + 3 * O, A[C[O]]);
		u += 3 * M;
		for (var W = [v, T], G = 0; G < 2; ++G) for (var K = W[G], O = 0; O < K.length; ++O) {
			var X = K[O] & 31;
			q(t, u, te[X]), u += A[X], X > 15 && (q(t, u, K[O] >> 5 & 127), u += K[O] >> 12);
		}
	} else V = L, H = F, U = z, ee = I;
	for (var O = 0; O < s; ++O) {
		var re = r[O];
		if (re > 255) {
			var X = re >> 18 & 31;
			J(t, u, V[X + 257]), u += H[X + 257], X > 7 && (q(t, u, re >> 23 & 31), u += x[X]);
			var ie = re & 31;
			J(t, u, U[ie]), u += ee[ie], ie > 3 && (J(t, u, re >> 5 & 8191), u += S[ie]);
		} else J(t, u, V[re]), u += H[re];
	}
	return J(t, u, V[256]), u + H[256];
}, ie = /*#__PURE__*/ new b([
	65540,
	131080,
	131088,
	131104,
	262176,
	1048704,
	1048832,
	2114560,
	2117632
]), ae = /*#__PURE__*/ new v(0), oe = function(e, t, n, r, i, a) {
	var o = a.z || e.length, s = new v(r + o + 5 * (1 + Math.ceil(o / 7e3)) + i), c = s.subarray(r, s.length - i), l = a.l, u = (a.r || 0) & 7;
	if (t) {
		u && (c[0] = a.r >> 3);
		for (var d = ie[t - 1], f = d >> 13, p = d & 8191, m = (1 << n) - 1, h = a.p || new y(32768), g = a.h || new y(m + 1), _ = Math.ceil(n / 3), C = 2 * _, w = function(t) {
			return (e[t] ^ e[t + 1] << _ ^ e[t + 2] << C) & m;
		}, T = new b(25e3), E = new y(288), O = new y(32), k = 0, j = 0, M = a.i || 0, N = 0, P = a.w || 0, F = 0; M + 2 < o; ++M) {
			var I = w(M), L = M & 32767, R = g[I];
			if (h[L] = R, g[I] = L, P <= M) {
				var z = o - M;
				if ((k > 7e3 || N > 24576) && (z > 423 || !l)) {
					u = re(e, c, 0, T, E, O, j, N, F, M - F, u), N = k = j = 0, F = M;
					for (var B = 0; B < 286; ++B) E[B] = 0;
					for (var B = 0; B < 30; ++B) O[B] = 0;
				}
				var V = 2, H = 0, U = p, W = L - R & 32767;
				if (z > 2 && I == w(M - W)) for (var G = Math.min(f, z) - 1, K = Math.min(32767, M), q = Math.min(258, z); W <= K && --U && L != R;) {
					if (e[M + V] == e[M + V - W]) {
						for (var J = 0; J < q && e[M + J] == e[M + J - W]; ++J);
						if (J > V) {
							if (V = J, H = W, J > G) break;
							for (var Y = Math.min(W, J - 2), X = 0, B = 0; B < Y; ++B) {
								var Z = M - W + B & 32767, Q = Z - h[Z] & 32767;
								Q > X && (X = Q, R = Z);
							}
						}
					}
					L = R, R = h[L], W += L - R & 32767;
				}
				if (H) {
					T[N++] = 268435456 | D[V] << 18 | A[H];
					var ae = D[V] & 31, oe = A[H] & 31;
					j += x[ae] + S[oe], ++E[257 + ae], ++O[oe], P = M + V, ++k;
				} else T[N++] = e[M], ++E[e[M]];
			}
		}
		for (M = Math.max(M, P); M < o; ++M) T[N++] = e[M], ++E[e[M]];
		u = re(e, c, l, T, E, O, j, N, F, M - F, u), l || (a.r = u & 7 | c[u / 8 | 0] << 3, u -= 7, a.h = g, a.p = h, a.i = M, a.w = P);
	} else {
		for (var M = a.w || 0; M < o + l; M += 65535) {
			var $ = M + 65535;
			$ >= o && (c[u / 8 | 0] = l, $ = o), u = ne(c, u + 1, e.subarray(M, $));
		}
		a.i = o;
	}
	return te(s, 0, r + ee(u) + i);
}, $ = /*#__PURE__*/ (function() {
	for (var e = /* @__PURE__ */ new Int32Array(256), t = 0; t < 256; ++t) {
		for (var n = t, r = 9; --r;) n = (n & 1 && -306674912) ^ n >>> 1;
		e[t] = n;
	}
	return e;
})(), se = function() {
	var e = -1;
	return {
		p: function(t) {
			for (var n = e, r = 0; r < t.length; ++r) n = $[n & 255 ^ t[r]] ^ n >>> 8;
			e = n;
		},
		d: function() {
			return ~e;
		}
	};
}, ce = function(e, t, n, r, i) {
	if (!i && (i = { l: 1 }, t.dictionary)) {
		var a = t.dictionary.subarray(-32768), o = new v(a.length + e.length);
		o.set(a), o.set(e, a.length), e = o, i.w = a.length;
	}
	return oe(e, t.level == null ? 6 : t.level, t.mem == null ? i.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(e.length))) * 1.5) : 20 : 12 + t.mem, n, r, i);
}, le = function(e, t, n) {
	for (; n; ++t) e[t] = n, n >>>= 8;
}, ue = function(e, t) {
	var n = t.filename;
	if (e[0] = 31, e[1] = 139, e[2] = 8, e[8] = t.level < 2 ? 4 : t.level == 9 ? 2 : 0, e[9] = 3, t.mtime != 0 && le(e, 4, Math.floor(new Date(t.mtime || Date.now()) / 1e3)), n) {
		e[3] = 8;
		for (var r = 0; r <= n.length; ++r) e[r + 10] = n.charCodeAt(r);
	}
}, de = function(e) {
	(e[0] != 31 || e[1] != 139 || e[2] != 8) && G(6, "invalid gzip data");
	var t = e[3], n = 10;
	t & 4 && (n += (e[10] | e[11] << 8) + 2);
	for (var r = (t >> 3 & 1) + (t >> 4 & 1); r > 0; r -= !e[n++]);
	return n + (t & 2);
}, fe = function(e) {
	var t = e.length;
	return (e[t - 4] | e[t - 3] << 8 | e[t - 2] << 16 | e[t - 1] << 24) >>> 0;
}, pe = function(e) {
	return 10 + (e.filename ? e.filename.length + 1 : 0);
};
function me(e, t) {
	t ||= {};
	var n = se(), r = e.length;
	n.p(e);
	var i = ce(e, t, pe(t), 8), a = i.length;
	return ue(i, t), le(i, a - 8, n.d()), le(i, a - 4, r), i;
}
function he(e, t) {
	var n = de(e);
	return n + 8 > e.length && G(6, "invalid gzip data"), K(e.subarray(n, -8), { i: 2 }, t && t.out || new v(fe(e)), t && t.dictionary);
}
var ge = typeof TextDecoder < "u" && /*#__PURE__*/ new TextDecoder();
try {
	ge.decode(ae, { stream: !0 });
} catch {}
//#endregion
//#region src/codec/compression.ts
function _e(e) {
	return me(e, { level: 9 });
}
function ve(e) {
	return he(e);
}
//#endregion
//#region src/codec/envelope.ts
var ye = 4;
function be(e, t) {
	let n = new TextEncoder().encode(JSON.stringify(e)), r = new Uint8Array(ye + n.length + t.length);
	return new DataView(r.buffer).setUint32(0, n.length, !1), r.set(n, ye), r.set(t, ye + n.length), r;
}
function xe(e) {
	if (e.length < ye) throw Error("Envelope is too short to contain a header length");
	let t = new DataView(e.buffer, e.byteOffset, e.byteLength).getUint32(0, !1), n = ye, r = n + t;
	if (r > e.length) throw Error("Envelope header length exceeds available data");
	let i = e.subarray(n, r);
	return {
		meta: JSON.parse(new TextDecoder().decode(i)),
		payload: e.subarray(r)
	};
}
//#endregion
//#region src/codec/errors.ts
var Se = class extends Error {
	constructor(e = "Reassembled data failed integrity verification") {
		super(e), this.name = "IntegrityError";
	}
};
//#endregion
//#region src/codec/hash.ts
async function Ce(e) {
	let t = new Uint8Array(e), n = await crypto.subtle.digest("SHA-256", t);
	return Array.from(new Uint8Array(n)).map((e) => e.toString(16).padStart(2, "0")).join("");
}
//#endregion
//#region node_modules/@ngraveio/bc-ur/dist/errors.js
var we = /* @__PURE__ */ s(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.InvalidChecksumError = e.InvalidSequenceComponentError = e.InvalidTypeError = e.InvalidPathLengthError = e.InvalidSchemeError = void 0, e.InvalidSchemeError = class extends Error {
		constructor() {
			super("Invalid Scheme"), this.name = "InvalidSchemeError";
		}
	}, e.InvalidPathLengthError = class extends Error {
		constructor() {
			super("Invalid Path"), this.name = "InvalidPathLengthError";
		}
	}, e.InvalidTypeError = class extends Error {
		constructor() {
			super("Invalid Type"), this.name = "InvalidTypeError";
		}
	}, e.InvalidSequenceComponentError = class extends Error {
		constructor() {
			super("Invalid Sequence Component"), this.name = "InvalidSequenceComponentError";
		}
	}, e.InvalidChecksumError = class extends Error {
		constructor() {
			super("Invalid Checksum"), this.name = "InvalidChecksumError";
		}
	};
})), Te = /* @__PURE__ */ s(((e, t) => {
	t.exports = typeof Object.create == "function" ? function(e, t) {
		t && (e.super_ = t, e.prototype = Object.create(t.prototype, { constructor: {
			value: e,
			enumerable: !1,
			writable: !0,
			configurable: !0
		} }));
	} : function(e, t) {
		if (t) {
			e.super_ = t;
			var n = function() {};
			n.prototype = t.prototype, e.prototype = new n(), e.prototype.constructor = e;
		}
	};
})), Ee = /* @__PURE__ */ s(((e, t) => {
	var n = m(), r = n.Buffer;
	function i(e, t) {
		for (var n in e) t[n] = e[n];
	}
	r.from && r.alloc && r.allocUnsafe && r.allocUnsafeSlow ? t.exports = n : (i(n, e), e.Buffer = a);
	function a(e, t, n) {
		return r(e, t, n);
	}
	a.prototype = Object.create(r.prototype), i(r, a), a.from = function(e, t, n) {
		if (typeof e == "number") throw TypeError("Argument must not be a number");
		return r(e, t, n);
	}, a.alloc = function(e, t, n) {
		if (typeof e != "number") throw TypeError("Argument must be a number");
		var i = r(e);
		return t === void 0 ? i.fill(0) : typeof n == "string" ? i.fill(t, n) : i.fill(t), i;
	}, a.allocUnsafe = function(e) {
		if (typeof e != "number") throw TypeError("Argument must be a number");
		return r(e);
	}, a.allocUnsafeSlow = function(e) {
		if (typeof e != "number") throw TypeError("Argument must be a number");
		return n.SlowBuffer(e);
	};
})), De = /* @__PURE__ */ s(((e, t) => {
	var n = {}.toString;
	t.exports = Array.isArray || function(e) {
		return n.call(e) == "[object Array]";
	};
})), Oe = /* @__PURE__ */ s(((e, t) => {
	t.exports = TypeError;
})), ke = /* @__PURE__ */ s(((e, t) => {
	t.exports = Object;
})), Ae = /* @__PURE__ */ s(((e, t) => {
	t.exports = Error;
})), je = /* @__PURE__ */ s(((e, t) => {
	t.exports = EvalError;
})), Me = /* @__PURE__ */ s(((e, t) => {
	t.exports = RangeError;
})), Ne = /* @__PURE__ */ s(((e, t) => {
	t.exports = ReferenceError;
})), Pe = /* @__PURE__ */ s(((e, t) => {
	t.exports = SyntaxError;
})), Fe = /* @__PURE__ */ s(((e, t) => {
	t.exports = URIError;
})), Ie = /* @__PURE__ */ s(((e, t) => {
	t.exports = Math.abs;
})), Le = /* @__PURE__ */ s(((e, t) => {
	t.exports = Math.floor;
})), Re = /* @__PURE__ */ s(((e, t) => {
	t.exports = Math.max;
})), ze = /* @__PURE__ */ s(((e, t) => {
	t.exports = Math.min;
})), Be = /* @__PURE__ */ s(((e, t) => {
	t.exports = Math.pow;
})), Ve = /* @__PURE__ */ s(((e, t) => {
	t.exports = Math.round;
})), He = /* @__PURE__ */ s(((e, t) => {
	t.exports = Number.isNaN || function(e) {
		return e !== e;
	};
})), Ue = /* @__PURE__ */ s(((e, t) => {
	var n = He();
	t.exports = function(e) {
		return n(e) || e === 0 ? e : e < 0 ? -1 : 1;
	};
})), We = /* @__PURE__ */ s(((e, t) => {
	t.exports = Object.getOwnPropertyDescriptor;
})), Ge = /* @__PURE__ */ s(((e, t) => {
	var n = We();
	if (n) try {
		n([], "length");
	} catch {
		n = null;
	}
	t.exports = n;
})), Ke = /* @__PURE__ */ s(((e, t) => {
	var n = Object.defineProperty || !1;
	if (n) try {
		n({}, "a", { value: 1 });
	} catch {
		n = !1;
	}
	t.exports = n;
})), qe = /* @__PURE__ */ s(((e, t) => {
	t.exports = function() {
		if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function") return !1;
		if (typeof Symbol.iterator == "symbol") return !0;
		var e = {}, t = Symbol("test"), n = Object(t);
		if (typeof t == "string" || Object.prototype.toString.call(t) !== "[object Symbol]" || Object.prototype.toString.call(n) !== "[object Symbol]") return !1;
		var r = 42;
		for (var i in e[t] = r, e) return !1;
		if (typeof Object.keys == "function" && Object.keys(e).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(e).length !== 0) return !1;
		var a = Object.getOwnPropertySymbols(e);
		if (a.length !== 1 || a[0] !== t || !Object.prototype.propertyIsEnumerable.call(e, t)) return !1;
		if (typeof Object.getOwnPropertyDescriptor == "function") {
			var o = Object.getOwnPropertyDescriptor(e, t);
			if (o.value !== r || o.enumerable !== !0) return !1;
		}
		return !0;
	};
})), Je = /* @__PURE__ */ s(((e, t) => {
	var n = typeof Symbol < "u" && Symbol, r = qe();
	t.exports = function() {
		return typeof n != "function" || typeof Symbol != "function" || typeof n("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 : r();
	};
})), Ye = /* @__PURE__ */ s(((e, t) => {
	t.exports = typeof Reflect < "u" && Reflect.getPrototypeOf || null;
})), Xe = /* @__PURE__ */ s(((e, t) => {
	t.exports = ke().getPrototypeOf || null;
})), Ze = /* @__PURE__ */ s(((e, t) => {
	var n = Object.prototype.toString, r = Math.max, i = "[object Function]", a = function(e, t) {
		for (var n = [], r = 0; r < e.length; r += 1) n[r] = e[r];
		for (var i = 0; i < t.length; i += 1) n[i + e.length] = t[i];
		return n;
	}, o = function(e, t) {
		for (var n = [], r = t || 0, i = 0; r < e.length; r += 1, i += 1) n[i] = e[r];
		return n;
	}, s = function(e, t) {
		for (var n = "", r = 0; r < e.length; r += 1) n += e[r], r + 1 < e.length && (n += t);
		return n;
	};
	t.exports = function(e) {
		var t = this;
		if (typeof t != "function" || n.apply(t) !== i) throw TypeError("Function.prototype.bind called on incompatible " + t);
		for (var c = o(arguments, 1), l, u = function() {
			if (this instanceof l) {
				var n = t.apply(this, a(c, arguments));
				return Object(n) === n ? n : this;
			}
			return t.apply(e, a(c, arguments));
		}, d = r(0, t.length - c.length), f = [], p = 0; p < d; p++) f[p] = "$" + p;
		if (l = Function("binder", "return function (" + s(f, ",") + "){ return binder.apply(this,arguments); }")(u), t.prototype) {
			var m = function() {};
			m.prototype = t.prototype, l.prototype = new m(), m.prototype = null;
		}
		return l;
	};
})), Qe = /* @__PURE__ */ s(((e, t) => {
	var n = Ze();
	t.exports = Function.prototype.bind || n;
})), $e = /* @__PURE__ */ s(((e, t) => {
	t.exports = Function.prototype.call;
})), et = /* @__PURE__ */ s(((e, t) => {
	t.exports = Function.prototype.apply;
})), tt = /* @__PURE__ */ s(((e, t) => {
	t.exports = typeof Reflect < "u" && Reflect && Reflect.apply;
})), nt = /* @__PURE__ */ s(((e, t) => {
	var n = Qe(), r = et(), i = $e();
	t.exports = tt() || n.call(i, r);
})), rt = /* @__PURE__ */ s(((e, t) => {
	var n = Qe(), r = Oe(), i = $e(), a = nt();
	t.exports = function(e) {
		if (e.length < 1 || typeof e[0] != "function") throw new r("a function is required");
		return a(n, i, e);
	};
})), it = /* @__PURE__ */ s(((e, t) => {
	var n = rt(), r = Ge(), i;
	try {
		i = [].__proto__ === Array.prototype;
	} catch (e) {
		if (!e || typeof e != "object" || !("code" in e) || e.code !== "ERR_PROTO_ACCESS") throw e;
	}
	var a = !!i && r && r(Object.prototype, "__proto__"), o = Object, s = o.getPrototypeOf;
	t.exports = a && typeof a.get == "function" ? n([a.get]) : typeof s == "function" && function(e) {
		return s(e == null ? e : o(e));
	};
})), at = /* @__PURE__ */ s(((e, t) => {
	var n = Ye(), r = Xe(), i = it();
	t.exports = n ? function(e) {
		return n(e);
	} : r ? function(e) {
		if (!e || typeof e != "object" && typeof e != "function") throw TypeError("getProto: not an object");
		return r(e);
	} : i ? function(e) {
		return i(e);
	} : null;
})), ot = /* @__PURE__ */ s(((e, t) => {
	var n = Function.prototype.call, r = Object.prototype.hasOwnProperty;
	t.exports = Qe().call(n, r);
})), st = /* @__PURE__ */ s(((e, t) => {
	var n, r = ke(), i = Ae(), a = je(), o = Me(), s = Ne(), c = Pe(), l = Oe(), u = Fe(), d = Ie(), f = Le(), p = Re(), m = ze(), h = Be(), g = Ve(), _ = Ue(), v = Function, y = function(e) {
		try {
			return v("\"use strict\"; return (" + e + ").constructor;")();
		} catch {}
	}, b = Ge(), x = Ke(), S = function() {
		throw new l();
	}, C = b ? function() {
		try {
			return arguments.callee, S;
		} catch {
			try {
				return b(arguments, "callee").get;
			} catch {
				return S;
			}
		}
	}() : S, w = Je()(), T = at(), E = Xe(), D = Ye(), O = et(), k = $e(), A = {}, j = typeof Uint8Array > "u" || !T ? n : T(Uint8Array), M = {
		__proto__: null,
		"%AggregateError%": typeof AggregateError > "u" ? n : AggregateError,
		"%Array%": Array,
		"%ArrayBuffer%": typeof ArrayBuffer > "u" ? n : ArrayBuffer,
		"%ArrayIteratorPrototype%": w && T ? T([][Symbol.iterator]()) : n,
		"%AsyncFromSyncIteratorPrototype%": n,
		"%AsyncFunction%": A,
		"%AsyncGenerator%": A,
		"%AsyncGeneratorFunction%": A,
		"%AsyncIteratorPrototype%": A,
		"%Atomics%": typeof Atomics > "u" ? n : Atomics,
		"%BigInt%": typeof BigInt > "u" ? n : BigInt,
		"%BigInt64Array%": typeof BigInt64Array > "u" ? n : BigInt64Array,
		"%BigUint64Array%": typeof BigUint64Array > "u" ? n : BigUint64Array,
		"%Boolean%": Boolean,
		"%DataView%": typeof DataView > "u" ? n : DataView,
		"%Date%": Date,
		"%decodeURI%": decodeURI,
		"%decodeURIComponent%": decodeURIComponent,
		"%encodeURI%": encodeURI,
		"%encodeURIComponent%": encodeURIComponent,
		"%Error%": i,
		"%eval%": eval,
		"%EvalError%": a,
		"%Float16Array%": typeof Float16Array > "u" ? n : Float16Array,
		"%Float32Array%": typeof Float32Array > "u" ? n : Float32Array,
		"%Float64Array%": typeof Float64Array > "u" ? n : Float64Array,
		"%FinalizationRegistry%": typeof FinalizationRegistry > "u" ? n : FinalizationRegistry,
		"%Function%": v,
		"%GeneratorFunction%": A,
		"%Int8Array%": typeof Int8Array > "u" ? n : Int8Array,
		"%Int16Array%": typeof Int16Array > "u" ? n : Int16Array,
		"%Int32Array%": typeof Int32Array > "u" ? n : Int32Array,
		"%isFinite%": isFinite,
		"%isNaN%": isNaN,
		"%IteratorPrototype%": w && T ? T(T([][Symbol.iterator]())) : n,
		"%JSON%": typeof JSON == "object" ? JSON : n,
		"%Map%": typeof Map > "u" ? n : Map,
		"%MapIteratorPrototype%": typeof Map > "u" || !w || !T ? n : T((/* @__PURE__ */ new Map())[Symbol.iterator]()),
		"%Math%": Math,
		"%Number%": Number,
		"%Object%": r,
		"%Object.getOwnPropertyDescriptor%": b,
		"%parseFloat%": parseFloat,
		"%parseInt%": parseInt,
		"%Promise%": typeof Promise > "u" ? n : Promise,
		"%Proxy%": typeof Proxy > "u" ? n : Proxy,
		"%RangeError%": o,
		"%ReferenceError%": s,
		"%Reflect%": typeof Reflect > "u" ? n : Reflect,
		"%RegExp%": RegExp,
		"%Set%": typeof Set > "u" ? n : Set,
		"%SetIteratorPrototype%": typeof Set > "u" || !w || !T ? n : T((/* @__PURE__ */ new Set())[Symbol.iterator]()),
		"%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? n : SharedArrayBuffer,
		"%String%": String,
		"%StringIteratorPrototype%": w && T ? T(""[Symbol.iterator]()) : n,
		"%Symbol%": w ? Symbol : n,
		"%SyntaxError%": c,
		"%ThrowTypeError%": C,
		"%TypedArray%": j,
		"%TypeError%": l,
		"%Uint8Array%": typeof Uint8Array > "u" ? n : Uint8Array,
		"%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? n : Uint8ClampedArray,
		"%Uint16Array%": typeof Uint16Array > "u" ? n : Uint16Array,
		"%Uint32Array%": typeof Uint32Array > "u" ? n : Uint32Array,
		"%URIError%": u,
		"%WeakMap%": typeof WeakMap > "u" ? n : WeakMap,
		"%WeakRef%": typeof WeakRef > "u" ? n : WeakRef,
		"%WeakSet%": typeof WeakSet > "u" ? n : WeakSet,
		"%Function.prototype.call%": k,
		"%Function.prototype.apply%": O,
		"%Object.defineProperty%": x,
		"%Object.getPrototypeOf%": E,
		"%Math.abs%": d,
		"%Math.floor%": f,
		"%Math.max%": p,
		"%Math.min%": m,
		"%Math.pow%": h,
		"%Math.round%": g,
		"%Math.sign%": _,
		"%Reflect.getPrototypeOf%": D
	};
	if (T) try {
		null.error;
	} catch (e) {
		M["%Error.prototype%"] = T(T(e));
	}
	var N = function e(t) {
		var n;
		if (t === "%AsyncFunction%") n = y("async function () {}");
		else if (t === "%GeneratorFunction%") n = y("function* () {}");
		else if (t === "%AsyncGeneratorFunction%") n = y("async function* () {}");
		else if (t === "%AsyncGenerator%") {
			var r = e("%AsyncGeneratorFunction%");
			r && (n = r.prototype);
		} else if (t === "%AsyncIteratorPrototype%") {
			var i = e("%AsyncGenerator%");
			i && T && (n = T(i.prototype));
		}
		return M[t] = n, n;
	}, P = {
		__proto__: null,
		"%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
		"%ArrayPrototype%": ["Array", "prototype"],
		"%ArrayProto_entries%": [
			"Array",
			"prototype",
			"entries"
		],
		"%ArrayProto_forEach%": [
			"Array",
			"prototype",
			"forEach"
		],
		"%ArrayProto_keys%": [
			"Array",
			"prototype",
			"keys"
		],
		"%ArrayProto_values%": [
			"Array",
			"prototype",
			"values"
		],
		"%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
		"%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
		"%AsyncGeneratorPrototype%": [
			"AsyncGeneratorFunction",
			"prototype",
			"prototype"
		],
		"%BooleanPrototype%": ["Boolean", "prototype"],
		"%DataViewPrototype%": ["DataView", "prototype"],
		"%DatePrototype%": ["Date", "prototype"],
		"%ErrorPrototype%": ["Error", "prototype"],
		"%EvalErrorPrototype%": ["EvalError", "prototype"],
		"%Float32ArrayPrototype%": ["Float32Array", "prototype"],
		"%Float64ArrayPrototype%": ["Float64Array", "prototype"],
		"%FunctionPrototype%": ["Function", "prototype"],
		"%Generator%": ["GeneratorFunction", "prototype"],
		"%GeneratorPrototype%": [
			"GeneratorFunction",
			"prototype",
			"prototype"
		],
		"%Int8ArrayPrototype%": ["Int8Array", "prototype"],
		"%Int16ArrayPrototype%": ["Int16Array", "prototype"],
		"%Int32ArrayPrototype%": ["Int32Array", "prototype"],
		"%JSONParse%": ["JSON", "parse"],
		"%JSONStringify%": ["JSON", "stringify"],
		"%MapPrototype%": ["Map", "prototype"],
		"%NumberPrototype%": ["Number", "prototype"],
		"%ObjectPrototype%": ["Object", "prototype"],
		"%ObjProto_toString%": [
			"Object",
			"prototype",
			"toString"
		],
		"%ObjProto_valueOf%": [
			"Object",
			"prototype",
			"valueOf"
		],
		"%PromisePrototype%": ["Promise", "prototype"],
		"%PromiseProto_then%": [
			"Promise",
			"prototype",
			"then"
		],
		"%Promise_all%": ["Promise", "all"],
		"%Promise_reject%": ["Promise", "reject"],
		"%Promise_resolve%": ["Promise", "resolve"],
		"%RangeErrorPrototype%": ["RangeError", "prototype"],
		"%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
		"%RegExpPrototype%": ["RegExp", "prototype"],
		"%SetPrototype%": ["Set", "prototype"],
		"%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
		"%StringPrototype%": ["String", "prototype"],
		"%SymbolPrototype%": ["Symbol", "prototype"],
		"%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
		"%TypedArrayPrototype%": ["TypedArray", "prototype"],
		"%TypeErrorPrototype%": ["TypeError", "prototype"],
		"%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
		"%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
		"%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
		"%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
		"%URIErrorPrototype%": ["URIError", "prototype"],
		"%WeakMapPrototype%": ["WeakMap", "prototype"],
		"%WeakSetPrototype%": ["WeakSet", "prototype"]
	}, F = Qe(), I = ot(), L = F.call(k, Array.prototype.concat), R = F.call(O, Array.prototype.splice), z = F.call(k, String.prototype.replace), B = F.call(k, String.prototype.slice), V = F.call(k, RegExp.prototype.exec), H = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, U = /\\(\\)?/g, ee = function(e) {
		var t = B(e, 0, 1), n = B(e, -1);
		if (t === "%" && n !== "%") throw new c("invalid intrinsic syntax, expected closing `%`");
		if (n === "%" && t !== "%") throw new c("invalid intrinsic syntax, expected opening `%`");
		var r = [];
		return z(e, H, function(e, t, n, i) {
			r[r.length] = n ? z(i, U, "$1") : t || e;
		}), r;
	}, te = function(e, t) {
		var n = e, r;
		if (I(P, n) && (r = P[n], n = "%" + r[0] + "%"), I(M, n)) {
			var i = M[n];
			if (i === A && (i = N(n)), i === void 0 && !t) throw new l("intrinsic " + e + " exists, but is not available. Please file an issue!");
			return {
				alias: r,
				name: n,
				value: i
			};
		}
		throw new c("intrinsic " + e + " does not exist!");
	};
	t.exports = function(e, t) {
		if (typeof e != "string" || e.length === 0) throw new l("intrinsic name must be a non-empty string");
		if (arguments.length > 1 && typeof t != "boolean") throw new l("\"allowMissing\" argument must be a boolean");
		if (V(/^%?[^%]*%?$/, e) === null) throw new c("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
		var n = ee(e), r = n.length > 0 ? n[0] : "", i = te("%" + r + "%", t), a = i.name, o = i.value, s = !1, u = i.alias;
		u && (r = u[0], R(n, L([0, 1], u)));
		for (var d = 1, f = !0; d < n.length; d += 1) {
			var p = n[d], m = B(p, 0, 1), h = B(p, -1);
			if ((m === "\"" || m === "'" || m === "`" || h === "\"" || h === "'" || h === "`") && m !== h) throw new c("property names with quotes must have matching quotes");
			if ((p === "constructor" || !f) && (s = !0), r += "." + p, a = "%" + r + "%", I(M, a)) o = M[a];
			else if (o != null) {
				if (!(p in o)) {
					if (!t) throw new l("base intrinsic for " + e + " exists, but the property is not available.");
					return;
				}
				if (b && d + 1 >= n.length) {
					var g = b(o, p);
					f = !!g, o = f && "get" in g && !("originalValue" in g.get) ? g.get : o[p];
				} else f = I(o, p), o = o[p];
				f && !s && (M[a] = o);
			}
		}
		return o;
	};
})), ct = /* @__PURE__ */ s(((e, t) => {
	var n = st(), r = rt(), i = r([n("%String.prototype.indexOf%")]);
	t.exports = function(e, t) {
		var a = n(e, !!t);
		return typeof a == "function" && i(e, ".prototype.") > -1 ? r([a]) : a;
	};
})), lt = /* @__PURE__ */ s(((e, t) => {
	var n = Function.prototype.toString, r = typeof Reflect == "object" && Reflect !== null && Reflect.apply, i, a;
	if (typeof r == "function" && typeof Object.defineProperty == "function") try {
		i = Object.defineProperty({}, "length", { get: function() {
			throw a;
		} }), a = {}, r(function() {
			throw 42;
		}, null, i);
	} catch (e) {
		e !== a && (r = null);
	}
	else r = null;
	var o = /^\s*class\b/, s = function(e) {
		try {
			var t = n.call(e);
			return o.test(t);
		} catch {
			return !1;
		}
	}, c = function(e) {
		try {
			return !s(e) && (n.call(e), !0);
		} catch {
			return !1;
		}
	}, l = Object.prototype.toString, u = "[object Object]", d = "[object Function]", f = "[object GeneratorFunction]", p = "[object HTMLAllCollection]", m = "[object HTML document.all class]", h = "[object HTMLCollection]", g = typeof Symbol == "function" && !!Symbol.toStringTag, _ = !(0 in [,]), v = function() {
		return !1;
	};
	if (typeof document == "object") {
		var y = document.all;
		l.call(y) === l.call(document.all) && (v = function(e) {
			if ((_ || !e) && (e === void 0 || typeof e == "object")) try {
				var t = l.call(e);
				return (t === p || t === m || t === h || t === u) && e("") == null;
			} catch {}
			return !1;
		});
	}
	t.exports = r ? function(e) {
		if (v(e)) return !0;
		if (!e || typeof e != "function" && typeof e != "object") return !1;
		try {
			r(e, null, i);
		} catch (e) {
			if (e !== a) return !1;
		}
		return !s(e) && c(e);
	} : function(e) {
		if (v(e)) return !0;
		if (!e || typeof e != "function" && typeof e != "object") return !1;
		if (g) return c(e);
		if (s(e)) return !1;
		var t = l.call(e);
		return t !== d && t !== f && !/^\[object HTML/.test(t) ? !1 : c(e);
	};
})), ut = /* @__PURE__ */ s(((e, t) => {
	var n = lt(), r = Object.prototype.toString, i = Object.prototype.hasOwnProperty, a = function(e, t, n) {
		for (var r = 0, a = e.length; r < a; r++) i.call(e, r) && (n == null ? t(e[r], r, e) : t.call(n, e[r], r, e));
	}, o = function(e, t, n) {
		for (var r = 0, i = e.length; r < i; r++) n == null ? t(e.charAt(r), r, e) : t.call(n, e.charAt(r), r, e);
	}, s = function(e, t, n) {
		for (var r in e) i.call(e, r) && (n == null ? t(e[r], r, e) : t.call(n, e[r], r, e));
	};
	function c(e) {
		return r.call(e) === "[object Array]";
	}
	t.exports = function(e, t, r) {
		if (!n(t)) throw TypeError("iterator must be a function");
		var i;
		arguments.length >= 3 && (i = r), c(e) ? a(e, t, i) : typeof e == "string" ? o(e, t, i) : s(e, t, i);
	};
})), dt = /* @__PURE__ */ s(((e, t) => {
	t.exports = [
		"Float16Array",
		"Float32Array",
		"Float64Array",
		"Int8Array",
		"Int16Array",
		"Int32Array",
		"Uint8Array",
		"Uint8ClampedArray",
		"Uint16Array",
		"Uint32Array",
		"BigInt64Array",
		"BigUint64Array"
	];
})), ft = /* @__PURE__ */ s(((e, t) => {
	var n = dt(), r = typeof globalThis > "u" ? global : globalThis;
	t.exports = function() {
		for (var e = [], t = 0; t < n.length; t++) typeof r[n[t]] == "function" && (e[e.length] = n[t]);
		return e;
	};
})), pt = /* @__PURE__ */ s(((e, t) => {
	var n = Ke(), r = Pe(), i = Oe(), a = Ge();
	t.exports = function(e, t, o) {
		if (!e || typeof e != "object" && typeof e != "function") throw new i("`obj` must be an object or a function`");
		if (typeof t != "string" && typeof t != "symbol") throw new i("`property` must be a string or a symbol`");
		if (arguments.length > 3 && typeof arguments[3] != "boolean" && arguments[3] !== null) throw new i("`nonEnumerable`, if provided, must be a boolean or null");
		if (arguments.length > 4 && typeof arguments[4] != "boolean" && arguments[4] !== null) throw new i("`nonWritable`, if provided, must be a boolean or null");
		if (arguments.length > 5 && typeof arguments[5] != "boolean" && arguments[5] !== null) throw new i("`nonConfigurable`, if provided, must be a boolean or null");
		if (arguments.length > 6 && typeof arguments[6] != "boolean") throw new i("`loose`, if provided, must be a boolean");
		var s = arguments.length > 3 ? arguments[3] : null, c = arguments.length > 4 ? arguments[4] : null, l = arguments.length > 5 ? arguments[5] : null, u = arguments.length > 6 && arguments[6], d = !!a && a(e, t);
		if (n) n(e, t, {
			configurable: l === null && d ? d.configurable : !l,
			enumerable: s === null && d ? d.enumerable : !s,
			value: o,
			writable: c === null && d ? d.writable : !c
		});
		else if (u || !s && !c && !l) e[t] = o;
		else throw new r("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
	};
})), mt = /* @__PURE__ */ s(((e, t) => {
	var n = Ke(), r = function() {
		return !!n;
	};
	r.hasArrayLengthDefineBug = function() {
		if (!n) return null;
		try {
			return n([], "length", { value: 1 }).length !== 1;
		} catch {
			return !0;
		}
	}, t.exports = r;
})), ht = /* @__PURE__ */ s(((e, t) => {
	var n = st(), r = pt(), i = mt()(), a = Ge(), o = Oe(), s = n("%Math.floor%");
	t.exports = function(e, t) {
		if (typeof e != "function") throw new o("`fn` is not a function");
		if (typeof t != "number" || t < 0 || t > 4294967295 || s(t) !== t) throw new o("`length` must be a positive 32-bit integer");
		var n = arguments.length > 2 && !!arguments[2], c = !0, l = !0;
		if ("length" in e && a) {
			var u = a(e, "length");
			u && !u.configurable && (c = !1), u && !u.writable && (l = !1);
		}
		return (c || l || !n) && (i ? r(e, "length", t, !0, !0) : r(e, "length", t)), e;
	};
})), gt = /* @__PURE__ */ s(((e, t) => {
	var n = Qe(), r = et(), i = nt();
	t.exports = function() {
		return i(n, r, arguments);
	};
})), _t = /* @__PURE__ */ s(((e, t) => {
	var n = ht(), r = Ke(), i = rt(), a = gt();
	t.exports = function(e) {
		var t = i(arguments), r = 1 + e.length - (arguments.length - 1);
		return n(t, r > 0 ? r : 0, !0);
	}, r ? r(t.exports, "apply", { value: a }) : t.exports.apply = a;
})), vt = /* @__PURE__ */ s(((e, t) => {
	var n = qe();
	t.exports = function() {
		return n() && !!Symbol.toStringTag;
	};
})), yt = /* @__PURE__ */ s(((e, t) => {
	var n = ut(), r = ft(), i = _t(), a = ct(), o = Ge(), s = at(), c = a("Object.prototype.toString"), l = vt()(), u = typeof globalThis > "u" ? global : globalThis, d = r(), f = a("String.prototype.slice"), p = a("Array.prototype.indexOf", !0) || function(e, t) {
		for (var n = 0; n < e.length; n += 1) if (e[n] === t) return n;
		return -1;
	}, m = { __proto__: null };
	l && o && s ? n(d, function(e) {
		var t = new u[e]();
		if (Symbol.toStringTag in t && s) {
			var n = s(t), r = o(n, Symbol.toStringTag);
			if (!r && n && (r = o(s(n), Symbol.toStringTag)), r && r.get) {
				var a = i(r.get);
				m["$" + e] = a;
			}
		}
	}) : n(d, function(e) {
		var t = new u[e](), n = t.slice || t.set;
		if (n) {
			var r = i(n);
			m["$" + e] = r;
		}
	});
	function h(e) {
		var t = !1;
		return n(m, function(n, r) {
			if (!t) try {
				"$" + n(e) === r && (t = f(r, 1));
			} catch {}
		}), t;
	}
	function g(e) {
		var t = !1;
		return n(m, function(n, r) {
			if (!t) try {
				n(e), t = f(r, 1);
			} catch {}
		}), t;
	}
	function _(e) {
		return p(d, e) > -1;
	}
	t.exports = function(e) {
		if (!e || typeof e != "object") return !1;
		if (!l) {
			var t = f(c(e), 8, -1);
			return _(t) ? t : t === "Object" && g(e);
		}
		return o ? h(e) : null;
	};
})), bt = /* @__PURE__ */ s(((e, t) => {
	var n = yt();
	t.exports = function(e) {
		return !!n(e);
	};
})), xt = /* @__PURE__ */ s(((e, t) => {
	var n = Oe(), r = ct()("TypedArray.prototype.buffer", !0), i = bt();
	t.exports = r || function(e) {
		if (!i(e)) throw new n("Not a Typed Array");
		return e.buffer;
	};
})), St = /* @__PURE__ */ s(((e, t) => {
	var n = Ee().Buffer, r = De(), i = xt(), a = ArrayBuffer.isView || function(e) {
		try {
			return i(e), !0;
		} catch {
			return !1;
		}
	}, o = typeof Uint8Array < "u", s = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", c = s && (n.prototype instanceof Uint8Array || n.TYPED_ARRAY_SUPPORT);
	t.exports = function(e, t) {
		if (n.isBuffer(e)) return e.constructor && !("isBuffer" in e) ? n.from(e) : e;
		if (typeof e == "string") return n.from(e, t);
		if (s && a(e)) {
			if (e.byteLength === 0) return n.alloc(0);
			if (c) {
				var i = n.from(e.buffer, e.byteOffset, e.byteLength);
				if (i.byteLength === e.byteLength) return i;
			}
			var l = e instanceof Uint8Array ? e : new Uint8Array(e.buffer, e.byteOffset, e.byteLength), u = n.from(l);
			if (u.length === e.byteLength) return u;
		}
		if (o && e instanceof Uint8Array) return n.from(e);
		var d = r(e);
		if (d) for (var f = 0; f < e.length; f += 1) {
			var p = e[f];
			if (typeof p != "number" || p < 0 || p > 255 || ~~p !== p) throw RangeError("Array items must be numbers in the range 0-255.");
		}
		if (d || n.isBuffer(e) && e.constructor && typeof e.constructor.isBuffer == "function" && e.constructor.isBuffer(e)) return n.from(e);
		throw TypeError("The \"data\" argument must be a string, an Array, a Buffer, a Uint8Array, or a DataView.");
	};
})), Ct = /* @__PURE__ */ s(((e, t) => {
	var n = Ee().Buffer, r = St();
	function i(e, t) {
		this._block = n.alloc(e), this._finalSize = t, this._blockSize = e, this._len = 0;
	}
	i.prototype.update = function(e, t) {
		e = r(e, t || "utf8");
		for (var n = this._block, i = this._blockSize, a = e.length, o = this._len, s = 0; s < a;) {
			for (var c = o % i, l = Math.min(a - s, i - c), u = 0; u < l; u++) n[c + u] = e[s + u];
			o += l, s += l, o % i === 0 && this._update(n);
		}
		return this._len += a, this;
	}, i.prototype.digest = function(e) {
		var t = this._len % this._blockSize;
		this._block[t] = 128, this._block.fill(0, t + 1), t >= this._finalSize && (this._update(this._block), this._block.fill(0));
		var n = this._len * 8;
		if (n <= 4294967295) this._block.writeUInt32BE(n, this._blockSize - 4);
		else {
			var r = (n & 4294967295) >>> 0, i = (n - r) / 4294967296;
			this._block.writeUInt32BE(i, this._blockSize - 8), this._block.writeUInt32BE(r, this._blockSize - 4);
		}
		this._update(this._block);
		var a = this._hash();
		return e ? a.toString(e) : a;
	}, i.prototype._update = function() {
		throw Error("_update must be implemented by subclass");
	}, t.exports = i;
})), wt = /* @__PURE__ */ s(((e, t) => {
	var n = Te(), r = Ct(), i = Ee().Buffer, a = [
		1518500249,
		1859775393,
		-1894007588,
		-899497514
	], o = Array(80);
	function s() {
		this.init(), this._w = o, r.call(this, 64, 56);
	}
	n(s, r), s.prototype.init = function() {
		return this._a = 1732584193, this._b = 4023233417, this._c = 2562383102, this._d = 271733878, this._e = 3285377520, this;
	};
	function c(e) {
		return e << 5 | e >>> 27;
	}
	function l(e) {
		return e << 30 | e >>> 2;
	}
	function u(e, t, n, r) {
		return e === 0 ? t & n | ~t & r : e === 2 ? t & n | t & r | n & r : t ^ n ^ r;
	}
	s.prototype._update = function(e) {
		for (var t = this._w, n = this._a | 0, r = this._b | 0, i = this._c | 0, o = this._d | 0, s = this._e | 0, d = 0; d < 16; ++d) t[d] = e.readInt32BE(d * 4);
		for (; d < 80; ++d) t[d] = t[d - 3] ^ t[d - 8] ^ t[d - 14] ^ t[d - 16];
		for (var f = 0; f < 80; ++f) {
			var p = ~~(f / 20), m = c(n) + u(p, r, i, o) + s + t[f] + a[p] | 0;
			s = o, o = i, i = l(r), r = n, n = m;
		}
		this._a = n + this._a | 0, this._b = r + this._b | 0, this._c = i + this._c | 0, this._d = o + this._d | 0, this._e = s + this._e | 0;
	}, s.prototype._hash = function() {
		var e = i.allocUnsafe(20);
		return e.writeInt32BE(this._a | 0, 0), e.writeInt32BE(this._b | 0, 4), e.writeInt32BE(this._c | 0, 8), e.writeInt32BE(this._d | 0, 12), e.writeInt32BE(this._e | 0, 16), e;
	}, t.exports = s;
})), Tt = /* @__PURE__ */ s(((e, t) => {
	var n = Te(), r = Ct(), i = Ee().Buffer, a = [
		1518500249,
		1859775393,
		-1894007588,
		-899497514
	], o = Array(80);
	function s() {
		this.init(), this._w = o, r.call(this, 64, 56);
	}
	n(s, r), s.prototype.init = function() {
		return this._a = 1732584193, this._b = 4023233417, this._c = 2562383102, this._d = 271733878, this._e = 3285377520, this;
	};
	function c(e) {
		return e << 1 | e >>> 31;
	}
	function l(e) {
		return e << 5 | e >>> 27;
	}
	function u(e) {
		return e << 30 | e >>> 2;
	}
	function d(e, t, n, r) {
		return e === 0 ? t & n | ~t & r : e === 2 ? t & n | t & r | n & r : t ^ n ^ r;
	}
	s.prototype._update = function(e) {
		for (var t = this._w, n = this._a | 0, r = this._b | 0, i = this._c | 0, o = this._d | 0, s = this._e | 0, f = 0; f < 16; ++f) t[f] = e.readInt32BE(f * 4);
		for (; f < 80; ++f) t[f] = c(t[f - 3] ^ t[f - 8] ^ t[f - 14] ^ t[f - 16]);
		for (var p = 0; p < 80; ++p) {
			var m = ~~(p / 20), h = l(n) + d(m, r, i, o) + s + t[p] + a[m] | 0;
			s = o, o = i, i = u(r), r = n, n = h;
		}
		this._a = n + this._a | 0, this._b = r + this._b | 0, this._c = i + this._c | 0, this._d = o + this._d | 0, this._e = s + this._e | 0;
	}, s.prototype._hash = function() {
		var e = i.allocUnsafe(20);
		return e.writeInt32BE(this._a | 0, 0), e.writeInt32BE(this._b | 0, 4), e.writeInt32BE(this._c | 0, 8), e.writeInt32BE(this._d | 0, 12), e.writeInt32BE(this._e | 0, 16), e;
	}, t.exports = s;
})), Et = /* @__PURE__ */ s(((e, t) => {
	var n = Te(), r = Ct(), i = Ee().Buffer, a = [
		1116352408,
		1899447441,
		3049323471,
		3921009573,
		961987163,
		1508970993,
		2453635748,
		2870763221,
		3624381080,
		310598401,
		607225278,
		1426881987,
		1925078388,
		2162078206,
		2614888103,
		3248222580,
		3835390401,
		4022224774,
		264347078,
		604807628,
		770255983,
		1249150122,
		1555081692,
		1996064986,
		2554220882,
		2821834349,
		2952996808,
		3210313671,
		3336571891,
		3584528711,
		113926993,
		338241895,
		666307205,
		773529912,
		1294757372,
		1396182291,
		1695183700,
		1986661051,
		2177026350,
		2456956037,
		2730485921,
		2820302411,
		3259730800,
		3345764771,
		3516065817,
		3600352804,
		4094571909,
		275423344,
		430227734,
		506948616,
		659060556,
		883997877,
		958139571,
		1322822218,
		1537002063,
		1747873779,
		1955562222,
		2024104815,
		2227730452,
		2361852424,
		2428436474,
		2756734187,
		3204031479,
		3329325298
	], o = Array(64);
	function s() {
		this.init(), this._w = o, r.call(this, 64, 56);
	}
	n(s, r), s.prototype.init = function() {
		return this._a = 1779033703, this._b = 3144134277, this._c = 1013904242, this._d = 2773480762, this._e = 1359893119, this._f = 2600822924, this._g = 528734635, this._h = 1541459225, this;
	};
	function c(e, t, n) {
		return n ^ e & (t ^ n);
	}
	function l(e, t, n) {
		return e & t | n & (e | t);
	}
	function u(e) {
		return (e >>> 2 | e << 30) ^ (e >>> 13 | e << 19) ^ (e >>> 22 | e << 10);
	}
	function d(e) {
		return (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
	}
	function f(e) {
		return (e >>> 7 | e << 25) ^ (e >>> 18 | e << 14) ^ e >>> 3;
	}
	function p(e) {
		return (e >>> 17 | e << 15) ^ (e >>> 19 | e << 13) ^ e >>> 10;
	}
	s.prototype._update = function(e) {
		for (var t = this._w, n = this._a | 0, r = this._b | 0, i = this._c | 0, o = this._d | 0, s = this._e | 0, m = this._f | 0, h = this._g | 0, g = this._h | 0, _ = 0; _ < 16; ++_) t[_] = e.readInt32BE(_ * 4);
		for (; _ < 64; ++_) t[_] = p(t[_ - 2]) + t[_ - 7] + f(t[_ - 15]) + t[_ - 16] | 0;
		for (var v = 0; v < 64; ++v) {
			var y = g + d(s) + c(s, m, h) + a[v] + t[v] | 0, b = u(n) + l(n, r, i) | 0;
			g = h, h = m, m = s, s = o + y | 0, o = i, i = r, r = n, n = y + b | 0;
		}
		this._a = n + this._a | 0, this._b = r + this._b | 0, this._c = i + this._c | 0, this._d = o + this._d | 0, this._e = s + this._e | 0, this._f = m + this._f | 0, this._g = h + this._g | 0, this._h = g + this._h | 0;
	}, s.prototype._hash = function() {
		var e = i.allocUnsafe(32);
		return e.writeInt32BE(this._a, 0), e.writeInt32BE(this._b, 4), e.writeInt32BE(this._c, 8), e.writeInt32BE(this._d, 12), e.writeInt32BE(this._e, 16), e.writeInt32BE(this._f, 20), e.writeInt32BE(this._g, 24), e.writeInt32BE(this._h, 28), e;
	}, t.exports = s;
})), Dt = /* @__PURE__ */ s(((e, t) => {
	var n = Te(), r = Et(), i = Ct(), a = Ee().Buffer, o = Array(64);
	function s() {
		this.init(), this._w = o, i.call(this, 64, 56);
	}
	n(s, r), s.prototype.init = function() {
		return this._a = 3238371032, this._b = 914150663, this._c = 812702999, this._d = 4144912697, this._e = 4290775857, this._f = 1750603025, this._g = 1694076839, this._h = 3204075428, this;
	}, s.prototype._hash = function() {
		var e = a.allocUnsafe(28);
		return e.writeInt32BE(this._a, 0), e.writeInt32BE(this._b, 4), e.writeInt32BE(this._c, 8), e.writeInt32BE(this._d, 12), e.writeInt32BE(this._e, 16), e.writeInt32BE(this._f, 20), e.writeInt32BE(this._g, 24), e;
	}, t.exports = s;
})), Ot = /* @__PURE__ */ s(((e, t) => {
	var n = Te(), r = Ct(), i = Ee().Buffer, a = [
		1116352408,
		3609767458,
		1899447441,
		602891725,
		3049323471,
		3964484399,
		3921009573,
		2173295548,
		961987163,
		4081628472,
		1508970993,
		3053834265,
		2453635748,
		2937671579,
		2870763221,
		3664609560,
		3624381080,
		2734883394,
		310598401,
		1164996542,
		607225278,
		1323610764,
		1426881987,
		3590304994,
		1925078388,
		4068182383,
		2162078206,
		991336113,
		2614888103,
		633803317,
		3248222580,
		3479774868,
		3835390401,
		2666613458,
		4022224774,
		944711139,
		264347078,
		2341262773,
		604807628,
		2007800933,
		770255983,
		1495990901,
		1249150122,
		1856431235,
		1555081692,
		3175218132,
		1996064986,
		2198950837,
		2554220882,
		3999719339,
		2821834349,
		766784016,
		2952996808,
		2566594879,
		3210313671,
		3203337956,
		3336571891,
		1034457026,
		3584528711,
		2466948901,
		113926993,
		3758326383,
		338241895,
		168717936,
		666307205,
		1188179964,
		773529912,
		1546045734,
		1294757372,
		1522805485,
		1396182291,
		2643833823,
		1695183700,
		2343527390,
		1986661051,
		1014477480,
		2177026350,
		1206759142,
		2456956037,
		344077627,
		2730485921,
		1290863460,
		2820302411,
		3158454273,
		3259730800,
		3505952657,
		3345764771,
		106217008,
		3516065817,
		3606008344,
		3600352804,
		1432725776,
		4094571909,
		1467031594,
		275423344,
		851169720,
		430227734,
		3100823752,
		506948616,
		1363258195,
		659060556,
		3750685593,
		883997877,
		3785050280,
		958139571,
		3318307427,
		1322822218,
		3812723403,
		1537002063,
		2003034995,
		1747873779,
		3602036899,
		1955562222,
		1575990012,
		2024104815,
		1125592928,
		2227730452,
		2716904306,
		2361852424,
		442776044,
		2428436474,
		593698344,
		2756734187,
		3733110249,
		3204031479,
		2999351573,
		3329325298,
		3815920427,
		3391569614,
		3928383900,
		3515267271,
		566280711,
		3940187606,
		3454069534,
		4118630271,
		4000239992,
		116418474,
		1914138554,
		174292421,
		2731055270,
		289380356,
		3203993006,
		460393269,
		320620315,
		685471733,
		587496836,
		852142971,
		1086792851,
		1017036298,
		365543100,
		1126000580,
		2618297676,
		1288033470,
		3409855158,
		1501505948,
		4234509866,
		1607167915,
		987167468,
		1816402316,
		1246189591
	], o = Array(160);
	function s() {
		this.init(), this._w = o, r.call(this, 128, 112);
	}
	n(s, r), s.prototype.init = function() {
		return this._ah = 1779033703, this._bh = 3144134277, this._ch = 1013904242, this._dh = 2773480762, this._eh = 1359893119, this._fh = 2600822924, this._gh = 528734635, this._hh = 1541459225, this._al = 4089235720, this._bl = 2227873595, this._cl = 4271175723, this._dl = 1595750129, this._el = 2917565137, this._fl = 725511199, this._gl = 4215389547, this._hl = 327033209, this;
	};
	function c(e, t, n) {
		return n ^ e & (t ^ n);
	}
	function l(e, t, n) {
		return e & t | n & (e | t);
	}
	function u(e, t) {
		return (e >>> 28 | t << 4) ^ (t >>> 2 | e << 30) ^ (t >>> 7 | e << 25);
	}
	function d(e, t) {
		return (e >>> 14 | t << 18) ^ (e >>> 18 | t << 14) ^ (t >>> 9 | e << 23);
	}
	function f(e, t) {
		return (e >>> 1 | t << 31) ^ (e >>> 8 | t << 24) ^ e >>> 7;
	}
	function p(e, t) {
		return (e >>> 1 | t << 31) ^ (e >>> 8 | t << 24) ^ (e >>> 7 | t << 25);
	}
	function m(e, t) {
		return (e >>> 19 | t << 13) ^ (t >>> 29 | e << 3) ^ e >>> 6;
	}
	function h(e, t) {
		return (e >>> 19 | t << 13) ^ (t >>> 29 | e << 3) ^ (e >>> 6 | t << 26);
	}
	function g(e, t) {
		return +(e >>> 0 < t >>> 0);
	}
	s.prototype._update = function(e) {
		for (var t = this._w, n = this._ah | 0, r = this._bh | 0, i = this._ch | 0, o = this._dh | 0, s = this._eh | 0, _ = this._fh | 0, v = this._gh | 0, y = this._hh | 0, b = this._al | 0, x = this._bl | 0, S = this._cl | 0, C = this._dl | 0, w = this._el | 0, T = this._fl | 0, E = this._gl | 0, D = this._hl | 0, O = 0; O < 32; O += 2) t[O] = e.readInt32BE(O * 4), t[O + 1] = e.readInt32BE(O * 4 + 4);
		for (; O < 160; O += 2) {
			var k = t[O - 30], A = t[O - 30 + 1], j = f(k, A), M = p(A, k);
			k = t[O - 4], A = t[O - 4 + 1];
			var N = m(k, A), P = h(A, k), F = t[O - 14], I = t[O - 14 + 1], L = t[O - 32], R = t[O - 32 + 1], z = M + I | 0, B = j + F + g(z, M) | 0;
			z = z + P | 0, B = B + N + g(z, P) | 0, z = z + R | 0, B = B + L + g(z, R) | 0, t[O] = B, t[O + 1] = z;
		}
		for (var V = 0; V < 160; V += 2) {
			B = t[V], z = t[V + 1];
			var H = l(n, r, i), U = l(b, x, S), ee = u(n, b), te = u(b, n), W = d(s, w), G = d(w, s), K = a[V], q = a[V + 1], J = c(s, _, v), Y = c(w, T, E), X = D + G | 0, Z = y + W + g(X, D) | 0;
			X = X + Y | 0, Z = Z + J + g(X, Y) | 0, X = X + q | 0, Z = Z + K + g(X, q) | 0, X = X + z | 0, Z = Z + B + g(X, z) | 0;
			var Q = te + U | 0, ne = ee + H + g(Q, te) | 0;
			y = v, D = E, v = _, E = T, _ = s, T = w, w = C + X | 0, s = o + Z + g(w, C) | 0, o = i, C = S, i = r, S = x, r = n, x = b, b = X + Q | 0, n = Z + ne + g(b, X) | 0;
		}
		this._al = this._al + b | 0, this._bl = this._bl + x | 0, this._cl = this._cl + S | 0, this._dl = this._dl + C | 0, this._el = this._el + w | 0, this._fl = this._fl + T | 0, this._gl = this._gl + E | 0, this._hl = this._hl + D | 0, this._ah = this._ah + n + g(this._al, b) | 0, this._bh = this._bh + r + g(this._bl, x) | 0, this._ch = this._ch + i + g(this._cl, S) | 0, this._dh = this._dh + o + g(this._dl, C) | 0, this._eh = this._eh + s + g(this._el, w) | 0, this._fh = this._fh + _ + g(this._fl, T) | 0, this._gh = this._gh + v + g(this._gl, E) | 0, this._hh = this._hh + y + g(this._hl, D) | 0;
	}, s.prototype._hash = function() {
		var e = i.allocUnsafe(64);
		function t(t, n, r) {
			e.writeInt32BE(t, r), e.writeInt32BE(n, r + 4);
		}
		return t(this._ah, this._al, 0), t(this._bh, this._bl, 8), t(this._ch, this._cl, 16), t(this._dh, this._dl, 24), t(this._eh, this._el, 32), t(this._fh, this._fl, 40), t(this._gh, this._gl, 48), t(this._hh, this._hl, 56), e;
	}, t.exports = s;
})), kt = /* @__PURE__ */ s(((e, t) => {
	var n = Te(), r = Ot(), i = Ct(), a = Ee().Buffer, o = Array(160);
	function s() {
		this.init(), this._w = o, i.call(this, 128, 112);
	}
	n(s, r), s.prototype.init = function() {
		return this._ah = 3418070365, this._bh = 1654270250, this._ch = 2438529370, this._dh = 355462360, this._eh = 1731405415, this._fh = 2394180231, this._gh = 3675008525, this._hh = 1203062813, this._al = 3238371032, this._bl = 914150663, this._cl = 812702999, this._dl = 4144912697, this._el = 4290775857, this._fl = 1750603025, this._gl = 1694076839, this._hl = 3204075428, this;
	}, s.prototype._hash = function() {
		var e = a.allocUnsafe(48);
		function t(t, n, r) {
			e.writeInt32BE(t, r), e.writeInt32BE(n, r + 4);
		}
		return t(this._ah, this._al, 0), t(this._bh, this._bl, 8), t(this._ch, this._cl, 16), t(this._dh, this._dl, 24), t(this._eh, this._el, 32), t(this._fh, this._fl, 40), e;
	}, t.exports = s;
})), At = /* @__PURE__ */ s(((e, t) => {
	t.exports = function(e) {
		var n = e.toLowerCase(), r = t.exports[n];
		if (!r) throw Error(n + " is not supported (we accept pull requests)");
		return new r();
	}, t.exports.sha = wt(), t.exports.sha1 = Tt(), t.exports.sha224 = Dt(), t.exports.sha256 = Et(), t.exports.sha384 = kt(), t.exports.sha512 = Ot();
})), jt = /* @__PURE__ */ s(((e) => {
	var t = f(), n = p(), r = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
	e.Buffer = s, e.SlowBuffer = b, e.INSPECT_MAX_BYTES = 50;
	var i = 2147483647;
	e.kMaxLength = i, s.TYPED_ARRAY_SUPPORT = a(), !s.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
	function a() {
		try {
			var e = /* @__PURE__ */ new Uint8Array(1), t = { foo: function() {
				return 42;
			} };
			return Object.setPrototypeOf(t, Uint8Array.prototype), Object.setPrototypeOf(e, t), e.foo() === 42;
		} catch {
			return !1;
		}
	}
	Object.defineProperty(s.prototype, "parent", {
		enumerable: !0,
		get: function() {
			if (s.isBuffer(this)) return this.buffer;
		}
	}), Object.defineProperty(s.prototype, "offset", {
		enumerable: !0,
		get: function() {
			if (s.isBuffer(this)) return this.byteOffset;
		}
	});
	function o(e) {
		if (e > i) throw RangeError("The value \"" + e + "\" is invalid for option \"size\"");
		var t = new Uint8Array(e);
		return Object.setPrototypeOf(t, s.prototype), t;
	}
	function s(e, t, n) {
		if (typeof e == "number") {
			if (typeof t == "string") throw TypeError("The \"string\" argument must be of type string. Received type number");
			return d(e);
		}
		return c(e, t, n);
	}
	s.poolSize = 8192;
	function c(e, t, n) {
		if (typeof e == "string") return m(e, t);
		if (ArrayBuffer.isView(e)) return g(e);
		if (e == null) throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e);
		if (Y(e, ArrayBuffer) || e && Y(e.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (Y(e, SharedArrayBuffer) || e && Y(e.buffer, SharedArrayBuffer))) return _(e, t, n);
		if (typeof e == "number") throw TypeError("The \"value\" argument must not be of type number. Received type number");
		var r = e.valueOf && e.valueOf();
		if (r != null && r !== e) return s.from(r, t, n);
		var i = v(e);
		if (i) return i;
		if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof e[Symbol.toPrimitive] == "function") return s.from(e[Symbol.toPrimitive]("string"), t, n);
		throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e);
	}
	s.from = function(e, t, n) {
		return c(e, t, n);
	}, Object.setPrototypeOf(s.prototype, Uint8Array.prototype), Object.setPrototypeOf(s, Uint8Array);
	function l(e) {
		if (typeof e != "number") throw TypeError("\"size\" argument must be of type number");
		if (e < 0) throw RangeError("The value \"" + e + "\" is invalid for option \"size\"");
	}
	function u(e, t, n) {
		return l(e), e <= 0 || t === void 0 ? o(e) : typeof n == "string" ? o(e).fill(t, n) : o(e).fill(t);
	}
	s.alloc = function(e, t, n) {
		return u(e, t, n);
	};
	function d(e) {
		return l(e), o(e < 0 ? 0 : y(e) | 0);
	}
	s.allocUnsafe = function(e) {
		return d(e);
	}, s.allocUnsafeSlow = function(e) {
		return d(e);
	};
	function m(e, t) {
		if ((typeof t != "string" || t === "") && (t = "utf8"), !s.isEncoding(t)) throw TypeError("Unknown encoding: " + t);
		var n = x(e, t) | 0, r = o(n), i = r.write(e, t);
		return i !== n && (r = r.slice(0, i)), r;
	}
	function h(e) {
		for (var t = e.length < 0 ? 0 : y(e.length) | 0, n = o(t), r = 0; r < t; r += 1) n[r] = e[r] & 255;
		return n;
	}
	function g(e) {
		if (Y(e, Uint8Array)) {
			var t = new Uint8Array(e);
			return _(t.buffer, t.byteOffset, t.byteLength);
		}
		return h(e);
	}
	function _(e, t, n) {
		if (t < 0 || e.byteLength < t) throw RangeError("\"offset\" is outside of buffer bounds");
		if (e.byteLength < t + (n || 0)) throw RangeError("\"length\" is outside of buffer bounds");
		var r = t === void 0 && n === void 0 ? new Uint8Array(e) : n === void 0 ? new Uint8Array(e, t) : new Uint8Array(e, t, n);
		return Object.setPrototypeOf(r, s.prototype), r;
	}
	function v(e) {
		if (s.isBuffer(e)) {
			var t = y(e.length) | 0, n = o(t);
			return n.length === 0 || e.copy(n, 0, 0, t), n;
		}
		if (e.length !== void 0) return typeof e.length != "number" || X(e.length) ? o(0) : h(e);
		if (e.type === "Buffer" && Array.isArray(e.data)) return h(e.data);
	}
	function y(e) {
		if (e >= i) throw RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + i.toString(16) + " bytes");
		return e | 0;
	}
	function b(e) {
		return +e != e && (e = 0), s.alloc(+e);
	}
	s.isBuffer = function(e) {
		return e != null && e._isBuffer === !0 && e !== s.prototype;
	}, s.compare = function(e, t) {
		if (Y(e, Uint8Array) && (e = s.from(e, e.offset, e.byteLength)), Y(t, Uint8Array) && (t = s.from(t, t.offset, t.byteLength)), !s.isBuffer(e) || !s.isBuffer(t)) throw TypeError("The \"buf1\", \"buf2\" arguments must be one of type Buffer or Uint8Array");
		if (e === t) return 0;
		for (var n = e.length, r = t.length, i = 0, a = Math.min(n, r); i < a; ++i) if (e[i] !== t[i]) {
			n = e[i], r = t[i];
			break;
		}
		return n < r ? -1 : +(r < n);
	}, s.isEncoding = function(e) {
		switch (String(e).toLowerCase()) {
			case "hex":
			case "utf8":
			case "utf-8":
			case "ascii":
			case "latin1":
			case "binary":
			case "base64":
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return !0;
			default: return !1;
		}
	}, s.concat = function(e, t) {
		if (!Array.isArray(e)) throw TypeError("\"list\" argument must be an Array of Buffers");
		if (e.length === 0) return s.alloc(0);
		var n;
		if (t === void 0) for (t = 0, n = 0; n < e.length; ++n) t += e[n].length;
		var r = s.allocUnsafe(t), i = 0;
		for (n = 0; n < e.length; ++n) {
			var a = e[n];
			if (Y(a, Uint8Array)) i + a.length > r.length ? s.from(a).copy(r, i) : Uint8Array.prototype.set.call(r, a, i);
			else if (s.isBuffer(a)) a.copy(r, i);
			else throw TypeError("\"list\" argument must be an Array of Buffers");
			i += a.length;
		}
		return r;
	};
	function x(e, t) {
		if (s.isBuffer(e)) return e.length;
		if (ArrayBuffer.isView(e) || Y(e, ArrayBuffer)) return e.byteLength;
		if (typeof e != "string") throw TypeError("The \"string\" argument must be one of type string, Buffer, or ArrayBuffer. Received type " + typeof e);
		var n = e.length, r = arguments.length > 2 && arguments[2] === !0;
		if (!r && n === 0) return 0;
		for (var i = !1;;) switch (t) {
			case "ascii":
			case "latin1":
			case "binary": return n;
			case "utf8":
			case "utf-8": return W(e).length;
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return n * 2;
			case "hex": return n >>> 1;
			case "base64": return q(e).length;
			default:
				if (i) return r ? -1 : W(e).length;
				t = ("" + t).toLowerCase(), i = !0;
		}
	}
	s.byteLength = x;
	function S(e, t, n) {
		var r = !1;
		if ((t === void 0 || t < 0) && (t = 0), t > this.length || ((n === void 0 || n > this.length) && (n = this.length), n <= 0) || (n >>>= 0, t >>>= 0, n <= t)) return "";
		for (e ||= "utf8";;) switch (e) {
			case "hex": return L(this, t, n);
			case "utf8":
			case "utf-8": return M(this, t, n);
			case "ascii": return F(this, t, n);
			case "latin1":
			case "binary": return I(this, t, n);
			case "base64": return j(this, t, n);
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return R(this, t, n);
			default:
				if (r) throw TypeError("Unknown encoding: " + e);
				e = (e + "").toLowerCase(), r = !0;
		}
	}
	s.prototype._isBuffer = !0;
	function C(e, t, n) {
		var r = e[t];
		e[t] = e[n], e[n] = r;
	}
	s.prototype.swap16 = function() {
		var e = this.length;
		if (e % 2 != 0) throw RangeError("Buffer size must be a multiple of 16-bits");
		for (var t = 0; t < e; t += 2) C(this, t, t + 1);
		return this;
	}, s.prototype.swap32 = function() {
		var e = this.length;
		if (e % 4 != 0) throw RangeError("Buffer size must be a multiple of 32-bits");
		for (var t = 0; t < e; t += 4) C(this, t, t + 3), C(this, t + 1, t + 2);
		return this;
	}, s.prototype.swap64 = function() {
		var e = this.length;
		if (e % 8 != 0) throw RangeError("Buffer size must be a multiple of 64-bits");
		for (var t = 0; t < e; t += 8) C(this, t, t + 7), C(this, t + 1, t + 6), C(this, t + 2, t + 5), C(this, t + 3, t + 4);
		return this;
	}, s.prototype.toString = function() {
		var e = this.length;
		return e === 0 ? "" : arguments.length === 0 ? M(this, 0, e) : S.apply(this, arguments);
	}, s.prototype.toLocaleString = s.prototype.toString, s.prototype.equals = function(e) {
		if (!s.isBuffer(e)) throw TypeError("Argument must be a Buffer");
		return this === e || s.compare(this, e) === 0;
	}, s.prototype.inspect = function() {
		var t = "", n = e.INSPECT_MAX_BYTES;
		return t = this.toString("hex", 0, n).replace(/(.{2})/g, "$1 ").trim(), this.length > n && (t += " ... "), "<Buffer " + t + ">";
	}, r && (s.prototype[r] = s.prototype.inspect), s.prototype.compare = function(e, t, n, r, i) {
		if (Y(e, Uint8Array) && (e = s.from(e, e.offset, e.byteLength)), !s.isBuffer(e)) throw TypeError("The \"target\" argument must be one of type Buffer or Uint8Array. Received type " + typeof e);
		if (t === void 0 && (t = 0), n === void 0 && (n = e ? e.length : 0), r === void 0 && (r = 0), i === void 0 && (i = this.length), t < 0 || n > e.length || r < 0 || i > this.length) throw RangeError("out of range index");
		if (r >= i && t >= n) return 0;
		if (r >= i) return -1;
		if (t >= n) return 1;
		if (t >>>= 0, n >>>= 0, r >>>= 0, i >>>= 0, this === e) return 0;
		for (var a = i - r, o = n - t, c = Math.min(a, o), l = this.slice(r, i), u = e.slice(t, n), d = 0; d < c; ++d) if (l[d] !== u[d]) {
			a = l[d], o = u[d];
			break;
		}
		return a < o ? -1 : +(o < a);
	};
	function w(e, t, n, r, i) {
		if (e.length === 0) return -1;
		if (typeof n == "string" ? (r = n, n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648), n = +n, X(n) && (n = i ? 0 : e.length - 1), n < 0 && (n = e.length + n), n >= e.length) {
			if (i) return -1;
			n = e.length - 1;
		} else if (n < 0) {
			if (i) n = 0;
			else return -1;
		}
		if (typeof t == "string" && (t = s.from(t, r)), s.isBuffer(t)) return t.length === 0 ? -1 : T(e, t, n, r, i);
		if (typeof t == "number") return t &= 255, typeof Uint8Array.prototype.indexOf == "function" ? i ? Uint8Array.prototype.indexOf.call(e, t, n) : Uint8Array.prototype.lastIndexOf.call(e, t, n) : T(e, [t], n, r, i);
		throw TypeError("val must be string, number or Buffer");
	}
	function T(e, t, n, r, i) {
		var a = 1, o = e.length, s = t.length;
		if (r !== void 0 && (r = String(r).toLowerCase(), r === "ucs2" || r === "ucs-2" || r === "utf16le" || r === "utf-16le")) {
			if (e.length < 2 || t.length < 2) return -1;
			a = 2, o /= 2, s /= 2, n /= 2;
		}
		function c(e, t) {
			return a === 1 ? e[t] : e.readUInt16BE(t * a);
		}
		var l;
		if (i) {
			var u = -1;
			for (l = n; l < o; l++) if (c(e, l) === c(t, u === -1 ? 0 : l - u)) {
				if (u === -1 && (u = l), l - u + 1 === s) return u * a;
			} else u !== -1 && (l -= l - u), u = -1;
		} else for (n + s > o && (n = o - s), l = n; l >= 0; l--) {
			for (var d = !0, f = 0; f < s; f++) if (c(e, l + f) !== c(t, f)) {
				d = !1;
				break;
			}
			if (d) return l;
		}
		return -1;
	}
	s.prototype.includes = function(e, t, n) {
		return this.indexOf(e, t, n) !== -1;
	}, s.prototype.indexOf = function(e, t, n) {
		return w(this, e, t, n, !0);
	}, s.prototype.lastIndexOf = function(e, t, n) {
		return w(this, e, t, n, !1);
	};
	function E(e, t, n, r) {
		n = Number(n) || 0;
		var i = e.length - n;
		r ? (r = Number(r), r > i && (r = i)) : r = i;
		var a = t.length;
		r > a / 2 && (r = a / 2);
		for (var o = 0; o < r; ++o) {
			var s = parseInt(t.substr(o * 2, 2), 16);
			if (X(s)) return o;
			e[n + o] = s;
		}
		return o;
	}
	function D(e, t, n, r) {
		return J(W(t, e.length - n), e, n, r);
	}
	function O(e, t, n, r) {
		return J(G(t), e, n, r);
	}
	function k(e, t, n, r) {
		return J(q(t), e, n, r);
	}
	function A(e, t, n, r) {
		return J(K(t, e.length - n), e, n, r);
	}
	s.prototype.write = function(e, t, n, r) {
		if (t === void 0) r = "utf8", n = this.length, t = 0;
		else if (n === void 0 && typeof t == "string") r = t, n = this.length, t = 0;
		else if (isFinite(t)) t >>>= 0, isFinite(n) ? (n >>>= 0, r === void 0 && (r = "utf8")) : (r = n, n = void 0);
		else throw Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
		var i = this.length - t;
		if ((n === void 0 || n > i) && (n = i), e.length > 0 && (n < 0 || t < 0) || t > this.length) throw RangeError("Attempt to write outside buffer bounds");
		r ||= "utf8";
		for (var a = !1;;) switch (r) {
			case "hex": return E(this, e, t, n);
			case "utf8":
			case "utf-8": return D(this, e, t, n);
			case "ascii":
			case "latin1":
			case "binary": return O(this, e, t, n);
			case "base64": return k(this, e, t, n);
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return A(this, e, t, n);
			default:
				if (a) throw TypeError("Unknown encoding: " + r);
				r = ("" + r).toLowerCase(), a = !0;
		}
	}, s.prototype.toJSON = function() {
		return {
			type: "Buffer",
			data: Array.prototype.slice.call(this._arr || this, 0)
		};
	};
	function j(e, n, r) {
		return n === 0 && r === e.length ? t.fromByteArray(e) : t.fromByteArray(e.slice(n, r));
	}
	function M(e, t, n) {
		n = Math.min(e.length, n);
		for (var r = [], i = t; i < n;) {
			var a = e[i], o = null, s = a > 239 ? 4 : a > 223 ? 3 : a > 191 ? 2 : 1;
			if (i + s <= n) {
				var c, l, u, d;
				switch (s) {
					case 1:
						a < 128 && (o = a);
						break;
					case 2:
						c = e[i + 1], (c & 192) == 128 && (d = (a & 31) << 6 | c & 63, d > 127 && (o = d));
						break;
					case 3:
						c = e[i + 1], l = e[i + 2], (c & 192) == 128 && (l & 192) == 128 && (d = (a & 15) << 12 | (c & 63) << 6 | l & 63, d > 2047 && (d < 55296 || d > 57343) && (o = d));
						break;
					case 4: c = e[i + 1], l = e[i + 2], u = e[i + 3], (c & 192) == 128 && (l & 192) == 128 && (u & 192) == 128 && (d = (a & 15) << 18 | (c & 63) << 12 | (l & 63) << 6 | u & 63, d > 65535 && d < 1114112 && (o = d));
				}
			}
			o === null ? (o = 65533, s = 1) : o > 65535 && (o -= 65536, r.push(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), r.push(o), i += s;
		}
		return P(r);
	}
	var N = 4096;
	function P(e) {
		var t = e.length;
		if (t <= N) return String.fromCharCode.apply(String, e);
		for (var n = "", r = 0; r < t;) n += String.fromCharCode.apply(String, e.slice(r, r += N));
		return n;
	}
	function F(e, t, n) {
		var r = "";
		n = Math.min(e.length, n);
		for (var i = t; i < n; ++i) r += String.fromCharCode(e[i] & 127);
		return r;
	}
	function I(e, t, n) {
		var r = "";
		n = Math.min(e.length, n);
		for (var i = t; i < n; ++i) r += String.fromCharCode(e[i]);
		return r;
	}
	function L(e, t, n) {
		var r = e.length;
		(!t || t < 0) && (t = 0), (!n || n < 0 || n > r) && (n = r);
		for (var i = "", a = t; a < n; ++a) i += Z[e[a]];
		return i;
	}
	function R(e, t, n) {
		for (var r = e.slice(t, n), i = "", a = 0; a < r.length - 1; a += 2) i += String.fromCharCode(r[a] + r[a + 1] * 256);
		return i;
	}
	s.prototype.slice = function(e, t) {
		var n = this.length;
		e = ~~e, t = t === void 0 ? n : ~~t, e < 0 ? (e += n, e < 0 && (e = 0)) : e > n && (e = n), t < 0 ? (t += n, t < 0 && (t = 0)) : t > n && (t = n), t < e && (t = e);
		var r = this.subarray(e, t);
		return Object.setPrototypeOf(r, s.prototype), r;
	};
	function z(e, t, n) {
		if (e % 1 != 0 || e < 0) throw RangeError("offset is not uint");
		if (e + t > n) throw RangeError("Trying to access beyond buffer length");
	}
	s.prototype.readUintLE = s.prototype.readUIntLE = function(e, t, n) {
		e >>>= 0, t >>>= 0, n || z(e, t, this.length);
		for (var r = this[e], i = 1, a = 0; ++a < t && (i *= 256);) r += this[e + a] * i;
		return r;
	}, s.prototype.readUintBE = s.prototype.readUIntBE = function(e, t, n) {
		e >>>= 0, t >>>= 0, n || z(e, t, this.length);
		for (var r = this[e + --t], i = 1; t > 0 && (i *= 256);) r += this[e + --t] * i;
		return r;
	}, s.prototype.readUint8 = s.prototype.readUInt8 = function(e, t) {
		return e >>>= 0, t || z(e, 1, this.length), this[e];
	}, s.prototype.readUint16LE = s.prototype.readUInt16LE = function(e, t) {
		return e >>>= 0, t || z(e, 2, this.length), this[e] | this[e + 1] << 8;
	}, s.prototype.readUint16BE = s.prototype.readUInt16BE = function(e, t) {
		return e >>>= 0, t || z(e, 2, this.length), this[e] << 8 | this[e + 1];
	}, s.prototype.readUint32LE = s.prototype.readUInt32LE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + this[e + 3] * 16777216;
	}, s.prototype.readUint32BE = s.prototype.readUInt32BE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), this[e] * 16777216 + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]);
	}, s.prototype.readIntLE = function(e, t, n) {
		e >>>= 0, t >>>= 0, n || z(e, t, this.length);
		for (var r = this[e], i = 1, a = 0; ++a < t && (i *= 256);) r += this[e + a] * i;
		return i *= 128, r >= i && (r -= 2 ** (8 * t)), r;
	}, s.prototype.readIntBE = function(e, t, n) {
		e >>>= 0, t >>>= 0, n || z(e, t, this.length);
		for (var r = t, i = 1, a = this[e + --r]; r > 0 && (i *= 256);) a += this[e + --r] * i;
		return i *= 128, a >= i && (a -= 2 ** (8 * t)), a;
	}, s.prototype.readInt8 = function(e, t) {
		return e >>>= 0, t || z(e, 1, this.length), this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e];
	}, s.prototype.readInt16LE = function(e, t) {
		e >>>= 0, t || z(e, 2, this.length);
		var n = this[e] | this[e + 1] << 8;
		return n & 32768 ? n | 4294901760 : n;
	}, s.prototype.readInt16BE = function(e, t) {
		e >>>= 0, t || z(e, 2, this.length);
		var n = this[e + 1] | this[e] << 8;
		return n & 32768 ? n | 4294901760 : n;
	}, s.prototype.readInt32LE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24;
	}, s.prototype.readInt32BE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3];
	}, s.prototype.readFloatLE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), n.read(this, e, !0, 23, 4);
	}, s.prototype.readFloatBE = function(e, t) {
		return e >>>= 0, t || z(e, 4, this.length), n.read(this, e, !1, 23, 4);
	}, s.prototype.readDoubleLE = function(e, t) {
		return e >>>= 0, t || z(e, 8, this.length), n.read(this, e, !0, 52, 8);
	}, s.prototype.readDoubleBE = function(e, t) {
		return e >>>= 0, t || z(e, 8, this.length), n.read(this, e, !1, 52, 8);
	};
	function B(e, t, n, r, i, a) {
		if (!s.isBuffer(e)) throw TypeError("\"buffer\" argument must be a Buffer instance");
		if (t > i || t < a) throw RangeError("\"value\" argument is out of bounds");
		if (n + r > e.length) throw RangeError("Index out of range");
	}
	s.prototype.writeUintLE = s.prototype.writeUIntLE = function(e, t, n, r) {
		if (e = +e, t >>>= 0, n >>>= 0, !r) {
			var i = 2 ** (8 * n) - 1;
			B(this, e, t, n, i, 0);
		}
		var a = 1, o = 0;
		for (this[t] = e & 255; ++o < n && (a *= 256);) this[t + o] = e / a & 255;
		return t + n;
	}, s.prototype.writeUintBE = s.prototype.writeUIntBE = function(e, t, n, r) {
		if (e = +e, t >>>= 0, n >>>= 0, !r) {
			var i = 2 ** (8 * n) - 1;
			B(this, e, t, n, i, 0);
		}
		var a = n - 1, o = 1;
		for (this[t + a] = e & 255; --a >= 0 && (o *= 256);) this[t + a] = e / o & 255;
		return t + n;
	}, s.prototype.writeUint8 = s.prototype.writeUInt8 = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 1, 255, 0), this[t] = e & 255, t + 1;
	}, s.prototype.writeUint16LE = s.prototype.writeUInt16LE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 2, 65535, 0), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
	}, s.prototype.writeUint16BE = s.prototype.writeUInt16BE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 2, 65535, 0), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
	}, s.prototype.writeUint32LE = s.prototype.writeUInt32LE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 4, 4294967295, 0), this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = e & 255, t + 4;
	}, s.prototype.writeUint32BE = s.prototype.writeUInt32BE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 4, 4294967295, 0), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
	}, s.prototype.writeIntLE = function(e, t, n, r) {
		if (e = +e, t >>>= 0, !r) {
			var i = 2 ** (8 * n - 1);
			B(this, e, t, n, i - 1, -i);
		}
		var a = 0, o = 1, s = 0;
		for (this[t] = e & 255; ++a < n && (o *= 256);) e < 0 && s === 0 && this[t + a - 1] !== 0 && (s = 1), this[t + a] = (e / o >> 0) - s & 255;
		return t + n;
	}, s.prototype.writeIntBE = function(e, t, n, r) {
		if (e = +e, t >>>= 0, !r) {
			var i = 2 ** (8 * n - 1);
			B(this, e, t, n, i - 1, -i);
		}
		var a = n - 1, o = 1, s = 0;
		for (this[t + a] = e & 255; --a >= 0 && (o *= 256);) e < 0 && s === 0 && this[t + a + 1] !== 0 && (s = 1), this[t + a] = (e / o >> 0) - s & 255;
		return t + n;
	}, s.prototype.writeInt8 = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 1, 127, -128), e < 0 && (e = 255 + e + 1), this[t] = e & 255, t + 1;
	}, s.prototype.writeInt16LE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 2, 32767, -32768), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
	}, s.prototype.writeInt16BE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 2, 32767, -32768), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
	}, s.prototype.writeInt32LE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 4, 2147483647, -2147483648), this[t] = e & 255, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24, t + 4;
	}, s.prototype.writeInt32BE = function(e, t, n) {
		return e = +e, t >>>= 0, n || B(this, e, t, 4, 2147483647, -2147483648), e < 0 && (e = 4294967295 + e + 1), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
	};
	function V(e, t, n, r, i, a) {
		if (n + r > e.length || n < 0) throw RangeError("Index out of range");
	}
	function H(e, t, r, i, a) {
		return t = +t, r >>>= 0, a || V(e, t, r, 4, 34028234663852886e22, -34028234663852886e22), n.write(e, t, r, i, 23, 4), r + 4;
	}
	s.prototype.writeFloatLE = function(e, t, n) {
		return H(this, e, t, !0, n);
	}, s.prototype.writeFloatBE = function(e, t, n) {
		return H(this, e, t, !1, n);
	};
	function U(e, t, r, i, a) {
		return t = +t, r >>>= 0, a || V(e, t, r, 8, 17976931348623157e292, -17976931348623157e292), n.write(e, t, r, i, 52, 8), r + 8;
	}
	s.prototype.writeDoubleLE = function(e, t, n) {
		return U(this, e, t, !0, n);
	}, s.prototype.writeDoubleBE = function(e, t, n) {
		return U(this, e, t, !1, n);
	}, s.prototype.copy = function(e, t, n, r) {
		if (!s.isBuffer(e)) throw TypeError("argument should be a Buffer");
		if (n ||= 0, !r && r !== 0 && (r = this.length), t >= e.length && (t = e.length), t ||= 0, r > 0 && r < n && (r = n), r === n || e.length === 0 || this.length === 0) return 0;
		if (t < 0) throw RangeError("targetStart out of bounds");
		if (n < 0 || n >= this.length) throw RangeError("Index out of range");
		if (r < 0) throw RangeError("sourceEnd out of bounds");
		r > this.length && (r = this.length), e.length - t < r - n && (r = e.length - t + n);
		var i = r - n;
		return this === e && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(t, n, r) : Uint8Array.prototype.set.call(e, this.subarray(n, r), t), i;
	}, s.prototype.fill = function(e, t, n, r) {
		if (typeof e == "string") {
			if (typeof t == "string" ? (r = t, t = 0, n = this.length) : typeof n == "string" && (r = n, n = this.length), r !== void 0 && typeof r != "string") throw TypeError("encoding must be a string");
			if (typeof r == "string" && !s.isEncoding(r)) throw TypeError("Unknown encoding: " + r);
			if (e.length === 1) {
				var i = e.charCodeAt(0);
				(r === "utf8" && i < 128 || r === "latin1") && (e = i);
			}
		} else typeof e == "number" ? e &= 255 : typeof e == "boolean" && (e = Number(e));
		if (t < 0 || this.length < t || this.length < n) throw RangeError("Out of range index");
		if (n <= t) return this;
		t >>>= 0, n = n === void 0 ? this.length : n >>> 0, e ||= 0;
		var a;
		if (typeof e == "number") for (a = t; a < n; ++a) this[a] = e;
		else {
			var o = s.isBuffer(e) ? e : s.from(e, r), c = o.length;
			if (c === 0) throw TypeError("The value \"" + e + "\" is invalid for argument \"value\"");
			for (a = 0; a < n - t; ++a) this[a + t] = o[a % c];
		}
		return this;
	};
	var ee = /[^+/0-9A-Za-z-_]/g;
	function te(e) {
		if (e = e.split("=")[0], e = e.trim().replace(ee, ""), e.length < 2) return "";
		for (; e.length % 4 != 0;) e += "=";
		return e;
	}
	function W(e, t) {
		t ||= Infinity;
		for (var n, r = e.length, i = null, a = [], o = 0; o < r; ++o) {
			if (n = e.charCodeAt(o), n > 55295 && n < 57344) {
				if (!i) {
					if (n > 56319) {
						(t -= 3) > -1 && a.push(239, 191, 189);
						continue;
					}
					if (o + 1 === r) {
						(t -= 3) > -1 && a.push(239, 191, 189);
						continue;
					}
					i = n;
					continue;
				}
				if (n < 56320) {
					(t -= 3) > -1 && a.push(239, 191, 189), i = n;
					continue;
				}
				n = (i - 55296 << 10 | n - 56320) + 65536;
			} else i && (t -= 3) > -1 && a.push(239, 191, 189);
			if (i = null, n < 128) {
				if (--t < 0) break;
				a.push(n);
			} else if (n < 2048) {
				if ((t -= 2) < 0) break;
				a.push(n >> 6 | 192, n & 63 | 128);
			} else if (n < 65536) {
				if ((t -= 3) < 0) break;
				a.push(n >> 12 | 224, n >> 6 & 63 | 128, n & 63 | 128);
			} else if (n < 1114112) {
				if ((t -= 4) < 0) break;
				a.push(n >> 18 | 240, n >> 12 & 63 | 128, n >> 6 & 63 | 128, n & 63 | 128);
			} else throw Error("Invalid code point");
		}
		return a;
	}
	function G(e) {
		for (var t = [], n = 0; n < e.length; ++n) t.push(e.charCodeAt(n) & 255);
		return t;
	}
	function K(e, t) {
		for (var n, r, i, a = [], o = 0; o < e.length && !((t -= 2) < 0); ++o) n = e.charCodeAt(o), r = n >> 8, i = n % 256, a.push(i), a.push(r);
		return a;
	}
	function q(e) {
		return t.toByteArray(te(e));
	}
	function J(e, t, n, r) {
		for (var i = 0; i < r && !(i + n >= t.length || i >= e.length); ++i) t[i + n] = e[i];
		return i;
	}
	function Y(e, t) {
		return e instanceof t || e != null && e.constructor != null && e.constructor.name != null && e.constructor.name === t.name;
	}
	function X(e) {
		return e !== e;
	}
	var Z = (function() {
		for (var e = "0123456789abcdef", t = Array(256), n = 0; n < 16; ++n) for (var r = n * 16, i = 0; i < 16; ++i) t[r + i] = e[n] + e[i];
		return t;
	})();
})), Mt, Nt, Pt = o((() => {
	Mt = jt(), Nt = Mt.Buffer.from && Mt.Buffer.alloc && Mt.Buffer.allocUnsafe && Mt.Buffer.allocUnsafeSlow ? Mt.Buffer.from : (e) => new Mt.Buffer(e);
}));
//#endregion
//#region node_modules/crc/define_crc.js
function Ft(e, t) {
	let n = (e, n) => t(e, n) >>> 0;
	return n.signed = t, n.unsigned = n, n.model = e, n;
}
var It = o((() => {})), Lt, Rt, zt = o((() => {
	Lt = jt(), Pt(), It(), Rt = Ft("crc1", function(e, t) {
		Lt.Buffer.isBuffer(e) || (e = Nt(e));
		let n = ~~t, r = 0;
		for (let t = 0; t < e.length; t++) {
			let n = e[t];
			r += n;
		}
		return n += r % 256, n % 256;
	});
})), Bt, Vt, Ht, Ut = o((() => {
	Bt = jt(), Pt(), It(), Vt = [
		0,
		7,
		14,
		9,
		28,
		27,
		18,
		21,
		56,
		63,
		54,
		49,
		36,
		35,
		42,
		45,
		112,
		119,
		126,
		121,
		108,
		107,
		98,
		101,
		72,
		79,
		70,
		65,
		84,
		83,
		90,
		93,
		224,
		231,
		238,
		233,
		252,
		251,
		242,
		245,
		216,
		223,
		214,
		209,
		196,
		195,
		202,
		205,
		144,
		151,
		158,
		153,
		140,
		139,
		130,
		133,
		168,
		175,
		166,
		161,
		180,
		179,
		186,
		189,
		199,
		192,
		201,
		206,
		219,
		220,
		213,
		210,
		255,
		248,
		241,
		246,
		227,
		228,
		237,
		234,
		183,
		176,
		185,
		190,
		171,
		172,
		165,
		162,
		143,
		136,
		129,
		134,
		147,
		148,
		157,
		154,
		39,
		32,
		41,
		46,
		59,
		60,
		53,
		50,
		31,
		24,
		17,
		22,
		3,
		4,
		13,
		10,
		87,
		80,
		89,
		94,
		75,
		76,
		69,
		66,
		111,
		104,
		97,
		102,
		115,
		116,
		125,
		122,
		137,
		142,
		135,
		128,
		149,
		146,
		155,
		156,
		177,
		182,
		191,
		184,
		173,
		170,
		163,
		164,
		249,
		254,
		247,
		240,
		229,
		226,
		235,
		236,
		193,
		198,
		207,
		200,
		221,
		218,
		211,
		212,
		105,
		110,
		103,
		96,
		117,
		114,
		123,
		124,
		81,
		86,
		95,
		88,
		77,
		74,
		67,
		68,
		25,
		30,
		23,
		16,
		5,
		2,
		11,
		12,
		33,
		38,
		47,
		40,
		61,
		58,
		51,
		52,
		78,
		73,
		64,
		71,
		82,
		85,
		92,
		91,
		118,
		113,
		120,
		127,
		106,
		109,
		100,
		99,
		62,
		57,
		48,
		55,
		34,
		37,
		44,
		43,
		6,
		1,
		8,
		15,
		26,
		29,
		20,
		19,
		174,
		169,
		160,
		167,
		178,
		181,
		188,
		187,
		150,
		145,
		152,
		159,
		138,
		141,
		132,
		131,
		222,
		217,
		208,
		215,
		194,
		197,
		204,
		203,
		230,
		225,
		232,
		239,
		250,
		253,
		244,
		243
	], typeof Int32Array < "u" && (Vt = new Int32Array(Vt)), Ht = Ft("crc-8", function(e, t) {
		Bt.Buffer.isBuffer(e) || (e = Nt(e));
		let n = ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = Vt[(n ^ r) & 255] & 255;
		}
		return n;
	});
})), Wt, Gt, Kt, qt = o((() => {
	Wt = jt(), Pt(), It(), Gt = [
		0,
		94,
		188,
		226,
		97,
		63,
		221,
		131,
		194,
		156,
		126,
		32,
		163,
		253,
		31,
		65,
		157,
		195,
		33,
		127,
		252,
		162,
		64,
		30,
		95,
		1,
		227,
		189,
		62,
		96,
		130,
		220,
		35,
		125,
		159,
		193,
		66,
		28,
		254,
		160,
		225,
		191,
		93,
		3,
		128,
		222,
		60,
		98,
		190,
		224,
		2,
		92,
		223,
		129,
		99,
		61,
		124,
		34,
		192,
		158,
		29,
		67,
		161,
		255,
		70,
		24,
		250,
		164,
		39,
		121,
		155,
		197,
		132,
		218,
		56,
		102,
		229,
		187,
		89,
		7,
		219,
		133,
		103,
		57,
		186,
		228,
		6,
		88,
		25,
		71,
		165,
		251,
		120,
		38,
		196,
		154,
		101,
		59,
		217,
		135,
		4,
		90,
		184,
		230,
		167,
		249,
		27,
		69,
		198,
		152,
		122,
		36,
		248,
		166,
		68,
		26,
		153,
		199,
		37,
		123,
		58,
		100,
		134,
		216,
		91,
		5,
		231,
		185,
		140,
		210,
		48,
		110,
		237,
		179,
		81,
		15,
		78,
		16,
		242,
		172,
		47,
		113,
		147,
		205,
		17,
		79,
		173,
		243,
		112,
		46,
		204,
		146,
		211,
		141,
		111,
		49,
		178,
		236,
		14,
		80,
		175,
		241,
		19,
		77,
		206,
		144,
		114,
		44,
		109,
		51,
		209,
		143,
		12,
		82,
		176,
		238,
		50,
		108,
		142,
		208,
		83,
		13,
		239,
		177,
		240,
		174,
		76,
		18,
		145,
		207,
		45,
		115,
		202,
		148,
		118,
		40,
		171,
		245,
		23,
		73,
		8,
		86,
		180,
		234,
		105,
		55,
		213,
		139,
		87,
		9,
		235,
		181,
		54,
		104,
		138,
		212,
		149,
		203,
		41,
		119,
		244,
		170,
		72,
		22,
		233,
		183,
		85,
		11,
		136,
		214,
		52,
		106,
		43,
		117,
		151,
		201,
		74,
		20,
		246,
		168,
		116,
		42,
		200,
		150,
		21,
		75,
		169,
		247,
		182,
		232,
		10,
		84,
		215,
		137,
		107,
		53
	], typeof Int32Array < "u" && (Gt = new Int32Array(Gt)), Kt = Ft("dallas-1-wire", function(e, t) {
		Wt.Buffer.isBuffer(e) || (e = Nt(e));
		let n = ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = Gt[(n ^ r) & 255] & 255;
		}
		return n;
	});
})), Jt, Yt, Xt, Zt = o((() => {
	Jt = jt(), Pt(), It(), Yt = [
		0,
		49345,
		49537,
		320,
		49921,
		960,
		640,
		49729,
		50689,
		1728,
		1920,
		51009,
		1280,
		50625,
		50305,
		1088,
		52225,
		3264,
		3456,
		52545,
		3840,
		53185,
		52865,
		3648,
		2560,
		51905,
		52097,
		2880,
		51457,
		2496,
		2176,
		51265,
		55297,
		6336,
		6528,
		55617,
		6912,
		56257,
		55937,
		6720,
		7680,
		57025,
		57217,
		8e3,
		56577,
		7616,
		7296,
		56385,
		5120,
		54465,
		54657,
		5440,
		55041,
		6080,
		5760,
		54849,
		53761,
		4800,
		4992,
		54081,
		4352,
		53697,
		53377,
		4160,
		61441,
		12480,
		12672,
		61761,
		13056,
		62401,
		62081,
		12864,
		13824,
		63169,
		63361,
		14144,
		62721,
		13760,
		13440,
		62529,
		15360,
		64705,
		64897,
		15680,
		65281,
		16320,
		16e3,
		65089,
		64001,
		15040,
		15232,
		64321,
		14592,
		63937,
		63617,
		14400,
		10240,
		59585,
		59777,
		10560,
		60161,
		11200,
		10880,
		59969,
		60929,
		11968,
		12160,
		61249,
		11520,
		60865,
		60545,
		11328,
		58369,
		9408,
		9600,
		58689,
		9984,
		59329,
		59009,
		9792,
		8704,
		58049,
		58241,
		9024,
		57601,
		8640,
		8320,
		57409,
		40961,
		24768,
		24960,
		41281,
		25344,
		41921,
		41601,
		25152,
		26112,
		42689,
		42881,
		26432,
		42241,
		26048,
		25728,
		42049,
		27648,
		44225,
		44417,
		27968,
		44801,
		28608,
		28288,
		44609,
		43521,
		27328,
		27520,
		43841,
		26880,
		43457,
		43137,
		26688,
		30720,
		47297,
		47489,
		31040,
		47873,
		31680,
		31360,
		47681,
		48641,
		32448,
		32640,
		48961,
		32e3,
		48577,
		48257,
		31808,
		46081,
		29888,
		30080,
		46401,
		30464,
		47041,
		46721,
		30272,
		29184,
		45761,
		45953,
		29504,
		45313,
		29120,
		28800,
		45121,
		20480,
		37057,
		37249,
		20800,
		37633,
		21440,
		21120,
		37441,
		38401,
		22208,
		22400,
		38721,
		21760,
		38337,
		38017,
		21568,
		39937,
		23744,
		23936,
		40257,
		24320,
		40897,
		40577,
		24128,
		23040,
		39617,
		39809,
		23360,
		39169,
		22976,
		22656,
		38977,
		34817,
		18624,
		18816,
		35137,
		19200,
		35777,
		35457,
		19008,
		19968,
		36545,
		36737,
		20288,
		36097,
		19904,
		19584,
		35905,
		17408,
		33985,
		34177,
		17728,
		34561,
		18368,
		18048,
		34369,
		33281,
		17088,
		17280,
		33601,
		16640,
		33217,
		32897,
		16448
	], typeof Int32Array < "u" && (Yt = new Int32Array(Yt)), Xt = Ft("crc-16", function(e, t) {
		Jt.Buffer.isBuffer(e) || (e = Nt(e));
		let n = ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = (Yt[(n ^ r) & 255] ^ n >> 8) & 65535;
		}
		return n;
	});
})), Qt, $t, en, tn = o((() => {
	Qt = jt(), Pt(), It(), $t = [
		0,
		4129,
		8258,
		12387,
		16516,
		20645,
		24774,
		28903,
		33032,
		37161,
		41290,
		45419,
		49548,
		53677,
		57806,
		61935,
		4657,
		528,
		12915,
		8786,
		21173,
		17044,
		29431,
		25302,
		37689,
		33560,
		45947,
		41818,
		54205,
		50076,
		62463,
		58334,
		9314,
		13379,
		1056,
		5121,
		25830,
		29895,
		17572,
		21637,
		42346,
		46411,
		34088,
		38153,
		58862,
		62927,
		50604,
		54669,
		13907,
		9842,
		5649,
		1584,
		30423,
		26358,
		22165,
		18100,
		46939,
		42874,
		38681,
		34616,
		63455,
		59390,
		55197,
		51132,
		18628,
		22757,
		26758,
		30887,
		2112,
		6241,
		10242,
		14371,
		51660,
		55789,
		59790,
		63919,
		35144,
		39273,
		43274,
		47403,
		23285,
		19156,
		31415,
		27286,
		6769,
		2640,
		14899,
		10770,
		56317,
		52188,
		64447,
		60318,
		39801,
		35672,
		47931,
		43802,
		27814,
		31879,
		19684,
		23749,
		11298,
		15363,
		3168,
		7233,
		60846,
		64911,
		52716,
		56781,
		44330,
		48395,
		36200,
		40265,
		32407,
		28342,
		24277,
		20212,
		15891,
		11826,
		7761,
		3696,
		65439,
		61374,
		57309,
		53244,
		48923,
		44858,
		40793,
		36728,
		37256,
		33193,
		45514,
		41451,
		53516,
		49453,
		61774,
		57711,
		4224,
		161,
		12482,
		8419,
		20484,
		16421,
		28742,
		24679,
		33721,
		37784,
		41979,
		46042,
		49981,
		54044,
		58239,
		62302,
		689,
		4752,
		8947,
		13010,
		16949,
		21012,
		25207,
		29270,
		46570,
		42443,
		38312,
		34185,
		62830,
		58703,
		54572,
		50445,
		13538,
		9411,
		5280,
		1153,
		29798,
		25671,
		21540,
		17413,
		42971,
		47098,
		34713,
		38840,
		59231,
		63358,
		50973,
		55100,
		9939,
		14066,
		1681,
		5808,
		26199,
		30326,
		17941,
		22068,
		55628,
		51565,
		63758,
		59695,
		39368,
		35305,
		47498,
		43435,
		22596,
		18533,
		30726,
		26663,
		6336,
		2273,
		14466,
		10403,
		52093,
		56156,
		60223,
		64286,
		35833,
		39896,
		43963,
		48026,
		19061,
		23124,
		27191,
		31254,
		2801,
		6864,
		10931,
		14994,
		64814,
		60687,
		56684,
		52557,
		48554,
		44427,
		40424,
		36297,
		31782,
		27655,
		23652,
		19525,
		15522,
		11395,
		7392,
		3265,
		61215,
		65342,
		53085,
		57212,
		44955,
		49082,
		36825,
		40952,
		28183,
		32310,
		20053,
		24180,
		11923,
		16050,
		3793,
		7920
	], typeof Int32Array < "u" && ($t = new Int32Array($t)), en = Ft("ccitt", function(e, t) {
		Qt.Buffer.isBuffer(e) || (e = Nt(e));
		let n = t === void 0 ? 65535 : ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = ($t[(n >> 8 ^ r) & 255] ^ n << 8) & 65535;
		}
		return n;
	});
})), nn, rn, an, on = o((() => {
	nn = jt(), Pt(), It(), rn = [
		0,
		49345,
		49537,
		320,
		49921,
		960,
		640,
		49729,
		50689,
		1728,
		1920,
		51009,
		1280,
		50625,
		50305,
		1088,
		52225,
		3264,
		3456,
		52545,
		3840,
		53185,
		52865,
		3648,
		2560,
		51905,
		52097,
		2880,
		51457,
		2496,
		2176,
		51265,
		55297,
		6336,
		6528,
		55617,
		6912,
		56257,
		55937,
		6720,
		7680,
		57025,
		57217,
		8e3,
		56577,
		7616,
		7296,
		56385,
		5120,
		54465,
		54657,
		5440,
		55041,
		6080,
		5760,
		54849,
		53761,
		4800,
		4992,
		54081,
		4352,
		53697,
		53377,
		4160,
		61441,
		12480,
		12672,
		61761,
		13056,
		62401,
		62081,
		12864,
		13824,
		63169,
		63361,
		14144,
		62721,
		13760,
		13440,
		62529,
		15360,
		64705,
		64897,
		15680,
		65281,
		16320,
		16e3,
		65089,
		64001,
		15040,
		15232,
		64321,
		14592,
		63937,
		63617,
		14400,
		10240,
		59585,
		59777,
		10560,
		60161,
		11200,
		10880,
		59969,
		60929,
		11968,
		12160,
		61249,
		11520,
		60865,
		60545,
		11328,
		58369,
		9408,
		9600,
		58689,
		9984,
		59329,
		59009,
		9792,
		8704,
		58049,
		58241,
		9024,
		57601,
		8640,
		8320,
		57409,
		40961,
		24768,
		24960,
		41281,
		25344,
		41921,
		41601,
		25152,
		26112,
		42689,
		42881,
		26432,
		42241,
		26048,
		25728,
		42049,
		27648,
		44225,
		44417,
		27968,
		44801,
		28608,
		28288,
		44609,
		43521,
		27328,
		27520,
		43841,
		26880,
		43457,
		43137,
		26688,
		30720,
		47297,
		47489,
		31040,
		47873,
		31680,
		31360,
		47681,
		48641,
		32448,
		32640,
		48961,
		32e3,
		48577,
		48257,
		31808,
		46081,
		29888,
		30080,
		46401,
		30464,
		47041,
		46721,
		30272,
		29184,
		45761,
		45953,
		29504,
		45313,
		29120,
		28800,
		45121,
		20480,
		37057,
		37249,
		20800,
		37633,
		21440,
		21120,
		37441,
		38401,
		22208,
		22400,
		38721,
		21760,
		38337,
		38017,
		21568,
		39937,
		23744,
		23936,
		40257,
		24320,
		40897,
		40577,
		24128,
		23040,
		39617,
		39809,
		23360,
		39169,
		22976,
		22656,
		38977,
		34817,
		18624,
		18816,
		35137,
		19200,
		35777,
		35457,
		19008,
		19968,
		36545,
		36737,
		20288,
		36097,
		19904,
		19584,
		35905,
		17408,
		33985,
		34177,
		17728,
		34561,
		18368,
		18048,
		34369,
		33281,
		17088,
		17280,
		33601,
		16640,
		33217,
		32897,
		16448
	], typeof Int32Array < "u" && (rn = new Int32Array(rn)), an = Ft("crc-16-modbus", function(e, t) {
		nn.Buffer.isBuffer(e) || (e = Nt(e));
		let n = t === void 0 ? 65535 : ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = (rn[(n ^ r) & 255] ^ n >> 8) & 65535;
		}
		return n;
	});
})), sn, cn, ln = o((() => {
	sn = jt(), Pt(), It(), cn = Ft("xmodem", function(e, t) {
		sn.Buffer.isBuffer(e) || (e = Nt(e));
		let n = t === void 0 ? 0 : ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t], i = n >>> 8 & 255;
			i ^= r & 255, i ^= i >>> 4, n = n << 8 & 65535, n ^= i, i = i << 5 & 65535, n ^= i, i = i << 7 & 65535, n ^= i;
		}
		return n;
	});
})), un, dn, fn, pn = o((() => {
	un = jt(), Pt(), It(), dn = [
		0,
		4489,
		8978,
		12955,
		17956,
		22445,
		25910,
		29887,
		35912,
		40385,
		44890,
		48851,
		51820,
		56293,
		59774,
		63735,
		4225,
		264,
		13203,
		8730,
		22181,
		18220,
		30135,
		25662,
		40137,
		36160,
		49115,
		44626,
		56045,
		52068,
		63999,
		59510,
		8450,
		12427,
		528,
		5017,
		26406,
		30383,
		17460,
		21949,
		44362,
		48323,
		36440,
		40913,
		60270,
		64231,
		51324,
		55797,
		12675,
		8202,
		4753,
		792,
		30631,
		26158,
		21685,
		17724,
		48587,
		44098,
		40665,
		36688,
		64495,
		60006,
		55549,
		51572,
		16900,
		21389,
		24854,
		28831,
		1056,
		5545,
		10034,
		14011,
		52812,
		57285,
		60766,
		64727,
		34920,
		39393,
		43898,
		47859,
		21125,
		17164,
		29079,
		24606,
		5281,
		1320,
		14259,
		9786,
		57037,
		53060,
		64991,
		60502,
		39145,
		35168,
		48123,
		43634,
		25350,
		29327,
		16404,
		20893,
		9506,
		13483,
		1584,
		6073,
		61262,
		65223,
		52316,
		56789,
		43370,
		47331,
		35448,
		39921,
		29575,
		25102,
		20629,
		16668,
		13731,
		9258,
		5809,
		1848,
		65487,
		60998,
		56541,
		52564,
		47595,
		43106,
		39673,
		35696,
		33800,
		38273,
		42778,
		46739,
		49708,
		54181,
		57662,
		61623,
		2112,
		6601,
		11090,
		15067,
		20068,
		24557,
		28022,
		31999,
		38025,
		34048,
		47003,
		42514,
		53933,
		49956,
		61887,
		57398,
		6337,
		2376,
		15315,
		10842,
		24293,
		20332,
		32247,
		27774,
		42250,
		46211,
		34328,
		38801,
		58158,
		62119,
		49212,
		53685,
		10562,
		14539,
		2640,
		7129,
		28518,
		32495,
		19572,
		24061,
		46475,
		41986,
		38553,
		34576,
		62383,
		57894,
		53437,
		49460,
		14787,
		10314,
		6865,
		2904,
		32743,
		28270,
		23797,
		19836,
		50700,
		55173,
		58654,
		62615,
		32808,
		37281,
		41786,
		45747,
		19012,
		23501,
		26966,
		30943,
		3168,
		7657,
		12146,
		16123,
		54925,
		50948,
		62879,
		58390,
		37033,
		33056,
		46011,
		41522,
		23237,
		19276,
		31191,
		26718,
		7393,
		3432,
		16371,
		11898,
		59150,
		63111,
		50204,
		54677,
		41258,
		45219,
		33336,
		37809,
		27462,
		31439,
		18516,
		23005,
		11618,
		15595,
		3696,
		8185,
		63375,
		58886,
		54429,
		50452,
		45483,
		40994,
		37561,
		33584,
		31687,
		27214,
		22741,
		18780,
		15843,
		11370,
		7921,
		3960
	], typeof Int32Array < "u" && (dn = new Int32Array(dn)), fn = Ft("kermit", function(e, t) {
		un.Buffer.isBuffer(e) || (e = Nt(e));
		let n = t === void 0 ? 0 : ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = (dn[(n ^ r) & 255] ^ n >> 8) & 65535;
		}
		return n;
	});
})), mn, hn, gn, _n = o((() => {
	mn = jt(), Pt(), It(), hn = [
		0,
		8801531,
		9098509,
		825846,
		9692897,
		1419802,
		1651692,
		10452759,
		10584377,
		2608578,
		2839604,
		11344079,
		3303384,
		11807523,
		12104405,
		4128302,
		12930697,
		4391538,
		5217156,
		13227903,
		5679208,
		13690003,
		14450021,
		5910942,
		6606768,
		14844747,
		15604413,
		6837830,
		16197969,
		7431594,
		8256604,
		16494759,
		840169,
		9084178,
		8783076,
		18463,
		10434312,
		1670131,
		1434117,
		9678590,
		11358416,
		2825259,
		2590173,
		10602790,
		4109873,
		12122826,
		11821884,
		3289031,
		13213536,
		5231515,
		4409965,
		12912278,
		5929345,
		14431610,
		13675660,
		5693559,
		6823513,
		15618722,
		14863188,
		6588335,
		16513208,
		8238147,
		7417269,
		16212302,
		1680338,
		10481449,
		9664223,
		1391140,
		9061683,
		788936,
		36926,
		8838341,
		12067563,
		4091408,
		3340262,
		11844381,
		2868234,
		11372785,
		10555655,
		2579964,
		14478683,
		5939616,
		5650518,
		13661357,
		5180346,
		13190977,
		12967607,
		4428364,
		8219746,
		16457881,
		16234863,
		7468436,
		15633027,
		6866552,
		6578062,
		14816117,
		1405499,
		9649856,
		10463030,
		1698765,
		8819930,
		55329,
		803287,
		9047340,
		11858690,
		3325945,
		4072975,
		12086004,
		2561507,
		10574104,
		11387118,
		2853909,
		13647026,
		5664841,
		5958079,
		14460228,
		4446803,
		12949160,
		13176670,
		5194661,
		7454091,
		16249200,
		16476294,
		8201341,
		14834538,
		6559633,
		6852199,
		15647388,
		3360676,
		11864927,
		12161705,
		4185682,
		10527045,
		2551230,
		2782280,
		11286707,
		9619101,
		1346150,
		1577872,
		10379115,
		73852,
		8875143,
		9172337,
		899466,
		16124205,
		7357910,
		8182816,
		16421083,
		6680524,
		14918455,
		15678145,
		6911546,
		5736468,
		13747439,
		14507289,
		5968354,
		12873461,
		4334094,
		5159928,
		13170435,
		4167245,
		12180150,
		11879232,
		3346363,
		11301036,
		2767959,
		2532769,
		10545498,
		10360692,
		1596303,
		1360505,
		9604738,
		913813,
		9157998,
		8856728,
		92259,
		16439492,
		8164415,
		7343561,
		16138546,
		6897189,
		15692510,
		14936872,
		6662099,
		5986813,
		14488838,
		13733104,
		5750795,
		13156124,
		5174247,
		4352529,
		12855018,
		2810998,
		11315341,
		10498427,
		2522496,
		12124823,
		4148844,
		3397530,
		11901793,
		9135439,
		862644,
		110658,
		8912057,
		1606574,
		10407765,
		9590435,
		1317464,
		15706879,
		6940164,
		6651890,
		14889737,
		8145950,
		16384229,
		16161043,
		7394792,
		5123014,
		13133629,
		12910283,
		4370992,
		14535975,
		5997020,
		5707818,
		13718737,
		2504095,
		10516836,
		11329682,
		2796649,
		11916158,
		3383173,
		4130419,
		12143240,
		8893606,
		129117,
		876971,
		9121104,
		1331783,
		9576124,
		10389322,
		1625009,
		14908182,
		6633453,
		6925851,
		15721184,
		7380471,
		16175372,
		16402682,
		8127489,
		4389423,
		12891860,
		13119266,
		5137369,
		13704398,
		5722165,
		6015427,
		14517560
	], typeof Int32Array < "u" && (hn = new Int32Array(hn)), gn = Ft("crc-24", function(e, t) {
		mn.Buffer.isBuffer(e) || (e = Nt(e));
		let n = t === void 0 ? 11994318 : ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = (hn[(n >> 16 ^ r) & 255] ^ n << 8) & 16777215;
		}
		return n;
	});
})), vn, yn, bn, xn = o((() => {
	vn = jt(), Pt(), It(), yn = [
		0,
		1996959894,
		3993919788,
		2567524794,
		124634137,
		1886057615,
		3915621685,
		2657392035,
		249268274,
		2044508324,
		3772115230,
		2547177864,
		162941995,
		2125561021,
		3887607047,
		2428444049,
		498536548,
		1789927666,
		4089016648,
		2227061214,
		450548861,
		1843258603,
		4107580753,
		2211677639,
		325883990,
		1684777152,
		4251122042,
		2321926636,
		335633487,
		1661365465,
		4195302755,
		2366115317,
		997073096,
		1281953886,
		3579855332,
		2724688242,
		1006888145,
		1258607687,
		3524101629,
		2768942443,
		901097722,
		1119000684,
		3686517206,
		2898065728,
		853044451,
		1172266101,
		3705015759,
		2882616665,
		651767980,
		1373503546,
		3369554304,
		3218104598,
		565507253,
		1454621731,
		3485111705,
		3099436303,
		671266974,
		1594198024,
		3322730930,
		2970347812,
		795835527,
		1483230225,
		3244367275,
		3060149565,
		1994146192,
		31158534,
		2563907772,
		4023717930,
		1907459465,
		112637215,
		2680153253,
		3904427059,
		2013776290,
		251722036,
		2517215374,
		3775830040,
		2137656763,
		141376813,
		2439277719,
		3865271297,
		1802195444,
		476864866,
		2238001368,
		4066508878,
		1812370925,
		453092731,
		2181625025,
		4111451223,
		1706088902,
		314042704,
		2344532202,
		4240017532,
		1658658271,
		366619977,
		2362670323,
		4224994405,
		1303535960,
		984961486,
		2747007092,
		3569037538,
		1256170817,
		1037604311,
		2765210733,
		3554079995,
		1131014506,
		879679996,
		2909243462,
		3663771856,
		1141124467,
		855842277,
		2852801631,
		3708648649,
		1342533948,
		654459306,
		3188396048,
		3373015174,
		1466479909,
		544179635,
		3110523913,
		3462522015,
		1591671054,
		702138776,
		2966460450,
		3352799412,
		1504918807,
		783551873,
		3082640443,
		3233442989,
		3988292384,
		2596254646,
		62317068,
		1957810842,
		3939845945,
		2647816111,
		81470997,
		1943803523,
		3814918930,
		2489596804,
		225274430,
		2053790376,
		3826175755,
		2466906013,
		167816743,
		2097651377,
		4027552580,
		2265490386,
		503444072,
		1762050814,
		4150417245,
		2154129355,
		426522225,
		1852507879,
		4275313526,
		2312317920,
		282753626,
		1742555852,
		4189708143,
		2394877945,
		397917763,
		1622183637,
		3604390888,
		2714866558,
		953729732,
		1340076626,
		3518719985,
		2797360999,
		1068828381,
		1219638859,
		3624741850,
		2936675148,
		906185462,
		1090812512,
		3747672003,
		2825379669,
		829329135,
		1181335161,
		3412177804,
		3160834842,
		628085408,
		1382605366,
		3423369109,
		3138078467,
		570562233,
		1426400815,
		3317316542,
		2998733608,
		733239954,
		1555261956,
		3268935591,
		3050360625,
		752459403,
		1541320221,
		2607071920,
		3965973030,
		1969922972,
		40735498,
		2617837225,
		3943577151,
		1913087877,
		83908371,
		2512341634,
		3803740692,
		2075208622,
		213261112,
		2463272603,
		3855990285,
		2094854071,
		198958881,
		2262029012,
		4057260610,
		1759359992,
		534414190,
		2176718541,
		4139329115,
		1873836001,
		414664567,
		2282248934,
		4279200368,
		1711684554,
		285281116,
		2405801727,
		4167216745,
		1634467795,
		376229701,
		2685067896,
		3608007406,
		1308918612,
		956543938,
		2808555105,
		3495958263,
		1231636301,
		1047427035,
		2932959818,
		3654703836,
		1088359270,
		936918e3,
		2847714899,
		3736837829,
		1202900863,
		817233897,
		3183342108,
		3401237130,
		1404277552,
		615818150,
		3134207493,
		3453421203,
		1423857449,
		601450431,
		3009837614,
		3294710456,
		1567103746,
		711928724,
		3020668471,
		3272380065,
		1510334235,
		755167117
	], typeof Int32Array < "u" && (yn = new Int32Array(yn)), bn = Ft("crc-32", function(e, t) {
		vn.Buffer.isBuffer(e) || (e = Nt(e));
		let n = t === 0 ? 0 : ~~t ^ -1;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = yn[(n ^ r) & 255] ^ n >>> 8;
		}
		return n ^ -1;
	});
})), Sn, Cn, wn, Tn = o((() => {
	Sn = jt(), Pt(), It(), Cn = [
		0,
		1996959894,
		3993919788,
		2567524794,
		124634137,
		1886057615,
		3915621685,
		2657392035,
		249268274,
		2044508324,
		3772115230,
		2547177864,
		162941995,
		2125561021,
		3887607047,
		2428444049,
		498536548,
		1789927666,
		4089016648,
		2227061214,
		450548861,
		1843258603,
		4107580753,
		2211677639,
		325883990,
		1684777152,
		4251122042,
		2321926636,
		335633487,
		1661365465,
		4195302755,
		2366115317,
		997073096,
		1281953886,
		3579855332,
		2724688242,
		1006888145,
		1258607687,
		3524101629,
		2768942443,
		901097722,
		1119000684,
		3686517206,
		2898065728,
		853044451,
		1172266101,
		3705015759,
		2882616665,
		651767980,
		1373503546,
		3369554304,
		3218104598,
		565507253,
		1454621731,
		3485111705,
		3099436303,
		671266974,
		1594198024,
		3322730930,
		2970347812,
		795835527,
		1483230225,
		3244367275,
		3060149565,
		1994146192,
		31158534,
		2563907772,
		4023717930,
		1907459465,
		112637215,
		2680153253,
		3904427059,
		2013776290,
		251722036,
		2517215374,
		3775830040,
		2137656763,
		141376813,
		2439277719,
		3865271297,
		1802195444,
		476864866,
		2238001368,
		4066508878,
		1812370925,
		453092731,
		2181625025,
		4111451223,
		1706088902,
		314042704,
		2344532202,
		4240017532,
		1658658271,
		366619977,
		2362670323,
		4224994405,
		1303535960,
		984961486,
		2747007092,
		3569037538,
		1256170817,
		1037604311,
		2765210733,
		3554079995,
		1131014506,
		879679996,
		2909243462,
		3663771856,
		1141124467,
		855842277,
		2852801631,
		3708648649,
		1342533948,
		654459306,
		3188396048,
		3373015174,
		1466479909,
		544179635,
		3110523913,
		3462522015,
		1591671054,
		702138776,
		2966460450,
		3352799412,
		1504918807,
		783551873,
		3082640443,
		3233442989,
		3988292384,
		2596254646,
		62317068,
		1957810842,
		3939845945,
		2647816111,
		81470997,
		1943803523,
		3814918930,
		2489596804,
		225274430,
		2053790376,
		3826175755,
		2466906013,
		167816743,
		2097651377,
		4027552580,
		2265490386,
		503444072,
		1762050814,
		4150417245,
		2154129355,
		426522225,
		1852507879,
		4275313526,
		2312317920,
		282753626,
		1742555852,
		4189708143,
		2394877945,
		397917763,
		1622183637,
		3604390888,
		2714866558,
		953729732,
		1340076626,
		3518719985,
		2797360999,
		1068828381,
		1219638859,
		3624741850,
		2936675148,
		906185462,
		1090812512,
		3747672003,
		2825379669,
		829329135,
		1181335161,
		3412177804,
		3160834842,
		628085408,
		1382605366,
		3423369109,
		3138078467,
		570562233,
		1426400815,
		3317316542,
		2998733608,
		733239954,
		1555261956,
		3268935591,
		3050360625,
		752459403,
		1541320221,
		2607071920,
		3965973030,
		1969922972,
		40735498,
		2617837225,
		3943577151,
		1913087877,
		83908371,
		2512341634,
		3803740692,
		2075208622,
		213261112,
		2463272603,
		3855990285,
		2094854071,
		198958881,
		2262029012,
		4057260610,
		1759359992,
		534414190,
		2176718541,
		4139329115,
		1873836001,
		414664567,
		2282248934,
		4279200368,
		1711684554,
		285281116,
		2405801727,
		4167216745,
		1634467795,
		376229701,
		2685067896,
		3608007406,
		1308918612,
		956543938,
		2808555105,
		3495958263,
		1231636301,
		1047427035,
		2932959818,
		3654703836,
		1088359270,
		936918e3,
		2847714899,
		3736837829,
		1202900863,
		817233897,
		3183342108,
		3401237130,
		1404277552,
		615818150,
		3134207493,
		3453421203,
		1423857449,
		601450431,
		3009837614,
		3294710456,
		1567103746,
		711928724,
		3020668471,
		3272380065,
		1510334235,
		755167117
	], typeof Int32Array < "u" && (Cn = new Int32Array(Cn)), wn = Ft("jam", function(e, t = -1) {
		Sn.Buffer.isBuffer(e) || (e = Nt(e));
		let n = t === 0 ? 0 : ~~t;
		for (let t = 0; t < e.length; t++) {
			let r = e[t];
			n = Cn[(n ^ r) & 255] ^ n >>> 8;
		}
		return n;
	});
})), En = /* @__PURE__ */ c({
	crc1: () => Rt,
	crc16: () => Xt,
	crc16ccitt: () => en,
	crc16kermit: () => fn,
	crc16modbus: () => an,
	crc16xmodem: () => cn,
	crc24: () => gn,
	crc32: () => bn,
	crc8: () => Ht,
	crc81wire: () => Kt,
	crcjam: () => wn,
	default: () => Dn
}), Dn, On = o((() => {
	zt(), Ut(), qt(), Zt(), tn(), on(), ln(), pn(), _n(), xn(), Tn(), Dn = {
		crc1: Rt,
		crc8: Ht,
		crc81wire: Kt,
		crc16: Xt,
		crc16ccitt: en,
		crc16modbus: an,
		crc16xmodem: cn,
		crc16kermit: fn,
		crc24: gn,
		crc32: bn,
		crcjam: wn
	};
})), kn = /* @__PURE__ */ s(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.bufferXOR = e.setDifference = e.arrayContains = e.arraysEqual = e.hasPrefix = e.isURType = e.intToBytes = e.toUint32 = e.getCRCHex = e.getCRC = e.split = e.partition = e.sha256Hash = void 0;
	var n = t(At()), r = (On(), d(En));
	e.sha256Hash = (e) => n.default("sha256").update(e).digest(), e.partition = (e, t) => e.match(RegExp(".{1," + t + "}", "g")) || [e], e.split = (e, t) => [e.slice(0, -t), e.slice(-t)], e.getCRC = (e) => r.crc32(e), e.getCRCHex = (e) => r.crc32(e).toString(16).padStart(8, "0"), e.toUint32 = (e) => e >>> 0, e.intToBytes = (e) => {
		let t = /* @__PURE__ */ new ArrayBuffer(4);
		return new DataView(t).setUint32(0, e, !1), Buffer.from(t);
	}, e.isURType = (e) => e.split("").every((t, n) => {
		let r = e.charCodeAt(n);
		return 97 <= r && r <= 122 || 48 <= r && r <= 57 || r === 45;
	}), e.hasPrefix = (e, t) => e.indexOf(t) === 0, e.arraysEqual = (e, t) => e.length === t.length && e.every((e) => t.includes(e)), e.arrayContains = (e, t) => t.every((t) => e.includes(t)), e.setDifference = (e, t) => e.filter((e) => t.indexOf(e) < 0), e.bufferXOR = (e, t) => {
		let n = Math.max(e.length, t.length), r = Buffer.allocUnsafe(n);
		for (let i = 0; i < n; ++i) r[i] = e[i] ^ t[i];
		return r;
	};
})), An = /* @__PURE__ */ s(((e, t) => {
	(function(e, n) {
		typeof define == "function" && define.amd ? define([], n) : t !== void 0 && t.exports ? t.exports = n() : e.CBOR = n();
	})(e, function() {
		var e = (function() {
			function e(e) {
				this.$hex = e;
			}
			e.prototype = {
				length: function() {
					return this.$hex.length / 2;
				},
				toString: function(e) {
					if (!e || e === "hex" || e === 16) return this.$hex;
					if (e === "utf-8") {
						for (var t = "", n = 0; n < this.$hex.length; n += 2) t += "%" + this.$hex.substring(n, n + 2);
						return decodeURIComponent(t);
					}
					if (e === "latin") {
						for (var t = [], n = 0; n < this.$hex.length; n += 2) t.push(parseInt(this.$hex.substring(n, n + 2), 16));
						return String.fromCharCode.apply(String, t);
					}
					throw Error("Unrecognised format: " + e);
				}
			}, e.fromLatinString = function(t) {
				for (var n = "", r = 0; r < t.length; r++) {
					var i = t.charCodeAt(r).toString(16);
					i.length === 1 && (i = "0" + i), n += i;
				}
				return new e(n);
			}, e.fromUtf8String = function(t) {
				for (var n = encodeURIComponent(t), r = "", i = 0; i < n.length; i++) if (n.charAt(i) === "%") r += n.substring(i + 1, i + 3), i += 2;
				else {
					var a = n.charCodeAt(i).toString(16);
					a.length < 2 && (a = "0" + a), r += a;
				}
				return new e(r);
			};
			var t = [], n = {}, r = function(e) {
				return function() {
					throw Error(e + " not implemented");
				};
			};
			function i() {}
			i.prototype = {
				peekByte: r("peekByte"),
				readByte: r("readByte"),
				readChunk: r("readChunk"),
				readFloat16: function() {
					var e = this.readUint16(), t = (e & 32767) >> 10, n = e & 1023, r = e & 32768;
					if (t === 31) return n === 0 ? r ? -Infinity : Infinity : NaN;
					var i = t ? 2 ** (t - 25) * (1024 + n) : 2 ** -24 * n;
					return r ? -i : i;
				},
				readFloat32: function() {
					var e = this.readUint32(), t = (e & 2147483647) >> 23, n = e & 8388607, r = e & 2147483648;
					if (t === 255) return n === 0 ? r ? -Infinity : Infinity : NaN;
					var i = t ? 2 ** (t - 23 - 127) * (8388608 + n) : 2 ** -149 * n;
					return r ? -i : i;
				},
				readFloat64: function() {
					var e = this.readUint32(), t = this.readUint32(), n = e >> 20 & 2047, r = (e & 1048575) * 4294967296 + t, i = e & 2147483648;
					if (n === 2047) return r === 0 ? i ? -Infinity : Infinity : NaN;
					var a = n ? 2 ** (n - 52 - 1023) * (4503599627370496 + r) : 2 ** -1074 * r;
					return i ? -a : a;
				},
				readUint16: function() {
					return this.readByte() * 256 + this.readByte();
				},
				readUint32: function() {
					return this.readUint16() * 65536 + this.readUint16();
				},
				readUint64: function() {
					return this.readUint32() * 4294967296 + this.readUint32();
				}
			};
			function a() {}
			a.prototype = {
				writeByte: r("writeByte"),
				result: r("result"),
				writeFloat16: r("writeFloat16"),
				writeFloat32: r("writeFloat32"),
				writeFloat64: r("writeFloat64"),
				writeUint16: function(e) {
					this.writeByte(e >> 8 & 255), this.writeByte(e & 255);
				},
				writeUint32: function(e) {
					this.writeUint16(e >> 16 & 65535), this.writeUint16(e & 65535);
				},
				writeUint64: function(e) {
					if (e >= 9007199254740992 || e <= -9007199254740992) throw Error("Cannot encode Uint64 of: " + e + " magnitude to big (floating point errors)");
					this.writeUint32(Math.floor(e / 4294967296)), this.writeUint32(e % 4294967296);
				},
				writeString: r("writeString"),
				canWriteBinary: function(e) {
					return !1;
				},
				writeBinary: r("writeChunk")
			};
			function o(e) {
				var t = e.readByte();
				return {
					type: t >> 5,
					value: t & 31
				};
			}
			function s(e, t) {
				var n = e.value;
				if (n < 24) return n;
				if (n == 24) return t.readByte();
				if (n == 25) return t.readUint16();
				if (n == 26) return t.readUint32();
				if (n == 27) return t.readUint64();
				if (n == 31) return null;
				r("Additional info: " + n)();
			}
			function c(e, t, n) {
				n.writeByte(e << 5 | t);
			}
			function l(e, t, n) {
				var r = e << 5;
				t < 24 ? n.writeByte(r | t) : t < 256 ? (n.writeByte(r | 24), n.writeByte(t)) : t < 65536 ? (n.writeByte(r | 25), n.writeUint16(t)) : t < 4294967296 ? (n.writeByte(r | 26), n.writeUint32(t)) : (n.writeByte(r | 27), n.writeUint64(t));
			}
			var u = /* @__PURE__ */ Error();
			function d(e) {
				var t = o(e);
				switch (t.type) {
					case 0: return s(t, e);
					case 1: return -1 - s(t, e);
					case 2: return e.readChunk(s(t, e));
					case 3: return e.readChunk(s(t, e)).toString("utf-8");
					case 4:
					case 5:
						var r = s(t, e), i = [];
						if (r !== null) {
							t.type === 5 && (r *= 2);
							for (var a = 0; a < r; a++) i[a] = d(e);
						} else for (var c; (c = d(e)) !== u;) i.push(c);
						if (t.type === 5) {
							for (var l = {}, a = 0; a < i.length; a += 2) l[i[a]] = i[a + 1];
							return l;
						}
						return i;
					case 6:
						var f = n[s(t, e)], i = d(e);
						return f ? f(i) : i;
					case 7:
						if (t.value === 25) return e.readFloat16();
						if (t.value === 26) return e.readFloat32();
						if (t.value === 27) return e.readFloat64();
						switch (s(t, e)) {
							case 20: return !1;
							case 21: return !0;
							case 22: return null;
							case 23: return;
							case null: return u;
							default: throw Error("Unknown fixed value: " + t.value);
						}
					default: throw Error("Unsupported header: " + JSON.stringify(t));
				}
				throw Error("not implemented yet");
			}
			function f(e, n) {
				for (var r = 0; r < t.length; r++) {
					var i = t[r].fn(e);
					if (i !== void 0) return l(6, t[r].tag, n), f(i, n);
				}
				if (e && typeof e.toCBOR == "function" && (e = e.toCBOR()), e === !1) l(7, 20, n);
				else if (e === !0) l(7, 21, n);
				else if (e === null) l(7, 22, n);
				else if (e === void 0) l(7, 23, n);
				else if (typeof e == "number") Math.floor(e) === e && e < 9007199254740992 && e > -9007199254740992 ? e < 0 ? l(1, -1 - e, n) : l(0, e, n) : (c(7, 27, n), n.writeFloat64(e));
				else if (typeof e == "string") n.writeString(e, function(e) {
					l(3, e, n);
				});
				else if (n.canWriteBinary(e)) n.writeBinary(e, function(e) {
					l(2, e, n);
				});
				else if (typeof e == "object") {
					if (h.config.useToJSON && typeof e.toJSON == "function" && (e = e.toJSON()), Array.isArray(e)) {
						l(4, e.length, n);
						for (var r = 0; r < e.length; r++) f(e[r], n);
					} else {
						var a = Object.keys(e);
						l(5, a.length, n);
						for (var r = 0; r < a.length; r++) f(a[r], n), f(e[a[r]], n);
					}
				} else throw Error("CBOR encoding not supported: " + e);
			}
			var p = [], m = [], h = {
				config: { useToJSON: !0 },
				addWriter: function(e, t) {
					typeof e == "string" ? m.push(function(n) {
						if (e === n) return t(n);
					}) : m.push(e);
				},
				addReader: function(e, t) {
					typeof e == "string" ? p.push(function(n, r) {
						if (e === r) return t(n, r);
					}) : p.push(e);
				},
				encode: function(e, t) {
					for (var n = 0; n < m.length; n++) {
						var r = m[n], i = r(t);
						if (i) return f(e, i), i.result();
					}
					throw Error("Unsupported output format: " + t);
				},
				decode: function(e, t) {
					for (var n = 0; n < p.length; n++) {
						var r = p[n], i = r(e, t);
						if (i) return d(i);
					}
					throw Error("Unsupported input format: " + t);
				},
				addSemanticEncode: function(e, n) {
					if (typeof e != "number" || e % 1 != 0 || e < 0) throw Error("Tag must be a positive integer");
					return t.push({
						tag: e,
						fn: n
					}), this;
				},
				addSemanticDecode: function(e, t) {
					if (typeof e != "number" || e % 1 != 0 || e < 0) throw Error("Tag must be a positive integer");
					return n[e] = t, this;
				},
				Reader: i,
				Writer: a
			};
			function g(e) {
				this.buffer = e, this.pos = 0;
			}
			g.prototype = Object.create(i.prototype), g.prototype.peekByte = function() {
				return this.buffer[this.pos];
			}, g.prototype.readByte = function() {
				return this.buffer[this.pos++];
			}, g.prototype.readUint16 = function() {
				var e = this.buffer.readUInt16BE(this.pos);
				return this.pos += 2, e;
			}, g.prototype.readUint32 = function() {
				var e = this.buffer.readUInt32BE(this.pos);
				return this.pos += 4, e;
			}, g.prototype.readFloat32 = function() {
				var e = this.buffer.readFloatBE(this.pos);
				return this.pos += 4, e;
			}, g.prototype.readFloat64 = function() {
				var e = this.buffer.readDoubleBE(this.pos);
				return this.pos += 8, e;
			}, g.prototype.readChunk = function(e) {
				var t = Buffer.alloc(e);
				return this.buffer.copy(t, 0, this.pos, this.pos += e), t;
			};
			function _(e) {
				this.byteLength = 0, this.defaultBufferLength = 16384, this.latestBuffer = Buffer.alloc(this.defaultBufferLength), this.latestBufferOffset = 0, this.completeBuffers = [], this.stringFormat = e;
			}
			_.prototype = Object.create(a.prototype), _.prototype.writeByte = function(e) {
				this.latestBuffer[this.latestBufferOffset++] = e, this.latestBufferOffset >= this.latestBuffer.length && (this.completeBuffers.push(this.latestBuffer), this.latestBuffer = Buffer.alloc(this.defaultBufferLength), this.latestBufferOffset = 0), this.byteLength++;
			}, _.prototype.writeFloat32 = function(e) {
				var t = Buffer.alloc(4);
				t.writeFloatBE(e, 0), this.writeBuffer(t);
			}, _.prototype.writeFloat64 = function(e) {
				var t = Buffer.alloc(8);
				t.writeDoubleBE(e, 0), this.writeBuffer(t);
			}, _.prototype.writeString = function(e, t) {
				var n = Buffer.from(e, "utf-8");
				t(n.length), this.writeBuffer(n);
			}, _.prototype.canWriteBinary = function(e) {
				return e instanceof Buffer;
			}, _.prototype.writeBinary = function(e, t) {
				t(e.length), this.writeBuffer(e);
			}, _.prototype.writeBuffer = function(e) {
				if (!(e instanceof Buffer)) throw TypeError("BufferWriter only accepts Buffers");
				this.latestBufferOffset ? this.latestBuffer.length - this.latestBufferOffset >= e.length ? (e.copy(this.latestBuffer, this.latestBufferOffset), this.latestBufferOffset += e.length, this.latestBufferOffset >= this.latestBuffer.length && (this.completeBuffers.push(this.latestBuffer), this.latestBuffer = Buffer.alloc(this.defaultBufferLength), this.latestBufferOffset = 0)) : (this.completeBuffers.push(this.latestBuffer.slice(0, this.latestBufferOffset)), this.completeBuffers.push(e), this.latestBuffer = Buffer.alloc(this.defaultBufferLength), this.latestBufferOffset = 0) : this.completeBuffers.push(e), this.byteLength += e.length;
			}, _.prototype.result = function() {
				for (var e = Buffer.alloc(this.byteLength), t = 0, n = 0; n < this.completeBuffers.length; n++) {
					var r = this.completeBuffers[n];
					r.copy(e, t, 0, r.length), t += r.length;
				}
				return this.latestBufferOffset && this.latestBuffer.copy(e, t, 0, this.latestBufferOffset), this.stringFormat ? e.toString(this.stringFormat) : e;
			}, typeof Buffer == "function" && (h.addReader(function(e, t) {
				if (e instanceof Buffer) return new g(e);
				if (t === "hex" || t === "base64") return new g(Buffer.from(e, t));
			}), h.addWriter(function(e) {
				if (!e || e === "buffer") return new _();
				if (e === "hex" || e === "base64") return new _(e);
			}));
			function v(e) {
				this.hex = e, this.pos = 0;
			}
			v.prototype = Object.create(i.prototype), v.prototype.peekByte = function() {
				var e = this.hex.substring(this.pos, 2);
				return parseInt(e, 16);
			}, v.prototype.readByte = function() {
				var e = this.hex.substring(this.pos, this.pos + 2);
				return this.pos += 2, parseInt(e, 16);
			}, v.prototype.readChunk = function(t) {
				var n = this.hex.substring(this.pos, this.pos + t * 2);
				return this.pos += t * 2, typeof Buffer == "function" ? Buffer.from(n, "hex") : new e(n);
			};
			function y(e) {
				this.$hex = "", this.finalFormat = e || "hex";
			}
			return y.prototype = Object.create(a.prototype), y.prototype.writeByte = function(e) {
				if (e < 0 || e > 255) throw Error("Byte value out of range: " + e);
				var t = e.toString(16);
				t.length == 1 && (t = "0" + t), this.$hex += t;
			}, y.prototype.canWriteBinary = function(t) {
				return t instanceof e || typeof Buffer == "function" && t instanceof Buffer;
			}, y.prototype.writeBinary = function(t, n) {
				if (t instanceof e) n(t.length()), this.$hex += t.$hex;
				else if (typeof Buffer == "function" && t instanceof Buffer) n(t.length), this.$hex += t.toString("hex");
				else throw TypeError("HexWriter only accepts BinaryHex or Buffers");
			}, y.prototype.result = function() {
				return this.finalFormat === "buffer" && typeof Buffer == "function" ? Buffer.from(this.$hex, "hex") : new e(this.$hex).toString(this.finalFormat);
			}, y.prototype.writeString = function(t, n) {
				var r = e.fromUtf8String(t);
				n(r.length()), this.$hex += r.$hex;
			}, h.addReader(function(t, n) {
				if (t instanceof e || t.$hex) return new v(t.$hex);
				if (n === "hex") return new v(t);
			}), h.addWriter(function(e) {
				if (e === "hex") return new y();
			}), h;
		})();
		return e.addSemanticEncode(0, function(e) {
			if (e instanceof Date) return e.toISOString();
		}).addSemanticDecode(0, function(e) {
			return new Date(e);
		}).addSemanticDecode(1, function(e) {
			return new Date(e);
		}), e;
	});
})), jn = /* @__PURE__ */ s(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.cborDecode = e.cborEncode = void 0;
	var t = An();
	e.cborEncode = (e) => t.encode(e), e.cborDecode = (e) => t.decode(Buffer.isBuffer(e) ? e : Buffer.from(e, "hex"));
})), Mn = /* @__PURE__ */ s(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var t = we(), n = kn(), r = jn();
	e.default = class e {
		constructor(e, r = "bytes") {
			if (this._cborPayload = e, this._type = r, !n.isURType(this._type)) throw new t.InvalidTypeError();
		}
		static fromBuffer(t) {
			return new e(r.cborEncode(t));
		}
		static from(t, n) {
			return e.fromBuffer(Buffer.from(t, n));
		}
		decodeCBOR() {
			return r.cborDecode(this._cborPayload);
		}
		get type() {
			return this._type;
		}
		get cbor() {
			return this._cborPayload;
		}
		equals(e) {
			return this.type === e.type && this.cbor.equals(e.cbor);
		}
	};
})), Nn = /* @__PURE__ */ s(((e, t) => {
	var n = vt()(), r = ct()("Object.prototype.toString"), i = function(e) {
		return n && e && typeof e == "object" && Symbol.toStringTag in e ? !1 : r(e) === "[object Arguments]";
	}, a = function(e) {
		return i(e) ? !0 : typeof e == "object" && !!e && "length" in e && typeof e.length == "number" && e.length >= 0 && r(e) !== "[object Array]" && "callee" in e && r(e.callee) === "[object Function]";
	}, o = function() {
		return i(arguments);
	}();
	i.isLegacyArguments = a, t.exports = o ? i : a;
})), Pn = /* @__PURE__ */ s(((e, t) => {
	var n = ct(), r = vt()(), i = ot(), a = Ge(), o;
	if (r) {
		var s = n("RegExp.prototype.exec"), c = {}, l = function() {
			throw c;
		}, u = {
			toString: l,
			valueOf: l
		};
		typeof Symbol.toPrimitive == "symbol" && (u[Symbol.toPrimitive] = l), o = function(e) {
			if (!e || typeof e != "object") return !1;
			var t = a(e, "lastIndex");
			if (!(t && i(t, "value"))) return !1;
			try {
				s(e, u);
			} catch (e) {
				return e === c;
			}
		};
	} else {
		var d = n("Object.prototype.toString"), f = "[object RegExp]";
		o = function(e) {
			return !e || typeof e != "object" && typeof e != "function" ? !1 : d(e) === f;
		};
	}
	t.exports = o;
})), Fn = /* @__PURE__ */ s(((e, t) => {
	var n = ct(), r = Pn(), i = n("RegExp.prototype.exec"), a = Oe();
	t.exports = function(e) {
		if (!r(e)) throw new a("`regex` must be a RegExp");
		return function(t) {
			return i(e, t) !== null;
		};
	};
})), In = /* @__PURE__ */ s(((e, t) => {
	var n = function* () {}.constructor;
	t.exports = () => n;
})), Ln = /* @__PURE__ */ s(((e, t) => {
	var n = ct(), r = Fn()(/^\s*(?:function)?\*/), i = vt()(), a = at(), o = n("Object.prototype.toString"), s = n("Function.prototype.toString"), c = In();
	t.exports = function(e) {
		if (typeof e != "function") return !1;
		if (r(s(e))) return !0;
		if (!i) return o(e) === "[object GeneratorFunction]";
		if (!a) return !1;
		var t = c();
		return t && a(e) === t.prototype;
	};
})), Rn = /* @__PURE__ */ s(((e) => {
	var t = Nn(), n = Ln(), r = yt(), i = bt();
	function a(e) {
		return e.call.bind(e);
	}
	var o = typeof BigInt < "u", s = typeof Symbol < "u", c = a(Object.prototype.toString), l = a(Number.prototype.valueOf), u = a(String.prototype.valueOf), d = a(Boolean.prototype.valueOf);
	if (o) var f = a(BigInt.prototype.valueOf);
	if (s) var p = a(Symbol.prototype.valueOf);
	function m(e, t) {
		if (typeof e != "object") return !1;
		try {
			return t(e), !0;
		} catch {
			return !1;
		}
	}
	e.isArgumentsObject = t, e.isGeneratorFunction = n, e.isTypedArray = i;
	function h(e) {
		return typeof Promise < "u" && e instanceof Promise || typeof e == "object" && !!e && typeof e.then == "function" && typeof e.catch == "function";
	}
	e.isPromise = h;
	function g(e) {
		return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? ArrayBuffer.isView(e) : i(e) || z(e);
	}
	e.isArrayBufferView = g;
	function _(e) {
		return r(e) === "Uint8Array";
	}
	e.isUint8Array = _;
	function v(e) {
		return r(e) === "Uint8ClampedArray";
	}
	e.isUint8ClampedArray = v;
	function y(e) {
		return r(e) === "Uint16Array";
	}
	e.isUint16Array = y;
	function b(e) {
		return r(e) === "Uint32Array";
	}
	e.isUint32Array = b;
	function x(e) {
		return r(e) === "Int8Array";
	}
	e.isInt8Array = x;
	function S(e) {
		return r(e) === "Int16Array";
	}
	e.isInt16Array = S;
	function C(e) {
		return r(e) === "Int32Array";
	}
	e.isInt32Array = C;
	function w(e) {
		return r(e) === "Float32Array";
	}
	e.isFloat32Array = w;
	function T(e) {
		return r(e) === "Float64Array";
	}
	e.isFloat64Array = T;
	function E(e) {
		return r(e) === "BigInt64Array";
	}
	e.isBigInt64Array = E;
	function D(e) {
		return r(e) === "BigUint64Array";
	}
	e.isBigUint64Array = D;
	function O(e) {
		return c(e) === "[object Map]";
	}
	O.working = typeof Map < "u" && O(/* @__PURE__ */ new Map());
	function k(e) {
		return typeof Map > "u" ? !1 : O.working ? O(e) : e instanceof Map;
	}
	e.isMap = k;
	function A(e) {
		return c(e) === "[object Set]";
	}
	A.working = typeof Set < "u" && A(/* @__PURE__ */ new Set());
	function j(e) {
		return typeof Set > "u" ? !1 : A.working ? A(e) : e instanceof Set;
	}
	e.isSet = j;
	function M(e) {
		return c(e) === "[object WeakMap]";
	}
	M.working = typeof WeakMap < "u" && M(/* @__PURE__ */ new WeakMap());
	function N(e) {
		return typeof WeakMap > "u" ? !1 : M.working ? M(e) : e instanceof WeakMap;
	}
	e.isWeakMap = N;
	function P(e) {
		return c(e) === "[object WeakSet]";
	}
	P.working = typeof WeakSet < "u" && P(/* @__PURE__ */ new WeakSet());
	function F(e) {
		return P(e);
	}
	e.isWeakSet = F;
	function I(e) {
		return c(e) === "[object ArrayBuffer]";
	}
	I.working = typeof ArrayBuffer < "u" && I(/* @__PURE__ */ new ArrayBuffer());
	function L(e) {
		return typeof ArrayBuffer > "u" ? !1 : I.working ? I(e) : e instanceof ArrayBuffer;
	}
	e.isArrayBuffer = L;
	function R(e) {
		return c(e) === "[object DataView]";
	}
	R.working = typeof ArrayBuffer < "u" && typeof DataView < "u" && R(new DataView(/* @__PURE__ */ new ArrayBuffer(1), 0, 1));
	function z(e) {
		return typeof DataView > "u" ? !1 : R.working ? R(e) : e instanceof DataView;
	}
	e.isDataView = z;
	var B = typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : void 0;
	function V(e) {
		return c(e) === "[object SharedArrayBuffer]";
	}
	function H(e) {
		return B !== void 0 && (V.working === void 0 && (V.working = V(new B())), V.working ? V(e) : e instanceof B);
	}
	e.isSharedArrayBuffer = H;
	function U(e) {
		return c(e) === "[object AsyncFunction]";
	}
	e.isAsyncFunction = U;
	function ee(e) {
		return c(e) === "[object Map Iterator]";
	}
	e.isMapIterator = ee;
	function te(e) {
		return c(e) === "[object Set Iterator]";
	}
	e.isSetIterator = te;
	function W(e) {
		return c(e) === "[object Generator]";
	}
	e.isGeneratorObject = W;
	function G(e) {
		return c(e) === "[object WebAssembly.Module]";
	}
	e.isWebAssemblyCompiledModule = G;
	function K(e) {
		return m(e, l);
	}
	e.isNumberObject = K;
	function q(e) {
		return m(e, u);
	}
	e.isStringObject = q;
	function J(e) {
		return m(e, d);
	}
	e.isBooleanObject = J;
	function Y(e) {
		return o && m(e, f);
	}
	e.isBigIntObject = Y;
	function X(e) {
		return s && m(e, p);
	}
	e.isSymbolObject = X;
	function Z(e) {
		return K(e) || q(e) || J(e) || Y(e) || X(e);
	}
	e.isBoxedPrimitive = Z;
	function Q(e) {
		return typeof Uint8Array < "u" && (L(e) || H(e));
	}
	e.isAnyArrayBuffer = Q, [
		"isProxy",
		"isExternal",
		"isModuleNamespaceObject"
	].forEach(function(t) {
		Object.defineProperty(e, t, {
			enumerable: !1,
			value: function() {
				throw Error(t + " is not supported in userland");
			}
		});
	});
})), zn = /* @__PURE__ */ s(((e, t) => {
	t.exports = function(e) {
		return e && typeof e == "object" && typeof e.copy == "function" && typeof e.fill == "function" && typeof e.readUInt8 == "function";
	};
})), Bn = /* @__PURE__ */ s(((e) => {
	var t = Object.getOwnPropertyDescriptors || function(e) {
		for (var t = Object.keys(e), n = {}, r = 0; r < t.length; r++) n[t[r]] = Object.getOwnPropertyDescriptor(e, t[r]);
		return n;
	}, n = /%[sdj%]/g;
	e.format = function(e) {
		if (!x(e)) {
			for (var t = [], r = 0; r < arguments.length; r++) t.push(o(arguments[r]));
			return t.join(" ");
		}
		for (var r = 1, i = arguments, a = i.length, s = String(e).replace(n, function(e) {
			if (e === "%%") return "%";
			if (r >= a) return e;
			switch (e) {
				case "%s": return String(i[r++]);
				case "%d": return Number(i[r++]);
				case "%j": try {
					return JSON.stringify(i[r++]);
				} catch {
					return "[Circular]";
				}
				default: return e;
			}
		}), c = i[r]; r < a; c = i[++r]) v(c) || !T(c) ? s += " " + c : s += " " + o(c);
		return s;
	}, e.deprecate = function(t, n) {
		if (typeof process < "u" && process.noDeprecation === !0) return t;
		if (typeof process > "u") return function() {
			return e.deprecate(t, n).apply(this, arguments);
		};
		var r = !1;
		function i() {
			if (!r) {
				if (process.throwDeprecation) throw Error(n);
				process.traceDeprecation ? console.trace(n) : console.error(n), r = !0;
			}
			return t.apply(this, arguments);
		}
		return i;
	};
	var r = {}, i = /^$/;
	if (process.env.NODE_DEBUG) {
		var a = process.env.NODE_DEBUG;
		a = a.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase(), i = RegExp("^" + a + "$", "i");
	}
	e.debuglog = function(t) {
		if (t = t.toUpperCase(), !r[t]) {
			if (i.test(t)) {
				var n = process.pid;
				r[t] = function() {
					var r = e.format.apply(e, arguments);
					console.error("%s %d: %s", t, n, r);
				};
			} else r[t] = function() {};
		}
		return r[t];
	};
	function o(t, n) {
		var r = {
			seen: [],
			stylize: c
		};
		return arguments.length >= 3 && (r.depth = arguments[2]), arguments.length >= 4 && (r.colors = arguments[3]), _(n) ? r.showHidden = n : n && e._extend(r, n), C(r.showHidden) && (r.showHidden = !1), C(r.depth) && (r.depth = 2), C(r.colors) && (r.colors = !1), C(r.customInspect) && (r.customInspect = !0), r.colors && (r.stylize = s), u(r, t, r.depth);
	}
	e.inspect = o, o.colors = {
		bold: [1, 22],
		italic: [3, 23],
		underline: [4, 24],
		inverse: [7, 27],
		white: [37, 39],
		grey: [90, 39],
		black: [30, 39],
		blue: [34, 39],
		cyan: [36, 39],
		green: [32, 39],
		magenta: [35, 39],
		red: [31, 39],
		yellow: [33, 39]
	}, o.styles = {
		special: "cyan",
		number: "yellow",
		boolean: "yellow",
		undefined: "grey",
		null: "bold",
		string: "green",
		date: "magenta",
		regexp: "red"
	};
	function s(e, t) {
		var n = o.styles[t];
		return n ? "\x1B[" + o.colors[n][0] + "m" + e + "\x1B[" + o.colors[n][1] + "m" : e;
	}
	function c(e, t) {
		return e;
	}
	function l(e) {
		var t = {};
		return e.forEach(function(e, n) {
			t[e] = !0;
		}), t;
	}
	function u(t, n, r) {
		if (t.customInspect && n && O(n.inspect) && n.inspect !== e.inspect && !(n.constructor && n.constructor.prototype === n)) {
			var i = n.inspect(r, t);
			return x(i) || (i = u(t, i, r)), i;
		}
		var a = d(t, n);
		if (a) return a;
		var o = Object.keys(n), s = l(o);
		if (t.showHidden && (o = Object.getOwnPropertyNames(n)), D(n) && (o.indexOf("message") >= 0 || o.indexOf("description") >= 0)) return f(n);
		if (o.length === 0) {
			if (O(n)) {
				var c = n.name ? ": " + n.name : "";
				return t.stylize("[Function" + c + "]", "special");
			}
			if (w(n)) return t.stylize(RegExp.prototype.toString.call(n), "regexp");
			if (E(n)) return t.stylize(Date.prototype.toString.call(n), "date");
			if (D(n)) return f(n);
		}
		var _ = "", v = !1, y = ["{", "}"];
		if (g(n) && (v = !0, y = ["[", "]"]), O(n) && (_ = " [Function" + (n.name ? ": " + n.name : "") + "]"), w(n) && (_ = " " + RegExp.prototype.toString.call(n)), E(n) && (_ = " " + Date.prototype.toUTCString.call(n)), D(n) && (_ = " " + f(n)), o.length === 0 && (!v || n.length == 0)) return y[0] + _ + y[1];
		if (r < 0) return w(n) ? t.stylize(RegExp.prototype.toString.call(n), "regexp") : t.stylize("[Object]", "special");
		t.seen.push(n);
		var b = v ? p(t, n, r, s, o) : o.map(function(e) {
			return m(t, n, r, s, e, v);
		});
		return t.seen.pop(), h(b, _, y);
	}
	function d(e, t) {
		if (C(t)) return e.stylize("undefined", "undefined");
		if (x(t)) {
			var n = "'" + JSON.stringify(t).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, "\"") + "'";
			return e.stylize(n, "string");
		}
		if (b(t)) return e.stylize("" + t, "number");
		if (_(t)) return e.stylize("" + t, "boolean");
		if (v(t)) return e.stylize("null", "null");
	}
	function f(e) {
		return "[" + Error.prototype.toString.call(e) + "]";
	}
	function p(e, t, n, r, i) {
		for (var a = [], o = 0, s = t.length; o < s; ++o) P(t, String(o)) ? a.push(m(e, t, n, r, String(o), !0)) : a.push("");
		return i.forEach(function(i) {
			i.match(/^\d+$/) || a.push(m(e, t, n, r, i, !0));
		}), a;
	}
	function m(e, t, n, r, i, a) {
		var o, s, c = Object.getOwnPropertyDescriptor(t, i) || { value: t[i] };
		if (c.get ? s = c.set ? e.stylize("[Getter/Setter]", "special") : e.stylize("[Getter]", "special") : c.set && (s = e.stylize("[Setter]", "special")), P(r, i) || (o = "[" + i + "]"), s || (e.seen.indexOf(c.value) < 0 ? (s = v(n) ? u(e, c.value, null) : u(e, c.value, n - 1), s.indexOf("\n") > -1 && (s = a ? s.split("\n").map(function(e) {
			return "  " + e;
		}).join("\n").slice(2) : "\n" + s.split("\n").map(function(e) {
			return "   " + e;
		}).join("\n"))) : s = e.stylize("[Circular]", "special")), C(o)) {
			if (a && i.match(/^\d+$/)) return s;
			o = JSON.stringify("" + i), o.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (o = o.slice(1, -1), o = e.stylize(o, "name")) : (o = o.replace(/'/g, "\\'").replace(/\\"/g, "\"").replace(/(^"|"$)/g, "'"), o = e.stylize(o, "string"));
		}
		return o + ": " + s;
	}
	function h(e, t, n) {
		var r = 0;
		return e.reduce(function(e, t) {
			return r++, t.indexOf("\n") >= 0 && r++, e + t.replace(/\u001b\[\d\d?m/g, "").length + 1;
		}, 0) > 60 ? n[0] + (t === "" ? "" : t + "\n ") + " " + e.join(",\n  ") + " " + n[1] : n[0] + t + " " + e.join(", ") + " " + n[1];
	}
	e.types = Rn();
	function g(e) {
		return Array.isArray(e);
	}
	e.isArray = g;
	function _(e) {
		return typeof e == "boolean";
	}
	e.isBoolean = _;
	function v(e) {
		return e === null;
	}
	e.isNull = v;
	function y(e) {
		return e == null;
	}
	e.isNullOrUndefined = y;
	function b(e) {
		return typeof e == "number";
	}
	e.isNumber = b;
	function x(e) {
		return typeof e == "string";
	}
	e.isString = x;
	function S(e) {
		return typeof e == "symbol";
	}
	e.isSymbol = S;
	function C(e) {
		return e === void 0;
	}
	e.isUndefined = C;
	function w(e) {
		return T(e) && A(e) === "[object RegExp]";
	}
	e.isRegExp = w, e.types.isRegExp = w;
	function T(e) {
		return typeof e == "object" && !!e;
	}
	e.isObject = T;
	function E(e) {
		return T(e) && A(e) === "[object Date]";
	}
	e.isDate = E, e.types.isDate = E;
	function D(e) {
		return T(e) && (A(e) === "[object Error]" || e instanceof Error);
	}
	e.isError = D, e.types.isNativeError = D;
	function O(e) {
		return typeof e == "function";
	}
	e.isFunction = O;
	function k(e) {
		return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string" || typeof e == "symbol" || e === void 0;
	}
	e.isPrimitive = k, e.isBuffer = zn();
	function A(e) {
		return Object.prototype.toString.call(e);
	}
	function j(e) {
		return e < 10 ? "0" + e.toString(10) : e.toString(10);
	}
	var M = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	];
	function N() {
		var e = /* @__PURE__ */ new Date(), t = [
			j(e.getHours()),
			j(e.getMinutes()),
			j(e.getSeconds())
		].join(":");
		return [
			e.getDate(),
			M[e.getMonth()],
			t
		].join(" ");
	}
	e.log = function() {
		console.log("%s - %s", N(), e.format.apply(e, arguments));
	}, e.inherits = Te(), e._extend = function(e, t) {
		if (!t || !T(t)) return e;
		for (var n = Object.keys(t), r = n.length; r--;) e[n[r]] = t[n[r]];
		return e;
	};
	function P(e, t) {
		return Object.prototype.hasOwnProperty.call(e, t);
	}
	var F = typeof Symbol < "u" ? Symbol("util.promisify.custom") : void 0;
	e.promisify = function(e) {
		if (typeof e != "function") throw TypeError("The \"original\" argument must be of type Function");
		if (F && e[F]) {
			var n = e[F];
			if (typeof n != "function") throw TypeError("The \"util.promisify.custom\" argument must be of type Function");
			return Object.defineProperty(n, F, {
				value: n,
				enumerable: !1,
				writable: !1,
				configurable: !0
			}), n;
		}
		function n() {
			for (var t, n, r = new Promise(function(e, r) {
				t = e, n = r;
			}), i = [], a = 0; a < arguments.length; a++) i.push(arguments[a]);
			i.push(function(e, r) {
				e ? n(e) : t(r);
			});
			try {
				e.apply(this, i);
			} catch (e) {
				n(e);
			}
			return r;
		}
		return Object.setPrototypeOf(n, Object.getPrototypeOf(e)), F && Object.defineProperty(n, F, {
			value: n,
			enumerable: !1,
			writable: !1,
			configurable: !0
		}), Object.defineProperties(n, t(e));
	}, e.promisify.custom = F;
	function I(e, t) {
		if (!e) {
			var n = /* @__PURE__ */ Error("Promise was rejected with a falsy value");
			n.reason = e, e = n;
		}
		return t(e);
	}
	function L(e) {
		if (typeof e != "function") throw TypeError("The \"original\" argument must be of type Function");
		function n() {
			for (var t = [], n = 0; n < arguments.length; n++) t.push(arguments[n]);
			var r = t.pop();
			if (typeof r != "function") throw TypeError("The last argument must be of type Function");
			var i = this, a = function() {
				return r.apply(i, arguments);
			};
			e.apply(this, t).then(function(e) {
				process.nextTick(a.bind(null, null, e));
			}, function(e) {
				process.nextTick(I.bind(null, e, a));
			});
		}
		return Object.setPrototypeOf(n, Object.getPrototypeOf(e)), Object.defineProperties(n, t(e)), n;
	}
	e.callbackify = L;
})), Vn = /* @__PURE__ */ s(((e, t) => {
	function n(e) {
		"@babel/helpers - typeof";
		return n = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, n(e);
	}
	function r(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, a(r.key), r);
		}
	}
	function i(e, t, n) {
		return t && r(e.prototype, t), n && r(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function a(e) {
		var t = o(e, "string");
		return n(t) === "symbol" ? t : String(t);
	}
	function o(e, t) {
		if (n(e) !== "object" || e === null) return e;
		var r = e[Symbol.toPrimitive];
		if (r !== void 0) {
			var i = r.call(e, t || "default");
			if (n(i) !== "object") return i;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (t === "string" ? String : Number)(e);
	}
	function s(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function c(e, t) {
		if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
		e.prototype = Object.create(t && t.prototype, { constructor: {
			value: e,
			writable: !0,
			configurable: !0
		} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && l(e, t);
	}
	function l(e, t) {
		return l = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
			return e.__proto__ = t, e;
		}, l(e, t);
	}
	function u(e) {
		var t = p();
		return function() {
			var n = m(e), r;
			if (t) {
				var i = m(this).constructor;
				r = Reflect.construct(n, arguments, i);
			} else r = n.apply(this, arguments);
			return d(this, r);
		};
	}
	function d(e, t) {
		if (t && (n(t) === "object" || typeof t == "function")) return t;
		if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
		return f(e);
	}
	function f(e) {
		if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
		return e;
	}
	function p() {
		if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
		if (typeof Proxy == "function") return !0;
		try {
			return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {})), !0;
		} catch {
			return !1;
		}
	}
	function m(e) {
		return m = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
			return e.__proto__ || Object.getPrototypeOf(e);
		}, m(e);
	}
	var h = {}, g, _;
	function v(e, t, n) {
		n ||= Error;
		function r(e, n, r) {
			return typeof t == "string" ? t : t(e, n, r);
		}
		h[e] = /* @__PURE__ */ function(t) {
			c(a, t);
			var n = u(a);
			function a(t, i, o) {
				var c;
				return s(this, a), c = n.call(this, r(t, i, o)), c.code = e, c;
			}
			return i(a);
		}(n);
	}
	function y(e, t) {
		if (Array.isArray(e)) {
			var n = e.length;
			return e = e.map(function(e) {
				return String(e);
			}), n > 2 ? `one of ${t} ${e.slice(0, n - 1).join(", ")}, or ` + e[n - 1] : n === 2 ? `one of ${t} ${e[0]} or ${e[1]}` : `of ${t} ${e[0]}`;
		}
		return `of ${t} ${String(e)}`;
	}
	function b(e, t, n) {
		return e.substr(!n || n < 0 ? 0 : +n, t.length) === t;
	}
	function x(e, t, n) {
		return (n === void 0 || n > e.length) && (n = e.length), e.substring(n - t.length, n) === t;
	}
	function S(e, t, n) {
		return typeof n != "number" && (n = 0), n + t.length > e.length ? !1 : e.indexOf(t, n) !== -1;
	}
	v("ERR_AMBIGUOUS_ARGUMENT", "The \"%s\" argument is ambiguous. %s", TypeError), v("ERR_INVALID_ARG_TYPE", function(e, t, r) {
		g === void 0 && (g = ar()), g(typeof e == "string", "'name' must be a string");
		var i;
		typeof t == "string" && b(t, "not ") ? (i = "must not be", t = t.replace(/^not /, "")) : i = "must be";
		var a = x(e, " argument") ? `The ${e} ${i} ${y(t, "type")}` : `The "${e}" ${S(e, ".") ? "property" : "argument"} ${i} ${y(t, "type")}`;
		return a += `. Received type ${n(r)}`, a;
	}, TypeError), v("ERR_INVALID_ARG_VALUE", function(e, t) {
		var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "is invalid";
		_ === void 0 && (_ = Bn());
		var r = _.inspect(t);
		return r.length > 128 && (r = `${r.slice(0, 128)}...`), `The argument '${e}' ${n}. Received ${r}`;
	}, TypeError, RangeError), v("ERR_INVALID_RETURN_VALUE", function(e, t, r) {
		return `Expected ${e} to be returned from the "${t}" function but got ${r && r.constructor && r.constructor.name ? `instance of ${r.constructor.name}` : `type ${n(r)}`}.`;
	}, TypeError), v("ERR_MISSING_ARGS", function() {
		var e = [...arguments];
		g === void 0 && (g = ar()), g(e.length > 0, "At least one arg needs to be specified");
		var t = "The ", n = e.length;
		switch (e = e.map(function(e) {
			return `"${e}"`;
		}), n) {
			case 1:
				t += `${e[0]} argument`;
				break;
			case 2:
				t += `${e[0]} and ${e[1]} arguments`;
				break;
			default: t += e.slice(0, n - 1).join(", "), t += `, and ${e[n - 1]} arguments`;
		}
		return `${t} must be specified`;
	}, TypeError), t.exports.codes = h;
})), Hn = /* @__PURE__ */ s(((e, t) => {
	function n(e, t) {
		var n = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var r = Object.getOwnPropertySymbols(e);
			t && (r = r.filter(function(t) {
				return Object.getOwnPropertyDescriptor(e, t).enumerable;
			})), n.push.apply(n, r);
		}
		return n;
	}
	function r(e) {
		for (var t = 1; t < arguments.length; t++) {
			var r = arguments[t] == null ? {} : arguments[t];
			t % 2 ? n(Object(r), !0).forEach(function(t) {
				i(e, t, r[t]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : n(Object(r)).forEach(function(t) {
				Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(r, t));
			});
		}
		return e;
	}
	function i(e, t, n) {
		return t = c(t), t in e ? Object.defineProperty(e, t, {
			value: n,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[t] = n, e;
	}
	function a(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function o(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, c(r.key), r);
		}
	}
	function s(e, t, n) {
		return t && o(e.prototype, t), n && o(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function c(e) {
		var t = l(e, "string");
		return b(t) === "symbol" ? t : String(t);
	}
	function l(e, t) {
		if (b(e) !== "object" || e === null) return e;
		var n = e[Symbol.toPrimitive];
		if (n !== void 0) {
			var r = n.call(e, t || "default");
			if (b(r) !== "object") return r;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (t === "string" ? String : Number)(e);
	}
	function u(e, t) {
		if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
		e.prototype = Object.create(t && t.prototype, { constructor: {
			value: e,
			writable: !0,
			configurable: !0
		} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && v(e, t);
	}
	function d(e) {
		var t = g();
		return function() {
			var n = y(e), r;
			if (t) {
				var i = y(this).constructor;
				r = Reflect.construct(n, arguments, i);
			} else r = n.apply(this, arguments);
			return f(this, r);
		};
	}
	function f(e, t) {
		if (t && (b(t) === "object" || typeof t == "function")) return t;
		if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
		return p(e);
	}
	function p(e) {
		if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
		return e;
	}
	function m(e) {
		var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
		return m = function(e) {
			if (e === null || !_(e)) return e;
			if (typeof e != "function") throw TypeError("Super expression must either be null or a function");
			if (t !== void 0) {
				if (t.has(e)) return t.get(e);
				t.set(e, n);
			}
			function n() {
				return h(e, arguments, y(this).constructor);
			}
			return n.prototype = Object.create(e.prototype, { constructor: {
				value: n,
				enumerable: !1,
				writable: !0,
				configurable: !0
			} }), v(n, e);
		}, m(e);
	}
	function h(e, t, n) {
		return h = g() ? Reflect.construct.bind() : function(e, t, n) {
			var r = [null];
			r.push.apply(r, t);
			var i = new (Function.bind.apply(e, r))();
			return n && v(i, n.prototype), i;
		}, h.apply(null, arguments);
	}
	function g() {
		if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
		if (typeof Proxy == "function") return !0;
		try {
			return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {})), !0;
		} catch {
			return !1;
		}
	}
	function _(e) {
		return Function.toString.call(e).indexOf("[native code]") !== -1;
	}
	function v(e, t) {
		return v = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
			return e.__proto__ = t, e;
		}, v(e, t);
	}
	function y(e) {
		return y = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
			return e.__proto__ || Object.getPrototypeOf(e);
		}, y(e);
	}
	function b(e) {
		"@babel/helpers - typeof";
		return b = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, b(e);
	}
	var x = Bn().inspect, S = Vn().codes.ERR_INVALID_ARG_TYPE;
	function C(e, t, n) {
		return (n === void 0 || n > e.length) && (n = e.length), e.substring(n - t.length, n) === t;
	}
	function w(e, t) {
		if (t = Math.floor(t), e.length == 0 || t == 0) return "";
		var n = e.length * t;
		for (t = Math.floor(Math.log(t) / Math.log(2)); t;) e += e, t--;
		return e += e.substring(0, n - e.length), e;
	}
	var T = "", E = "", D = "", O = "", k = {
		deepStrictEqual: "Expected values to be strictly deep-equal:",
		strictEqual: "Expected values to be strictly equal:",
		strictEqualObject: "Expected \"actual\" to be reference-equal to \"expected\":",
		deepEqual: "Expected values to be loosely deep-equal:",
		equal: "Expected values to be loosely equal:",
		notDeepStrictEqual: "Expected \"actual\" not to be strictly deep-equal to:",
		notStrictEqual: "Expected \"actual\" to be strictly unequal to:",
		notStrictEqualObject: "Expected \"actual\" not to be reference-equal to \"expected\":",
		notDeepEqual: "Expected \"actual\" not to be loosely deep-equal to:",
		notEqual: "Expected \"actual\" to be loosely unequal to:",
		notIdentical: "Values identical but not reference-equal:"
	}, A = 10;
	function j(e) {
		var t = Object.keys(e), n = Object.create(Object.getPrototypeOf(e));
		return t.forEach(function(t) {
			n[t] = e[t];
		}), Object.defineProperty(n, "message", { value: e.message }), n;
	}
	function M(e) {
		return x(e, {
			compact: !1,
			customInspect: !1,
			depth: 1e3,
			maxArrayLength: Infinity,
			showHidden: !1,
			breakLength: Infinity,
			showProxy: !1,
			sorted: !0,
			getters: !0
		});
	}
	function N(e, t, n) {
		var r = "", i = "", a = 0, o = "", s = !1, c = M(e), l = c.split("\n"), u = M(t).split("\n"), d = 0, f = "";
		if (n === "strictEqual" && b(e) === "object" && b(t) === "object" && e !== null && t !== null && (n = "strictEqualObject"), l.length === 1 && u.length === 1 && l[0] !== u[0]) {
			var p = l[0].length + u[0].length;
			if (p <= A) {
				if ((b(e) !== "object" || e === null) && (b(t) !== "object" || t === null) && (e !== 0 || t !== 0)) return `${k[n]}

${l[0]} !== ${u[0]}
`;
			} else if (n !== "strictEqualObject" && p < (process.stderr && process.stderr.isTTY ? process.stderr.columns : 80)) {
				for (; l[0][d] === u[0][d];) d++;
				d > 2 && (f = `
  ${w(" ", d)}^`, d = 0);
			}
		}
		for (var m = l[l.length - 1], h = u[u.length - 1]; m === h && (d++ < 2 ? o = `
  ${m}${o}` : r = m, l.pop(), u.pop(), l.length !== 0 && u.length !== 0);) m = l[l.length - 1], h = u[u.length - 1];
		var g = Math.max(l.length, u.length);
		if (g === 0) {
			var _ = c.split("\n");
			if (_.length > 30) for (_[26] = `${T}...${O}`; _.length > 27;) _.pop();
			return `${k.notIdentical}

${_.join("\n")}
`;
		}
		d > 3 && (o = `
${T}...${O}${o}`, s = !0), r !== "" && (o = `
  ${r}${o}`, r = "");
		var v = 0, y = k[n] + `
${E}+ actual${O} ${D}- expected${O}`, x = ` ${T}...${O} Lines skipped`;
		for (d = 0; d < g; d++) {
			var S = d - a;
			if (l.length < d + 1) S > 1 && d > 2 && (S > 4 ? (i += `
${T}...${O}`, s = !0) : S > 3 && (i += `
  ${u[d - 2]}`, v++), i += `
  ${u[d - 1]}`, v++), a = d, r += `
${D}-${O} ${u[d]}`, v++;
			else if (u.length < d + 1) S > 1 && d > 2 && (S > 4 ? (i += `
${T}...${O}`, s = !0) : S > 3 && (i += `
  ${l[d - 2]}`, v++), i += `
  ${l[d - 1]}`, v++), a = d, i += `
${E}+${O} ${l[d]}`, v++;
			else {
				var j = u[d], N = l[d], P = N !== j && (!C(N, ",") || N.slice(0, -1) !== j);
				P && C(j, ",") && j.slice(0, -1) === N && (P = !1, N += ","), P ? (S > 1 && d > 2 && (S > 4 ? (i += `
${T}...${O}`, s = !0) : S > 3 && (i += `
  ${l[d - 2]}`, v++), i += `
  ${l[d - 1]}`, v++), a = d, i += `
${E}+${O} ${N}`, r += `
${D}-${O} ${j}`, v += 2) : (i += r, r = "", (S === 1 || d === 0) && (i += `
  ${N}`, v++));
			}
			if (v > 20 && d < g - 2) return `${y}${x}
${i}
${T}...${O}${r}
${T}...${O}`;
		}
		return `${y}${s ? x : ""}
${i}${r}${o}${f}`;
	}
	t.exports = /* @__PURE__ */ function(e, t) {
		u(i, e);
		var n = d(i);
		function i(e) {
			var t;
			if (a(this, i), b(e) !== "object" || e === null) throw new S("options", "Object", e);
			var r = e.message, o = e.operator, s = e.stackStartFn, c = e.actual, l = e.expected, u = Error.stackTraceLimit;
			if (Error.stackTraceLimit = 0, r != null) t = n.call(this, String(r));
			else if (process.stderr && process.stderr.isTTY && (process.stderr && process.stderr.getColorDepth && process.stderr.getColorDepth() !== 1 ? (T = "\x1B[34m", E = "\x1B[32m", O = "\x1B[39m", D = "\x1B[31m") : (T = "", E = "", O = "", D = "")), b(c) === "object" && c !== null && b(l) === "object" && l !== null && "stack" in c && c instanceof Error && "stack" in l && l instanceof Error && (c = j(c), l = j(l)), o === "deepStrictEqual" || o === "strictEqual") t = n.call(this, N(c, l, o));
			else if (o === "notDeepStrictEqual" || o === "notStrictEqual") {
				var d = k[o], m = M(c).split("\n");
				if (o === "notStrictEqual" && b(c) === "object" && c !== null && (d = k.notStrictEqualObject), m.length > 30) for (m[26] = `${T}...${O}`; m.length > 27;) m.pop();
				t = m.length === 1 ? n.call(this, `${d} ${m[0]}`) : n.call(this, `${d}

${m.join("\n")}
`);
			} else {
				var h = M(c), g = "", _ = k[o];
				o === "notDeepEqual" || o === "notEqual" ? (h = `${k[o]}

${h}`, h.length > 1024 && (h = `${h.slice(0, 1021)}...`)) : (g = `${M(l)}`, h.length > 512 && (h = `${h.slice(0, 509)}...`), g.length > 512 && (g = `${g.slice(0, 509)}...`), o === "deepEqual" || o === "equal" ? h = `${_}

${h}

should equal

` : g = ` ${o} ${g}`), t = n.call(this, `${h}${g}`);
			}
			return Error.stackTraceLimit = u, t.generatedMessage = !r, Object.defineProperty(p(t), "name", {
				value: "AssertionError [ERR_ASSERTION]",
				enumerable: !1,
				writable: !0,
				configurable: !0
			}), t.code = "ERR_ASSERTION", t.actual = c, t.expected = l, t.operator = o, Error.captureStackTrace && Error.captureStackTrace(p(t), s), t.stack, t.name = "AssertionError", f(t);
		}
		return s(i, [{
			key: "toString",
			value: function() {
				return `${this.name} [${this.code}]: ${this.message}`;
			}
		}, {
			key: t,
			value: function(e, t) {
				return x(this, r(r({}, t), {}, {
					customInspect: !1,
					depth: 0
				}));
			}
		}]), i;
	}(/*#__PURE__*/ m(Error), x.custom);
})), Un = /* @__PURE__ */ s(((e, t) => {
	var n = Object.prototype.toString;
	t.exports = function(e) {
		var t = n.call(e), r = t === "[object Arguments]";
		return r ||= t !== "[object Array]" && typeof e == "object" && !!e && typeof e.length == "number" && e.length >= 0 && n.call(e.callee) === "[object Function]", r;
	};
})), Wn = /* @__PURE__ */ s(((e, t) => {
	var n;
	if (!Object.keys) {
		var r = Object.prototype.hasOwnProperty, i = Object.prototype.toString, a = Un(), o = Object.prototype.propertyIsEnumerable, s = !o.call({ toString: null }, "toString"), c = o.call(function() {}, "prototype"), l = [
			"toString",
			"toLocaleString",
			"valueOf",
			"hasOwnProperty",
			"isPrototypeOf",
			"propertyIsEnumerable",
			"constructor"
		], u = function(e) {
			var t = e.constructor;
			return t && t.prototype === e;
		}, d = {
			$applicationCache: !0,
			$console: !0,
			$external: !0,
			$frame: !0,
			$frameElement: !0,
			$frames: !0,
			$innerHeight: !0,
			$innerWidth: !0,
			$onmozfullscreenchange: !0,
			$onmozfullscreenerror: !0,
			$outerHeight: !0,
			$outerWidth: !0,
			$pageXOffset: !0,
			$pageYOffset: !0,
			$parent: !0,
			$scrollLeft: !0,
			$scrollTop: !0,
			$scrollX: !0,
			$scrollY: !0,
			$self: !0,
			$webkitIndexedDB: !0,
			$webkitStorageInfo: !0,
			$window: !0
		}, f = function() {
			if (typeof window > "u") return !1;
			for (var e in window) try {
				if (!d["$" + e] && r.call(window, e) && window[e] !== null && typeof window[e] == "object") try {
					u(window[e]);
				} catch {
					return !0;
				}
			} catch {
				return !0;
			}
			return !1;
		}(), p = function(e) {
			if (typeof window > "u" || !f) return u(e);
			try {
				return u(e);
			} catch {
				return !1;
			}
		};
		n = function(e) {
			var t = typeof e == "object" && !!e, n = i.call(e) === "[object Function]", o = a(e), u = t && i.call(e) === "[object String]", d = [];
			if (!t && !n && !o) throw TypeError("Object.keys called on a non-object");
			var f = c && n;
			if (u && e.length > 0 && !r.call(e, 0)) for (var m = 0; m < e.length; ++m) d.push(String(m));
			if (o && e.length > 0) for (var h = 0; h < e.length; ++h) d.push(String(h));
			else for (var g in e) !(f && g === "prototype") && r.call(e, g) && d.push(String(g));
			if (s) for (var _ = p(e), v = 0; v < l.length; ++v) !(_ && l[v] === "constructor") && r.call(e, l[v]) && d.push(l[v]);
			return d;
		};
	}
	t.exports = n;
})), Gn = /* @__PURE__ */ s(((e, t) => {
	var n = Array.prototype.slice, r = Un(), i = Object.keys, a = i ? function(e) {
		return i(e);
	} : Wn(), o = Object.keys;
	a.shim = function() {
		return Object.keys ? function() {
			var e = Object.keys(arguments);
			return e && e.length === arguments.length;
		}(1, 2) || (Object.keys = function(e) {
			return r(e) ? o(n.call(e)) : o(e);
		}) : Object.keys = a, Object.keys || a;
	}, t.exports = a;
})), Kn = /* @__PURE__ */ s(((e, t) => {
	var n = Gn(), r = qe()(), i = ct(), a = ke(), o = i("Array.prototype.push"), s = i("Object.prototype.propertyIsEnumerable"), c = r ? a.getOwnPropertySymbols : null;
	t.exports = function(e, t) {
		if (e == null) throw TypeError("target must be an object");
		var i = a(e);
		if (arguments.length === 1) return i;
		for (var l = 1; l < arguments.length; ++l) {
			var u = a(arguments[l]), d = n(u), f = r && (a.getOwnPropertySymbols || c);
			if (f) for (var p = f(u), m = 0; m < p.length; ++m) {
				var h = p[m];
				s(u, h) && o(d, h);
			}
			for (var g = 0; g < d.length; ++g) {
				var _ = d[g];
				s(u, _) && (i[_] = u[_]);
			}
		}
		return i;
	};
})), qn = /* @__PURE__ */ s(((e, t) => {
	var n = Kn(), r = function() {
		if (!Object.assign) return !1;
		for (var e = "abcdefghijklmnopqrst", t = e.split(""), n = {}, r = 0; r < t.length; ++r) n[t[r]] = t[r];
		var i = Object.assign({}, n), a = "";
		for (var o in i) a += o;
		return e !== a;
	}, i = function() {
		if (!Object.assign || !Object.preventExtensions) return !1;
		var e = Object.preventExtensions({ 1: 2 });
		try {
			Object.assign(e, "xy");
		} catch {
			return e[1] === "y";
		}
		return !1;
	};
	t.exports = function() {
		return !Object.assign || r() || i() ? n : Object.assign;
	};
})), Jn = /* @__PURE__ */ s(((e, t) => {
	var n = function(e) {
		return e !== e;
	};
	t.exports = function(e, t) {
		return e === 0 && t === 0 ? 1 / e == 1 / t : !!(e === t || n(e) && n(t));
	};
})), Yn = /* @__PURE__ */ s(((e, t) => {
	var n = Jn();
	t.exports = function() {
		return typeof Object.is == "function" ? Object.is : n;
	};
})), Xn = /* @__PURE__ */ s(((e, t) => {
	var n = st(), r = _t(), i = r(n("String.prototype.indexOf"));
	t.exports = function(e, t) {
		var a = n(e, !!t);
		return typeof a == "function" && i(e, ".prototype.") > -1 ? r(a) : a;
	};
})), Zn = /* @__PURE__ */ s(((e, t) => {
	var n = Gn(), r = typeof Symbol == "function" && typeof Symbol("foo") == "symbol", i = Object.prototype.toString, a = Array.prototype.concat, o = pt(), s = function(e) {
		return typeof e == "function" && i.call(e) === "[object Function]";
	}, c = mt()(), l = function(e, t, n, r) {
		if (t in e) {
			if (r === !0) {
				if (e[t] === n) return;
			} else if (!s(r) || !r()) return;
		}
		c ? o(e, t, n, !0) : o(e, t, n);
	}, u = function(e, t) {
		var i = arguments.length > 2 ? arguments[2] : {}, o = n(t);
		r && (o = a.call(o, Object.getOwnPropertySymbols(t)));
		for (var s = 0; s < o.length; s += 1) l(e, o[s], t[o[s]], i[o[s]]);
	};
	u.supportsDescriptors = !!c, t.exports = u;
})), Qn = /* @__PURE__ */ s(((e, t) => {
	var n = Yn(), r = Zn();
	t.exports = function() {
		var e = n();
		return r(Object, { is: e }, { is: function() {
			return Object.is !== e;
		} }), e;
	};
})), $n = /* @__PURE__ */ s(((e, t) => {
	var n = Zn(), r = _t(), i = Jn(), a = Yn(), o = Qn(), s = r(a(), Object);
	n(s, {
		getPolyfill: a,
		implementation: i,
		shim: o
	}), t.exports = s;
})), er = /* @__PURE__ */ s(((e, t) => {
	t.exports = function(e) {
		return e !== e;
	};
})), tr = /* @__PURE__ */ s(((e, t) => {
	var n = er();
	t.exports = function() {
		return Number.isNaN && !Number.isNaN("a") ? Number.isNaN : n;
	};
})), nr = /* @__PURE__ */ s(((e, t) => {
	var n = Zn(), r = tr();
	t.exports = function() {
		var e = r();
		return n(Number, { isNaN: e }, { isNaN: function() {
			return Number.isNaN !== e;
		} }), e;
	};
})), rr = /* @__PURE__ */ s(((e, t) => {
	var n = _t(), r = Zn(), i = er(), a = tr(), o = nr(), s = n(a(), Number);
	r(s, {
		getPolyfill: a,
		implementation: i,
		shim: o
	}), t.exports = s;
})), ir = /* @__PURE__ */ s(((e, t) => {
	function n(e, t) {
		return s(e) || o(e, t) || i(e, t) || r();
	}
	function r() {
		throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function i(e, t) {
		if (e) {
			if (typeof e == "string") return a(e, t);
			var n = Object.prototype.toString.call(e).slice(8, -1);
			if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
			if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return a(e, t);
		}
	}
	function a(e, t) {
		(t == null || t > e.length) && (t = e.length);
		for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
		return r;
	}
	function o(e, t) {
		var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
		if (n != null) {
			var r, i, a, o, s = [], c = !0, l = !1;
			try {
				if (a = (n = n.call(e)).next, t === 0) {
					if (Object(n) !== n) return;
					c = !1;
				} else for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
			} catch (e) {
				l = !0, i = e;
			} finally {
				try {
					if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
				} finally {
					if (l) throw i;
				}
			}
			return s;
		}
	}
	function s(e) {
		if (Array.isArray(e)) return e;
	}
	function c(e) {
		"@babel/helpers - typeof";
		return c = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, c(e);
	}
	var l = /a/g.flags !== void 0, u = function(e) {
		var t = [];
		return e.forEach(function(e) {
			return t.push(e);
		}), t;
	}, d = function(e) {
		var t = [];
		return e.forEach(function(e, n) {
			return t.push([n, e]);
		}), t;
	}, f = Object.is ? Object.is : $n(), p = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols : function() {
		return [];
	}, m = Number.isNaN ? Number.isNaN : rr();
	function h(e) {
		return e.call.bind(e);
	}
	var g = h(Object.prototype.hasOwnProperty), _ = h(Object.prototype.propertyIsEnumerable), v = h(Object.prototype.toString), y = Bn().types, b = y.isAnyArrayBuffer, x = y.isArrayBufferView, S = y.isDate, C = y.isMap, w = y.isRegExp, T = y.isSet, E = y.isNativeError, D = y.isBoxedPrimitive, O = y.isNumberObject, k = y.isStringObject, A = y.isBooleanObject, j = y.isBigIntObject, M = y.isSymbolObject, N = y.isFloat32Array, P = y.isFloat64Array;
	function F(e) {
		if (e.length === 0 || e.length > 10) return !0;
		for (var t = 0; t < e.length; t++) {
			var n = e.charCodeAt(t);
			if (n < 48 || n > 57) return !0;
		}
		return e.length === 10 && e >= 2 ** 32;
	}
	function I(e) {
		return Object.keys(e).filter(F).concat(p(e).filter(Object.prototype.propertyIsEnumerable.bind(e)));
	}
	function L(e, t) {
		if (e === t) return 0;
		for (var n = e.length, r = t.length, i = 0, a = Math.min(n, r); i < a; ++i) if (e[i] !== t[i]) {
			n = e[i], r = t[i];
			break;
		}
		return n < r ? -1 : +(r < n);
	}
	var R = void 0, z = !0, B = !1, V = 0, H = 1, U = 2, ee = 3;
	function te(e, t) {
		return l ? e.source === t.source && e.flags === t.flags : RegExp.prototype.toString.call(e) === RegExp.prototype.toString.call(t);
	}
	function W(e, t) {
		if (e.byteLength !== t.byteLength) return !1;
		for (var n = 0; n < e.byteLength; n++) if (e[n] !== t[n]) return !1;
		return !0;
	}
	function G(e, t) {
		return e.byteLength === t.byteLength && L(new Uint8Array(e.buffer, e.byteOffset, e.byteLength), new Uint8Array(t.buffer, t.byteOffset, t.byteLength)) === 0;
	}
	function K(e, t) {
		return e.byteLength === t.byteLength && L(new Uint8Array(e), new Uint8Array(t)) === 0;
	}
	function q(e, t) {
		return O(e) ? O(t) && f(Number.prototype.valueOf.call(e), Number.prototype.valueOf.call(t)) : k(e) ? k(t) && String.prototype.valueOf.call(e) === String.prototype.valueOf.call(t) : A(e) ? A(t) && Boolean.prototype.valueOf.call(e) === Boolean.prototype.valueOf.call(t) : j(e) ? j(t) && BigInt.prototype.valueOf.call(e) === BigInt.prototype.valueOf.call(t) : M(t) && Symbol.prototype.valueOf.call(e) === Symbol.prototype.valueOf.call(t);
	}
	function J(e, t, n, r) {
		if (e === t) return e !== 0 || !n || f(e, t);
		if (n) {
			if (c(e) !== "object") return typeof e == "number" && m(e) && m(t);
			if (c(t) !== "object" || e === null || t === null || Object.getPrototypeOf(e) !== Object.getPrototypeOf(t)) return !1;
		} else {
			if (e === null || c(e) !== "object") return t === null || c(t) !== "object" ? e == t : !1;
			if (t === null || c(t) !== "object") return !1;
		}
		var i = v(e);
		if (i !== v(t)) return !1;
		if (Array.isArray(e)) {
			if (e.length !== t.length) return !1;
			var a = I(e, R), o = I(t, R);
			return a.length === o.length && X(e, t, n, r, H, a);
		}
		if (i === "[object Object]" && (!C(e) && C(t) || !T(e) && T(t))) return !1;
		if (S(e)) {
			if (!S(t) || Date.prototype.getTime.call(e) !== Date.prototype.getTime.call(t)) return !1;
		} else if (w(e)) {
			if (!w(t) || !te(e, t)) return !1;
		} else if (E(e) || e instanceof Error) {
			if (e.message !== t.message || e.name !== t.name) return !1;
		} else if (x(e)) {
			if (!n && (N(e) || P(e))) {
				if (!W(e, t)) return !1;
			} else if (!G(e, t)) return !1;
			var s = I(e, R), l = I(t, R);
			return s.length === l.length && X(e, t, n, r, V, s);
		} else if (T(e)) return !T(t) || e.size !== t.size ? !1 : X(e, t, n, r, U);
		else if (C(e)) return !C(t) || e.size !== t.size ? !1 : X(e, t, n, r, ee);
		else if (b(e)) {
			if (!K(e, t)) return !1;
		} else if (D(e) && !q(e, t)) return !1;
		return X(e, t, n, r, V);
	}
	function Y(e, t) {
		return t.filter(function(t) {
			return _(e, t);
		});
	}
	function X(e, t, n, r, i, a) {
		if (arguments.length === 5) {
			a = Object.keys(e);
			var o = Object.keys(t);
			if (a.length !== o.length) return !1;
		}
		for (var s = 0; s < a.length; s++) if (!g(t, a[s])) return !1;
		if (n && arguments.length === 5) {
			var c = p(e);
			if (c.length !== 0) {
				var l = 0;
				for (s = 0; s < c.length; s++) {
					var u = c[s];
					if (_(e, u)) {
						if (!_(t, u)) return !1;
						a.push(u), l++;
					} else if (_(t, u)) return !1;
				}
				var d = p(t);
				if (c.length !== d.length && Y(t, d).length !== l) return !1;
			} else {
				var f = p(t);
				if (f.length !== 0 && Y(t, f).length !== 0) return !1;
			}
		}
		if (a.length === 0 && (i === V || i === H && e.length === 0 || e.size === 0)) return !0;
		if (r === void 0) r = {
			val1: /* @__PURE__ */ new Map(),
			val2: /* @__PURE__ */ new Map(),
			position: 0
		};
		else {
			var m = r.val1.get(e);
			if (m !== void 0) {
				var h = r.val2.get(t);
				if (h !== void 0) return m === h;
			}
			r.position++;
		}
		r.val1.set(e, r.position), r.val2.set(t, r.position);
		var v = $(e, t, n, a, r, i);
		return r.val1.delete(e), r.val2.delete(t), v;
	}
	function Z(e, t, n, r) {
		for (var i = u(e), a = 0; a < i.length; a++) {
			var o = i[a];
			if (J(t, o, n, r)) return e.delete(o), !0;
		}
		return !1;
	}
	function Q(e) {
		switch (c(e)) {
			case "undefined": return null;
			case "object": return;
			case "symbol": return !1;
			case "string": e = +e;
			case "number": if (m(e)) return !1;
		}
		return !0;
	}
	function ne(e, t, n) {
		var r = Q(n);
		return r ?? (t.has(r) && !e.has(r));
	}
	function re(e, t, n, r, i) {
		var a = Q(n);
		if (a != null) return a;
		var o = t.get(a);
		return o === void 0 && !t.has(a) || !J(r, o, !1, i) ? !1 : !e.has(a) && J(r, o, !1, i);
	}
	function ie(e, t, n, r) {
		for (var i = null, a = u(e), o = 0; o < a.length; o++) {
			var s = a[o];
			if (c(s) === "object" && s !== null) i === null && (i = /* @__PURE__ */ new Set()), i.add(s);
			else if (!t.has(s)) {
				if (n || !ne(e, t, s)) return !1;
				i === null && (i = /* @__PURE__ */ new Set()), i.add(s);
			}
		}
		if (i !== null) {
			for (var l = u(t), d = 0; d < l.length; d++) {
				var f = l[d];
				if (c(f) === "object" && f !== null) {
					if (!Z(i, f, n, r)) return !1;
				} else if (!n && !e.has(f) && !Z(i, f, n, r)) return !1;
			}
			return i.size === 0;
		}
		return !0;
	}
	function ae(e, t, n, r, i, a) {
		for (var o = u(e), s = 0; s < o.length; s++) {
			var c = o[s];
			if (J(n, c, i, a) && J(r, t.get(c), i, a)) return e.delete(c), !0;
		}
		return !1;
	}
	function oe(e, t, r, i) {
		for (var a = null, o = d(e), s = 0; s < o.length; s++) {
			var l = n(o[s], 2), u = l[0], f = l[1];
			if (c(u) === "object" && u !== null) a === null && (a = /* @__PURE__ */ new Set()), a.add(u);
			else {
				var p = t.get(u);
				if (p === void 0 && !t.has(u) || !J(f, p, r, i)) {
					if (r || !re(e, t, u, f, i)) return !1;
					a === null && (a = /* @__PURE__ */ new Set()), a.add(u);
				}
			}
		}
		if (a !== null) {
			for (var m = d(t), h = 0; h < m.length; h++) {
				var g = n(m[h], 2), _ = g[0], v = g[1];
				if (c(_) === "object" && _ !== null) {
					if (!ae(a, e, _, v, r, i)) return !1;
				} else if (!r && (!e.has(_) || !J(e.get(_), v, !1, i)) && !ae(a, e, _, v, !1, i)) return !1;
			}
			return a.size === 0;
		}
		return !0;
	}
	function $(e, t, n, r, i, a) {
		var o = 0;
		if (a === U) {
			if (!ie(e, t, n, i)) return !1;
		} else if (a === ee) {
			if (!oe(e, t, n, i)) return !1;
		} else if (a === H) for (; o < e.length; o++) if (g(e, o)) {
			if (!g(t, o) || !J(e[o], t[o], n, i)) return !1;
		} else if (g(t, o)) return !1;
		else {
			for (var s = Object.keys(e); o < s.length; o++) {
				var c = s[o];
				if (!g(t, c) || !J(e[c], t[c], n, i)) return !1;
			}
			return s.length === Object.keys(t).length;
		}
		for (o = 0; o < r.length; o++) {
			var l = r[o];
			if (!J(e[l], t[l], n, i)) return !1;
		}
		return !0;
	}
	function se(e, t) {
		return J(e, t, B);
	}
	function ce(e, t) {
		return J(e, t, z);
	}
	t.exports = {
		isDeepEqual: se,
		isDeepStrictEqual: ce
	};
})), ar = /* @__PURE__ */ s(((e, t) => {
	function n(e) {
		"@babel/helpers - typeof";
		return n = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, n(e);
	}
	function r(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, a(r.key), r);
		}
	}
	function i(e, t, n) {
		return t && r(e.prototype, t), n && r(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function a(e) {
		var t = o(e, "string");
		return n(t) === "symbol" ? t : String(t);
	}
	function o(e, t) {
		if (n(e) !== "object" || e === null) return e;
		var r = e[Symbol.toPrimitive];
		if (r !== void 0) {
			var i = r.call(e, t || "default");
			if (n(i) !== "object") return i;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (t === "string" ? String : Number)(e);
	}
	function s(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	var c = Vn().codes, l = c.ERR_AMBIGUOUS_ARGUMENT, u = c.ERR_INVALID_ARG_TYPE, d = c.ERR_INVALID_ARG_VALUE, f = c.ERR_INVALID_RETURN_VALUE, p = c.ERR_MISSING_ARGS, m = Hn(), h = Bn().inspect, g = Bn().types, _ = g.isPromise, v = g.isRegExp, y = qn()(), b = Yn()(), x = Xn()("RegExp.prototype.test"), S, C;
	function w() {
		var e = ir();
		S = e.isDeepEqual, C = e.isDeepStrictEqual;
	}
	var T = !1, E = t.exports = j, D = {};
	function O(e) {
		throw e.message instanceof Error ? e.message : new m(e);
	}
	function k(e, t, n, r, i) {
		var a = arguments.length, o;
		if (a === 0 ? o = "Failed" : a === 1 ? (n = e, e = void 0) : (T === !1 && (T = !0, (process.emitWarning ? process.emitWarning : console.warn.bind(console))("assert.fail() with more than one argument is deprecated. Please use assert.strictEqual() instead or only pass a message.", "DeprecationWarning", "DEP0094")), a === 2 && (r = "!=")), n instanceof Error) throw n;
		var s = {
			actual: e,
			expected: t,
			operator: r === void 0 ? "fail" : r,
			stackStartFn: i || k
		};
		n !== void 0 && (s.message = n);
		var c = new m(s);
		throw o && (c.message = o, c.generatedMessage = !0), c;
	}
	E.fail = k, E.AssertionError = m;
	function A(e, t, n, r) {
		if (!n) {
			var i = !1;
			if (t === 0) i = !0, r = "No value argument passed to `assert.ok()`";
			else if (r instanceof Error) throw r;
			var a = new m({
				actual: n,
				expected: !0,
				message: r,
				operator: "==",
				stackStartFn: e
			});
			throw a.generatedMessage = i, a;
		}
	}
	function j() {
		var e = [...arguments];
		A.apply(void 0, [j, e.length].concat(e));
	}
	E.ok = j, E.equal = function e(t, n, r) {
		if (arguments.length < 2) throw new p("actual", "expected");
		t != n && O({
			actual: t,
			expected: n,
			message: r,
			operator: "==",
			stackStartFn: e
		});
	}, E.notEqual = function e(t, n, r) {
		if (arguments.length < 2) throw new p("actual", "expected");
		t == n && O({
			actual: t,
			expected: n,
			message: r,
			operator: "!=",
			stackStartFn: e
		});
	}, E.deepEqual = function e(t, n, r) {
		if (arguments.length < 2) throw new p("actual", "expected");
		S === void 0 && w(), S(t, n) || O({
			actual: t,
			expected: n,
			message: r,
			operator: "deepEqual",
			stackStartFn: e
		});
	}, E.notDeepEqual = function e(t, n, r) {
		if (arguments.length < 2) throw new p("actual", "expected");
		S === void 0 && w(), S(t, n) && O({
			actual: t,
			expected: n,
			message: r,
			operator: "notDeepEqual",
			stackStartFn: e
		});
	}, E.deepStrictEqual = function e(t, n, r) {
		if (arguments.length < 2) throw new p("actual", "expected");
		S === void 0 && w(), C(t, n) || O({
			actual: t,
			expected: n,
			message: r,
			operator: "deepStrictEqual",
			stackStartFn: e
		});
	}, E.notDeepStrictEqual = M;
	function M(e, t, n) {
		if (arguments.length < 2) throw new p("actual", "expected");
		S === void 0 && w(), C(e, t) && O({
			actual: e,
			expected: t,
			message: n,
			operator: "notDeepStrictEqual",
			stackStartFn: M
		});
	}
	E.strictEqual = function e(t, n, r) {
		if (arguments.length < 2) throw new p("actual", "expected");
		b(t, n) || O({
			actual: t,
			expected: n,
			message: r,
			operator: "strictEqual",
			stackStartFn: e
		});
	}, E.notStrictEqual = function e(t, n, r) {
		if (arguments.length < 2) throw new p("actual", "expected");
		b(t, n) && O({
			actual: t,
			expected: n,
			message: r,
			operator: "notStrictEqual",
			stackStartFn: e
		});
	};
	var N = /*#__PURE__*/ i(function e(t, n, r) {
		var i = this;
		s(this, e), n.forEach(function(e) {
			e in t && (i[e] = r !== void 0 && typeof r[e] == "string" && v(t[e]) && x(t[e], r[e]) ? r[e] : t[e]);
		});
	});
	function P(e, t, n, r, i, a) {
		if (!(n in e) || !C(e[n], t[n])) {
			if (!r) {
				var o = new m({
					actual: new N(e, i),
					expected: new N(t, i, e),
					operator: "deepStrictEqual",
					stackStartFn: a
				});
				throw o.actual = e, o.expected = t, o.operator = a.name, o;
			}
			O({
				actual: e,
				expected: t,
				message: r,
				operator: a.name,
				stackStartFn: a
			});
		}
	}
	function F(e, t, r, i) {
		if (typeof t != "function") {
			if (v(t)) return x(t, e);
			if (arguments.length === 2) throw new u("expected", ["Function", "RegExp"], t);
			if (n(e) !== "object" || e === null) {
				var a = new m({
					actual: e,
					expected: t,
					message: r,
					operator: "deepStrictEqual",
					stackStartFn: i
				});
				throw a.operator = i.name, a;
			}
			var o = Object.keys(t);
			if (t instanceof Error) o.push("name", "message");
			else if (o.length === 0) throw new d("error", t, "may not be an empty object");
			return S === void 0 && w(), o.forEach(function(n) {
				typeof e[n] == "string" && v(t[n]) && x(t[n], e[n]) || P(e, t, n, r, o, i);
			}), !0;
		}
		return t.prototype !== void 0 && e instanceof t || !Error.isPrototypeOf(t) && t.call({}, e) === !0;
	}
	function I(e) {
		if (typeof e != "function") throw new u("fn", "Function", e);
		try {
			e();
		} catch (e) {
			return e;
		}
		return D;
	}
	function L(e) {
		return _(e) || e !== null && n(e) === "object" && typeof e.then == "function" && typeof e.catch == "function";
	}
	function R(e) {
		return Promise.resolve().then(function() {
			var t;
			if (typeof e == "function") {
				if (t = e(), !L(t)) throw new f("instance of Promise", "promiseFn", t);
			} else if (L(e)) t = e;
			else throw new u("promiseFn", ["Function", "Promise"], e);
			return Promise.resolve().then(function() {
				return t;
			}).then(function() {
				return D;
			}).catch(function(e) {
				return e;
			});
		});
	}
	function z(e, t, r, i) {
		if (typeof r == "string") {
			if (arguments.length === 4) throw new u("error", [
				"Object",
				"Error",
				"Function",
				"RegExp"
			], r);
			if (n(t) === "object" && t !== null) {
				if (t.message === r) throw new l("error/message", `The error message "${t.message}" is identical to the message.`);
			} else if (t === r) throw new l("error/message", `The error "${t}" is identical to the message.`);
			i = r, r = void 0;
		} else if (r != null && n(r) !== "object" && typeof r != "function") throw new u("error", [
			"Object",
			"Error",
			"Function",
			"RegExp"
		], r);
		if (t === D) {
			var a = "";
			r && r.name && (a += ` (${r.name})`), a += i ? `: ${i}` : ".";
			var o = e.name === "rejects" ? "rejection" : "exception";
			O({
				actual: void 0,
				expected: r,
				operator: e.name,
				message: `Missing expected ${o}${a}`,
				stackStartFn: e
			});
		}
		if (r && !F(t, r, i, e)) throw t;
	}
	function B(e, t, n, r) {
		if (t !== D) {
			if (typeof n == "string" && (r = n, n = void 0), !n || F(t, n)) {
				var i = r ? `: ${r}` : ".", a = e.name === "doesNotReject" ? "rejection" : "exception";
				O({
					actual: t,
					expected: n,
					operator: e.name,
					message: `Got unwanted ${a}${i}
Actual message: "${t && t.message}"`,
					stackStartFn: e
				});
			}
			throw t;
		}
	}
	E.throws = function e(t) {
		var n = [...arguments].slice(1);
		z.apply(void 0, [e, I(t)].concat(n));
	}, E.rejects = function e(t) {
		var n = [...arguments].slice(1);
		return R(t).then(function(t) {
			return z.apply(void 0, [e, t].concat(n));
		});
	}, E.doesNotThrow = function e(t) {
		var n = [...arguments].slice(1);
		B.apply(void 0, [e, I(t)].concat(n));
	}, E.doesNotReject = function e(t) {
		var n = [...arguments].slice(1);
		return R(t).then(function(t) {
			return B.apply(void 0, [e, t].concat(n));
		});
	}, E.ifError = function e(t) {
		if (t != null) {
			var r = "ifError got unwanted exception: ";
			n(t) === "object" && typeof t.message == "string" ? t.message.length === 0 && t.constructor ? r += t.constructor.name : r += t.message : r += h(t);
			var i = new m({
				actual: t,
				expected: null,
				operator: "ifError",
				message: r,
				stackStartFn: e
			}), a = t.stack;
			if (typeof a == "string") {
				var o = a.split("\n");
				o.shift();
				for (var s = i.stack.split("\n"), c = 0; c < o.length; c++) {
					var l = s.indexOf(o[c]);
					if (l !== -1) {
						s = s.slice(0, l);
						break;
					}
				}
				i.stack = `${s.join("\n")}
${o.join("\n")}`;
			}
			throw i;
		}
	};
	function V(e, t, r, i, a) {
		if (!v(t)) throw new u("regexp", "RegExp", t);
		var o = a === "match";
		if (typeof e != "string" || x(t, e) !== o) {
			if (r instanceof Error) throw r;
			var s = !r;
			r ||= typeof e == "string" ? (o ? "The input did not match the regular expression " : "The input was expected to not match the regular expression ") + `${h(t)}. Input:

${h(e)}
` : `The "string" argument must be of type string. Received type ${n(e)} (${h(e)})`;
			var c = new m({
				actual: e,
				expected: t,
				message: r,
				operator: a,
				stackStartFn: i
			});
			throw c.generatedMessage = s, c;
		}
	}
	E.match = function e(t, n, r) {
		V(t, n, r, e, "match");
	}, E.doesNotMatch = function e(t, n, r) {
		V(t, n, r, e, "doesNotMatch");
	};
	function H() {
		var e = [...arguments];
		A.apply(void 0, [H, e.length].concat(e));
	}
	E.strict = y(H, E, {
		equal: E.strictEqual,
		deepEqual: E.deepStrictEqual,
		notEqual: E.notStrictEqual,
		notDeepEqual: E.notDeepStrictEqual
	}), E.strict.strict = E.strict;
})), or = /* @__PURE__ */ s(((e, t) => {
	(function(e) {
		var n, r = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i, i = Math.ceil, a = Math.floor, o = "[BigNumber Error] ", s = o + "Number primitive has more than 15 significant digits: ", c = 0x5af3107a4000, l = 14, u = 9007199254740991, d = [
			1,
			10,
			100,
			1e3,
			1e4,
			1e5,
			1e6,
			1e7,
			1e8,
			1e9,
			1e10,
			1e11,
			0xe8d4a51000,
			0x9184e72a000
		], f = 1e7, p = 1e9;
		function m(e) {
			var t, n, S, C = L.prototype = {
				constructor: L,
				toString: null,
				valueOf: null
			}, w = new L(1), T = 20, E = 4, D = -7, O = 21, k = -1e7, A = 1e7, j = !1, M = 1, N = 0, P = {
				prefix: "",
				groupSize: 3,
				secondaryGroupSize: 0,
				groupSeparator: ",",
				decimalSeparator: ".",
				fractionGroupSize: 0,
				fractionGroupSeparator: "\xA0",
				suffix: ""
			}, F = "0123456789abcdefghijklmnopqrstuvwxyz", I = !0;
			function L(e, t) {
				var i, o, c, d, f, p, m, h, g = this;
				if (!(g instanceof L)) return new L(e, t);
				if (t == null) {
					if (e && e._isBigNumber === !0) {
						g.s = e.s, !e.c || e.e > A ? g.c = g.e = null : e.e < k ? g.c = [g.e = 0] : (g.e = e.e, g.c = e.c.slice());
						return;
					}
					if ((p = typeof e == "number") && e * 0 == 0) {
						if (g.s = 1 / e < 0 ? (e = -e, -1) : 1, e === ~~e) {
							for (d = 0, f = e; f >= 10; f /= 10, d++);
							d > A ? g.c = g.e = null : (g.e = d, g.c = [e]);
							return;
						}
						h = String(e);
					} else {
						if (!r.test(h = String(e))) return S(g, h, p);
						g.s = h.charCodeAt(0) == 45 ? (h = h.slice(1), -1) : 1;
					}
					(d = h.indexOf(".")) > -1 && (h = h.replace(".", "")), (f = h.search(/e/i)) > 0 ? (d < 0 && (d = f), d += +h.slice(f + 1), h = h.substring(0, f)) : d < 0 && (d = h.length);
				} else {
					if (v(t, 2, F.length, "Base"), t == 10 && I) return g = new L(e), V(g, T + g.e + 1, E);
					if (h = String(e), p = typeof e == "number") {
						if (e * 0 != 0) return S(g, h, p, t);
						if (g.s = 1 / e < 0 ? (h = h.slice(1), -1) : 1, L.DEBUG && h.replace(/^0\.0*|\./, "").length > 15) throw Error(s + e);
					} else g.s = h.charCodeAt(0) === 45 ? (h = h.slice(1), -1) : 1;
					for (i = F.slice(0, t), d = f = 0, m = h.length; f < m; f++) if (i.indexOf(o = h.charAt(f)) < 0) {
						if (o == ".") {
							if (f > d) {
								d = m;
								continue;
							}
						} else if (!c && (h == h.toUpperCase() && (h = h.toLowerCase()) || h == h.toLowerCase() && (h = h.toUpperCase()))) {
							c = !0, f = -1, d = 0;
							continue;
						}
						return S(g, String(e), p, t);
					}
					p = !1, h = n(h, t, 10, g.s), (d = h.indexOf(".")) > -1 ? h = h.replace(".", "") : d = h.length;
				}
				for (f = 0; h.charCodeAt(f) === 48; f++);
				for (m = h.length; h.charCodeAt(--m) === 48;);
				if (h = h.slice(f, ++m)) {
					if (m -= f, p && L.DEBUG && m > 15 && (e > u || e !== a(e))) throw Error(s + g.s * e);
					if ((d = d - f - 1) > A) g.c = g.e = null;
					else if (d < k) g.c = [g.e = 0];
					else {
						if (g.e = d, g.c = [], f = (d + 1) % l, d < 0 && (f += l), f < m) {
							for (f && g.c.push(+h.slice(0, f)), m -= l; f < m;) g.c.push(+h.slice(f, f += l));
							f = l - (h = h.slice(f)).length;
						} else f -= m;
						for (; f--; h += "0");
						g.c.push(+h);
					}
				} else g.c = [g.e = 0];
			}
			L.clone = m, L.ROUND_UP = 0, L.ROUND_DOWN = 1, L.ROUND_CEIL = 2, L.ROUND_FLOOR = 3, L.ROUND_HALF_UP = 4, L.ROUND_HALF_DOWN = 5, L.ROUND_HALF_EVEN = 6, L.ROUND_HALF_CEIL = 7, L.ROUND_HALF_FLOOR = 8, L.EUCLID = 9, L.config = L.set = function(e) {
				var t, n;
				if (e != null) {
					if (typeof e == "object") {
						if (e.hasOwnProperty(t = "DECIMAL_PLACES") && (n = e[t], v(n, 0, p, t), T = n), e.hasOwnProperty(t = "ROUNDING_MODE") && (n = e[t], v(n, 0, 8, t), E = n), e.hasOwnProperty(t = "EXPONENTIAL_AT") && (n = e[t], n && n.pop ? (v(n[0], -p, 0, t), v(n[1], 0, p, t), D = n[0], O = n[1]) : (v(n, -p, p, t), D = -(O = n < 0 ? -n : n))), e.hasOwnProperty(t = "RANGE")) {
							if (n = e[t], n && n.pop) v(n[0], -p, -1, t), v(n[1], 1, p, t), k = n[0], A = n[1];
							else if (v(n, -p, p, t), n) k = -(A = n < 0 ? -n : n);
							else throw Error(o + t + " cannot be zero: " + n);
						}
						if (e.hasOwnProperty(t = "CRYPTO")) {
							if (n = e[t], n === !!n) {
								if (n) {
									if (typeof crypto < "u" && crypto && (crypto.getRandomValues || crypto.randomBytes)) j = n;
									else throw j = !n, Error(o + "crypto unavailable");
								} else j = n;
							} else throw Error(o + t + " not true or false: " + n);
						}
						if (e.hasOwnProperty(t = "MODULO_MODE") && (n = e[t], v(n, 0, 9, t), M = n), e.hasOwnProperty(t = "POW_PRECISION") && (n = e[t], v(n, 0, p, t), N = n), e.hasOwnProperty(t = "FORMAT")) {
							if (n = e[t], typeof n == "object") P = n;
							else throw Error(o + t + " not an object: " + n);
						}
						if (e.hasOwnProperty(t = "ALPHABET")) {
							if (n = e[t], typeof n == "string" && !/^.?$|[+\-.\s]|(.).*\1/.test(n)) I = n.slice(0, 10) == "0123456789", F = n;
							else throw Error(o + t + " invalid: " + n);
						}
					} else throw Error(o + "Object expected: " + e);
				}
				return {
					DECIMAL_PLACES: T,
					ROUNDING_MODE: E,
					EXPONENTIAL_AT: [D, O],
					RANGE: [k, A],
					CRYPTO: j,
					MODULO_MODE: M,
					POW_PRECISION: N,
					FORMAT: P,
					ALPHABET: F
				};
			}, L.isBigNumber = function(e) {
				if (!e || e._isBigNumber !== !0) return !1;
				if (!L.DEBUG) return !0;
				var t, n, r = e.c, i = e.e, s = e.s;
				out: if ({}.toString.call(r) == "[object Array]") {
					if ((s === 1 || s === -1) && i >= -p && i <= p && i === a(i)) {
						if (r[0] === 0) {
							if (i === 0 && r.length === 1) return !0;
							break out;
						}
						if (t = (i + 1) % l, t < 1 && (t += l), String(r[0]).length == t) {
							for (t = 0; t < r.length; t++) if (n = r[t], n < 0 || n >= c || n !== a(n)) break out;
							if (n !== 0) return !0;
						}
					}
				} else if (r === null && i === null && (s === null || s === 1 || s === -1)) return !0;
				throw Error(o + "Invalid BigNumber: " + e);
			}, L.maximum = L.max = function() {
				return z(arguments, -1);
			}, L.minimum = L.min = function() {
				return z(arguments, 1);
			}, L.random = (function() {
				var e = 9007199254740992, t = Math.random() * e & 2097151 ? function() {
					return a(Math.random() * e);
				} : function() {
					return (Math.random() * 1073741824 | 0) * 8388608 + (Math.random() * 8388608 | 0);
				};
				return function(e) {
					var n, r, s, c, u, f = 0, m = [], h = new L(w);
					if (e == null ? e = T : v(e, 0, p), c = i(e / l), j) {
						if (crypto.getRandomValues) {
							for (n = crypto.getRandomValues(new Uint32Array(c *= 2)); f < c;) u = n[f] * 131072 + (n[f + 1] >>> 11), u >= 9e15 ? (r = crypto.getRandomValues(/* @__PURE__ */ new Uint32Array(2)), n[f] = r[0], n[f + 1] = r[1]) : (m.push(u % 0x5af3107a4000), f += 2);
							f = c / 2;
						} else if (crypto.randomBytes) {
							for (n = crypto.randomBytes(c *= 7); f < c;) u = (n[f] & 31) * 281474976710656 + n[f + 1] * 1099511627776 + n[f + 2] * 4294967296 + n[f + 3] * 16777216 + (n[f + 4] << 16) + (n[f + 5] << 8) + n[f + 6], u >= 9e15 ? crypto.randomBytes(7).copy(n, f) : (m.push(u % 0x5af3107a4000), f += 7);
							f = c / 7;
						} else throw j = !1, Error(o + "crypto unavailable");
					}
					if (!j) for (; f < c;) u = t(), u < 9e15 && (m[f++] = u % 0x5af3107a4000);
					for (c = m[--f], e %= l, c && e && (u = d[l - e], m[f] = a(c / u) * u); m[f] === 0; m.pop(), f--);
					if (f < 0) m = [s = 0];
					else {
						for (s = -1; m[0] === 0; m.splice(0, 1), s -= l);
						for (f = 1, u = m[0]; u >= 10; u /= 10, f++);
						f < l && (s -= l - f);
					}
					return h.e = s, h.c = m, h;
				};
			})(), L.sum = function() {
				for (var e = 1, t = arguments, n = new L(t[0]); e < t.length;) n = n.plus(t[e++]);
				return n;
			}, n = (function() {
				var e = "0123456789";
				function n(e, t, n, r) {
					for (var i, a = [0], o, s = 0, c = e.length; s < c;) {
						for (o = a.length; o--; a[o] *= t);
						for (a[0] += r.indexOf(e.charAt(s++)), i = 0; i < a.length; i++) a[i] > n - 1 && (a[i + 1] ?? (a[i + 1] = 0), a[i + 1] += a[i] / n | 0, a[i] %= n);
					}
					return a.reverse();
				}
				return function(r, i, a, o, s) {
					var c, l, u, d, f, p, m, h, _ = r.indexOf("."), v = T, y = E;
					for (_ >= 0 && (d = N, N = 0, r = r.replace(".", ""), h = new L(i), p = h.pow(r.length - _), N = d, h.c = n(x(g(p.c), p.e, "0"), 10, a, e), h.e = h.c.length), m = n(r, i, a, s ? (c = F, e) : (c = e, F)), u = d = m.length; m[--d] == 0; m.pop());
					if (!m[0]) return c.charAt(0);
					if (_ < 0 ? --u : (p.c = m, p.e = u, p.s = o, p = t(p, h, v, y, a), m = p.c, f = p.r, u = p.e), l = u + v + 1, _ = m[l], d = a / 2, f = f || l < 0 || m[l + 1] != null, f = y < 4 ? (_ != null || f) && (y == 0 || y == (p.s < 0 ? 3 : 2)) : _ > d || _ == d && (y == 4 || f || y == 6 && m[l - 1] & 1 || y == (p.s < 0 ? 8 : 7)), l < 1 || !m[0]) r = f ? x(c.charAt(1), -v, c.charAt(0)) : c.charAt(0);
					else {
						if (m.length = l, f) for (--a; ++m[--l] > a;) m[l] = 0, l || (++u, m = [1].concat(m));
						for (d = m.length; !m[--d];);
						for (_ = 0, r = ""; _ <= d; r += c.charAt(m[_++]));
						r = x(r, u, c.charAt(0));
					}
					return r;
				};
			})(), t = (function() {
				function e(e, t, n) {
					var r, i, a, o, s = 0, c = e.length, l = t % f, u = t / f | 0;
					for (e = e.slice(); c--;) a = e[c] % f, o = e[c] / f | 0, r = u * a + o * l, i = l * a + r % f * f + s, s = (i / n | 0) + (r / f | 0) + u * o, e[c] = i % n;
					return s && (e = [s].concat(e)), e;
				}
				function t(e, t, n, r) {
					var i, a;
					if (n != r) a = n > r ? 1 : -1;
					else for (i = a = 0; i < n; i++) if (e[i] != t[i]) {
						a = e[i] > t[i] ? 1 : -1;
						break;
					}
					return a;
				}
				function n(e, t, n, r) {
					for (var i = 0; n--;) e[n] -= i, i = +(e[n] < t[n]), e[n] = i * r + e[n] - t[n];
					for (; !e[0] && e.length > 1; e.splice(0, 1));
				}
				return function(r, i, o, s, u) {
					var d, f, p, m, g, _, v, y, b, x, S, C, w, T, E, D, O, k = r.s == i.s ? 1 : -1, A = r.c, j = i.c;
					if (!A || !A[0] || !j || !j[0]) return new L(!r.s || !i.s || (A ? j && A[0] == j[0] : !j) ? NaN : A && A[0] == 0 || !j ? k * 0 : k / 0);
					for (y = new L(k), b = y.c = [], f = r.e - i.e, k = o + f + 1, u || (u = c, f = h(r.e / l) - h(i.e / l), k = k / l | 0), p = 0; j[p] == (A[p] || 0); p++);
					if (j[p] > (A[p] || 0) && f--, k < 0) b.push(1), m = !0;
					else {
						for (T = A.length, D = j.length, p = 0, k += 2, g = a(u / (j[0] + 1)), g > 1 && (j = e(j, g, u), A = e(A, g, u), D = j.length, T = A.length), w = D, x = A.slice(0, D), S = x.length; S < D; x[S++] = 0);
						O = j.slice(), O = [0].concat(O), E = j[0], j[1] >= u / 2 && E++;
						do {
							if (g = 0, d = t(j, x, D, S), d < 0) {
								if (C = x[0], D != S && (C = C * u + (x[1] || 0)), g = a(C / E), g > 1) for (g >= u && (g = u - 1), _ = e(j, g, u), v = _.length, S = x.length; t(_, x, v, S) == 1;) g--, n(_, D < v ? O : j, v, u), v = _.length, d = 1;
								else g == 0 && (d = g = 1), _ = j.slice(), v = _.length;
								if (v < S && (_ = [0].concat(_)), n(x, _, S, u), S = x.length, d == -1) for (; t(j, x, D, S) < 1;) g++, n(x, D < S ? O : j, S, u), S = x.length;
							} else d === 0 && (g++, x = [0]);
							b[p++] = g, x[0] ? x[S++] = A[w] || 0 : (x = [A[w]], S = 1);
						} while ((w++ < T || x[0] != null) && k--);
						m = x[0] != null, b[0] || b.splice(0, 1);
					}
					if (u == c) {
						for (p = 1, k = b[0]; k >= 10; k /= 10, p++);
						V(y, o + (y.e = p + f * l - 1) + 1, s, m);
					} else y.e = f, y.r = +m;
					return y;
				};
			})();
			function R(e, t, n, r) {
				var i, a, o, s, c;
				if (n == null ? n = E : v(n, 0, 8), !e.c) return e.toString();
				if (i = e.c[0], o = e.e, t == null) c = g(e.c), c = r == 1 || r == 2 && (o <= D || o >= O) ? b(c, o) : x(c, o, "0");
				else if (e = V(new L(e), t, n), a = e.e, c = g(e.c), s = c.length, r == 1 || r == 2 && (t <= a || a <= D)) {
					for (; s < t; c += "0", s++);
					c = b(c, a);
				} else if (t -= o + (r === 2 && a > o), c = x(c, a, "0"), a + 1 > s) {
					if (--t > 0) for (c += "."; t--; c += "0");
				} else if (t += a - s, t > 0) for (a + 1 == s && (c += "."); t--; c += "0");
				return e.s < 0 && i ? "-" + c : c;
			}
			function z(e, t) {
				for (var n, r, i = 1, a = new L(e[0]); i < e.length; i++) r = new L(e[i]), (!r.s || (n = _(a, r)) === t || n === 0 && a.s === t) && (a = r);
				return a;
			}
			function B(e, t, n) {
				for (var r = 1, i = t.length; !t[--i]; t.pop());
				for (i = t[0]; i >= 10; i /= 10, r++);
				return (n = r + n * l - 1) > A ? e.c = e.e = null : n < k ? e.c = [e.e = 0] : (e.e = n, e.c = t), e;
			}
			S = (function() {
				var e = /^(-?)0([xbo])(?=\w[\w.]*$)/i, t = /^([^.]+)\.$/, n = /^\.([^.]+)$/, r = /^-?(Infinity|NaN)$/, i = /^\s*\+(?=[\w.])|^\s+|\s+$/g;
				return function(a, s, c, l) {
					var u, d = c ? s : s.replace(i, "");
					if (r.test(d)) a.s = isNaN(d) ? null : d < 0 ? -1 : 1;
					else {
						if (!c && (d = d.replace(e, function(e, t, n) {
							return u = (n = n.toLowerCase()) == "x" ? 16 : n == "b" ? 2 : 8, !l || l == u ? t : e;
						}), l && (u = l, d = d.replace(t, "$1").replace(n, "0.$1")), s != d)) return new L(d, u);
						if (L.DEBUG) throw Error(o + "Not a" + (l ? " base " + l : "") + " number: " + s);
						a.s = null;
					}
					a.c = a.e = null;
				};
			})();
			function V(e, t, n, r) {
				var o, s, u, f, p, m, h, g = e.c, _ = d;
				if (g) {
					out: {
						for (o = 1, f = g[0]; f >= 10; f /= 10, o++);
						if (s = t - o, s < 0) s += l, u = t, p = g[m = 0], h = a(p / _[o - u - 1] % 10);
						else if (m = i((s + 1) / l), m >= g.length) {
							if (r) {
								for (; g.length <= m; g.push(0));
								p = h = 0, o = 1, s %= l, u = s - l + 1;
							} else break out;
						} else {
							for (p = f = g[m], o = 1; f >= 10; f /= 10, o++);
							s %= l, u = s - l + o, h = u < 0 ? 0 : a(p / _[o - u - 1] % 10);
						}
						if (r = r || t < 0 || g[m + 1] != null || (u < 0 ? p : p % _[o - u - 1]), r = n < 4 ? (h || r) && (n == 0 || n == (e.s < 0 ? 3 : 2)) : h > 5 || h == 5 && (n == 4 || r || n == 6 && (s > 0 ? u > 0 ? p / _[o - u] : 0 : g[m - 1]) % 10 & 1 || n == (e.s < 0 ? 8 : 7)), t < 1 || !g[0]) return g.length = 0, r ? (t -= e.e + 1, g[0] = _[(l - t % l) % l], e.e = -t || 0) : g[0] = e.e = 0, e;
						if (s == 0 ? (g.length = m, f = 1, m--) : (g.length = m + 1, f = _[l - s], g[m] = u > 0 ? a(p / _[o - u] % _[u]) * f : 0), r) for (;;) if (m == 0) {
							for (s = 1, u = g[0]; u >= 10; u /= 10, s++);
							for (u = g[0] += f, f = 1; u >= 10; u /= 10, f++);
							s != f && (e.e++, g[0] == c && (g[0] = 1));
							break;
						} else {
							if (g[m] += f, g[m] != c) break;
							g[m--] = 0, f = 1;
						}
						for (s = g.length; g[--s] === 0; g.pop());
					}
					e.e > A ? e.c = e.e = null : e.e < k && (e.c = [e.e = 0]);
				}
				return e;
			}
			function H(e) {
				var t, n = e.e;
				return n === null ? e.toString() : (t = g(e.c), t = n <= D || n >= O ? b(t, n) : x(t, n, "0"), e.s < 0 ? "-" + t : t);
			}
			return C.absoluteValue = C.abs = function() {
				var e = new L(this);
				return e.s < 0 && (e.s = 1), e;
			}, C.comparedTo = function(e, t) {
				return _(this, new L(e, t));
			}, C.decimalPlaces = C.dp = function(e, t) {
				var n, r, i, a = this;
				if (e != null) return v(e, 0, p), t == null ? t = E : v(t, 0, 8), V(new L(a), e + a.e + 1, t);
				if (!(n = a.c)) return null;
				if (r = ((i = n.length - 1) - h(this.e / l)) * l, i = n[i]) for (; i % 10 == 0; i /= 10, r--);
				return r < 0 && (r = 0), r;
			}, C.dividedBy = C.div = function(e, n) {
				return t(this, new L(e, n), T, E);
			}, C.dividedToIntegerBy = C.idiv = function(e, n) {
				return t(this, new L(e, n), 0, 1);
			}, C.exponentiatedBy = C.pow = function(e, t) {
				var n, r, s, c, u, d, f, p, m, h = this;
				if (e = new L(e), e.c && !e.isInteger()) throw Error(o + "Exponent not an integer: " + H(e));
				if (t != null && (t = new L(t)), d = e.e > 14, !h.c || !h.c[0] || h.c[0] == 1 && !h.e && h.c.length == 1 || !e.c || !e.c[0]) return m = new L((+H(h)) ** (d ? e.s * (2 - y(e)) : +H(e))), t ? m.mod(t) : m;
				if (f = e.s < 0, t) {
					if (t.c ? !t.c[0] : !t.s) return new L(NaN);
					r = !f && h.isInteger() && t.isInteger(), r && (h = h.mod(t));
				} else if (e.e > 9 && (h.e > 0 || h.e < -1 || (h.e == 0 ? h.c[0] > 1 || d && h.c[1] >= 24e7 : h.c[0] < 8e13 || d && h.c[0] <= 9999975e7))) return c = h.s < 0 && y(e) ? -0 : 0, h.e > -1 && (c = 1 / c), new L(f ? 1 / c : c);
				else N && (c = i(N / l + 2));
				for (d ? (n = new L(.5), f && (e.s = 1), p = y(e)) : (s = Math.abs(+H(e)), p = s % 2), m = new L(w);;) {
					if (p) {
						if (m = m.times(h), !m.c) break;
						c ? m.c.length > c && (m.c.length = c) : r && (m = m.mod(t));
					}
					if (s) {
						if (s = a(s / 2), s === 0) break;
						p = s % 2;
					} else if (e = e.times(n), V(e, e.e + 1, 1), e.e > 14) p = y(e);
					else {
						if (s = +H(e), s === 0) break;
						p = s % 2;
					}
					h = h.times(h), c ? h.c && h.c.length > c && (h.c.length = c) : r && (h = h.mod(t));
				}
				return r ? m : (f && (m = w.div(m)), t ? m.mod(t) : c ? V(m, N, E, u) : m);
			}, C.integerValue = function(e) {
				var t = new L(this);
				return e == null ? e = E : v(e, 0, 8), V(t, t.e + 1, e);
			}, C.isEqualTo = C.eq = function(e, t) {
				return _(this, new L(e, t)) === 0;
			}, C.isFinite = function() {
				return !!this.c;
			}, C.isGreaterThan = C.gt = function(e, t) {
				return _(this, new L(e, t)) > 0;
			}, C.isGreaterThanOrEqualTo = C.gte = function(e, t) {
				return (t = _(this, new L(e, t))) === 1 || t === 0;
			}, C.isInteger = function() {
				return !!this.c && h(this.e / l) > this.c.length - 2;
			}, C.isLessThan = C.lt = function(e, t) {
				return _(this, new L(e, t)) < 0;
			}, C.isLessThanOrEqualTo = C.lte = function(e, t) {
				return (t = _(this, new L(e, t))) === -1 || t === 0;
			}, C.isNaN = function() {
				return !this.s;
			}, C.isNegative = function() {
				return this.s < 0;
			}, C.isPositive = function() {
				return this.s > 0;
			}, C.isZero = function() {
				return !!this.c && this.c[0] == 0;
			}, C.minus = function(e, t) {
				var n, r, i, a, o = this, s = o.s;
				if (e = new L(e, t), t = e.s, !s || !t) return new L(NaN);
				if (s != t) return e.s = -t, o.plus(e);
				var u = o.e / l, d = e.e / l, f = o.c, p = e.c;
				if (!u || !d) {
					if (!f || !p) return f ? (e.s = -t, e) : new L(p ? o : NaN);
					if (!f[0] || !p[0]) return p[0] ? (e.s = -t, e) : new L(f[0] ? o : E == 3 ? -0 : 0);
				}
				if (u = h(u), d = h(d), f = f.slice(), s = u - d) {
					for ((a = s < 0) ? (s = -s, i = f) : (d = u, i = p), i.reverse(), t = s; t--; i.push(0));
					i.reverse();
				} else for (r = (a = (s = f.length) < (t = p.length)) ? s : t, s = t = 0; t < r; t++) if (f[t] != p[t]) {
					a = f[t] < p[t];
					break;
				}
				if (a && (i = f, f = p, p = i, e.s = -e.s), t = (r = p.length) - (n = f.length), t > 0) for (; t--; f[n++] = 0);
				for (t = c - 1; r > s;) {
					if (f[--r] < p[r]) {
						for (n = r; n && !f[--n]; f[n] = t);
						--f[n], f[r] += c;
					}
					f[r] -= p[r];
				}
				for (; f[0] == 0; f.splice(0, 1), --d);
				return f[0] ? B(e, f, d) : (e.s = E == 3 ? -1 : 1, e.c = [e.e = 0], e);
			}, C.modulo = C.mod = function(e, n) {
				var r, i, a = this;
				return e = new L(e, n), !a.c || !e.s || e.c && !e.c[0] ? new L(NaN) : !e.c || a.c && !a.c[0] ? new L(a) : (M == 9 ? (i = e.s, e.s = 1, r = t(a, e, 0, 3), e.s = i, r.s *= i) : r = t(a, e, 0, M), e = a.minus(r.times(e)), !e.c[0] && M == 1 && (e.s = a.s), e);
			}, C.multipliedBy = C.times = function(e, t) {
				var n, r, i, a, o, s, u, d, p, m, g, _, v, y, b, x = this, S = x.c, C = (e = new L(e, t)).c;
				if (!S || !C || !S[0] || !C[0]) return !x.s || !e.s || S && !S[0] && !C || C && !C[0] && !S ? e.c = e.e = e.s = null : (e.s *= x.s, !S || !C ? e.c = e.e = null : (e.c = [0], e.e = 0)), e;
				for (r = h(x.e / l) + h(e.e / l), e.s *= x.s, u = S.length, m = C.length, u < m && (v = S, S = C, C = v, i = u, u = m, m = i), i = u + m, v = []; i--; v.push(0));
				for (y = c, b = f, i = m; --i >= 0;) {
					for (n = 0, g = C[i] % b, _ = C[i] / b | 0, o = u, a = i + o; a > i;) d = S[--o] % b, p = S[o] / b | 0, s = _ * d + p * g, d = g * d + s % b * b + v[a] + n, n = (d / y | 0) + (s / b | 0) + _ * p, v[a--] = d % y;
					v[a] = n;
				}
				return n ? ++r : v.splice(0, 1), B(e, v, r);
			}, C.negated = function() {
				var e = new L(this);
				return e.s = -e.s || null, e;
			}, C.plus = function(e, t) {
				var n, r = this, i = r.s;
				if (e = new L(e, t), t = e.s, !i || !t) return new L(NaN);
				if (i != t) return e.s = -t, r.minus(e);
				var a = r.e / l, o = e.e / l, s = r.c, u = e.c;
				if (!a || !o) {
					if (!s || !u) return new L(i / 0);
					if (!s[0] || !u[0]) return u[0] ? e : new L(s[0] ? r : i * 0);
				}
				if (a = h(a), o = h(o), s = s.slice(), i = a - o) {
					for (i > 0 ? (o = a, n = u) : (i = -i, n = s), n.reverse(); i--; n.push(0));
					n.reverse();
				}
				for (i = s.length, t = u.length, i - t < 0 && (n = u, u = s, s = n, t = i), i = 0; t;) i = (s[--t] = s[t] + u[t] + i) / c | 0, s[t] = c === s[t] ? 0 : s[t] % c;
				return i && (s = [i].concat(s), ++o), B(e, s, o);
			}, C.precision = C.sd = function(e, t) {
				var n, r, i, a = this;
				if (e != null && e !== !!e) return v(e, 1, p), t == null ? t = E : v(t, 0, 8), V(new L(a), e, t);
				if (!(n = a.c)) return null;
				if (i = n.length - 1, r = i * l + 1, i = n[i]) {
					for (; i % 10 == 0; i /= 10, r--);
					for (i = n[0]; i >= 10; i /= 10, r++);
				}
				return e && a.e + 1 > r && (r = a.e + 1), r;
			}, C.shiftedBy = function(e) {
				return v(e, -u, u), this.times("1e" + e);
			}, C.squareRoot = C.sqrt = function() {
				var e, n, r, i, a, o = this, s = o.c, c = o.s, l = o.e, u = T + 4, d = new L("0.5");
				if (c !== 1 || !s || !s[0]) return new L(!c || c < 0 && (!s || s[0]) ? NaN : s ? o : 1 / 0);
				if (c = Math.sqrt(+H(o)), c == 0 || c == 1 / 0 ? (n = g(s), (n.length + l) % 2 == 0 && (n += "0"), c = Math.sqrt(+n), l = h((l + 1) / 2) - (l < 0 || l % 2), c == 1 / 0 ? n = "5e" + l : (n = c.toExponential(), n = n.slice(0, n.indexOf("e") + 1) + l), r = new L(n)) : r = new L(c + ""), r.c[0]) {
					for (l = r.e, c = l + u, c < 3 && (c = 0);;) if (a = r, r = d.times(a.plus(t(o, a, u, 1))), g(a.c).slice(0, c) === (n = g(r.c)).slice(0, c)) {
						if (r.e < l && --c, n = n.slice(c - 3, c + 1), n == "9999" || !i && n == "4999") {
							if (!i && (V(a, a.e + T + 2, 0), a.times(a).eq(o))) {
								r = a;
								break;
							}
							u += 4, c += 4, i = 1;
						} else {
							(!+n || !+n.slice(1) && n.charAt(0) == "5") && (V(r, r.e + T + 2, 1), e = !r.times(r).eq(o));
							break;
						}
					}
				}
				return V(r, r.e + T + 1, E, e);
			}, C.toExponential = function(e, t) {
				return e != null && (v(e, 0, p), e++), R(this, e, t, 1);
			}, C.toFixed = function(e, t) {
				return e != null && (v(e, 0, p), e = e + this.e + 1), R(this, e, t);
			}, C.toFormat = function(e, t, n) {
				var r, i = this;
				if (n == null) e != null && t && typeof t == "object" ? (n = t, t = null) : e && typeof e == "object" ? (n = e, e = t = null) : n = P;
				else if (typeof n != "object") throw Error(o + "Argument not an object: " + n);
				if (r = i.toFixed(e, t), i.c) {
					var a, s = r.split("."), c = +n.groupSize, l = +n.secondaryGroupSize, u = n.groupSeparator || "", d = s[0], f = s[1], p = i.s < 0, m = p ? d.slice(1) : d, h = m.length;
					if (l && (a = c, c = l, l = a, h -= a), c > 0 && h > 0) {
						for (a = h % c || c, d = m.substr(0, a); a < h; a += c) d += u + m.substr(a, c);
						l > 0 && (d += u + m.slice(a)), p && (d = "-" + d);
					}
					r = f ? d + (n.decimalSeparator || "") + ((l = +n.fractionGroupSize) ? f.replace(RegExp("\\d{" + l + "}\\B", "g"), "$&" + (n.fractionGroupSeparator || "")) : f) : d;
				}
				return (n.prefix || "") + r + (n.suffix || "");
			}, C.toFraction = function(e) {
				var n, r, i, a, s, c, u, f, p, m, h, _, v = this, y = v.c;
				if (e != null && (u = new L(e), !u.isInteger() && (u.c || u.s !== 1) || u.lt(w))) throw Error(o + "Argument " + (u.isInteger() ? "out of range: " : "not an integer: ") + H(u));
				if (!y) return new L(v);
				for (n = new L(w), p = r = new L(w), i = f = new L(w), _ = g(y), s = n.e = _.length - v.e - 1, n.c[0] = d[(c = s % l) < 0 ? l + c : c], e = !e || u.comparedTo(n) > 0 ? s > 0 ? n : p : u, c = A, A = 1 / 0, u = new L(_), f.c[0] = 0; m = t(u, n, 0, 1), a = r.plus(m.times(i)), a.comparedTo(e) != 1;) r = i, i = a, p = f.plus(m.times(a = p)), f = a, n = u.minus(m.times(a = n)), u = a;
				return a = t(e.minus(r), i, 0, 1), f = f.plus(a.times(p)), r = r.plus(a.times(i)), f.s = p.s = v.s, s *= 2, h = t(p, i, s, E).minus(v).abs().comparedTo(t(f, r, s, E).minus(v).abs()) < 1 ? [p, i] : [f, r], A = c, h;
			}, C.toNumber = function() {
				return +H(this);
			}, C.toPrecision = function(e, t) {
				return e != null && v(e, 1, p), R(this, e, t, 2);
			}, C.toString = function(e) {
				var t, r = this, i = r.s, a = r.e;
				return a === null ? i ? (t = "Infinity", i < 0 && (t = "-" + t)) : t = "NaN" : (e == null ? t = a <= D || a >= O ? b(g(r.c), a) : x(g(r.c), a, "0") : e === 10 && I ? (r = V(new L(r), T + a + 1, E), t = x(g(r.c), r.e, "0")) : (v(e, 2, F.length, "Base"), t = n(x(g(r.c), a, "0"), 10, e, i, !0)), i < 0 && r.c[0] && (t = "-" + t)), t;
			}, C.valueOf = C.toJSON = function() {
				return H(this);
			}, C._isBigNumber = !0, e != null && L.set(e), L;
		}
		function h(e) {
			var t = e | 0;
			return e > 0 || e === t ? t : t - 1;
		}
		function g(e) {
			for (var t, n, r = 1, i = e.length, a = e[0] + ""; r < i;) {
				for (t = e[r++] + "", n = l - t.length; n--; t = "0" + t);
				a += t;
			}
			for (i = a.length; a.charCodeAt(--i) === 48;);
			return a.slice(0, i + 1 || 1);
		}
		function _(e, t) {
			var n, r, i = e.c, a = t.c, o = e.s, s = t.s, c = e.e, l = t.e;
			if (!o || !s) return null;
			if (n = i && !i[0], r = a && !a[0], n || r) return n ? r ? 0 : -s : o;
			if (o != s) return o;
			if (n = o < 0, r = c == l, !i || !a) return r ? 0 : !i ^ n ? 1 : -1;
			if (!r) return c > l ^ n ? 1 : -1;
			for (s = (c = i.length) < (l = a.length) ? c : l, o = 0; o < s; o++) if (i[o] != a[o]) return i[o] > a[o] ^ n ? 1 : -1;
			return c == l ? 0 : c > l ^ n ? 1 : -1;
		}
		function v(e, t, n, r) {
			if (e < t || e > n || e !== a(e)) throw Error(o + (r || "Argument") + (typeof e == "number" ? e < t || e > n ? " out of range: " : " not an integer: " : " not a primitive number: ") + String(e));
		}
		function y(e) {
			var t = e.c.length - 1;
			return h(e.e / l) == t && e.c[t] % 2 != 0;
		}
		function b(e, t) {
			return (e.length > 1 ? e.charAt(0) + "." + e.slice(1) : e) + (t < 0 ? "e" : "e+") + t;
		}
		function x(e, t, n) {
			var r, i;
			if (t < 0) {
				for (i = n + "."; ++t; i += n);
				e = i + e;
			} else if (r = e.length, ++t > r) {
				for (i = n, t -= r; --t; i += n);
				e += i;
			} else t < r && (e = e.slice(0, t) + "." + e.slice(t));
			return e;
		}
		n = m(), n.default = n.BigNumber = n, typeof define == "function" && define.amd ? define(function() {
			return n;
		}) : t !== void 0 && t.exports ? t.exports = n : (e ||= typeof self < "u" && self ? self : window, e.BigNumber = n);
	})(e);
})), sr = /* @__PURE__ */ s(((e, t) => {
	(function(n, r) {
		typeof e == "object" && t !== void 0 ? t.exports = r() : typeof define == "function" && define.amd ? define(r) : (n ||= self, n.JSBI = r());
	})(e, function() {
		var e = Math.imul, t = Math.clz32, n = Math.abs, r = Math.max, i = Math.floor;
		class a extends Array {
			constructor(e, t) {
				if (super(e), this.sign = t, e > a.__kMaxLength) throw RangeError("Maximum BigInt size exceeded");
			}
			static BigInt(e) {
				var t = Number.isFinite;
				if (typeof e == "number") {
					if (e === 0) return a.__zero();
					if (a.__isOneDigitInt(e)) return 0 > e ? a.__oneDigit(-e, !0) : a.__oneDigit(e, !1);
					if (!t(e) || i(e) !== e) throw RangeError("The number " + e + " cannot be converted to BigInt because it is not an integer");
					return a.__fromDouble(e);
				}
				if (typeof e == "string") {
					let t = a.__fromString(e);
					if (t === null) throw SyntaxError("Cannot convert " + e + " to a BigInt");
					return t;
				}
				if (typeof e == "boolean") return !0 === e ? a.__oneDigit(1, !1) : a.__zero();
				if (typeof e == "object") {
					if (e.constructor === a) return e;
					let t = a.__toPrimitive(e);
					return a.BigInt(t);
				}
				throw TypeError("Cannot convert " + e + " to a BigInt");
			}
			toDebugString() {
				let e = ["BigInt["];
				for (let t of this) e.push((t && (t >>> 0).toString(16)) + ", ");
				return e.push("]"), e.join("");
			}
			toString(e = 10) {
				if (2 > e || 36 < e) throw RangeError("toString() radix argument must be between 2 and 36");
				return this.length === 0 ? "0" : e & e - 1 ? a.__toStringGeneric(this, e, !1) : a.__toStringBasePowerOfTwo(this, e);
			}
			static toNumber(e) {
				let t = e.length;
				if (t === 0) return 0;
				if (t === 1) {
					let t = e.__unsignedDigit(0);
					return e.sign ? -t : t;
				}
				let n = e.__digit(t - 1), r = a.__clz30(n), i = 30 * t - r;
				if (1024 < i) return e.sign ? -Infinity : 1 / 0;
				let o = i - 1, s = n, c = t - 1, l = r + 3, u = l === 32 ? 0 : s << l;
				u >>>= 12;
				let d = l - 12, f = 12 <= l ? 0 : s << 20 + l, p = 20 + l;
				for (0 < d && 0 < c && (c--, s = e.__digit(c), u |= s >>> 30 - d, f = s << d + 2, p = d + 2); 0 < p && 0 < c;) c--, s = e.__digit(c), f |= 30 <= p ? s << p - 30 : s >>> 30 - p, p -= 30;
				let m = a.__decideRounding(e, p, c, s);
				if ((m === 1 || m === 0 && (1 & f) == 1) && (f = f + 1 >>> 0, f === 0 && (u++, u >>> 20 && (u = 0, o++, 1023 < o)))) return e.sign ? -Infinity : 1 / 0;
				let h = e.sign ? -2147483648 : 0;
				return o = o + 1023 << 20, a.__kBitConversionInts[1] = h | o | u, a.__kBitConversionInts[0] = f, a.__kBitConversionDouble[0];
			}
			static unaryMinus(e) {
				if (e.length === 0) return e;
				let t = e.__copy();
				return t.sign = !e.sign, t;
			}
			static bitwiseNot(e) {
				return e.sign ? a.__absoluteSubOne(e).__trim() : a.__absoluteAddOne(e, !0);
			}
			static exponentiate(e, t) {
				if (t.sign) throw RangeError("Exponent must be positive");
				if (t.length === 0) return a.__oneDigit(1, !1);
				if (e.length === 0) return e;
				if (e.length === 1 && e.__digit(0) === 1) return e.sign && !(1 & t.__digit(0)) ? a.unaryMinus(e) : e;
				if (1 < t.length) throw RangeError("BigInt too big");
				let n = t.__unsignedDigit(0);
				if (n === 1) return e;
				if (n >= a.__kMaxLengthBits) throw RangeError("BigInt too big");
				if (e.length === 1 && e.__digit(0) === 2) {
					let t = 1 + (0 | n / 30), r = e.sign && !!(1 & n), i = new a(t, r);
					i.__initializeDigits();
					let o = 1 << n % 30;
					return i.__setDigit(t - 1, o), i;
				}
				let r = null, i = e;
				for (1 & n && (r = e), n >>= 1; n !== 0; n >>= 1) i = a.multiply(i, i), 1 & n && (r = r === null ? i : a.multiply(r, i));
				return r;
			}
			static multiply(e, t) {
				if (e.length === 0) return e;
				if (t.length === 0) return t;
				let n = e.length + t.length;
				30 <= e.__clzmsd() + t.__clzmsd() && n--;
				let r = new a(n, e.sign !== t.sign);
				r.__initializeDigits();
				for (let n = 0; n < e.length; n++) a.__multiplyAccumulate(t, e.__digit(n), r, n);
				return r.__trim();
			}
			static divide(e, t) {
				if (t.length === 0) throw RangeError("Division by zero");
				if (0 > a.__absoluteCompare(e, t)) return a.__zero();
				let n = e.sign !== t.sign, r = t.__unsignedDigit(0), i;
				if (t.length === 1 && 32767 >= r) {
					if (r === 1) return n === e.sign ? e : a.unaryMinus(e);
					i = a.__absoluteDivSmall(e, r, null);
				} else i = a.__absoluteDivLarge(e, t, !0, !1);
				return i.sign = n, i.__trim();
			}
			static remainder(e, t) {
				if (t.length === 0) throw RangeError("Division by zero");
				if (0 > a.__absoluteCompare(e, t)) return e;
				let n = t.__unsignedDigit(0);
				if (t.length === 1 && 32767 >= n) {
					if (n === 1) return a.__zero();
					let t = a.__absoluteModSmall(e, n);
					return t === 0 ? a.__zero() : a.__oneDigit(t, e.sign);
				}
				let r = a.__absoluteDivLarge(e, t, !1, !0);
				return r.sign = e.sign, r.__trim();
			}
			static add(e, t) {
				let n = e.sign;
				return n === t.sign ? a.__absoluteAdd(e, t, n) : 0 <= a.__absoluteCompare(e, t) ? a.__absoluteSub(e, t, n) : a.__absoluteSub(t, e, !n);
			}
			static subtract(e, t) {
				let n = e.sign;
				return n === t.sign ? 0 <= a.__absoluteCompare(e, t) ? a.__absoluteSub(e, t, n) : a.__absoluteSub(t, e, !n) : a.__absoluteAdd(e, t, n);
			}
			static leftShift(e, t) {
				return t.length === 0 || e.length === 0 ? e : t.sign ? a.__rightShiftByAbsolute(e, t) : a.__leftShiftByAbsolute(e, t);
			}
			static signedRightShift(e, t) {
				return t.length === 0 || e.length === 0 ? e : t.sign ? a.__leftShiftByAbsolute(e, t) : a.__rightShiftByAbsolute(e, t);
			}
			static unsignedRightShift() {
				throw TypeError("BigInts have no unsigned right shift; use >> instead");
			}
			static lessThan(e, t) {
				return 0 > a.__compareToBigInt(e, t);
			}
			static lessThanOrEqual(e, t) {
				return 0 >= a.__compareToBigInt(e, t);
			}
			static greaterThan(e, t) {
				return 0 < a.__compareToBigInt(e, t);
			}
			static greaterThanOrEqual(e, t) {
				return 0 <= a.__compareToBigInt(e, t);
			}
			static equal(e, t) {
				if (e.sign !== t.sign || e.length !== t.length) return !1;
				for (let n = 0; n < e.length; n++) if (e.__digit(n) !== t.__digit(n)) return !1;
				return !0;
			}
			static notEqual(e, t) {
				return !a.equal(e, t);
			}
			static bitwiseAnd(e, t) {
				if (!e.sign && !t.sign) return a.__absoluteAnd(e, t).__trim();
				if (e.sign && t.sign) {
					let n = r(e.length, t.length) + 1, i = a.__absoluteSubOne(e, n), o = a.__absoluteSubOne(t);
					return i = a.__absoluteOr(i, o, i), a.__absoluteAddOne(i, !0, i).__trim();
				}
				return e.sign && ([e, t] = [t, e]), a.__absoluteAndNot(e, a.__absoluteSubOne(t)).__trim();
			}
			static bitwiseXor(e, t) {
				if (!e.sign && !t.sign) return a.__absoluteXor(e, t).__trim();
				if (e.sign && t.sign) {
					let n = r(e.length, t.length), i = a.__absoluteSubOne(e, n), o = a.__absoluteSubOne(t);
					return a.__absoluteXor(i, o, i).__trim();
				}
				let n = r(e.length, t.length) + 1;
				e.sign && ([e, t] = [t, e]);
				let i = a.__absoluteSubOne(t, n);
				return i = a.__absoluteXor(i, e, i), a.__absoluteAddOne(i, !0, i).__trim();
			}
			static bitwiseOr(e, t) {
				let n = r(e.length, t.length);
				if (!e.sign && !t.sign) return a.__absoluteOr(e, t).__trim();
				if (e.sign && t.sign) {
					let r = a.__absoluteSubOne(e, n), i = a.__absoluteSubOne(t);
					return r = a.__absoluteAnd(r, i, r), a.__absoluteAddOne(r, !0, r).__trim();
				}
				e.sign && ([e, t] = [t, e]);
				let i = a.__absoluteSubOne(t, n);
				return i = a.__absoluteAndNot(i, e, i), a.__absoluteAddOne(i, !0, i).__trim();
			}
			static asIntN(e, t) {
				if (t.length === 0) return t;
				if (e = i(e), 0 > e) throw RangeError("Invalid value: not (convertible to) a safe integer");
				if (e === 0) return a.__zero();
				if (e >= a.__kMaxLengthBits) return t;
				let n = 0 | (e + 29) / 30;
				if (t.length < n) return t;
				let r = t.__unsignedDigit(n - 1), o = 1 << (e - 1) % 30;
				if (t.length === n && r < o) return t;
				if ((r & o) !== o) return a.__truncateToNBits(e, t);
				if (!t.sign) return a.__truncateAndSubFromPowerOfTwo(e, t, !0);
				if (!(r & o - 1)) {
					for (let r = n - 2; 0 <= r; r--) if (t.__digit(r) !== 0) return a.__truncateAndSubFromPowerOfTwo(e, t, !1);
					return t.length === n && r === o ? t : a.__truncateToNBits(e, t);
				}
				return a.__truncateAndSubFromPowerOfTwo(e, t, !1);
			}
			static asUintN(e, t) {
				if (t.length === 0) return t;
				if (e = i(e), 0 > e) throw RangeError("Invalid value: not (convertible to) a safe integer");
				if (e === 0) return a.__zero();
				if (t.sign) {
					if (e > a.__kMaxLengthBits) throw RangeError("BigInt too big");
					return a.__truncateAndSubFromPowerOfTwo(e, t, !1);
				}
				if (e >= a.__kMaxLengthBits) return t;
				let n = 0 | (e + 29) / 30;
				if (t.length < n) return t;
				let r = e % 30;
				return t.length == n && (r === 0 || !(t.__digit(n - 1) >>> r)) ? t : a.__truncateToNBits(e, t);
			}
			static ADD(e, t) {
				if (e = a.__toPrimitive(e), t = a.__toPrimitive(t), typeof e == "string") return typeof t != "string" && (t = t.toString()), e + t;
				if (typeof t == "string") return e.toString() + t;
				if (e = a.__toNumeric(e), t = a.__toNumeric(t), a.__isBigInt(e) && a.__isBigInt(t)) return a.add(e, t);
				if (typeof e == "number" && typeof t == "number") return e + t;
				throw TypeError("Cannot mix BigInt and other types, use explicit conversions");
			}
			static LT(e, t) {
				return a.__compare(e, t, 0);
			}
			static LE(e, t) {
				return a.__compare(e, t, 1);
			}
			static GT(e, t) {
				return a.__compare(e, t, 2);
			}
			static GE(e, t) {
				return a.__compare(e, t, 3);
			}
			static EQ(e, t) {
				for (;;) {
					if (a.__isBigInt(e)) return a.__isBigInt(t) ? a.equal(e, t) : a.EQ(t, e);
					if (typeof e == "number") {
						if (a.__isBigInt(t)) return a.__equalToNumber(t, e);
						if (typeof t != "object") return e == t;
						t = a.__toPrimitive(t);
					} else if (typeof e == "string") {
						if (a.__isBigInt(t)) return e = a.__fromString(e), e !== null && a.equal(e, t);
						if (typeof t != "object") return e == t;
						t = a.__toPrimitive(t);
					} else if (typeof e == "boolean") {
						if (a.__isBigInt(t)) return a.__equalToNumber(t, +e);
						if (typeof t != "object") return e == t;
						t = a.__toPrimitive(t);
					} else if (typeof e == "symbol") {
						if (a.__isBigInt(t)) return !1;
						if (typeof t != "object") return e == t;
						t = a.__toPrimitive(t);
					} else if (typeof e == "object") {
						if (typeof t == "object" && t.constructor !== a) return e == t;
						e = a.__toPrimitive(e);
					} else return e == t;
				}
			}
			static NE(e, t) {
				return !a.EQ(e, t);
			}
			static __zero() {
				return new a(0, !1);
			}
			static __oneDigit(e, t) {
				let n = new a(1, t);
				return n.__setDigit(0, e), n;
			}
			__copy() {
				let e = new a(this.length, this.sign);
				for (let t = 0; t < this.length; t++) e[t] = this[t];
				return e;
			}
			__trim() {
				let e = this.length, t = this[e - 1];
				for (; t === 0;) e--, t = this[e - 1], this.pop();
				return e === 0 && (this.sign = !1), this;
			}
			__initializeDigits() {
				for (let e = 0; e < this.length; e++) this[e] = 0;
			}
			static __decideRounding(e, t, n, r) {
				if (0 < t) return -1;
				let i;
				if (0 > t) i = -t - 1;
				else {
					if (n === 0) return -1;
					n--, r = e.__digit(n), i = 29;
				}
				let a = 1 << i;
				if ((r & a) == 0) return -1;
				if (--a, (r & a) != 0) return 1;
				for (; 0 < n;) if (n--, e.__digit(n) !== 0) return 1;
				return 0;
			}
			static __fromDouble(e) {
				a.__kBitConversionDouble[0] = e;
				let t = (2047 & a.__kBitConversionInts[1] >>> 20) - 1023, n = (0 | t / 30) + 1, r = new a(n, 0 > e), i = 1048575 & a.__kBitConversionInts[1] | 1048576, o = a.__kBitConversionInts[0], s = t % 30, c, l = 0;
				if (20 > s) {
					let e = 20 - s;
					l = e + 32, c = i >>> e, i = i << 32 - e | o >>> e, o <<= 32 - e;
				} else if (s === 20) l = 32, c = i, i = o, o = 0;
				else {
					let e = s - 20;
					l = 32 - e, c = i << e | o >>> 32 - e, i = o << e, o = 0;
				}
				r.__setDigit(n - 1, c);
				for (let e = n - 2; 0 <= e; e--) 0 < l ? (l -= 30, c = i >>> 2, i = i << 30 | o >>> 2, o <<= 30) : c = 0, r.__setDigit(e, c);
				return r.__trim();
			}
			static __isWhitespace(e) {
				return 13 >= e && 9 <= e || (159 >= e ? e == 32 : 131071 >= e ? e == 160 || e == 5760 : 196607 >= e ? (e &= 131071, 10 >= e || e == 40 || e == 41 || e == 47 || e == 95 || e == 4096) : e == 65279);
			}
			static __fromString(e, t = 0) {
				let n = 0, r = e.length, i = 0;
				if (i === r) return a.__zero();
				let o = e.charCodeAt(i);
				for (; a.__isWhitespace(o);) {
					if (++i === r) return a.__zero();
					o = e.charCodeAt(i);
				}
				if (o === 43) {
					if (++i === r) return null;
					o = e.charCodeAt(i), n = 1;
				} else if (o === 45) {
					if (++i === r) return null;
					o = e.charCodeAt(i), n = -1;
				}
				if (t === 0) {
					if (t = 10, o === 48) {
						if (++i === r) return a.__zero();
						if (o = e.charCodeAt(i), o === 88 || o === 120) {
							if (t = 16, ++i === r) return null;
							o = e.charCodeAt(i);
						} else if (o === 79 || o === 111) {
							if (t = 8, ++i === r) return null;
							o = e.charCodeAt(i);
						} else if (o === 66 || o === 98) {
							if (t = 2, ++i === r) return null;
							o = e.charCodeAt(i);
						}
					}
				} else if (t === 16 && o === 48) {
					if (++i === r) return a.__zero();
					if (o = e.charCodeAt(i), o === 88 || o === 120) {
						if (++i === r) return null;
						o = e.charCodeAt(i);
					}
				}
				if (n != 0 && t !== 10) return null;
				for (; o === 48;) {
					if (++i === r) return a.__zero();
					o = e.charCodeAt(i);
				}
				let s = r - i, c = a.__kMaxBitsPerChar[t], l = a.__kBitsPerCharTableMultiplier - 1;
				if (s > 1073741824 / c) return null;
				let u = c * s + l >>> a.__kBitsPerCharTableShift, d = new a(0 | (u + 29) / 30, !1), f = 10 > t ? t : 10, p = 10 < t ? t - 10 : 0;
				if (t & t - 1) {
					d.__initializeDigits();
					let n = !1, s = 0;
					do {
						let u = 0, m = 1;
						for (;;) {
							let a;
							if (o - 48 >>> 0 < f) a = o - 48;
							else if ((32 | o) - 97 >>> 0 < p) a = (32 | o) - 87;
							else {
								n = !0;
								break;
							}
							let c = m * t;
							if (1073741823 < c) break;
							if (m = c, u = u * t + a, s++, ++i === r) {
								n = !0;
								break;
							}
							o = e.charCodeAt(i);
						}
						l = 30 * a.__kBitsPerCharTableMultiplier - 1;
						let h = 0 | (c * s + l >>> a.__kBitsPerCharTableShift) / 30;
						d.__inplaceMultiplyAdd(m, u, h);
					} while (!n);
				} else {
					c >>= a.__kBitsPerCharTableShift;
					let t = [], n = [], s = !1;
					do {
						let a = 0, l = 0;
						for (;;) {
							let t;
							if (o - 48 >>> 0 < f) t = o - 48;
							else if ((32 | o) - 97 >>> 0 < p) t = (32 | o) - 87;
							else {
								s = !0;
								break;
							}
							if (l += c, a = a << c | t, ++i === r) {
								s = !0;
								break;
							}
							if (o = e.charCodeAt(i), 30 < l + c) break;
						}
						t.push(a), n.push(l);
					} while (!s);
					a.__fillFromParts(d, t, n);
				}
				if (i !== r) {
					if (!a.__isWhitespace(o)) return null;
					for (i++; i < r; i++) if (o = e.charCodeAt(i), !a.__isWhitespace(o)) return null;
				}
				return d.sign = n == -1, d.__trim();
			}
			static __fillFromParts(e, t, n) {
				let r = 0, i = 0, a = 0;
				for (let o = t.length - 1; 0 <= o; o--) {
					let s = t[o], c = n[o];
					i |= s << a, a += c, a === 30 ? (e.__setDigit(r++, i), a = 0, i = 0) : 30 < a && (e.__setDigit(r++, 1073741823 & i), a -= 30, i = s >>> c - a);
				}
				if (i !== 0) {
					if (r >= e.length) throw Error("implementation bug");
					e.__setDigit(r++, i);
				}
				for (; r < e.length; r++) e.__setDigit(r, 0);
			}
			static __toStringBasePowerOfTwo(e, t) {
				let n = e.length, r = t - 1;
				r = (85 & r >>> 1) + (85 & r), r = (51 & r >>> 2) + (51 & r), r = (15 & r >>> 4) + (15 & r);
				let i = r, o = t - 1, s = e.__digit(n - 1), c = a.__clz30(s), l = 0 | (30 * n - c + i - 1) / i;
				if (e.sign && l++, 268435456 < l) throw Error("string too long");
				let u = Array(l), d = l - 1, f = 0, p = 0;
				for (let t = 0; t < n - 1; t++) {
					let n = e.__digit(t), r = (f | n << p) & o;
					u[d--] = a.__kConversionChars[r];
					let s = i - p;
					for (f = n >>> s, p = 30 - s; p >= i;) u[d--] = a.__kConversionChars[f & o], f >>>= i, p -= i;
				}
				let m = (f | s << p) & o;
				for (u[d--] = a.__kConversionChars[m], f = s >>> i - p; f !== 0;) u[d--] = a.__kConversionChars[f & o], f >>>= i;
				if (e.sign && (u[d--] = "-"), d != -1) throw Error("implementation bug");
				return u.join("");
			}
			static __toStringGeneric(e, t, n) {
				let r = e.length;
				if (r === 0) return "";
				if (r === 1) {
					let r = e.__unsignedDigit(0).toString(t);
					return !1 === n && e.sign && (r = "-" + r), r;
				}
				let i = 30 * r - a.__clz30(e.__digit(r - 1)), o = a.__kMaxBitsPerChar[t] - 1, s = i * a.__kBitsPerCharTableMultiplier;
				s += o - 1, s = 0 | s / o;
				let c = s + 1 >> 1, l = a.exponentiate(a.__oneDigit(t, !1), a.__oneDigit(c, !1)), u, d, f = l.__unsignedDigit(0);
				if (l.length === 1 && 32767 >= f) {
					u = new a(e.length, !1), u.__initializeDigits();
					let n = 0;
					for (let t = 2 * e.length - 1; 0 <= t; t--) {
						let r = n << 15 | e.__halfDigit(t);
						u.__setHalfDigit(t, 0 | r / f), n = 0 | r % f;
					}
					d = n.toString(t);
				} else {
					let n = a.__absoluteDivLarge(e, l, !0, !0);
					u = n.quotient;
					let r = n.remainder.__trim();
					d = a.__toStringGeneric(r, t, !0);
				}
				u.__trim();
				let p = a.__toStringGeneric(u, t, !0);
				for (; d.length < c;) d = "0" + d;
				return !1 === n && e.sign && (p = "-" + p), p + d;
			}
			static __unequalSign(e) {
				return e ? -1 : 1;
			}
			static __absoluteGreater(e) {
				return e ? -1 : 1;
			}
			static __absoluteLess(e) {
				return e ? 1 : -1;
			}
			static __compareToBigInt(e, t) {
				let n = e.sign;
				if (n !== t.sign) return a.__unequalSign(n);
				let r = a.__absoluteCompare(e, t);
				return 0 < r ? a.__absoluteGreater(n) : 0 > r ? a.__absoluteLess(n) : 0;
			}
			static __compareToNumber(e, t) {
				if (a.__isOneDigitInt(t)) {
					let r = e.sign, i = 0 > t;
					if (r !== i) return a.__unequalSign(r);
					if (e.length === 0) {
						if (i) throw Error("implementation bug");
						return t === 0 ? 0 : -1;
					}
					if (1 < e.length) return a.__absoluteGreater(r);
					let o = n(t), s = e.__unsignedDigit(0);
					return s > o ? a.__absoluteGreater(r) : s < o ? a.__absoluteLess(r) : 0;
				}
				return a.__compareToDouble(e, t);
			}
			static __compareToDouble(e, t) {
				if (t !== t) return t;
				if (t === 1 / 0) return -1;
				if (t === -Infinity) return 1;
				let n = e.sign;
				if (n !== 0 > t) return a.__unequalSign(n);
				if (t === 0) throw Error("implementation bug: should be handled elsewhere");
				if (e.length === 0) return -1;
				a.__kBitConversionDouble[0] = t;
				let r = 2047 & a.__kBitConversionInts[1] >>> 20;
				if (r == 2047) throw Error("implementation bug: handled elsewhere");
				let i = r - 1023;
				if (0 > i) return a.__absoluteGreater(n);
				let o = e.length, s = e.__digit(o - 1), c = a.__clz30(s), l = 30 * o - c, u = i + 1;
				if (l < u) return a.__absoluteLess(n);
				if (l > u) return a.__absoluteGreater(n);
				let d = 1048576 | 1048575 & a.__kBitConversionInts[1], f = a.__kBitConversionInts[0], p = 29 - c;
				if (p !== (0 | (l - 1) % 30)) throw Error("implementation bug");
				let m, h = 0;
				if (20 > p) {
					let e = 20 - p;
					h = e + 32, m = d >>> e, d = d << 32 - e | f >>> e, f <<= 32 - e;
				} else if (p === 20) h = 32, m = d, d = f, f = 0;
				else {
					let e = p - 20;
					h = 32 - e, m = d << e | f >>> 32 - e, d = f << e, f = 0;
				}
				if (s >>>= 0, m >>>= 0, s > m) return a.__absoluteGreater(n);
				if (s < m) return a.__absoluteLess(n);
				for (let t = o - 2; 0 <= t; t--) {
					0 < h ? (h -= 30, m = d >>> 2, d = d << 30 | f >>> 2, f <<= 30) : m = 0;
					let r = e.__unsignedDigit(t);
					if (r > m) return a.__absoluteGreater(n);
					if (r < m) return a.__absoluteLess(n);
				}
				if (d !== 0 || f !== 0) {
					if (h === 0) throw Error("implementation bug");
					return a.__absoluteLess(n);
				}
				return 0;
			}
			static __equalToNumber(e, t) {
				return a.__isOneDigitInt(t) ? t === 0 ? e.length === 0 : e.length === 1 && e.sign === 0 > t && e.__unsignedDigit(0) === n(t) : a.__compareToDouble(e, t) === 0;
			}
			static __comparisonResultToBool(e, t) {
				return t === 0 ? 0 > e : t === 1 ? 0 >= e : t === 2 ? 0 < e : t === 3 ? 0 <= e : void 0;
			}
			static __compare(e, t, n) {
				if (e = a.__toPrimitive(e), t = a.__toPrimitive(t), typeof e == "string" && typeof t == "string") switch (n) {
					case 0: return e < t;
					case 1: return e <= t;
					case 2: return e > t;
					case 3: return e >= t;
				}
				if (a.__isBigInt(e) && typeof t == "string") return t = a.__fromString(t), t !== null && a.__comparisonResultToBool(a.__compareToBigInt(e, t), n);
				if (typeof e == "string" && a.__isBigInt(t)) return e = a.__fromString(e), e !== null && a.__comparisonResultToBool(a.__compareToBigInt(e, t), n);
				if (e = a.__toNumeric(e), t = a.__toNumeric(t), a.__isBigInt(e)) {
					if (a.__isBigInt(t)) return a.__comparisonResultToBool(a.__compareToBigInt(e, t), n);
					if (typeof t != "number") throw Error("implementation bug");
					return a.__comparisonResultToBool(a.__compareToNumber(e, t), n);
				}
				if (typeof e != "number") throw Error("implementation bug");
				if (a.__isBigInt(t)) return a.__comparisonResultToBool(a.__compareToNumber(t, e), 2 ^ n);
				if (typeof t != "number") throw Error("implementation bug");
				return n === 0 ? e < t : n === 1 ? e <= t : n === 2 ? e > t : n === 3 ? e >= t : void 0;
			}
			__clzmsd() {
				return a.__clz30(this.__digit(this.length - 1));
			}
			static __absoluteAdd(e, t, n) {
				if (e.length < t.length) return a.__absoluteAdd(t, e, n);
				if (e.length === 0) return e;
				if (t.length === 0) return e.sign === n ? e : a.unaryMinus(e);
				let r = e.length;
				(e.__clzmsd() === 0 || t.length === e.length && t.__clzmsd() === 0) && r++;
				let i = new a(r, n), o = 0, s = 0;
				for (; s < t.length; s++) {
					let n = e.__digit(s) + t.__digit(s) + o;
					o = n >>> 30, i.__setDigit(s, 1073741823 & n);
				}
				for (; s < e.length; s++) {
					let t = e.__digit(s) + o;
					o = t >>> 30, i.__setDigit(s, 1073741823 & t);
				}
				return s < i.length && i.__setDigit(s, o), i.__trim();
			}
			static __absoluteSub(e, t, n) {
				if (e.length === 0) return e;
				if (t.length === 0) return e.sign === n ? e : a.unaryMinus(e);
				let r = new a(e.length, n), i = 0, o = 0;
				for (; o < t.length; o++) {
					let n = e.__digit(o) - t.__digit(o) - i;
					i = 1 & n >>> 30, r.__setDigit(o, 1073741823 & n);
				}
				for (; o < e.length; o++) {
					let t = e.__digit(o) - i;
					i = 1 & t >>> 30, r.__setDigit(o, 1073741823 & t);
				}
				return r.__trim();
			}
			static __absoluteAddOne(e, t, n = null) {
				let r = e.length;
				n === null ? n = new a(r, t) : n.sign = t;
				let i = 1;
				for (let t = 0; t < r; t++) {
					let r = e.__digit(t) + i;
					i = r >>> 30, n.__setDigit(t, 1073741823 & r);
				}
				return i != 0 && n.__setDigitGrow(r, 1), n;
			}
			static __absoluteSubOne(e, t) {
				let n = e.length;
				t ||= n;
				let r = new a(t, !1), i = 1;
				for (let t = 0; t < n; t++) {
					let n = e.__digit(t) - i;
					i = 1 & n >>> 30, r.__setDigit(t, 1073741823 & n);
				}
				if (i != 0) throw Error("implementation bug");
				for (let e = n; e < t; e++) r.__setDigit(e, 0);
				return r;
			}
			static __absoluteAnd(e, t, n = null) {
				let r = e.length, i = t.length, o = i;
				if (r < i) {
					o = r;
					let n = e, a = r;
					e = t, r = i, t = n, i = a;
				}
				let s = o;
				n === null ? n = new a(s, !1) : s = n.length;
				let c = 0;
				for (; c < o; c++) n.__setDigit(c, e.__digit(c) & t.__digit(c));
				for (; c < s; c++) n.__setDigit(c, 0);
				return n;
			}
			static __absoluteAndNot(e, t, n = null) {
				let r = e.length, i = t.length, o = i;
				r < i && (o = r);
				let s = r;
				n === null ? n = new a(s, !1) : s = n.length;
				let c = 0;
				for (; c < o; c++) n.__setDigit(c, e.__digit(c) & ~t.__digit(c));
				for (; c < r; c++) n.__setDigit(c, e.__digit(c));
				for (; c < s; c++) n.__setDigit(c, 0);
				return n;
			}
			static __absoluteOr(e, t, n = null) {
				let r = e.length, i = t.length, o = i;
				if (r < i) {
					o = r;
					let n = e, a = r;
					e = t, r = i, t = n, i = a;
				}
				let s = r;
				n === null ? n = new a(s, !1) : s = n.length;
				let c = 0;
				for (; c < o; c++) n.__setDigit(c, e.__digit(c) | t.__digit(c));
				for (; c < r; c++) n.__setDigit(c, e.__digit(c));
				for (; c < s; c++) n.__setDigit(c, 0);
				return n;
			}
			static __absoluteXor(e, t, n = null) {
				let r = e.length, i = t.length, o = i;
				if (r < i) {
					o = r;
					let n = e, a = r;
					e = t, r = i, t = n, i = a;
				}
				let s = r;
				n === null ? n = new a(s, !1) : s = n.length;
				let c = 0;
				for (; c < o; c++) n.__setDigit(c, e.__digit(c) ^ t.__digit(c));
				for (; c < r; c++) n.__setDigit(c, e.__digit(c));
				for (; c < s; c++) n.__setDigit(c, 0);
				return n;
			}
			static __absoluteCompare(e, t) {
				let n = e.length - t.length;
				if (n != 0) return n;
				let r = e.length - 1;
				for (; 0 <= r && e.__digit(r) === t.__digit(r);) r--;
				return 0 > r ? 0 : e.__unsignedDigit(r) > t.__unsignedDigit(r) ? 1 : -1;
			}
			static __multiplyAccumulate(e, t, n, r) {
				if (t === 0) return;
				let i = 32767 & t, o = t >>> 15, s = 0, c = 0;
				for (let t, l = 0; l < e.length; l++, r++) {
					t = n.__digit(r);
					let u = e.__digit(l), d = 32767 & u, f = u >>> 15, p = a.__imul(d, i), m = a.__imul(d, o), h = a.__imul(f, i), g = a.__imul(f, o);
					t += c + p + s, s = t >>> 30, t &= 1073741823, t += ((32767 & m) << 15) + ((32767 & h) << 15), s += t >>> 30, c = g + (m >>> 15) + (h >>> 15), n.__setDigit(r, 1073741823 & t);
				}
				for (; s != 0 || c !== 0; r++) {
					let e = n.__digit(r);
					e += s + c, c = 0, s = e >>> 30, n.__setDigit(r, 1073741823 & e);
				}
			}
			static __internalMultiplyAdd(e, t, n, r, i) {
				let o = n, s = 0;
				for (let n = 0; n < r; n++) {
					let r = e.__digit(n), c = a.__imul(32767 & r, t), l = a.__imul(r >>> 15, t), u = c + ((32767 & l) << 15) + s + o;
					o = u >>> 30, s = l >>> 15, i.__setDigit(n, 1073741823 & u);
				}
				if (i.length > r) for (i.__setDigit(r++, o + s); r < i.length;) i.__setDigit(r++, 0);
				else if (o + s !== 0) throw Error("implementation bug");
			}
			__inplaceMultiplyAdd(e, t, n) {
				n > this.length && (n = this.length);
				let r = 32767 & e, i = e >>> 15, o = 0, s = t;
				for (let e = 0; e < n; e++) {
					let t = this.__digit(e), n = 32767 & t, c = t >>> 15, l = a.__imul(n, r), u = a.__imul(n, i), d = a.__imul(c, r), f = a.__imul(c, i), p = s + l + o;
					o = p >>> 30, p &= 1073741823, p += ((32767 & u) << 15) + ((32767 & d) << 15), o += p >>> 30, s = f + (u >>> 15) + (d >>> 15), this.__setDigit(e, 1073741823 & p);
				}
				if (o != 0 || s !== 0) throw Error("implementation bug");
			}
			static __absoluteDivSmall(e, t, n = null) {
				n === null && (n = new a(e.length, !1));
				let r = 0;
				for (let i, a = 2 * e.length - 1; 0 <= a; a -= 2) {
					i = (r << 15 | e.__halfDigit(a)) >>> 0;
					let o = 0 | i / t;
					r = 0 | i % t, i = (r << 15 | e.__halfDigit(a - 1)) >>> 0;
					let s = 0 | i / t;
					r = 0 | i % t, n.__setDigit(a >>> 1, o << 15 | s);
				}
				return n;
			}
			static __absoluteModSmall(e, t) {
				let n = 0;
				for (let r = 2 * e.length - 1; 0 <= r; r--) n = 0 | ((n << 15 | e.__halfDigit(r)) >>> 0) % t;
				return n;
			}
			static __absoluteDivLarge(e, t, n, r) {
				let i = t.__halfDigitLength(), o = t.length, s = e.__halfDigitLength() - i, c = null;
				n && (c = new a(s + 2 >>> 1, !1), c.__initializeDigits());
				let l = new a(i + 2 >>> 1, !1);
				l.__initializeDigits();
				let u = a.__clz15(t.__halfDigit(i - 1));
				0 < u && (t = a.__specialLeftShift(t, u, 0));
				let d = a.__specialLeftShift(e, u, 1), f = t.__halfDigit(i - 1), p = 0;
				for (let e, r = s; 0 <= r; r--) {
					e = 32767;
					let s = d.__halfDigit(r + i);
					if (s !== f) {
						let n = (s << 15 | d.__halfDigit(r + i - 1)) >>> 0;
						e = 0 | n / f;
						let o = 0 | n % f, c = t.__halfDigit(i - 2), l = d.__halfDigit(r + i - 2);
						for (; a.__imul(e, c) >>> 0 > (o << 16 | l) >>> 0 && (e--, o += f, !(32767 < o)););
					}
					a.__internalMultiplyAdd(t, e, 0, o, l);
					let u = d.__inplaceSub(l, r, i + 1);
					u !== 0 && (u = d.__inplaceAdd(t, r, i), d.__setHalfDigit(r + i, 32767 & d.__halfDigit(r + i) + u), e--), n && (1 & r ? p = e << 15 : c.__setDigit(r >>> 1, p | e));
				}
				if (r) return d.__inplaceRightShift(u), n ? {
					quotient: c,
					remainder: d
				} : d;
				if (n) return c;
				throw Error("unreachable");
			}
			static __clz15(e) {
				return a.__clz30(e) - 15;
			}
			__inplaceAdd(e, t, n) {
				let r = 0;
				for (let i = 0; i < n; i++) {
					let n = this.__halfDigit(t + i) + e.__halfDigit(i) + r;
					r = n >>> 15, this.__setHalfDigit(t + i, 32767 & n);
				}
				return r;
			}
			__inplaceSub(e, t, n) {
				let r = 0;
				if (1 & t) {
					t >>= 1;
					let i = this.__digit(t), a = 32767 & i, o = 0;
					for (; o < n - 1 >>> 1; o++) {
						let n = e.__digit(o), s = (i >>> 15) - (32767 & n) - r;
						r = 1 & s >>> 15, this.__setDigit(t + o, (32767 & s) << 15 | 32767 & a), i = this.__digit(t + o + 1), a = (32767 & i) - (n >>> 15) - r, r = 1 & a >>> 15;
					}
					let s = e.__digit(o), c = (i >>> 15) - (32767 & s) - r;
					if (r = 1 & c >>> 15, this.__setDigit(t + o, (32767 & c) << 15 | 32767 & a), t + o + 1 >= this.length) throw RangeError("out of bounds");
					!(1 & n) && (i = this.__digit(t + o + 1), a = (32767 & i) - (s >>> 15) - r, r = 1 & a >>> 15, this.__setDigit(t + e.length, 1073709056 & i | 32767 & a));
				} else {
					t >>= 1;
					let i = 0;
					for (; i < e.length - 1; i++) {
						let n = this.__digit(t + i), a = e.__digit(i), o = (32767 & n) - (32767 & a) - r;
						r = 1 & o >>> 15;
						let s = (n >>> 15) - (a >>> 15) - r;
						r = 1 & s >>> 15, this.__setDigit(t + i, (32767 & s) << 15 | 32767 & o);
					}
					let a = this.__digit(t + i), o = e.__digit(i), s = (32767 & a) - (32767 & o) - r;
					r = 1 & s >>> 15;
					let c = 0;
					!(1 & n) && (c = (a >>> 15) - (o >>> 15) - r, r = 1 & c >>> 15), this.__setDigit(t + i, (32767 & c) << 15 | 32767 & s);
				}
				return r;
			}
			__inplaceRightShift(e) {
				if (e === 0) return;
				let t = this.__digit(0) >>> e, n = this.length - 1;
				for (let r = 0; r < n; r++) {
					let n = this.__digit(r + 1);
					this.__setDigit(r, 1073741823 & n << 30 - e | t), t = n >>> e;
				}
				this.__setDigit(n, t);
			}
			static __specialLeftShift(e, t, n) {
				let r = e.length, i = new a(r + n, !1);
				if (t === 0) {
					for (let t = 0; t < r; t++) i.__setDigit(t, e.__digit(t));
					return 0 < n && i.__setDigit(r, 0), i;
				}
				let o = 0;
				for (let n = 0; n < r; n++) {
					let r = e.__digit(n);
					i.__setDigit(n, 1073741823 & r << t | o), o = r >>> 30 - t;
				}
				return 0 < n && i.__setDigit(r, o), i;
			}
			static __leftShiftByAbsolute(e, t) {
				let n = a.__toShiftAmount(t);
				if (0 > n) throw RangeError("BigInt too big");
				let r = 0 | n / 30, i = n % 30, o = e.length, s = i !== 0 && !!(e.__digit(o - 1) >>> 30 - i), c = o + r + +!!s, l = new a(c, e.sign);
				if (i === 0) {
					let t = 0;
					for (; t < r; t++) l.__setDigit(t, 0);
					for (; t < c; t++) l.__setDigit(t, e.__digit(t - r));
				} else {
					let t = 0;
					for (let e = 0; e < r; e++) l.__setDigit(e, 0);
					for (let n = 0; n < o; n++) {
						let a = e.__digit(n);
						l.__setDigit(n + r, 1073741823 & a << i | t), t = a >>> 30 - i;
					}
					if (s) l.__setDigit(o + r, t);
					else if (t !== 0) throw Error("implementation bug");
				}
				return l.__trim();
			}
			static __rightShiftByAbsolute(e, t) {
				let n = e.length, r = e.sign, i = a.__toShiftAmount(t);
				if (0 > i) return a.__rightShiftByMaximum(r);
				let o = 0 | i / 30, s = i % 30, c = n - o;
				if (0 >= c) return a.__rightShiftByMaximum(r);
				let l = !1;
				if (r) {
					if (e.__digit(o) & (1 << s) - 1) l = !0;
					else for (let t = 0; t < o; t++) if (e.__digit(t) !== 0) {
						l = !0;
						break;
					}
				}
				l && s === 0 && ~e.__digit(n - 1) == 0 && c++;
				let u = new a(c, r);
				if (s === 0) {
					u.__setDigit(c - 1, 0);
					for (let t = o; t < n; t++) u.__setDigit(t - o, e.__digit(t));
				} else {
					let t = e.__digit(o) >>> s, r = n - o - 1;
					for (let n = 0; n < r; n++) {
						let r = e.__digit(n + o + 1);
						u.__setDigit(n, 1073741823 & r << 30 - s | t), t = r >>> s;
					}
					u.__setDigit(r, t);
				}
				return l && (u = a.__absoluteAddOne(u, !0, u)), u.__trim();
			}
			static __rightShiftByMaximum(e) {
				return e ? a.__oneDigit(1, !0) : a.__zero();
			}
			static __toShiftAmount(e) {
				if (1 < e.length) return -1;
				let t = e.__unsignedDigit(0);
				return t > a.__kMaxLengthBits ? -1 : t;
			}
			static __toPrimitive(e, t = "default") {
				if (typeof e != "object" || e.constructor === a) return e;
				if (typeof Symbol < "u" && typeof Symbol.toPrimitive == "symbol") {
					let n = e[Symbol.toPrimitive];
					if (n) {
						let e = n(t);
						if (typeof e != "object") return e;
						throw TypeError("Cannot convert object to primitive value");
					}
				}
				let n = e.valueOf;
				if (n) {
					let t = n.call(e);
					if (typeof t != "object") return t;
				}
				let r = e.toString;
				if (r) {
					let t = r.call(e);
					if (typeof t != "object") return t;
				}
				throw TypeError("Cannot convert object to primitive value");
			}
			static __toNumeric(e) {
				return a.__isBigInt(e) ? e : +e;
			}
			static __isBigInt(e) {
				return typeof e == "object" && !!e && e.constructor === a;
			}
			static __truncateToNBits(e, t) {
				let n = 0 | (e + 29) / 30, r = new a(n, t.sign), i = n - 1;
				for (let e = 0; e < i; e++) r.__setDigit(e, t.__digit(e));
				let o = t.__digit(i);
				if (e % 30 != 0) {
					let t = 32 - e % 30;
					o = o << t >>> t;
				}
				return r.__setDigit(i, o), r.__trim();
			}
			static __truncateAndSubFromPowerOfTwo(e, t, n) {
				var r = Math.min;
				let i = 0 | (e + 29) / 30, o = new a(i, n), s = 0, c = i - 1, l = 0;
				for (let e = r(c, t.length); s < e; s++) {
					let e = 0 - t.__digit(s) - l;
					l = 1 & e >>> 30, o.__setDigit(s, 1073741823 & e);
				}
				for (; s < c; s++) o.__setDigit(s, 0 | 1073741823 & -l);
				let u = c < t.length ? t.__digit(c) : 0, d = e % 30, f;
				if (d == 0) f = 0 - u - l, f &= 1073741823;
				else {
					let e = 32 - d;
					u = u << e >>> e;
					let t = 1 << 32 - e;
					f = t - u - l, f &= t - 1;
				}
				return o.__setDigit(c, f), o.__trim();
			}
			__digit(e) {
				return this[e];
			}
			__unsignedDigit(e) {
				return this[e] >>> 0;
			}
			__setDigit(e, t) {
				this[e] = 0 | t;
			}
			__setDigitGrow(e, t) {
				this[e] = 0 | t;
			}
			__halfDigitLength() {
				let e = this.length;
				return 32767 >= this.__unsignedDigit(e - 1) ? 2 * e - 1 : 2 * e;
			}
			__halfDigit(e) {
				return 32767 & this[e >>> 1] >>> 15 * (1 & e);
			}
			__setHalfDigit(e, t) {
				let n = e >>> 1, r = this.__digit(n), i = 1 & e ? 32767 & r | t << 15 : 1073709056 & r | 32767 & t;
				this.__setDigit(n, i);
			}
			static __digitPow(e, t) {
				let n = 1;
				for (; 0 < t;) 1 & t && (n *= e), t >>>= 1, e *= e;
				return n;
			}
			static __isOneDigitInt(e) {
				return (1073741823 & e) === e;
			}
		}
		return a.__kMaxLength = 33554432, a.__kMaxLengthBits = a.__kMaxLength << 5, a.__kMaxBitsPerChar = [
			0,
			0,
			32,
			51,
			64,
			75,
			83,
			90,
			96,
			102,
			107,
			111,
			115,
			119,
			122,
			126,
			128,
			131,
			134,
			136,
			139,
			141,
			143,
			145,
			147,
			149,
			151,
			153,
			154,
			156,
			158,
			159,
			160,
			162,
			163,
			165,
			166
		], a.__kBitsPerCharTableShift = 5, a.__kBitsPerCharTableMultiplier = 1 << a.__kBitsPerCharTableShift, a.__kConversionChars = /* @__PURE__ */ "0123456789abcdefghijklmnopqrstuvwxyz".split(""), a.__kBitConversionBuffer = /* @__PURE__ */ new ArrayBuffer(8), a.__kBitConversionDouble = new Float64Array(a.__kBitConversionBuffer), a.__kBitConversionInts = new Int32Array(a.__kBitConversionBuffer), a.__clz30 = t ? function(e) {
			return t(e) - 2;
		} : function(e) {
			var t = Math.LN2, n = Math.log;
			return e === 0 ? 30 : 0 | 29 - (0 | n(e >>> 0) / t);
		}, a.__imul = e || function(e, t) {
			return 0 | e * t;
		}, a;
	});
})), cr = /* @__PURE__ */ s(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = kn(), r = t(or()), i = t(sr()), a = (e, t) => i.default.bitwiseXor(i.default.asUintN(64, i.default.leftShift(e, i.default.BigInt(t))), i.default.BigInt(i.default.asUintN(64, i.default.signedRightShift(e, i.default.subtract(i.default.BigInt(64), i.default.BigInt(t))))));
	e.default = class {
		constructor(e) {
			this.next = () => new r.default(this.roll().toString()), this.nextDouble = () => new r.default(this.roll().toString()).div(0x10000000000000000), this.nextInt = (e, t) => Math.floor(this.nextDouble().toNumber() * (t - e + 1) + e), this.nextByte = () => this.nextInt(0, 255), this.nextData = (e) => [...Array(e)].map(() => this.nextByte());
			let t = n.sha256Hash(e);
			this.s = [
				i.default.BigInt(0),
				i.default.BigInt(0),
				i.default.BigInt(0),
				i.default.BigInt(0)
			], this.setS(t);
		}
		setS(e) {
			for (let t = 0; t < 4; t++) {
				let n = t * 8, r = i.default.BigInt(0);
				for (let t = 0; t < 8; t++) r = i.default.asUintN(64, i.default.leftShift(r, i.default.BigInt(8))), r = i.default.asUintN(64, i.default.bitwiseOr(r, i.default.BigInt(e[n + t])));
				this.s[t] = i.default.asUintN(64, r);
			}
		}
		roll() {
			let e = i.default.asUintN(64, i.default.multiply(a(i.default.asUintN(64, i.default.multiply(this.s[1], i.default.BigInt(5))), 7), i.default.BigInt(9))), t = i.default.asUintN(64, i.default.leftShift(this.s[1], i.default.BigInt(17)));
			return this.s[2] = i.default.asUintN(64, i.default.bitwiseXor(this.s[2], i.default.BigInt(this.s[0]))), this.s[3] = i.default.asUintN(64, i.default.bitwiseXor(this.s[3], i.default.BigInt(this.s[1]))), this.s[1] = i.default.asUintN(64, i.default.bitwiseXor(this.s[1], i.default.BigInt(this.s[2]))), this.s[0] = i.default.asUintN(64, i.default.bitwiseXor(this.s[0], i.default.BigInt(this.s[3]))), this.s[2] = i.default.asUintN(64, i.default.bitwiseXor(this.s[2], i.default.BigInt(t))), this.s[3] = i.default.asUintN(64, a(this.s[3], 45)), e;
		}
	};
})), lr = /* @__PURE__ */ c({ default: () => pr }), ur, dr, fr, pr, mr = o((() => {
	ur = function(e, t) {
		var n = e.reduce(function(t, n) {
			if (n < 0) throw Error("Probability must be a positive: p[" + e.indexOf(n) + "]=" + n);
			return t + n;
		}, 0);
		if (n === 0) throw Error("Probability sum must be greater than zero.");
		for (var r = e.map(function(e) {
			return e * t / n;
		}), i = {
			prob: Array(t),
			alias: Array(t)
		}, a = [], o = [], s = t - 1; s >= 0; s--) r[s] < 1 ? a.push(s) : o.push(s);
		for (; a.length > 0 && o.length > 0;) {
			var c = a.pop(), l = o.pop();
			i.prob[c] = r[c], i.alias[c] = l, r[l] = r[l] + r[c] - 1, r[l] < 1 ? a.push(l) : o.push(l);
		}
		for (; o.length > 0;) i.prob[o.pop()] = 1;
		for (; a.length > 0;) i.prob[a.pop()] = 1;
		return i;
	}, dr = function(e, t, n) {
		var r = Math.floor(n() * e.prob.length);
		return t[n() < e.prob[r] ? r : e.alias[r]];
	}, fr = function(e, t, n, r) {
		if (r === void 0 && (r = 1), r === 1) return dr(e, t, n);
		for (var i = [], a = 0; a < r; a++) i.push(dr(e, t, n));
		return i;
	}, pr = function(e, t, n) {
		if (n === void 0 && (n = Math.random), !Array.isArray(e)) throw Error("Probabilities must be an array.");
		if (e.length === 0) throw Error("Probabilities array must not be empty.");
		var r = e.length, i = t ?? Array.from({ length: r }, function(e, t) {
			return t;
		}), a = ur(e, r);
		return { next: function(e) {
			return e === void 0 && (e = 1), fr(a, i, n, e);
		} };
	};
})), hr = /* @__PURE__ */ s(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.chooseFragments = e.shuffle = e.chooseDegree = void 0;
	var n = kn(), r = t(cr()), i = t((mr(), d(lr)));
	e.chooseDegree = (e, t) => {
		let n = [...Array(e)].map((e, t) => 1 / (t + 1));
		return i.default(n, void 0, t.nextDouble).next() + 1;
	}, e.shuffle = (e, t) => {
		let n = [...e], r = [];
		for (; n.length > 0;) {
			let e = t.nextInt(0, n.length - 1), i = n[e];
			n.splice(e, 1), r.push(i);
		}
		return r;
	}, e.chooseFragments = (t, i, a) => {
		if (t <= i) return [t - 1];
		{
			let o = Buffer.concat([n.intToBytes(t), n.intToBytes(a)]), s = new r.default(o), c = e.chooseDegree(i, s), l = [...Array(i)].map((e, t) => t);
			return e.shuffle(l, s).slice(0, c);
		}
	};
})), gr = /* @__PURE__ */ s(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.FountainEncoderPart = void 0;
	var n = t(ar()), r = kn(), i = hr(), a = jn(), o = class e {
		constructor(e, t, n, r, i) {
			this._seqNum = e, this._seqLength = t, this._messageLength = n, this._checksum = r, this._fragment = i;
		}
		get messageLength() {
			return this._messageLength;
		}
		get fragment() {
			return this._fragment;
		}
		get seqNum() {
			return this._seqNum;
		}
		get seqLength() {
			return this._seqLength;
		}
		get checksum() {
			return this._checksum;
		}
		cbor() {
			let e = a.cborEncode([
				this._seqNum,
				this._seqLength,
				this._messageLength,
				this._checksum,
				this._fragment
			]);
			return Buffer.from(e);
		}
		description() {
			return `seqNum:${this._seqNum}, seqLen:${this._seqLength}, messageLen:${this._messageLength}, checksum:${this._checksum}, data:${this._fragment.toString("hex")}`;
		}
		static fromCBOR(t) {
			let [r, i, o, s, c] = a.cborDecode(t);
			return n.default(typeof r == "number"), n.default(typeof i == "number"), n.default(typeof o == "number"), n.default(typeof s == "number"), n.default(Buffer.isBuffer(c) && c.length > 0), new e(r, i, o, s, Buffer.from(c));
		}
	};
	e.FountainEncoderPart = o, e.default = class e {
		constructor(t, n = 100, i = 0, a = 10) {
			let o = e.findNominalFragmentLength(t.length, a, n);
			this._messageLength = t.length, this._fragments = e.partitionMessage(t, o), this.fragmentLength = o, this.seqNum = r.toUint32(i), this.checksum = r.getCRC(t);
		}
		get fragmentsLength() {
			return this._fragments.length;
		}
		get fragments() {
			return this._fragments;
		}
		get messageLength() {
			return this._messageLength;
		}
		isComplete() {
			return this.seqNum >= this._fragments.length;
		}
		isSinglePart() {
			return this._fragments.length === 1;
		}
		seqLength() {
			return this._fragments.length;
		}
		mix(e) {
			return e.reduce((e, t) => r.bufferXOR(this._fragments[t], e), Buffer.alloc(this.fragmentLength, 0));
		}
		nextPart() {
			this.seqNum = r.toUint32(this.seqNum + 1);
			let e = i.chooseFragments(this.seqNum, this._fragments.length, this.checksum), t = this.mix(e);
			return new o(this.seqNum, this._fragments.length, this._messageLength, this.checksum, t);
		}
		static findNominalFragmentLength(e, t, r) {
			n.default(e > 0), n.default(t > 0), n.default(r >= t);
			let i = Math.ceil(e / t), a = 0;
			for (let t = 1; t <= i && (a = Math.ceil(e / t), !(a <= r)); t++);
			return a;
		}
		static partitionMessage(e, t) {
			let n = Buffer.from(e), i, a = [];
			for (; n.length > 0;) [i, n] = r.split(n, -t), i = Buffer.alloc(t, 0).fill(i, 0, i.length), a.push(i);
			return a;
		}
	};
})), _r = /* @__PURE__ */ s(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = t(ar()), r = kn(), i = "ableacidalsoapexaquaarchatomauntawayaxisbackbaldbarnbeltbetabiasbluebodybragbrewbulbbuzzcalmcashcatschefcityclawcodecolacookcostcruxcurlcuspcyandarkdatadaysdelidicedietdoordowndrawdropdrumdulldutyeacheasyechoedgeepicevenexamexiteyesfactfairfernfigsfilmfishfizzflapflewfluxfoxyfreefrogfuelfundgalagamegeargemsgiftgirlglowgoodgraygrimgurugushgyrohalfhanghardhawkheathelphighhillholyhopehornhutsicedideaidleinchinkyintoirisironitemjadejazzjoinjoltjowljudojugsjumpjunkjurykeepkenokeptkeyskickkilnkingkitekiwiknoblamblavalazyleaflegsliarlimplionlistlogoloudloveluaulucklungmainmanymathmazememomenumeowmildmintmissmonknailnavyneednewsnextnoonnotenumbobeyoboeomitonyxopenovalowlspaidpartpeckplaypluspoempoolposepuffpumapurrquadquizraceramprealredorichroadrockroofrubyruinrunsrustsafesagascarsetssilkskewslotsoapsolosongstubsurfswantacotasktaxitenttiedtimetinytoiltombtoystriptunatwinuglyundouniturgeuservastveryvetovialvibeviewvisavoidvowswallwandwarmwaspwavewaxywebswhatwhenwhizwolfworkyankyawnyellyogayurtzapszerozestzinczonezoom", a = [], o = 256, s = 4, c = 2, l;
	(function(e) {
		e.STANDARD = "standard", e.URI = "uri", e.MINIMAL = "minimal";
	})(l ||= {});
	var u = (e) => i.slice(e * s, e * s + s), d = (e) => {
		let t = u(e);
		return `${t[0]}${t[3]}`;
	}, f = (e) => `${e}${r.getCRCHex(Buffer.from(e, "hex"))}`, p = (e, t) => {
		let n = f(e);
		return Buffer.from(n, "hex").reduce((e, t) => [...e, u(t)], []).join(t);
	}, m = (e) => {
		let t = f(e);
		return Buffer.from(t, "hex").reduce((e, t) => e + d(t), "");
	}, h = (e, t) => {
		if (n.default(e.length === t, "Invalid Bytewords: word.length does not match wordLength provided"), a.length === 0) {
			a = [...Array(676)].map(() => -1);
			for (let e = 0; e < o; e++) {
				let t = u(e), n = t[0].charCodeAt(0) - 97, r = (t[3].charCodeAt(0) - 97) * 26 + n;
				a[r] = e;
			}
		}
		let r = e[0].toLowerCase().charCodeAt(0) - 97, i = e[t == 4 ? 3 : 1].toLowerCase().charCodeAt(0) - 97;
		n.default(0 <= r && r < 26 && 0 <= i && i < 26, "Invalid Bytewords: invalid word");
		let c = i * 26 + r, l = a[c];
		if (n.default(l !== -1, "Invalid Bytewords: value not in lookup table"), t == s) {
			let t = u(l), r = e[1].toLowerCase(), i = e[2].toLowerCase();
			n.default(r === t[1] && i === t[2], "Invalid Bytewords: invalid middle letters of word");
		}
		return Buffer.from([l]).toString("hex");
	}, g = (e, t, i) => {
		let a = (i == s ? e.split(t) : r.partition(e, 2)).map((e) => h(e, i)).join("");
		n.default(a.length >= 5, "Invalid Bytewords: invalid decoded string length");
		let [o, c] = r.split(Buffer.from(a, "hex"), 4), l = r.getCRCHex(o);
		return n.default(l === c.toString("hex"), "Invalid Checksum"), o.toString("hex");
	};
	e.default = {
		decode: (e, t = l.MINIMAL) => {
			switch (t) {
				case l.STANDARD: return g(e, " ", s);
				case l.URI: return g(e, "-", s);
				case l.MINIMAL: return g(e, "", c);
				default: throw Error(`Invalid style ${t}`);
			}
		},
		encode: (e, t = l.MINIMAL) => {
			switch (t) {
				case l.STANDARD: return p(e, " ");
				case l.URI: return p(e, "-");
				case l.MINIMAL: return m(e);
				default: throw Error(`Invalid style ${t}`);
			}
		},
		STYLES: l
	};
})), vr = /* @__PURE__ */ s(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = t(gr()), r = t(_r());
	e.default = class e {
		constructor(e, t, r, i) {
			this.ur = e, this.fountainEncoder = new n.default(e.cbor, t, r, i);
		}
		get fragmentsLength() {
			return this.fountainEncoder.fragmentsLength;
		}
		get fragments() {
			return this.fountainEncoder.fragments;
		}
		get messageLength() {
			return this.fountainEncoder.messageLength;
		}
		get cbor() {
			return this.ur.cbor;
		}
		encodeWhole() {
			return [...Array(this.fragmentsLength)].map(() => this.nextPart());
		}
		nextPart() {
			let t = this.fountainEncoder.nextPart();
			return this.fountainEncoder.isSinglePart() ? e.encodeSinglePart(this.ur) : e.encodePart(this.ur.type, t);
		}
		static encodeUri(e, t) {
			return [e, t.join("/")].join(":");
		}
		static encodeUR(t) {
			return e.encodeUri("ur", t);
		}
		static encodePart(t, n) {
			let i = `${n.seqNum}-${n.seqLength}`, a = r.default.encode(n.cbor().toString("hex"), r.default.STYLES.MINIMAL);
			return e.encodeUR([
				t,
				i,
				a
			]);
		}
		static encodeSinglePart(t) {
			let n = r.default.encode(t.cbor.toString("hex"), r.default.STYLES.MINIMAL);
			return e.encodeUR([t.type, n]);
		}
	};
})), yr = /* @__PURE__ */ s(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.FountainDecoderPart = void 0;
	var t = kn(), n = hr(), r = we(), i = class e {
		constructor(e, t) {
			this._indexes = e, this._fragment = t;
		}
		get indexes() {
			return this._indexes;
		}
		get fragment() {
			return this._fragment;
		}
		static fromEncoderPart(t) {
			let r = n.chooseFragments(t.seqNum, t.seqLength, t.checksum), i = t.fragment;
			return new e(r, i);
		}
		isSimple() {
			return this.indexes.length === 1;
		}
	};
	e.FountainDecoderPart = i;
	var a = class e {
		constructor() {
			this.result = void 0, this.expectedMessageLength = 0, this.expectedChecksum = 0, this.expectedFragmentLength = 0, this.processedPartsCount = 0, this.expectedPartIndexes = [], this.lastPartIndexes = [], this.queuedParts = [], this.receivedPartIndexes = [], this.mixedParts = [], this.simpleParts = [];
		}
		validatePart(e) {
			if (this.expectedPartIndexes.length === 0) [...Array(e.seqLength)].forEach((e, t) => this.expectedPartIndexes.push(t)), this.expectedMessageLength = e.messageLength, this.expectedChecksum = e.checksum, this.expectedFragmentLength = e.fragment.length;
			else if (this.expectedPartIndexes.length !== e.seqLength || this.expectedMessageLength !== e.messageLength || this.expectedChecksum !== e.checksum || this.expectedFragmentLength !== e.fragment.length) return !1;
			return !0;
		}
		reducePartByPart(e, n) {
			return t.arrayContains(e.indexes, n.indexes) ? new i(t.setDifference(e.indexes, n.indexes), t.bufferXOR(e.fragment, n.fragment)) : e;
		}
		reduceMixedBy(e) {
			let t = [];
			this.mixedParts.map(({ value: t }) => this.reducePartByPart(t, e)).forEach((e) => {
				e.isSimple() ? this.queuedParts.push(e) : t.push({
					key: e.indexes,
					value: e
				});
			}), this.mixedParts = t;
		}
		processSimplePart(n) {
			let i = n.indexes[0];
			if (!this.receivedPartIndexes.includes(i)) {
				if (this.simpleParts.push({
					key: n.indexes,
					value: n
				}), this.receivedPartIndexes.push(i), t.arraysEqual(this.receivedPartIndexes, this.expectedPartIndexes)) {
					let n = this.simpleParts.map(({ value: e }) => e).sort((e, t) => e.indexes[0] - t.indexes[0]), i = e.joinFragments(n.map((e) => e.fragment), this.expectedMessageLength);
					t.getCRC(i) === this.expectedChecksum ? this.result = i : this.error = new r.InvalidChecksumError();
				} else this.reduceMixedBy(n);
			}
		}
		processMixedPart(e) {
			if (this.mixedParts.some(({ key: n }) => t.arraysEqual(n, e.indexes))) return;
			let n = this.simpleParts.reduce((e, { value: t }) => this.reducePartByPart(e, t), e);
			n = this.mixedParts.reduce((e, { value: t }) => this.reducePartByPart(e, t), n), n.isSimple() ? this.queuedParts.push(n) : (this.reduceMixedBy(n), this.mixedParts.push({
				key: n.indexes,
				value: n
			}));
		}
		processQueuedItem() {
			if (this.queuedParts.length === 0) return;
			let e = this.queuedParts.shift();
			e.isSimple() ? this.processSimplePart(e) : this.processMixedPart(e);
		}
		receivePart(e) {
			if (this.isComplete() || !this.validatePart(e)) return !1;
			let t = i.fromEncoderPart(e);
			for (this.lastPartIndexes = t.indexes, this.queuedParts.push(t); !this.isComplete() && this.queuedParts.length > 0;) this.processQueuedItem();
			return this.processedPartsCount += 1, !0;
		}
		isComplete() {
			return this.result !== void 0 && this.result.length > 0;
		}
		isSuccess() {
			return !!(this.error === void 0 && this.isComplete());
		}
		resultMessage() {
			return this.isSuccess() ? this.result : Buffer.from([]);
		}
		isFailure() {
			return this.error !== void 0;
		}
		resultError() {
			return this.error ? this.error.message : "";
		}
		expectedPartCount() {
			return this.expectedPartIndexes.length;
		}
		getExpectedPartIndexes() {
			return [...this.expectedPartIndexes];
		}
		getReceivedPartIndexes() {
			return [...this.receivedPartIndexes];
		}
		getLastPartIndexes() {
			return [...this.lastPartIndexes];
		}
		estimatedPercentComplete() {
			if (this.isComplete()) return 1;
			let e = this.expectedPartCount();
			return e === 0 ? 0 : Math.min(.99, this.processedPartsCount / (e * 1.75));
		}
		getProgress() {
			if (this.isComplete()) return 1;
			let e = this.expectedPartCount();
			return e === 0 ? 0 : this.receivedPartIndexes.length / e;
		}
	};
	e.default = a, a.joinFragments = (e, t) => Buffer.concat(e).slice(0, t);
})), br = /* @__PURE__ */ s(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = t(yr()), r = t(_r()), i = t(ar()), a = kn(), o = we(), s = t(Mn()), c = gr();
	e.default = class e {
		constructor(e = new n.default(), t = "bytes") {
			this.fountainDecoder = e, this.type = t, i.default(a.isURType(t), "Invalid UR type"), this.expected_type = "";
		}
		static decodeBody(e, t) {
			let n = r.default.decode(t, r.default.STYLES.MINIMAL);
			return new s.default(Buffer.from(n, "hex"), e);
		}
		validatePart(e) {
			return this.expected_type ? this.expected_type === e : a.isURType(e) ? (this.expected_type = e, !0) : !1;
		}
		static decode(t) {
			let [n, r] = this.parse(t);
			if (r.length === 0) throw new o.InvalidPathLengthError();
			let i = r[0];
			return e.decodeBody(n, i);
		}
		static parse(e) {
			let t = e.toLowerCase();
			if (t.slice(0, 3) !== "ur:") throw new o.InvalidSchemeError();
			let n = t.slice(3).split("/"), r = n[0];
			if (n.length < 2) throw new o.InvalidPathLengthError();
			if (!a.isURType(r)) throw new o.InvalidTypeError();
			return [r, n.slice(1)];
		}
		static parseSequenceComponent(e) {
			let t = e.split("-");
			if (t.length !== 2) throw new o.InvalidSequenceComponentError();
			let n = a.toUint32(Number(t[0])), r = Number(t[1]);
			if (n < 1 || r < 1) throw new o.InvalidSequenceComponentError();
			return [n, r];
		}
		receivePart(t) {
			if (this.result !== void 0) return !1;
			let [n, i] = e.parse(t);
			if (!this.validatePart(n)) return !1;
			if (i.length === 1) return this.result = e.decodeBody(n, i[0]), !0;
			if (i.length !== 2) throw new o.InvalidPathLengthError();
			let [a, l] = i, [u, d] = e.parseSequenceComponent(a), f = r.default.decode(l, r.default.STYLES.MINIMAL), p = c.FountainEncoderPart.fromCBOR(f);
			return u !== p.seqNum || d !== p.seqLength || !this.fountainDecoder.receivePart(p) ? !1 : (this.fountainDecoder.isSuccess() ? this.result = new s.default(this.fountainDecoder.resultMessage(), n) : this.fountainDecoder.isFailure() && (this.error = new o.InvalidSchemeError()), !0);
		}
		resultUR() {
			return this.result ? this.result : new s.default(Buffer.from([]));
		}
		isComplete() {
			return this.result && this.result.cbor.length > 0;
		}
		isSuccess() {
			return !this.error && this.isComplete();
		}
		isError() {
			return this.error !== void 0;
		}
		resultError() {
			return this.error ? this.error.message : "";
		}
		expectedPartCount() {
			return this.fountainDecoder.expectedPartCount();
		}
		expectedPartIndexes() {
			return this.fountainDecoder.getExpectedPartIndexes();
		}
		receivedPartIndexes() {
			return this.fountainDecoder.getReceivedPartIndexes();
		}
		lastPartIndexes() {
			return this.fountainDecoder.getLastPartIndexes();
		}
		estimatedPercentComplete() {
			return this.fountainDecoder.estimatedPercentComplete();
		}
		getProgress() {
			return this.fountainDecoder.getProgress();
		}
	};
})), xr = (/* @__PURE__ */ s(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.URDecoder = e.UREncoder = e.UR = void 0, e.UR = t(Mn()).default, e.UREncoder = t(vr()).default, e.URDecoder = t(br()).default;
})))();
function Sr(e) {
	let t = e?.expectedMessageLength;
	return typeof t == "number" && t > 0 ? t : void 0;
}
function Cr(e) {
	return e?.fountainDecoder;
}
function wr(e) {
	let t = (e?.result)?.cbor?.length;
	return typeof t == "number" && t > 0 ? t : void 0;
}
function Tr(e, t, n) {
	if (e === void 0 || t <= 0) return 0;
	let r = Math.min(1, n / t);
	return Math.round(e * r);
}
var Er = 2108;
async function* Dr(e, t) {
	let n = xr.UR.fromBuffer(Buffer.from(e)), r = new xr.UREncoder(n, t?.maxFragmentLength ?? 2111);
	for (;;) yield r.nextPart();
}
var Or = class {
	constructor() {
		this.decoder = new xr.URDecoder();
	}
	receivePart(e) {
		this.decoder.receivePart(e);
	}
	isComplete() {
		return !!this.decoder.isComplete();
	}
	get progress() {
		return this.decoder.estimatedPercentComplete();
	}
	get totalBytes() {
		return Sr(Cr(this.decoder)) ?? wr(this.decoder);
	}
	get bytesReceived() {
		return this.isComplete() ? this.totalBytes ?? 0 : Tr(this.totalBytes, this.decoder.expectedPartCount(), this.decoder.receivedPartIndexes().length);
	}
	getResult() {
		if (!this.decoder.isComplete()) throw Error("FountainDecoder: cannot get result before decoding is complete");
		if (!this.decoder.isSuccess()) throw Error(`FountainDecoder: decode failed: ${this.decoder.resultError()}`);
		return new Uint8Array(this.decoder.resultUR().decodeCBOR());
	}
}, kr = /* @__PURE__ */ ((e) => (e[e.Border = -1] = "Border", e[e.Data = 0] = "Data", e[e.Function = 1] = "Function", e[e.Position = 2] = "Position", e[e.Timing = 3] = "Timing", e[e.Alignment = 4] = "Alignment", e))(kr || {}), Ar = [0, 1], jr = [1, 0], Mr = [2, 3], Nr = [3, 2], Pr = {
	L: Ar,
	M: jr,
	Q: Mr,
	H: Nr
}, Fr = /^\d*$/, Ir = /^[A-Z0-9 $%*+./:-]*$/, Lr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:", Rr = 1, zr = 40, Br = 3, Vr = 3, Hr = 40, Ur = 10, Wr = [
	[
		-1,
		7,
		10,
		15,
		20,
		26,
		18,
		20,
		24,
		30,
		18,
		20,
		24,
		26,
		30,
		22,
		24,
		28,
		30,
		28,
		28,
		28,
		28,
		30,
		30,
		26,
		28,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	],
	[
		-1,
		10,
		16,
		26,
		18,
		24,
		16,
		18,
		22,
		22,
		26,
		30,
		22,
		22,
		24,
		24,
		28,
		28,
		26,
		26,
		26,
		26,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28
	],
	[
		-1,
		13,
		22,
		18,
		26,
		18,
		24,
		18,
		22,
		20,
		24,
		28,
		26,
		24,
		20,
		30,
		24,
		28,
		28,
		26,
		30,
		28,
		30,
		30,
		30,
		30,
		28,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	],
	[
		-1,
		17,
		28,
		22,
		16,
		22,
		28,
		26,
		26,
		24,
		28,
		24,
		28,
		22,
		24,
		24,
		30,
		28,
		28,
		26,
		28,
		30,
		24,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	]
], Gr = [
	[
		-1,
		1,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		4,
		4,
		4,
		4,
		4,
		6,
		6,
		6,
		6,
		7,
		8,
		8,
		9,
		9,
		10,
		12,
		12,
		12,
		13,
		14,
		15,
		16,
		17,
		18,
		19,
		19,
		20,
		21,
		22,
		24,
		25
	],
	[
		-1,
		1,
		1,
		1,
		2,
		2,
		4,
		4,
		4,
		5,
		5,
		5,
		8,
		9,
		9,
		10,
		10,
		11,
		13,
		14,
		16,
		17,
		17,
		18,
		20,
		21,
		23,
		25,
		26,
		28,
		29,
		31,
		33,
		35,
		37,
		38,
		40,
		43,
		45,
		47,
		49
	],
	[
		-1,
		1,
		1,
		2,
		2,
		4,
		4,
		6,
		6,
		8,
		8,
		8,
		10,
		12,
		16,
		12,
		17,
		16,
		18,
		21,
		20,
		23,
		23,
		25,
		27,
		29,
		34,
		34,
		35,
		38,
		40,
		43,
		45,
		48,
		51,
		53,
		56,
		59,
		62,
		65,
		68
	],
	[
		-1,
		1,
		1,
		2,
		4,
		4,
		4,
		5,
		6,
		8,
		8,
		11,
		11,
		16,
		16,
		18,
		16,
		19,
		21,
		25,
		25,
		25,
		34,
		30,
		32,
		35,
		37,
		40,
		42,
		45,
		48,
		51,
		54,
		57,
		60,
		63,
		66,
		70,
		74,
		77,
		81
	]
], Kr = class {
	constructor(e, t, n, r) {
		if (this.version = e, this.ecc = t, e < Rr || e > zr) throw RangeError("Version value out of range");
		if (r < -1 || r > 7) throw RangeError("Mask value out of range");
		this.size = e * 4 + 17;
		let i = Array.from({ length: this.size }).fill(!1);
		for (let e = 0; e < this.size; e++) this.modules.push(i.slice()), this.types.push(i.map(() => 0));
		this.drawFunctionPatterns();
		let a = this.addEccAndInterleave(n);
		if (this.drawCodewords(a), r === -1) {
			let e = 1e9;
			for (let t = 0; t < 8; t++) {
				this.applyMask(t), this.drawFormatBits(t);
				let n = this.getPenaltyScore();
				n < e && (r = t, e = n), this.applyMask(t);
			}
		}
		this.mask = r, this.applyMask(r), this.drawFormatBits(r);
	}
	size;
	mask;
	modules = [];
	types = [];
	getModule(e, t) {
		return e >= 0 && e < this.size && t >= 0 && t < this.size && this.modules[t][e];
	}
	drawFunctionPatterns() {
		for (let e = 0; e < this.size; e++) this.setFunctionModule(6, e, e % 2 == 0, kr.Timing), this.setFunctionModule(e, 6, e % 2 == 0, kr.Timing);
		this.drawFinderPattern(3, 3), this.drawFinderPattern(this.size - 4, 3), this.drawFinderPattern(3, this.size - 4);
		let e = this.getAlignmentPatternPositions(), t = e.length;
		for (let n = 0; n < t; n++) for (let r = 0; r < t; r++) n === 0 && r === 0 || n === 0 && r === t - 1 || n === t - 1 && r === 0 || this.drawAlignmentPattern(e[n], e[r]);
		this.drawFormatBits(0), this.drawVersion();
	}
	drawFormatBits(e) {
		let t = this.ecc[1] << 3 | e, n = t;
		for (let e = 0; e < 10; e++) n = n << 1 ^ (n >>> 9) * 1335;
		let r = (t << 10 | n) ^ 21522;
		for (let e = 0; e <= 5; e++) this.setFunctionModule(8, e, Jr(r, e));
		this.setFunctionModule(8, 7, Jr(r, 6)), this.setFunctionModule(8, 8, Jr(r, 7)), this.setFunctionModule(7, 8, Jr(r, 8));
		for (let e = 9; e < 15; e++) this.setFunctionModule(14 - e, 8, Jr(r, e));
		for (let e = 0; e < 8; e++) this.setFunctionModule(this.size - 1 - e, 8, Jr(r, e));
		for (let e = 8; e < 15; e++) this.setFunctionModule(8, this.size - 15 + e, Jr(r, e));
		this.setFunctionModule(8, this.size - 8, !0);
	}
	drawVersion() {
		if (this.version < 7) return;
		let e = this.version;
		for (let t = 0; t < 12; t++) e = e << 1 ^ (e >>> 11) * 7973;
		let t = this.version << 12 | e;
		for (let e = 0; e < 18; e++) {
			let n = Jr(t, e), r = this.size - 11 + e % 3, i = Math.floor(e / 3);
			this.setFunctionModule(r, i, n), this.setFunctionModule(i, r, n);
		}
	}
	drawFinderPattern(e, t) {
		for (let n = -4; n <= 4; n++) for (let r = -4; r <= 4; r++) {
			let i = Math.max(Math.abs(r), Math.abs(n)), a = e + r, o = t + n;
			a >= 0 && a < this.size && o >= 0 && o < this.size && this.setFunctionModule(a, o, i !== 2 && i !== 4, kr.Position);
		}
	}
	drawAlignmentPattern(e, t) {
		for (let n = -2; n <= 2; n++) for (let r = -2; r <= 2; r++) this.setFunctionModule(e + r, t + n, Math.max(Math.abs(r), Math.abs(n)) !== 1, kr.Alignment);
	}
	setFunctionModule(e, t, n, r = kr.Function) {
		this.modules[t][e] = n, this.types[t][e] = r;
	}
	addEccAndInterleave(e) {
		let t = this.version, n = this.ecc;
		if (e.length !== li(t, n)) throw RangeError("Invalid argument");
		let r = Gr[n[0]][t], i = Wr[n[0]][t], a = Math.floor(ci(t) / 8), o = r - a % r, s = Math.floor(a / r), c = [], l = ui(i);
		for (let t = 0, n = 0; t < r; t++) {
			let r = e.slice(n, n + s - i + (t < o ? 0 : 1));
			n += r.length;
			let a = di(r, l);
			t < o && r.push(0), c.push(r.concat(a));
		}
		let u = [];
		for (let e = 0; e < c[0].length; e++) c.forEach((t, n) => {
			(e !== s - i || n >= o) && u.push(t[e]);
		});
		return u;
	}
	drawCodewords(e) {
		if (e.length !== Math.floor(ci(this.version) / 8)) throw RangeError("Invalid argument");
		let t = 0;
		for (let n = this.size - 1; n >= 1; n -= 2) {
			n === 6 && (n = 5);
			for (let r = 0; r < this.size; r++) for (let i = 0; i < 2; i++) {
				let a = n - i, o = n + 1 & 2 ? r : this.size - 1 - r;
				!this.types[o][a] && t < e.length * 8 && (this.modules[o][a] = Jr(e[t >>> 3], 7 - (t & 7)), t++);
			}
		}
	}
	applyMask(e) {
		if (e < 0 || e > 7) throw RangeError("Mask value out of range");
		for (let t = 0; t < this.size; t++) for (let n = 0; n < this.size; n++) {
			let r;
			switch (e) {
				case 0:
					r = (n + t) % 2 == 0;
					break;
				case 1:
					r = t % 2 == 0;
					break;
				case 2:
					r = n % 3 == 0;
					break;
				case 3:
					r = (n + t) % 3 == 0;
					break;
				case 4:
					r = (Math.floor(n / 3) + Math.floor(t / 2)) % 2 == 0;
					break;
				case 5:
					r = n * t % 2 + n * t % 3 == 0;
					break;
				case 6:
					r = (n * t % 2 + n * t % 3) % 2 == 0;
					break;
				case 7:
					r = ((n + t) % 2 + n * t % 3) % 2 == 0;
					break;
				default: throw Error("Unreachable");
			}
			!this.types[t][n] && r && (this.modules[t][n] = !this.modules[t][n]);
		}
	}
	getPenaltyScore() {
		let e = 0;
		for (let t = 0; t < this.size; t++) {
			let n = !1, r = 0, i = [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (let a = 0; a < this.size; a++) this.modules[t][a] === n ? (r++, r === 5 ? e += Br : r > 5 && e++) : (this.finderPenaltyAddHistory(r, i), n || (e += this.finderPenaltyCountPatterns(i) * Hr), n = this.modules[t][a], r = 1);
			e += this.finderPenaltyTerminateAndCount(n, r, i) * Hr;
		}
		for (let t = 0; t < this.size; t++) {
			let n = !1, r = 0, i = [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (let a = 0; a < this.size; a++) this.modules[a][t] === n ? (r++, r === 5 ? e += Br : r > 5 && e++) : (this.finderPenaltyAddHistory(r, i), n || (e += this.finderPenaltyCountPatterns(i) * Hr), n = this.modules[a][t], r = 1);
			e += this.finderPenaltyTerminateAndCount(n, r, i) * Hr;
		}
		for (let t = 0; t < this.size - 1; t++) for (let n = 0; n < this.size - 1; n++) {
			let r = this.modules[t][n];
			r === this.modules[t][n + 1] && r === this.modules[t + 1][n] && r === this.modules[t + 1][n + 1] && (e += Vr);
		}
		let t = 0;
		for (let e of this.modules) t = e.reduce((e, t) => e + +!!t, t);
		let n = this.size * this.size, r = Math.ceil(Math.abs(t * 20 - n * 10) / n) - 1;
		return e += r * Ur, e;
	}
	getAlignmentPatternPositions() {
		if (this.version === 1) return [];
		{
			let e = Math.floor(this.version / 7) + 2, t = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (e * 2 - 2)) * 2, n = [6];
			for (let r = this.size - 7; n.length < e; r -= t) n.splice(1, 0, r);
			return n;
		}
	}
	finderPenaltyCountPatterns(e) {
		let t = e[1], n = t > 0 && e[2] === t && e[3] === t * 3 && e[4] === t && e[5] === t;
		return (n && e[0] >= t * 4 && e[6] >= t ? 1 : 0) + (n && e[6] >= t * 4 && e[0] >= t ? 1 : 0);
	}
	finderPenaltyTerminateAndCount(e, t, n) {
		return e && (this.finderPenaltyAddHistory(t, n), t = 0), t += this.size, this.finderPenaltyAddHistory(t, n), this.finderPenaltyCountPatterns(n);
	}
	finderPenaltyAddHistory(e, t) {
		t[0] === 0 && (e += this.size), t.pop(), t.unshift(e);
	}
};
function qr(e, t, n) {
	if (t < 0 || t > 31 || e >>> t) throw RangeError("Value out of range");
	for (let r = t - 1; r >= 0; r--) n.push(e >>> r & 1);
}
function Jr(e, t) {
	return !!(e >>> t & 1);
}
var Yr = class {
	constructor(e, t, n) {
		if (this.mode = e, this.numChars = t, this.bitData = n, t < 0) throw RangeError("Invalid argument");
		this.bitData = n.slice();
	}
	getData() {
		return this.bitData.slice();
	}
}, Xr = [
	1,
	10,
	12,
	14
], Zr = [
	2,
	9,
	11,
	13
], Qr = [
	4,
	8,
	16,
	16
];
function $r(e, t) {
	return e[Math.floor((t + 7) / 17) + 1];
}
function ei(e) {
	let t = [];
	for (let n of e) qr(n, 8, t);
	return new Yr(Qr, e.length, t);
}
function ti(e) {
	if (!ii(e)) throw RangeError("String contains non-numeric characters");
	let t = [];
	for (let n = 0; n < e.length;) {
		let r = Math.min(e.length - n, 3);
		qr(Number.parseInt(e.substring(n, n + r), 10), r * 3 + 1, t), n += r;
	}
	return new Yr(Xr, e.length, t);
}
function ni(e) {
	if (!ai(e)) throw RangeError("String contains unencodable characters in alphanumeric mode");
	let t = [], n;
	for (n = 0; n + 2 <= e.length; n += 2) {
		let r = Lr.indexOf(e.charAt(n)) * 45;
		r += Lr.indexOf(e.charAt(n + 1)), qr(r, 11, t);
	}
	return n < e.length && qr(Lr.indexOf(e.charAt(n)), 6, t), new Yr(Zr, e.length, t);
}
function ri(e) {
	return e === "" ? [] : ii(e) ? [ti(e)] : ai(e) ? [ni(e)] : [ei(si(e))];
}
function ii(e) {
	return Fr.test(e);
}
function ai(e) {
	return Ir.test(e);
}
function oi(e, t) {
	let n = 0;
	for (let r of e) {
		let e = $r(r.mode, t);
		if (r.numChars >= 1 << e) return Infinity;
		n += 4 + e + r.bitData.length;
	}
	return n;
}
function si(e) {
	e = encodeURI(e);
	let t = [];
	for (let n = 0; n < e.length; n++) e.charAt(n) === "%" ? (t.push(Number.parseInt(e.substring(n + 1, n + 3), 16)), n += 2) : t.push(e.charCodeAt(n));
	return t;
}
function ci(e) {
	if (e < Rr || e > zr) throw RangeError("Version number out of range");
	let t = (16 * e + 128) * e + 64;
	if (e >= 2) {
		let n = Math.floor(e / 7) + 2;
		t -= (25 * n - 10) * n - 55, e >= 7 && (t -= 36);
	}
	return t;
}
function li(e, t) {
	return Math.floor(ci(e) / 8) - Wr[t[0]][e] * Gr[t[0]][e];
}
function ui(e) {
	if (e < 1 || e > 255) throw RangeError("Degree out of range");
	let t = [];
	for (let n = 0; n < e - 1; n++) t.push(0);
	t.push(1);
	let n = 1;
	for (let r = 0; r < e; r++) {
		for (let e = 0; e < t.length; e++) t[e] = fi(t[e], n), e + 1 < t.length && (t[e] ^= t[e + 1]);
		n = fi(n, 2);
	}
	return t;
}
function di(e, t) {
	let n = t.map((e) => 0);
	for (let r of e) {
		let e = r ^ n.shift();
		n.push(0), t.forEach((t, r) => n[r] ^= fi(t, e));
	}
	return n;
}
function fi(e, t) {
	if (e >>> 8 || t >>> 8) throw RangeError("Byte out of range");
	let n = 0;
	for (let r = 7; r >= 0; r--) n = n << 1 ^ (n >>> 7) * 285, n ^= (t >>> r & 1) * e;
	return n;
}
function pi(e, t, n = 1, r = 40, i = -1, a = !0) {
	if (!(Rr <= n && n <= r && r <= zr) || i < -1 || i > 7) throw RangeError("Invalid value");
	let o, s;
	for (o = n;; o++) {
		let n = li(o, t) * 8, i = oi(e, o);
		if (i <= n) {
			s = i;
			break;
		}
		if (o >= r) throw RangeError("Data too long");
	}
	for (let e of [
		jr,
		Mr,
		Nr
	]) a && s <= li(o, e) * 8 && (t = e);
	let c = [];
	for (let t of e) {
		qr(t.mode[0], 4, c), qr(t.numChars, $r(t.mode, o), c);
		for (let e of t.getData()) c.push(e);
	}
	let l = li(o, t) * 8;
	qr(0, Math.min(4, l - c.length), c), qr(0, (8 - c.length % 8) % 8, c);
	for (let e = 236; c.length < l; e ^= 253) qr(e, 8, c);
	let u = Array.from({ length: Math.ceil(c.length / 8) }, () => 0);
	return c.forEach((e, t) => u[t >>> 3] |= e << 7 - (t & 7)), new Kr(o, t, u, i);
}
function mi(e, t) {
	let { ecc: n = "L", boostEcc: r = !1, minVersion: i = 1, maxVersion: a = 40, maskPattern: o = -1, border: s = 1 } = t || {}, c = typeof e == "string" ? ri(e) : Array.isArray(e) ? [ei(e)] : void 0;
	if (!c) throw Error(`uqr only supports encoding string and binary data, but got: ${typeof e}`);
	let l = pi(c, Pr[n], i, a, o, r), u = hi({
		version: l.version,
		maskPattern: l.mask,
		size: l.size,
		data: l.modules,
		types: l.types
	}, s);
	return t?.invert && (u.data = u.data.map((e) => e.map((e) => !e))), t?.onEncoded?.(u), u;
}
function hi(e, t = 1) {
	if (!t) return e;
	let { size: n } = e, r = n + t * 2;
	e.size = r, e.data.forEach((e) => {
		for (let n = 0; n < t; n++) e.unshift(!1), e.push(!1);
	});
	for (let n = 0; n < t; n++) e.data.unshift(Array.from({ length: r }, (e) => !1)), e.data.push(Array.from({ length: r }, (e) => !1));
	let i = kr.Border;
	e.types.forEach((e) => {
		for (let n = 0; n < t; n++) e.unshift(i), e.push(i);
	});
	for (let n = 0; n < t; n++) e.types.unshift(Array.from({ length: r }, (e) => i)), e.types.push(Array.from({ length: r }, (e) => i));
	return e;
}
function gi(e) {
	let t = e.toUpperCase();
	return t.toLowerCase() === e ? t : e;
}
function _i(e, t) {
	let n = mi(typeof e == "string" ? gi(e) : [...e], {
		ecc: t?.eccLevel ?? "L",
		maxVersion: t?.maxVersion ?? 40,
		maskPattern: t?.maskPattern ?? 0,
		border: 0
	});
	return {
		modules: n.data,
		size: n.size,
		version: n.version
	};
}
function vi(e, t) {
	let n = t?.moduleSizePx ?? 4, r = Math.max(t?.quietZoneModules ?? 4, 4), i = e.length, a = (i + r * 2) * n, o = new Uint8ClampedArray(a * a * 4).fill(255);
	for (let t = 0; t < i; t++) for (let s = 0; s < i; s++) {
		if (!e[t][s]) continue;
		let i = (s + r) * n, c = (t + r) * n;
		for (let e = 0; e < n; e++) {
			let t = ((c + e) * a + i) * 4;
			for (let e = 0; e < n; e++) {
				let n = t + e * 4;
				o[n] = 0, o[n + 1] = 0, o[n + 2] = 0, o[n + 3] = 255;
			}
		}
	}
	return {
		data: o,
		width: a,
		height: a
	};
}
//#endregion
//#region src/backends/qr-lt/render.ts
function yi(e, t, n) {
	let { modules: r } = _i(e, n), { data: i, width: a, height: o } = vi(r, n);
	t.width = a, t.height = o;
	let s = t.getContext("2d");
	if (!s) throw Error("renderQrToCanvas: failed to acquire a 2D rendering context");
	s.putImageData(new ImageData(i, a, o), 0, 0);
}
//#endregion
//#region src/backends/qr-lt/index.ts
var bi = class {
	constructor() {
		this.decoder = new Or();
	}
	addFrame(e) {
		this.decoder.receivePart(e);
	}
	get isComplete() {
		return this.decoder.isComplete();
	}
	get progress() {
		return this.decoder.progress;
	}
	get totalBytes() {
		return this.decoder.totalBytes;
	}
	get bytesReceived() {
		return this.decoder.bytesReceived;
	}
	getResult() {
		return this.decoder.getResult();
	}
}, xi = {
	id: "qr-lt",
	encode(e, t) {
		return Dr(e, t);
	},
	createDecoder() {
		return new bi();
	}
};
//#endregion
//#region src/codec/transfer.ts
async function Si(e, t, n) {
	let r = await Ce(e), i = !1, a = e;
	if (!n?.skipCompression) {
		let t = _e(e);
		i = t.length < e.length, a = i ? t : e;
	}
	return be({
		filename: t.filename,
		mimeType: t.mimeType,
		size: e.length,
		sha256: r,
		compressed: i
	}, a);
}
async function Ci(e) {
	let { meta: t, payload: n } = xe(e), r = t.compressed ? ve(n) : new Uint8Array(n), i = await Ce(r);
	if (i !== t.sha256) throw new Se(`Checksum mismatch: expected ${t.sha256}, got ${i}`);
	return {
		filename: t.filename,
		mimeType: t.mimeType,
		bytes: r
	};
}
//#endregion
//#region src/backends/qr-bin-lt/fountain.ts
var wi = /* @__PURE__ */ u(gr(), 1), Ti = /* @__PURE__ */ u(yr(), 1);
function Ei(e) {
	return e.default ?? e;
}
var Di = Ei(wi.default), Oi = Ei(Ti.default), ki = 2930;
async function* Ai(e, t) {
	let n = new Di(Buffer.from(e), t?.maxFragmentLength ?? 2931);
	for (;;) {
		let e = n.nextPart();
		yield new Uint8Array(e.cbor());
	}
}
var ji = class {
	constructor() {
		this.decoder = new Oi();
	}
	receivePart(e) {
		let t = wi.FountainEncoderPart.fromCBOR(Buffer.from(e.buffer, e.byteOffset, e.byteLength));
		this.decoder.receivePart(t);
	}
	isComplete() {
		return this.decoder.isComplete();
	}
	get progress() {
		return this.decoder.estimatedPercentComplete();
	}
	get totalBytes() {
		return Sr(this.decoder);
	}
	get bytesReceived() {
		return this.isComplete() ? this.totalBytes ?? 0 : Tr(this.totalBytes, this.decoder.expectedPartCount(), this.decoder.getReceivedPartIndexes().length);
	}
	getResult() {
		if (!this.decoder.isComplete()) throw Error("FountainByteDecoder: cannot get result before decoding is complete");
		if (!this.decoder.isSuccess()) throw Error(`FountainByteDecoder: decode failed: ${this.decoder.resultError()}`);
		return new Uint8Array(this.decoder.resultMessage());
	}
}, Mi = class {
	constructor() {
		this.decoder = new ji();
	}
	addFrame(e) {
		this.decoder.receivePart(e);
	}
	get isComplete() {
		return this.decoder.isComplete();
	}
	get progress() {
		return this.decoder.progress;
	}
	get totalBytes() {
		return this.decoder.totalBytes;
	}
	get bytesReceived() {
		return this.decoder.bytesReceived;
	}
	getResult() {
		return this.decoder.getResult();
	}
}, Ni = {
	id: "qr-bin-lt",
	encode(e, t) {
		return Ai(e, t);
	},
	createDecoder() {
		return new Mi();
	}
};
//#endregion
//#region src/codec/frame-tag.ts
function Pi(e, t) {
	if (typeof e == "string") return `c${t}:${e}`;
	{
		let n = new Uint8Array(e.length + 1);
		return n[0] = t, n.set(e, 1), n;
	}
}
function Fi(e, t, n = 0) {
	if (!t) return {
		chunkId: n,
		frame: e
	};
	if (typeof e == "string") {
		if (e.startsWith("c") && e.includes(":")) {
			let t = e.indexOf(":"), n = e.slice(1, t), r = parseInt(n, 10);
			if (!isNaN(r)) return {
				chunkId: r,
				frame: e.slice(t + 1)
			};
		}
		return {
			chunkId: n,
			frame: e
		};
	}
	return e.length > 0 ? {
		chunkId: e[0],
		frame: e.subarray(1)
	} : {
		chunkId: n,
		frame: e
	};
}
//#endregion
//#region src/codec/chunked-transfer.ts
var Ii = class {
	constructor() {
		this.currentIndex = 0;
	}
	nextChunkIndex(e) {
		let t = e.length;
		if (t === 0) return 0;
		for (let n = 0; n < t; n++) {
			let r = (this.currentIndex + n) % t;
			if (!e[r]) return this.currentIndex = (r + 1) % t, r;
		}
		let n = this.currentIndex % t;
		return this.currentIndex = (n + 1) % t, n;
	}
}, Li = class {
	constructor(e) {
		this.currentIndex = 0, this.weights = [], this.weights = Array(e).fill(1);
	}
	setPriority(e, t = .1) {
		for (let n = 0; n < this.weights.length; n++) this.weights[n] = e.has(n) ? t : 1;
	}
	nextChunkIndex(e) {
		let t = e.length;
		if (t === 0) return 0;
		let n = 0;
		for (let r = 0; r < t; r++) e[r] || (n += this.weights[r] ?? 1);
		if (n === 0) {
			let e = this.currentIndex % t;
			return this.currentIndex = (e + 1) % t, e;
		}
		let r = Math.random() * n;
		for (let n = 0; n < t; n++) if (!e[n]) {
			let e = this.weights[n] ?? 1;
			if (r < e) return n;
			r -= e;
		}
		return 0;
	}
};
function Ri(e, t) {
	let n = Math.ceil(e / (t ?? 2e3));
	if (n <= 3e3) return 1;
	let r = Math.ceil(n / 2500);
	return Math.min(r, 255);
}
async function* zi(e, t, n, r, i) {
	if (t <= 1) {
		let t = n.encode(e, r?.backendOptions ?? { maxFragmentLength: r?.maxFragmentLength });
		for await (let e of t) yield {
			rawFrame: e,
			taggedFrame: e,
			chunkId: 0
		};
		return;
	}
	let a = n.id === "qr-bin-lt" ? ki : Er, o = r?.maxFragmentLength ?? a, s = e.length, c = Math.ceil(s / t), l = [];
	for (let n = 0; n < t; n++) {
		let t = n * c, r = Math.min(t + c, s);
		l.push(e.subarray(t, r));
	}
	let u = await Promise.all(l.map((e) => n.encode(e, r?.backendOptions ?? { maxFragmentLength: o })[Symbol.asyncIterator]())), d = i ?? new Ii(), f = Array(t).fill(!1);
	for (;;) {
		let e = d.nextChunkIndex(f), n = await u[e].next();
		if (!n.done && n.value !== void 0) {
			let r = n.value, i;
			i = t > 1 ? Pi(r, e) : r, yield {
				rawFrame: r,
				taggedFrame: i,
				chunkId: e
			};
		}
	}
}
var Bi = class {
	constructor(e, t = xi) {
		this.chunkCount = Math.max(1, e), this.decoders = Array.from({ length: this.chunkCount }, () => t.createDecoder());
	}
	get numChunks() {
		return this.chunkCount;
	}
	receiveTaggedFrame(e, t = 0) {
		if (this.chunkCount === 1) {
			let t = this.decoders[0].isComplete;
			this.decoders[0].addFrame(e);
			let n = this.decoders[0].isComplete;
			return {
				chunkId: 0,
				newlyCompleted: !t && n
			};
		}
		let n = Fi(e, !0, t), r = n.chunkId;
		if (r >= 0 && r < this.chunkCount) {
			let e = this.decoders[r].isComplete;
			this.decoders[r].addFrame(n.frame);
			let t = this.decoders[r].isComplete;
			return {
				chunkId: r,
				newlyCompleted: !e && t
			};
		}
		return {
			chunkId: r,
			newlyCompleted: !1
		};
	}
	isChunkComplete(e) {
		return e < 0 || e >= this.chunkCount ? !1 : this.decoders[e].isComplete;
	}
	get completedChunks() {
		return this.decoders.map((e) => e.isComplete);
	}
	get isComplete() {
		return this.decoders.every((e) => e.isComplete);
	}
	get progress() {
		return this.chunkCount === 0 ? 0 : this.decoders.reduce((e, t) => e + (t.progress ?? 0), 0) / this.chunkCount;
	}
	get totalBytes() {
		let e = 0;
		for (let t of this.decoders) {
			if (t.totalBytes === void 0) return;
			e += t.totalBytes;
		}
		return e;
	}
	get bytesReceived() {
		return this.decoders.reduce((e, t) => e + (t.bytesReceived ?? 0), 0);
	}
	async getResult() {
		if (!this.isComplete) throw Error("ChunkedTransferDecoder: cannot get result before all chunks complete");
		let e = [];
		for (let t of this.decoders) e.push(t.getResult());
		let t = e.reduce((e, t) => e + t.length, 0), n = new Uint8Array(t), r = 0;
		for (let t of e) n.set(t, r), r += t.length;
		return Ci(n);
	}
}, Vi = 1920, Hi = 1080, Ui = 120, Wi = class e {
	constructor(t) {
		this.pumpRunning = !1, this.ownsVideoElement = t === void 0, this.video = t ?? e.createHiddenVideoElement(), this.canvas = document.createElement("canvas");
		let n = this.canvas.getContext("2d", { willReadFrequently: !0 });
		if (!n) throw Error("Camera: failed to acquire a 2D rendering context");
		this.ctx = n;
	}
	static createHiddenVideoElement() {
		let e = document.createElement("video");
		return e.style.position = "absolute", e.style.width = "1px", e.style.height = "1px", e.style.opacity = "0", e.style.pointerEvents = "none", document.body.appendChild(e), e;
	}
	async start(e) {
		let t = {
			facingMode: e?.facingMode ?? "environment",
			width: { ideal: e?.width ?? Vi },
			height: { ideal: e?.height ?? Hi },
			aspectRatio: matchMedia("all and (orientation: landscape)").matches ? 16 / 9 : 9 / 16,
			frameRate: { ideal: 30 }
		};
		return Object.assign(t, {
			exposureMode: "continuous",
			focusMode: "continuous"
		}), this.stream = await navigator.mediaDevices.getUserMedia({
			video: t,
			audio: !1
		}), this.video.srcObject = this.stream, this.video.playsInline = !0, this.video.muted = !0, await this.video.play(), this.setupNativeFrameReader(), this.video;
	}
	setupNativeFrameReader() {
		if (this.frameReader = void 0, typeof MediaStreamTrackProcessor > "u" || !this.stream) return;
		let [e] = this.stream.getVideoTracks();
		if (e) try {
			let t = new MediaStreamTrackProcessor({ track: e });
			this.frameReader = t.readable.getReader(), this.startFramePump();
		} catch {
			this.frameReader = void 0;
		}
	}
	get resolution() {
		let { videoWidth: e, videoHeight: t } = this.video;
		return e && t ? {
			width: e,
			height: t
		} : void 0;
	}
	stop() {
		this.stream?.getTracks().forEach((e) => e.stop()), this.stream = void 0, this.video.srcObject = null, this.disableNativeCapture();
		let e = this.frameWaiter;
		this.frameWaiter = void 0, e?.(), this.ownsVideoElement && this.video.remove();
	}
	grabFrame() {
		let { videoWidth: e, videoHeight: t } = this.video;
		if (e !== 0 && t !== 0) return this.canvas.width = e, this.canvas.height = t, this.ctx.drawImage(this.video, 0, 0, e, t), this.ctx.getImageData(0, 0, e, t);
	}
	async grabLumaFrame() {
		let e = await this.captureNativeFrame();
		if (e) return {
			data: e.data.slice(0, e.width * e.height),
			width: e.width,
			height: e.height
		};
	}
	async captureNativeFrame() {
		if (!this.frameReader) return;
		let e;
		try {
			if (e = await this.takeLatestFrame(Ui), e) {
				let t = await this.videoFrameToNativeFrame(e);
				if (t) return t;
				this.disableNativeCapture();
			}
		} catch (e) {
			console.warn("[screenferry] native VideoFrame capture failed, falling back to canvas/RGBA:", e);
		} finally {
			e?.close();
		}
	}
	disableNativeCapture() {
		this.pumpRunning = !1, this.latestFrame?.close(), this.latestFrame = void 0, this.frameReader &&= (this.frameReader.cancel().catch(() => {}), void 0);
	}
	startFramePump() {
		let e = this.frameReader;
		e && (this.pumpRunning = !0, (async () => {
			try {
				for (; this.pumpRunning;) {
					let { done: t, value: n } = await e.read();
					if (t) break;
					if (!n) continue;
					if (!this.pumpRunning) {
						n.close();
						break;
					}
					this.latestFrame?.close(), this.latestFrame = n;
					let r = this.frameWaiter;
					this.frameWaiter = void 0, r?.();
				}
			} catch {} finally {
				this.pumpRunning = !1;
				let e = this.frameWaiter;
				this.frameWaiter = void 0, e?.();
			}
		})());
	}
	async takeLatestFrame(e) {
		!this.latestFrame && this.pumpRunning && await new Promise((t) => {
			let n = setTimeout(() => {
				this.frameWaiter === r && (this.frameWaiter = void 0), t();
			}, e), r = () => {
				clearTimeout(n), t();
			};
			this.frameWaiter = r;
		});
		let t = this.latestFrame;
		return this.latestFrame = void 0, t;
	}
	async videoFrameToNativeFrame(e) {
		let t = e.format === "NV12" ? "nv12" : e.format === "I420" ? "i420" : void 0;
		if (!t) return;
		let n = e.visibleRect;
		if (!n) return;
		let { width: r, height: i } = n, a = new Uint8Array(e.allocationSize());
		if (Gi(await e.copyTo(a), r, i, t)) return {
			data: a,
			width: r,
			height: i,
			format: t
		};
	}
};
function Gi(e, t, n, r) {
	let i = Math.ceil(t / 2), a = Math.ceil(n / 2);
	if (r === "nv12") {
		if (e.length !== 2) return !1;
		let [r, i] = e;
		return r.offset === 0 && r.stride === t && i.offset === t * n && i.stride === t;
	}
	if (e.length !== 3) return !1;
	let [o, s, c] = e, l = t * n, u = l + i * a;
	return o.offset === 0 && o.stride === t && s.offset === l && s.stride === i && c.offset === u && c.stride === i;
}
//#endregion
//#region src/scan/worker-pool.ts
var Ki = class {
	constructor(e, t) {
		let n = Math.max(1, Math.floor(e));
		this.slots = Array.from({ length: n }, () => ({
			worker: t(),
			busy: !1
		}));
	}
	get size() {
		return this.slots.length;
	}
	get hasIdle() {
		return this.slots.some((e) => !e.busy);
	}
	acquireIdle() {
		let e = this.slots.find((e) => !e.busy);
		if (e) return e.busy = !0, e.worker;
	}
	release(e) {
		let t = this.slots.find((t) => t.worker === e);
		t && (t.busy = !1);
	}
	forEach(e) {
		for (let t of this.slots) e(t.worker);
	}
}, qi = 20, Ji = 1, Yi = class {
	constructor() {
		this.nextRequestId = 0, this.captureInFlight = !1, this.samplingGeneration = 0, this.decodeBytes = !1, this.callbacks = /* @__PURE__ */ new Set();
	}
	onDecode(e) {
		return this.callbacks.add(e), () => this.callbacks.delete(e);
	}
	get resolution() {
		return this.camera?.resolution;
	}
	async start(e, t) {
		this.stop(), this.camera = new Wi(e), await this.camera.start(t);
		let n = t?.scanHz ?? qi;
		this.decodeBytes = t?.decodeBytes ?? !1;
		let r = Math.max(1, Math.floor(t?.decodeWorkers ?? Ji));
		this.pool = new Ki(r, () => this.createDecodeWorker()), this.startSampling(() => this.tick(), n);
	}
	createDecodeWorker() {
		let e = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("assets/decode.worker-Kz3EDOsC.js", import.meta.url).href,
			"" + import.meta.url
		), { type: "module" });
		return e.onmessage = (t) => {
			this.pool?.release(e);
			let n = t.data;
			if (n.type === "result") {
				if (this.decodeBytes) {
					if (n.bytes) for (let e of this.callbacks) e(n.bytes);
				} else for (let e of this.callbacks) e(n.text);
			} else n.type === "error" && console.warn("[screenferry] decode worker error:", n.message);
		}, e;
	}
	startSampling(e, t) {
		let n = ++this.samplingGeneration, r = 1e3 / t, i = Math.min(r * .1, 5), a = () => {
			let t = Math.max(0, r + (Math.random() * 2 - 1) * i);
			this.timeoutHandle = setTimeout(() => {
				if (n === this.samplingGeneration) {
					try {
						e();
					} catch (e) {
						console.warn("[screenferry] scan tick failed:", e);
					}
					n === this.samplingGeneration && a();
				}
			}, t);
		};
		a();
	}
	stop() {
		this.samplingGeneration++, this.timeoutHandle !== void 0 && (clearTimeout(this.timeoutHandle), this.timeoutHandle = void 0), this.pool?.forEach((e) => e.terminate()), this.pool = void 0, this.camera?.stop(), this.camera = void 0, this.captureInFlight = !1, this.decodeBytes = !1;
	}
	tick() {
		if (this.captureInFlight || !this.camera || !this.pool || !this.pool.hasIdle) return;
		let e = this.camera, t = this.pool;
		this.captureInFlight = !0;
		try {
			e.grabLumaFrame().then((n) => {
				if (this.captureInFlight = !1, n) {
					let e = t.acquireIdle();
					if (!e) return;
					let r = {
						id: this.nextRequestId++,
						luma: n
					};
					e.postMessage(r, [n.data.buffer]);
					return;
				}
				let r = e.grabFrame();
				if (!r) return;
				let i = t.acquireIdle();
				if (!i) return;
				let a = {
					id: this.nextRequestId++,
					imageData: r
				};
				i.postMessage(a, [r.data.buffer]);
			}).catch((e) => {
				console.warn("[screenferry] frame capture failed:", e), this.captureInFlight = !1;
			});
		} catch (e) {
			this.captureInFlight = !1, console.warn("[screenferry] frame capture failed:", e);
		}
	}
}, Xi = class {
	constructor(e = 2e3) {
		this.timestamps = [], this.windowMs = e;
	}
	record(e = Date.now()) {
		this.timestamps.push(e);
		let t = e - this.windowMs;
		for (; this.timestamps.length > 0 && this.timestamps[0] < t;) this.timestamps.shift();
	}
	get framesPerSecond() {
		if (this.timestamps.length < 2) return 0;
		let e = (this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / 1e3;
		return e > 0 ? (this.timestamps.length - 1) / e : 0;
	}
	reset() {
		this.timestamps = [];
	}
}, Zi = 2e3, Qi = class {
	constructor(e = Zi) {
		this.samples = [], this.startedAt = 0, this.windowMs = e;
	}
	start(e = Date.now()) {
		this.startedAt = e, this.samples = [];
	}
	sample(e, t, n = Date.now()) {
		return this.samples.push({
			at: n,
			bytes: e
		}), this.trim(n), {
			bytesReceived: e,
			totalBytes: t ?? null,
			bytesPerSecond: this.bytesPerSecond,
			elapsedMs: Math.max(0, n - this.startedAt)
		};
	}
	get bytesPerSecond() {
		if (this.samples.length < 2) return 0;
		let e = this.samples[0], t = this.samples[this.samples.length - 1], n = t.at - e.at;
		return n <= 0 ? 0 : (t.bytes - e.bytes) / n * 1e3;
	}
	trim(e) {
		let t = e - this.windowMs, n = 0;
		for (; n + 1 < this.samples.length && this.samples[n + 1].at <= t;) n++;
		n > 0 && this.samples.splice(0, n);
	}
}, $i = {
	"qr-lt": xi,
	"qr-bin-lt": Ni
}, ea = "sf1:backend=";
function ta(e, t) {
	return t?.chunkCount && t.chunkCount > 1 ? `${ea}${e};chunks=${t.chunkCount}` : `${ea}${e}`;
}
function na(e) {
	let t = (typeof e == "string" ? e : new TextDecoder().decode(e)).toLowerCase();
	if (!t.startsWith(ea)) return;
	let n = t.slice(12).split(";"), r = n[0], i;
	for (let e = 1; e < n.length; e++) if (n[e].startsWith("chunks=")) {
		let t = parseInt(n[e].slice(7), 10);
		!isNaN(t) && t > 0 && (i = t);
	}
	return {
		backendId: r,
		chunkCount: i
	};
}
function ra(e) {
	return Object.prototype.hasOwnProperty.call($i, e) ? $i[e] : void 0;
}
function ia(e) {
	return e === Ni.id ? { decodeBytes: !0 } : {};
}
async function aa(e) {
	return e === "qr-bin-lt" ? Ni : xi;
}
//#endregion
//#region src/backends/display-driver.ts
var oa = 10, sa = class {
	constructor(e, t, n) {
		this.source = e, this.canvas = t, this.opts = n, this.running = !1, this.frameIndex = 0, this.lastFrameTime = 0, this.renderInFlight = !1, this.fps = n?.fps ?? oa, this.onFrameSent = n?.onFrameSent, this.onError = n?.onError;
	}
	start() {
		this.running || (this.running = !0, this.iterator = this.source[Symbol.asyncIterator](), this.lastFrameTime = 0, this.visibilityListener = () => {
			document.hidden ? this.cancelScheduledFrame() : this.running && this.rafHandle === void 0 && this.scheduleNextTick();
		}, document.addEventListener("visibilitychange", this.visibilityListener), document.hidden || this.scheduleNextTick());
	}
	stop() {
		this.running = !1, this.cancelScheduledFrame(), this.visibilityListener &&= (document.removeEventListener("visibilitychange", this.visibilityListener), void 0), this.iterator?.return?.(void 0);
	}
	scheduleNextTick() {
		this.rafHandle = requestAnimationFrame((e) => this.tick(e));
	}
	cancelScheduledFrame() {
		this.rafHandle !== void 0 && (cancelAnimationFrame(this.rafHandle), this.rafHandle = void 0);
	}
	tick(e) {
		if (!this.running) return;
		this.scheduleNextTick();
		let t = 1e3 / this.fps;
		e - this.lastFrameTime < t || this.renderInFlight || (this.lastFrameTime = e, this.renderInFlight = !0, this.renderNextFrame().finally(() => {
			this.renderInFlight = !1;
		}));
	}
	async renderNextFrame() {
		if (!this.iterator) return;
		let e;
		try {
			e = await this.iterator.next();
		} catch (e) {
			this.onError?.(e);
			return;
		}
		let { value: t, done: n } = e;
		if (!(n || t === void 0 || !this.running)) try {
			yi(t, this.canvas, this.opts), this.onFrameSent?.(this.frameIndex), this.frameIndex++;
		} catch (e) {
			this.onError?.(e);
		}
	}
}, ca = 10;
function la(e) {
	return "preferredBackend" in e;
}
async function* ua(e, t, n, r) {
	let i = e[Symbol.asyncIterator](), a = ta(t, { chunkCount: r }), o = 0;
	for (;;) {
		o % n === 0 && (yield a);
		let { value: e, done: t } = await i.next();
		if (t) return;
		yield e, o++;
	}
}
async function* da(e, t) {
	let n = new Uint8Array(await e.arrayBuffer()), r = "name" in e && typeof e.name == "string" ? e.name : "file", i = e.type || "application/octet-stream", a = t && la(t) ? await aa(t.preferredBackend) : t?.backend ?? xi, o = await Si(n, {
		filename: r,
		mimeType: i
	}, { skipCompression: a.compressesInternally }), s = 1;
	t?.chunked && (s = typeof t.chunkCount == "number" ? Math.max(1, Math.floor(t.chunkCount)) : Ri(o.length, t.fragmentSize));
	let c = zi(o, s, a, {
		maxFragmentLength: t?.fragmentSize,
		backendOptions: t?.backendOptions
	}, t?.picker);
	async function* l() {
		for await (let e of c) yield e.taggedFrame;
	}
	if (t && la(t)) {
		let e = Math.max(1, t.headerIntervalFrames ?? ca);
		yield* ua(l(), a.id, e, s);
		return;
	}
	yield* l();
}
var fa = class {
	constructor(e, t = 1) {
		this.decoder = new Bi(t, e);
	}
	addFrame(e) {
		return this.decoder.receiveTaggedFrame(e);
	}
	get completedChunks() {
		return this.decoder.completedChunks;
	}
	get numChunks() {
		return this.decoder.numChunks;
	}
	get progress() {
		return this.decoder.progress;
	}
	get isComplete() {
		return this.decoder.isComplete;
	}
	get totalBytes() {
		return this.decoder.totalBytes;
	}
	get bytesReceived() {
		return this.decoder.bytesReceived;
	}
	async getResult() {
		let { filename: e, mimeType: t, bytes: n } = await this.decoder.getResult();
		return new File([n], e, { type: t });
	}
}, pa = class {
	constructor(e = {}, t, n = 1) {
		this.scanner = new Yi(), this.goodputTracker = new Xi(), this.metricsTracker = new Qi(), this.settled = !1, this.callbacks = e, this.decoder = new fa(t, n);
	}
	async start(e, t) {
		this.settled = !1, this.goodputTracker.reset(), this.metricsTracker.start(), this.unsubscribe = this.scanner.onDecode((e) => this.handleFrame(e)), await this.scanner.start(e, t);
	}
	stop() {
		this.unsubscribe?.(), this.unsubscribe = void 0, this.scanner.stop();
	}
	get resolution() {
		return this.scanner.resolution;
	}
	get goodput() {
		return this.goodputTracker.framesPerSecond;
	}
	handleFrame(e) {
		if (this.settled) return;
		let t;
		try {
			t = this.decoder.addFrame(e);
		} catch {
			return;
		}
		if (this.goodputTracker.record(), this.callbacks.onProgress?.(this.decoder.progress), t.newlyCompleted || this.decoder.completedChunks.some(Boolean)) {
			let e = this.decoder.completedChunks.map((e, t) => e ? t : -1).filter((e) => e >= 0);
			this.callbacks.onChunkProgress?.({
				chunkCount: this.decoder.numChunks,
				complete: e,
				completedChunks: this.decoder.completedChunks
			});
		}
		this.callbacks.onMetrics && this.callbacks.onMetrics(this.metricsTracker.sample(this.decoder.bytesReceived, this.decoder.totalBytes)), this.decoder.isComplete && (this.settled = !0, this.decoder.getResult().then((e) => {
			this.stop(), this.callbacks.onComplete?.(e);
		}).catch((e) => {
			this.stop(), this.callbacks.onError?.(e);
		}));
	}
}, ma = class {
	constructor(e = {}) {
		this.resolvedChunkCount = 1, this.callbacks = e;
	}
	get backendId() {
		return this.resolvedBackendId;
	}
	get chunkCount() {
		return this.resolvedChunkCount;
	}
	get completedChunks() {
		return this.decoder?.completedChunks ?? [];
	}
	get numChunks() {
		return this.decoder?.numChunks ?? 1;
	}
	get progress() {
		return this.decoder?.progress ?? 0;
	}
	get isComplete() {
		return this.decoder?.isComplete ?? !1;
	}
	get totalBytes() {
		return this.decoder?.totalBytes;
	}
	get bytesReceived() {
		return this.decoder?.bytesReceived ?? 0;
	}
	addFrame(e) {
		let t = na(e);
		if (t !== void 0) {
			this.resolvedBackendId || this.resolve(t.backendId, t.chunkCount ?? 1);
			return;
		}
		if (!this.resolvedBackendId) {
			if (typeof e != "string") return;
			this.resolve(xi.id, 1);
		}
		return this.decoder?.addFrame(e);
	}
	async getResult() {
		if (!this.decoder) throw Error("NegotiatingStreamDecoder: cannot get result before a backend has been resolved");
		return this.decoder.getResult();
	}
	resolve(e, t = 1) {
		let n = ra(e);
		n && (this.resolvedBackendId = e, this.resolvedChunkCount = t, this.decoder = new fa(n, t), this.callbacks.onBackendResolved?.(e));
	}
}, ha = class {
	constructor(e = {}) {
		this.scanner = new Yi(), this.goodputTracker = new Xi(), this.metricsTracker = new Qi(), this.settled = !1, this.callbacks = e, this.decoder = new ma({ onBackendResolved: (e) => {
			this.callbacks.onBackendResolved?.(e), e !== xi.id && this.switchCaptureMode(e);
		} });
	}
	async start(e, t) {
		this.settled = !1, this.goodputTracker.reset(), this.metricsTracker.start(), this.videoElement = e, this.scannerOpts = t, this.unsubscribe = this.scanner.onDecode((e) => this.handleFrame(e)), await this.scanner.start(e, {
			...t,
			decodeBytes: !1
		});
	}
	stop() {
		this.unsubscribe?.(), this.unsubscribe = void 0, this.scanner.stop();
	}
	get resolution() {
		return this.scanner.resolution;
	}
	get goodput() {
		return this.goodputTracker.framesPerSecond;
	}
	handleFrame(e) {
		if (this.settled) return;
		let t;
		try {
			t = this.decoder.addFrame(e);
		} catch {
			return;
		}
		if (t !== void 0) {
			if (this.goodputTracker.record(), this.callbacks.onProgress?.(this.decoder.progress), t.newlyCompleted || this.decoder.completedChunks.some(Boolean)) {
				let e = this.decoder.completedChunks.map((e, t) => e ? t : -1).filter((e) => e >= 0);
				this.callbacks.onChunkProgress?.({
					chunkCount: this.decoder.numChunks,
					complete: e,
					completedChunks: this.decoder.completedChunks
				});
			}
			this.callbacks.onMetrics && this.callbacks.onMetrics(this.metricsTracker.sample(this.decoder.bytesReceived, this.decoder.totalBytes)), this.decoder.isComplete && (this.settled = !0, this.decoder.getResult().then((e) => {
				this.stop(), this.callbacks.onComplete?.(e);
			}).catch((e) => {
				this.stop(), this.callbacks.onError?.(e);
			}));
		}
	}
	async switchCaptureMode(e) {
		this.scanner.stop();
		try {
			await this.scanner.start(this.videoElement, {
				...this.scannerOpts,
				...ia(e)
			});
		} catch (e) {
			this.callbacks.onError?.(e);
		}
	}
};
//#endregion
export { Wi as Camera, Bi as ChunkedTransferDecoder, sa as DisplayDriver, Se as IntegrityError, ha as NegotiatingReceiverSession, ma as NegotiatingStreamDecoder, pa as ReceiverSession, Ii as RoundRobinChunkPicker, Yi as Scanner, fa as StreamDecoder, Li as WeightedChunkPicker, Si as buildEnvelope, Ri as computeAutoChunkCount, zi as encodeChunkedEnvelope, da as encodeToFrames, Ni as qrBinLtBackend, xi as qrLtBackend, aa as resolvePreferredBackend };

//# sourceMappingURL=index.js.map