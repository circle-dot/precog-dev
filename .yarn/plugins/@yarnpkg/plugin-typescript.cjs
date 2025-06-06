/* eslint-disable */
//prettier-ignore
module.exports = {
    name: "@yarnpkg/plugin-typescript",
    factory: function (require) {
        var plugin = (() => {
            var Ft = Object.create, H = Object.defineProperty, Bt = Object.defineProperties,
                Kt = Object.getOwnPropertyDescriptor, zt = Object.getOwnPropertyDescriptors,
                Gt = Object.getOwnPropertyNames, Q = Object.getOwnPropertySymbols, $t = Object.getPrototypeOf,
                ne = Object.prototype.hasOwnProperty, De = Object.prototype.propertyIsEnumerable;
            var Re = (e, t, r) => t in e ? H(e, t, {
                enumerable: !0,
                configurable: !0,
                writable: !0,
                value: r
            }) : e[t] = r, u = (e, t) => {
                for (var r in t || (t = {})) ne.call(t, r) && Re(e, r, t[r]);
                if (Q) for (var r of Q(t)) De.call(t, r) && Re(e, r, t[r]);
                return e
            }, g = (e, t) => Bt(e, zt(t)), Lt = e => H(e, "__esModule", {value: !0});
            var R = (e, t) => {
                var r = {};
                for (var s in e) ne.call(e, s) && t.indexOf(s) < 0 && (r[s] = e[s]);
                if (e != null && Q) for (var s of Q(e)) t.indexOf(s) < 0 && De.call(e, s) && (r[s] = e[s]);
                return r
            };
            var I = (e, t) => () => (t || e((t = {exports: {}}).exports, t), t.exports), Vt = (e, t) => {
                for (var r in t) H(e, r, {get: t[r], enumerable: !0})
            }, Qt = (e, t, r) => {
                if (t && typeof t == "object" || typeof t == "function") for (let s of Gt(t)) !ne.call(e, s) && s !== "default" && H(e, s, {
                    get: () => t[s],
                    enumerable: !(r = Kt(t, s)) || r.enumerable
                });
                return e
            }, C = e => Qt(Lt(H(e != null ? Ft($t(e)) : {}, "default", e && e.__esModule && "default" in e ? {
                get: () => e.default,
                enumerable: !0
            } : {value: e, enumerable: !0})), e);
            var xe = I(J => {
                "use strict";
                Object.defineProperty(J, "__esModule", {value: !0});

                function _(e) {
                    let t = [...e.caches], r = t.shift();
                    return r === void 0 ? ve() : {
                        get(s, n, a = {miss: () => Promise.resolve()}) {
                            return r.get(s, n, a).catch(() => _({caches: t}).get(s, n, a))
                        }, set(s, n) {
                            return r.set(s, n).catch(() => _({caches: t}).set(s, n))
                        }, delete(s) {
                            return r.delete(s).catch(() => _({caches: t}).delete(s))
                        }, clear() {
                            return r.clear().catch(() => _({caches: t}).clear())
                        }
                    }
                }

                function ve() {
                    return {
                        get(e, t, r = {miss: () => Promise.resolve()}) {
                            return t().then(n => Promise.all([n, r.miss(n)])).then(([n]) => n)
                        }, set(e, t) {
                            return Promise.resolve(t)
                        }, delete(e) {
                            return Promise.resolve()
                        }, clear() {
                            return Promise.resolve()
                        }
                    }
                }

                J.createFallbackableCache = _;
                J.createNullCache = ve
            });
            var Ee = I(($s, qe) => {
                qe.exports = xe()
            });
            var Te = I(ae => {
                "use strict";
                Object.defineProperty(ae, "__esModule", {value: !0});

                function Jt(e = {serializable: !0}) {
                    let t = {};
                    return {
                        get(r, s, n = {miss: () => Promise.resolve()}) {
                            let a = JSON.stringify(r);
                            if (a in t) return Promise.resolve(e.serializable ? JSON.parse(t[a]) : t[a]);
                            let o = s(), d = n && n.miss || (() => Promise.resolve());
                            return o.then(y => d(y)).then(() => o)
                        }, set(r, s) {
                            return t[JSON.stringify(r)] = e.serializable ? JSON.stringify(s) : s, Promise.resolve(s)
                        }, delete(r) {
                            return delete t[JSON.stringify(r)], Promise.resolve()
                        }, clear() {
                            return t = {}, Promise.resolve()
                        }
                    }
                }

                ae.createInMemoryCache = Jt
            });
            var we = I((Vs, Me) => {
                Me.exports = Te()
            });
            var Ce = I(M => {
                "use strict";
                Object.defineProperty(M, "__esModule", {value: !0});

                function Xt(e, t, r) {
                    let s = {"x-algolia-api-key": r, "x-algolia-application-id": t};
                    return {
                        headers() {
                            return e === oe.WithinHeaders ? s : {}
                        }, queryParameters() {
                            return e === oe.WithinQueryParameters ? s : {}
                        }
                    }
                }

                function Yt(e) {
                    let t = 0, r = () => (t++, new Promise(s => {
                        setTimeout(() => {
                            s(e(r))
                        }, Math.min(100 * t, 1e3))
                    }));
                    return e(r)
                }

                function ke(e, t = (r, s) => Promise.resolve()) {
                    return Object.assign(e, {
                        wait(r) {
                            return ke(e.then(s => Promise.all([t(s, r), s])).then(s => s[1]))
                        }
                    })
                }

                function Zt(e) {
                    let t = e.length - 1;
                    for (t; t > 0; t--) {
                        let r = Math.floor(Math.random() * (t + 1)), s = e[t];
                        e[t] = e[r], e[r] = s
                    }
                    return e
                }

                function er(e, t) {
                    return Object.keys(t !== void 0 ? t : {}).forEach(r => {
                        e[r] = t[r](e)
                    }), e
                }

                function tr(e, ...t) {
                    let r = 0;
                    return e.replace(/%s/g, () => encodeURIComponent(t[r++]))
                }

                var rr = "4.2.0", sr = e => () => e.transporter.requester.destroy(),
                    oe = {WithinQueryParameters: 0, WithinHeaders: 1};
                M.AuthMode = oe;
                M.addMethods = er;
                M.createAuth = Xt;
                M.createRetryablePromise = Yt;
                M.createWaitablePromise = ke;
                M.destroy = sr;
                M.encode = tr;
                M.shuffle = Zt;
                M.version = rr
            });
            var F = I((Js, Ue) => {
                Ue.exports = Ce()
            });
            var Ne = I(ie => {
                "use strict";
                Object.defineProperty(ie, "__esModule", {value: !0});
                var nr = {Delete: "DELETE", Get: "GET", Post: "POST", Put: "PUT"};
                ie.MethodEnum = nr
            });
            var B = I((Ys, We) => {
                We.exports = Ne()
            });
            var Ze = I(A => {
                "use strict";
                Object.defineProperty(A, "__esModule", {value: !0});
                var He = B();

                function ce(e, t) {
                    let r = e || {}, s = r.data || {};
                    return Object.keys(r).forEach(n => {
                        ["timeout", "headers", "queryParameters", "data", "cacheable"].indexOf(n) === -1 && (s[n] = r[n])
                    }), {
                        data: Object.entries(s).length > 0 ? s : void 0,
                        timeout: r.timeout || t,
                        headers: r.headers || {},
                        queryParameters: r.queryParameters || {},
                        cacheable: r.cacheable
                    }
                }

                var X = {Read: 1, Write: 2, Any: 3}, U = {Up: 1, Down: 2, Timeouted: 3}, _e = 2 * 60 * 1e3;

                function ue(e, t = U.Up) {
                    return g(u({}, e), {status: t, lastUpdate: Date.now()})
                }

                function Fe(e) {
                    return e.status === U.Up || Date.now() - e.lastUpdate > _e
                }

                function Be(e) {
                    return e.status === U.Timeouted && Date.now() - e.lastUpdate <= _e
                }

                function le(e) {
                    return {protocol: e.protocol || "https", url: e.url, accept: e.accept || X.Any}
                }

                function ar(e, t) {
                    return Promise.all(t.map(r => e.get(r, () => Promise.resolve(ue(r))))).then(r => {
                        let s = r.filter(d => Fe(d)), n = r.filter(d => Be(d)), a = [...s, ...n],
                            o = a.length > 0 ? a.map(d => le(d)) : t;
                        return {
                            getTimeout(d, y) {
                                return (n.length === 0 && d === 0 ? 1 : n.length + 3 + d) * y
                            }, statelessHosts: o
                        }
                    })
                }

                var or = ({isTimedOut: e, status: t}) => !e && ~~t == 0, ir = e => {
                        let t = e.status;
                        return e.isTimedOut || or(e) || ~~(t / 100) != 2 && ~~(t / 100) != 4
                    }, cr = ({status: e}) => ~~(e / 100) == 2,
                    ur = (e, t) => ir(e) ? t.onRetry(e) : cr(e) ? t.onSucess(e) : t.onFail(e);

                function Qe(e, t, r, s) {
                    let n = [], a = $e(r, s), o = Le(e, s), d = r.method,
                        y = r.method !== He.MethodEnum.Get ? {} : u(u({}, r.data), s.data),
                        b = u(u(u({"x-algolia-agent": e.userAgent.value}, e.queryParameters), y), s.queryParameters),
                        f = 0, p = (h, S) => {
                            let O = h.pop();
                            if (O === void 0) throw Ve(de(n));
                            let P = {
                                data: a,
                                headers: o,
                                method: d,
                                url: Ge(O, r.path, b),
                                connectTimeout: S(f, e.timeouts.connect),
                                responseTimeout: S(f, s.timeout)
                            }, x = j => {
                                let T = {request: P, response: j, host: O, triesLeft: h.length};
                                return n.push(T), T
                            }, v = {
                                onSucess: j => Ke(j), onRetry(j) {
                                    let T = x(j);
                                    return j.isTimedOut && f++, Promise.all([e.logger.info("Retryable failure", pe(T)), e.hostsCache.set(O, ue(O, j.isTimedOut ? U.Timeouted : U.Down))]).then(() => p(h, S))
                                }, onFail(j) {
                                    throw x(j), ze(j, de(n))
                                }
                            };
                            return e.requester.send(P).then(j => ur(j, v))
                        };
                    return ar(e.hostsCache, t).then(h => p([...h.statelessHosts].reverse(), h.getTimeout))
                }

                function lr(e) {
                    let {
                        hostsCache: t,
                        logger: r,
                        requester: s,
                        requestsCache: n,
                        responsesCache: a,
                        timeouts: o,
                        userAgent: d,
                        hosts: y,
                        queryParameters: b,
                        headers: f
                    } = e, p = {
                        hostsCache: t,
                        logger: r,
                        requester: s,
                        requestsCache: n,
                        responsesCache: a,
                        timeouts: o,
                        userAgent: d,
                        headers: f,
                        queryParameters: b,
                        hosts: y.map(h => le(h)),
                        read(h, S) {
                            let O = ce(S, p.timeouts.read),
                                P = () => Qe(p, p.hosts.filter(j => (j.accept & X.Read) != 0), h, O);
                            if ((O.cacheable !== void 0 ? O.cacheable : h.cacheable) !== !0) return P();
                            let v = {
                                request: h,
                                mappedRequestOptions: O,
                                transporter: {queryParameters: p.queryParameters, headers: p.headers}
                            };
                            return p.responsesCache.get(v, () => p.requestsCache.get(v, () => p.requestsCache.set(v, P()).then(j => Promise.all([p.requestsCache.delete(v), j]), j => Promise.all([p.requestsCache.delete(v), Promise.reject(j)])).then(([j, T]) => T)), {miss: j => p.responsesCache.set(v, j)})
                        },
                        write(h, S) {
                            return Qe(p, p.hosts.filter(O => (O.accept & X.Write) != 0), h, ce(S, p.timeouts.write))
                        }
                    };
                    return p
                }

                function dr(e) {
                    let t = {
                        value: `Algolia for JavaScript (${e})`, add(r) {
                            let s = `; ${r.segment}${r.version !== void 0 ? ` (${r.version})` : ""}`;
                            return t.value.indexOf(s) === -1 && (t.value = `${t.value}${s}`), t
                        }
                    };
                    return t
                }

                function Ke(e) {
                    try {
                        return JSON.parse(e.content)
                    } catch (t) {
                        throw Je(t.message, e)
                    }
                }

                function ze({content: e, status: t}, r) {
                    let s = e;
                    try {
                        s = JSON.parse(e).message
                    } catch (n) {
                    }
                    return Xe(s, t, r)
                }

                function pr(e, ...t) {
                    let r = 0;
                    return e.replace(/%s/g, () => encodeURIComponent(t[r++]))
                }

                function Ge(e, t, r) {
                    let s = Ye(r), n = `${e.protocol}://${e.url}/${t.charAt(0) === "/" ? t.substr(1) : t}`;
                    return s.length && (n += `?${s}`), n
                }

                function Ye(e) {
                    let t = r => Object.prototype.toString.call(r) === "[object Object]" || Object.prototype.toString.call(r) === "[object Array]";
                    return Object.keys(e).map(r => pr("%s=%s", r, t(e[r]) ? JSON.stringify(e[r]) : e[r])).join("&")
                }

                function $e(e, t) {
                    if (e.method === He.MethodEnum.Get || e.data === void 0 && t.data === void 0) return;
                    let r = Array.isArray(e.data) ? e.data : u(u({}, e.data), t.data);
                    return JSON.stringify(r)
                }

                function Le(e, t) {
                    let r = u(u({}, e.headers), t.headers), s = {};
                    return Object.keys(r).forEach(n => {
                        let a = r[n];
                        s[n.toLowerCase()] = a
                    }), s
                }

                function de(e) {
                    return e.map(t => pe(t))
                }

                function pe(e) {
                    let t = e.request.headers["x-algolia-api-key"] ? {"x-algolia-api-key": "*****"} : {};
                    return g(u({}, e), {request: g(u({}, e.request), {headers: u(u({}, e.request.headers), t)})})
                }

                function Xe(e, t, r) {
                    return {name: "ApiError", message: e, status: t, transporterStackTrace: r}
                }

                function Je(e, t) {
                    return {name: "DeserializationError", message: e, response: t}
                }

                function Ve(e) {
                    return {
                        name: "RetryError",
                        message: "Unreachable hosts - your application id may be incorrect. If the error persists, contact support@algolia.com.",
                        transporterStackTrace: e
                    }
                }

                A.CallEnum = X;
                A.HostStatusEnum = U;
                A.createApiError = Xe;
                A.createDeserializationError = Je;
                A.createMappedRequestOptions = ce;
                A.createRetryError = Ve;
                A.createStatefulHost = ue;
                A.createStatelessHost = le;
                A.createTransporter = lr;
                A.createUserAgent = dr;
                A.deserializeFailure = ze;
                A.deserializeSuccess = Ke;
                A.isStatefulHostTimeouted = Be;
                A.isStatefulHostUp = Fe;
                A.serializeData = $e;
                A.serializeHeaders = Le;
                A.serializeQueryParameters = Ye;
                A.serializeUrl = Ge;
                A.stackFrameWithoutCredentials = pe;
                A.stackTraceWithoutCredentials = de
            });
            var K = I((en, et) => {
                et.exports = Ze()
            });
            var tt = I(w => {
                "use strict";
                Object.defineProperty(w, "__esModule", {value: !0});
                var N = F(), mr = K(), z = B(), hr = e => {
                        let t = e.region || "us", r = N.createAuth(N.AuthMode.WithinHeaders, e.appId, e.apiKey),
                            s = mr.createTransporter(g(u({hosts: [{url: `analytics.${t}.algolia.com`}]}, e), {
                                headers: u(g(u({}, r.headers()), {"content-type": "application/json"}), e.headers),
                                queryParameters: u(u({}, r.queryParameters()), e.queryParameters)
                            })), n = e.appId;
                        return N.addMethods({appId: n, transporter: s}, e.methods)
                    }, yr = e => (t, r) => e.transporter.write({method: z.MethodEnum.Post, path: "2/abtests", data: t}, r),
                    gr = e => (t, r) => e.transporter.write({
                        method: z.MethodEnum.Delete,
                        path: N.encode("2/abtests/%s", t)
                    }, r), fr = e => (t, r) => e.transporter.read({
                        method: z.MethodEnum.Get,
                        path: N.encode("2/abtests/%s", t)
                    }, r), br = e => t => e.transporter.read({method: z.MethodEnum.Get, path: "2/abtests"}, t),
                    Pr = e => (t, r) => e.transporter.write({
                        method: z.MethodEnum.Post,
                        path: N.encode("2/abtests/%s/stop", t)
                    }, r);
                w.addABTest = yr;
                w.createAnalyticsClient = hr;
                w.deleteABTest = gr;
                w.getABTest = fr;
                w.getABTests = br;
                w.stopABTest = Pr
            });
            var st = I((rn, rt) => {
                rt.exports = tt()
            });
            var at = I(G => {
                "use strict";
                Object.defineProperty(G, "__esModule", {value: !0});
                var me = F(), jr = K(), nt = B(), Or = e => {
                    let t = e.region || "us", r = me.createAuth(me.AuthMode.WithinHeaders, e.appId, e.apiKey),
                        s = jr.createTransporter(g(u({hosts: [{url: `recommendation.${t}.algolia.com`}]}, e), {
                            headers: u(g(u({}, r.headers()), {"content-type": "application/json"}), e.headers),
                            queryParameters: u(u({}, r.queryParameters()), e.queryParameters)
                        }));
                    return me.addMethods({appId: e.appId, transporter: s}, e.methods)
                }, Ir = e => t => e.transporter.read({
                    method: nt.MethodEnum.Get,
                    path: "1/strategies/personalization"
                }, t), Ar = e => (t, r) => e.transporter.write({
                    method: nt.MethodEnum.Post,
                    path: "1/strategies/personalization",
                    data: t
                }, r);
                G.createRecommendationClient = Or;
                G.getPersonalizationStrategy = Ir;
                G.setPersonalizationStrategy = Ar
            });
            var it = I((nn, ot) => {
                ot.exports = at()
            });
            var jt = I(i => {
                "use strict";
                Object.defineProperty(i, "__esModule", {value: !0});
                var l = F(), q = K(), m = B(), Sr = require("crypto");

                function Y(e) {
                    let t = r => e.request(r).then(s => {
                        if (e.batch !== void 0 && e.batch(s.hits), !e.shouldStop(s)) return s.cursor ? t({cursor: s.cursor}) : t({page: (r.page || 0) + 1})
                    });
                    return t({})
                }

                var Dr = e => {
                    let t = e.appId,
                        r = l.createAuth(e.authMode !== void 0 ? e.authMode : l.AuthMode.WithinHeaders, t, e.apiKey),
                        s = q.createTransporter(g(u({
                            hosts: [{
                                url: `${t}-dsn.algolia.net`,
                                accept: q.CallEnum.Read
                            }, {
                                url: `${t}.algolia.net`,
                                accept: q.CallEnum.Write
                            }].concat(l.shuffle([{url: `${t}-1.algolianet.com`}, {url: `${t}-2.algolianet.com`}, {url: `${t}-3.algolianet.com`}]))
                        }, e), {
                            headers: u(g(u({}, r.headers()), {"content-type": "application/x-www-form-urlencoded"}), e.headers),
                            queryParameters: u(u({}, r.queryParameters()), e.queryParameters)
                        })), n = {
                            transporter: s, appId: t, addAlgoliaAgent(a, o) {
                                s.userAgent.add({segment: a, version: o})
                            }, clearCache() {
                                return Promise.all([s.requestsCache.clear(), s.responsesCache.clear()]).then(() => {
                                })
                            }
                        };
                    return l.addMethods(n, e.methods)
                };

                function ct() {
                    return {
                        name: "MissingObjectIDError",
                        message: "All objects must have an unique objectID (like a primary key) to be valid. Algolia is also able to generate objectIDs automatically but *it's not recommended*. To do it, use the `{'autoGenerateObjectIDIfNotExist': true}` option."
                    }
                }

                function ut() {
                    return {name: "ObjectNotFoundError", message: "Object not found."}
                }

                function lt() {
                    return {name: "ValidUntilNotFoundError", message: "ValidUntil not found in given secured api key."}
                }

                var Rr = e => (t, r) => {
                        let d = r || {}, {queryParameters: s} = d, n = R(d, ["queryParameters"]),
                            a = u({acl: t}, s !== void 0 ? {queryParameters: s} : {}),
                            o = (y, b) => l.createRetryablePromise(f => $(e)(y.key, b).catch(p => {
                                if (p.status !== 404) throw p;
                                return f()
                            }));
                        return l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: "1/keys",
                            data: a
                        }, n), o)
                    }, vr = e => (t, r, s) => {
                        let n = q.createMappedRequestOptions(s);
                        return n.queryParameters["X-Algolia-User-ID"] = t, e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: "1/clusters/mapping",
                            data: {cluster: r}
                        }, n)
                    }, xr = e => (t, r, s) => e.transporter.write({
                        method: m.MethodEnum.Post,
                        path: "1/clusters/mapping/batch",
                        data: {users: t, cluster: r}
                    }, s), Z = e => (t, r, s) => {
                        let n = (a, o) => L(e)(t, {methods: {waitTask: D}}).waitTask(a.taskID, o);
                        return l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/indexes/%s/operation", t),
                            data: {operation: "copy", destination: r}
                        }, s), n)
                    }, qr = e => (t, r, s) => Z(e)(t, r, g(u({}, s), {scope: [ee.Rules]})),
                    Er = e => (t, r, s) => Z(e)(t, r, g(u({}, s), {scope: [ee.Settings]})),
                    Tr = e => (t, r, s) => Z(e)(t, r, g(u({}, s), {scope: [ee.Synonyms]})), Mr = e => (t, r) => {
                        let s = (n, a) => l.createRetryablePromise(o => $(e)(t, a).then(o).catch(d => {
                            if (d.status !== 404) throw d
                        }));
                        return l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Delete,
                            path: l.encode("1/keys/%s", t)
                        }, r), s)
                    }, wr = () => (e, t) => {
                        let r = q.serializeQueryParameters(t), s = Sr.createHmac("sha256", e).update(r).digest("hex");
                        return Buffer.from(s + r).toString("base64")
                    }, $ = e => (t, r) => e.transporter.read({method: m.MethodEnum.Get, path: l.encode("1/keys/%s", t)}, r),
                    kr = e => t => e.transporter.read({method: m.MethodEnum.Get, path: "1/logs"}, t), Cr = () => e => {
                        let t = Buffer.from(e, "base64").toString("ascii"), r = /validUntil=(\d+)/, s = t.match(r);
                        if (s === null) throw lt();
                        return parseInt(s[1], 10) - Math.round(new Date().getTime() / 1e3)
                    }, Ur = e => t => e.transporter.read({method: m.MethodEnum.Get, path: "1/clusters/mapping/top"}, t),
                    Nr = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Get,
                        path: l.encode("1/clusters/mapping/%s", t)
                    }, r), Wr = e => t => {
                        let n = t || {}, {retrieveMappings: r} = n, s = R(n, ["retrieveMappings"]);
                        return r === !0 && (s.getClusters = !0), e.transporter.read({
                            method: m.MethodEnum.Get,
                            path: "1/clusters/mapping/pending"
                        }, s)
                    }, L = e => (t, r = {}) => {
                        let s = {transporter: e.transporter, appId: e.appId, indexName: t};
                        return l.addMethods(s, r.methods)
                    }, Hr = e => t => e.transporter.read({method: m.MethodEnum.Get, path: "1/keys"}, t),
                    _r = e => t => e.transporter.read({method: m.MethodEnum.Get, path: "1/clusters"}, t),
                    Fr = e => t => e.transporter.read({method: m.MethodEnum.Get, path: "1/indexes"}, t),
                    Br = e => t => e.transporter.read({method: m.MethodEnum.Get, path: "1/clusters/mapping"}, t),
                    Kr = e => (t, r, s) => {
                        let n = (a, o) => L(e)(t, {methods: {waitTask: D}}).waitTask(a.taskID, o);
                        return l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/indexes/%s/operation", t),
                            data: {operation: "move", destination: r}
                        }, s), n)
                    }, zr = e => (t, r) => {
                        let s = (n, a) => Promise.all(Object.keys(n.taskID).map(o => L(e)(o, {methods: {waitTask: D}}).waitTask(n.taskID[o], a)));
                        return l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: "1/indexes/*/batch",
                            data: {requests: t}
                        }, r), s)
                    }, Gr = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Post,
                        path: "1/indexes/*/objects",
                        data: {requests: t}
                    }, r), $r = e => (t, r) => {
                        let s = t.map(n => g(u({}, n), {params: q.serializeQueryParameters(n.params || {})}));
                        return e.transporter.read({
                            method: m.MethodEnum.Post,
                            path: "1/indexes/*/queries",
                            data: {requests: s},
                            cacheable: !0
                        }, r)
                    }, Lr = e => (t, r) => Promise.all(t.map(s => {
                        let d = s.params, {facetName: n, facetQuery: a} = d, o = R(d, ["facetName", "facetQuery"]);
                        return L(e)(s.indexName, {methods: {searchForFacetValues: dt}}).searchForFacetValues(n, a, u(u({}, r), o))
                    })), Vr = e => (t, r) => {
                        let s = q.createMappedRequestOptions(r);
                        return s.queryParameters["X-Algolia-User-ID"] = t, e.transporter.write({
                            method: m.MethodEnum.Delete,
                            path: "1/clusters/mapping"
                        }, s)
                    }, Qr = e => (t, r) => {
                        let s = (n, a) => l.createRetryablePromise(o => $(e)(t, a).catch(d => {
                            if (d.status !== 404) throw d;
                            return o()
                        }));
                        return l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/keys/%s/restore", t)
                        }, r), s)
                    }, Jr = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Post,
                        path: "1/clusters/mapping/search",
                        data: {query: t}
                    }, r), Xr = e => (t, r) => {
                        let s = Object.assign({}, r), f = r || {}, {queryParameters: n} = f, a = R(f, ["queryParameters"]),
                            o = n ? {queryParameters: n} : {},
                            d = ["acl", "indexes", "referers", "restrictSources", "queryParameters", "description", "maxQueriesPerIPPerHour", "maxHitsPerQuery"],
                            y = p => Object.keys(s).filter(h => d.indexOf(h) !== -1).every(h => p[h] === s[h]),
                            b = (p, h) => l.createRetryablePromise(S => $(e)(t, h).then(O => y(O) ? Promise.resolve() : S()));
                        return l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Put,
                            path: l.encode("1/keys/%s", t),
                            data: o
                        }, a), b)
                    }, pt = e => (t, r) => {
                        let s = (n, a) => D(e)(n.taskID, a);
                        return l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/indexes/%s/batch", e.indexName),
                            data: {requests: t}
                        }, r), s)
                    }, Yr = e => t => Y(g(u({}, t), {
                        shouldStop: r => r.cursor === void 0,
                        request: r => e.transporter.read({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/indexes/%s/browse", e.indexName),
                            data: r
                        }, t)
                    })), Zr = e => t => {
                        let r = u({hitsPerPage: 1e3}, t);
                        return Y(g(u({}, r), {
                            shouldStop: s => s.hits.length < r.hitsPerPage, request(s) {
                                return mt(e)("", u(u({}, r), s)).then(n => g(u({}, n), {hits: n.hits.map(a => (delete a._highlightResult, a))}))
                            }
                        }))
                    }, es = e => t => {
                        let r = u({hitsPerPage: 1e3}, t);
                        return Y(g(u({}, r), {
                            shouldStop: s => s.hits.length < r.hitsPerPage, request(s) {
                                return ht(e)("", u(u({}, r), s)).then(n => g(u({}, n), {hits: n.hits.map(a => (delete a._highlightResult, a))}))
                            }
                        }))
                    }, te = e => (t, r, s) => {
                        let y = s || {}, {batchSize: n} = y, a = R(y, ["batchSize"]), o = {taskIDs: [], objectIDs: []},
                            d = (b = 0) => {
                                let f = [], p;
                                for (p = b; p < t.length && (f.push(t[p]), f.length !== (n || 1e3)); p++) ;
                                return f.length === 0 ? Promise.resolve(o) : pt(e)(f.map(h => ({
                                    action: r,
                                    body: h
                                })), a).then(h => (o.objectIDs = o.objectIDs.concat(h.objectIDs), o.taskIDs.push(h.taskID), p++, d(p)))
                            };
                        return l.createWaitablePromise(d(), (b, f) => Promise.all(b.taskIDs.map(p => D(e)(p, f))))
                    }, ts = e => t => l.createWaitablePromise(e.transporter.write({
                        method: m.MethodEnum.Post,
                        path: l.encode("1/indexes/%s/clear", e.indexName)
                    }, t), (r, s) => D(e)(r.taskID, s)), rs = e => t => {
                        let a = t || {}, {forwardToReplicas: r} = a, s = R(a, ["forwardToReplicas"]),
                            n = q.createMappedRequestOptions(s);
                        return r && (n.queryParameters.forwardToReplicas = 1), l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/indexes/%s/rules/clear", e.indexName)
                        }, n), (o, d) => D(e)(o.taskID, d))
                    }, ss = e => t => {
                        let a = t || {}, {forwardToReplicas: r} = a, s = R(a, ["forwardToReplicas"]),
                            n = q.createMappedRequestOptions(s);
                        return r && (n.queryParameters.forwardToReplicas = 1), l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/indexes/%s/synonyms/clear", e.indexName)
                        }, n), (o, d) => D(e)(o.taskID, d))
                    }, ns = e => (t, r) => l.createWaitablePromise(e.transporter.write({
                        method: m.MethodEnum.Post,
                        path: l.encode("1/indexes/%s/deleteByQuery", e.indexName),
                        data: t
                    }, r), (s, n) => D(e)(s.taskID, n)), as = e => t => l.createWaitablePromise(e.transporter.write({
                        method: m.MethodEnum.Delete,
                        path: l.encode("1/indexes/%s", e.indexName)
                    }, t), (r, s) => D(e)(r.taskID, s)),
                    os = e => (t, r) => l.createWaitablePromise(yt(e)([t], r).then(s => ({taskID: s.taskIDs[0]})), (s, n) => D(e)(s.taskID, n)),
                    yt = e => (t, r) => {
                        let s = t.map(n => ({objectID: n}));
                        return te(e)(s, k.DeleteObject, r)
                    }, is = e => (t, r) => {
                        let o = r || {}, {forwardToReplicas: s} = o, n = R(o, ["forwardToReplicas"]),
                            a = q.createMappedRequestOptions(n);
                        return s && (a.queryParameters.forwardToReplicas = 1), l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Delete,
                            path: l.encode("1/indexes/%s/rules/%s", e.indexName, t)
                        }, a), (d, y) => D(e)(d.taskID, y))
                    }, cs = e => (t, r) => {
                        let o = r || {}, {forwardToReplicas: s} = o, n = R(o, ["forwardToReplicas"]),
                            a = q.createMappedRequestOptions(n);
                        return s && (a.queryParameters.forwardToReplicas = 1), l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Delete,
                            path: l.encode("1/indexes/%s/synonyms/%s", e.indexName, t)
                        }, a), (d, y) => D(e)(d.taskID, y))
                    }, us = e => t => gt(e)(t).then(() => !0).catch(r => {
                        if (r.status !== 404) throw r;
                        return !1
                    }), ls = e => (t, r) => {
                        let y = r || {}, {query: s, paginate: n} = y, a = R(y, ["query", "paginate"]), o = 0,
                            d = () => ft(e)(s || "", g(u({}, a), {page: o})).then(b => {
                                for (let [f, p] of Object.entries(b.hits)) if (t(p)) return {
                                    object: p,
                                    position: parseInt(f, 10),
                                    page: o
                                };
                                if (o++, n === !1 || o >= b.nbPages) throw ut();
                                return d()
                            });
                        return d()
                    }, ds = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Get,
                        path: l.encode("1/indexes/%s/%s", e.indexName, t)
                    }, r), ps = () => (e, t) => {
                        for (let [r, s] of Object.entries(e.hits)) if (s.objectID === t) return parseInt(r, 10);
                        return -1
                    }, ms = e => (t, r) => {
                        let o = r || {}, {attributesToRetrieve: s} = o, n = R(o, ["attributesToRetrieve"]),
                            a = t.map(d => u({indexName: e.indexName, objectID: d}, s ? {attributesToRetrieve: s} : {}));
                        return e.transporter.read({
                            method: m.MethodEnum.Post,
                            path: "1/indexes/*/objects",
                            data: {requests: a}
                        }, n)
                    }, hs = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Get,
                        path: l.encode("1/indexes/%s/rules/%s", e.indexName, t)
                    }, r), gt = e => t => e.transporter.read({
                        method: m.MethodEnum.Get,
                        path: l.encode("1/indexes/%s/settings", e.indexName),
                        data: {getVersion: 2}
                    }, t), ys = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Get,
                        path: l.encode("1/indexes/%s/synonyms/%s", e.indexName, t)
                    }, r), bt = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Get,
                        path: l.encode("1/indexes/%s/task/%s", e.indexName, t.toString())
                    }, r), gs = e => (t, r) => l.createWaitablePromise(Pt(e)([t], r).then(s => ({
                        objectID: s.objectIDs[0],
                        taskID: s.taskIDs[0]
                    })), (s, n) => D(e)(s.taskID, n)), Pt = e => (t, r) => {
                        let o = r || {}, {createIfNotExists: s} = o, n = R(o, ["createIfNotExists"]),
                            a = s ? k.PartialUpdateObject : k.PartialUpdateObjectNoCreate;
                        return te(e)(t, a, n)
                    }, fs = e => (t, r) => {
                        let O = r || {}, {safe: s, autoGenerateObjectIDIfNotExist: n, batchSize: a} = O,
                            o = R(O, ["safe", "autoGenerateObjectIDIfNotExist", "batchSize"]),
                            d = (P, x, v, j) => l.createWaitablePromise(e.transporter.write({
                                method: m.MethodEnum.Post,
                                path: l.encode("1/indexes/%s/operation", P),
                                data: {operation: v, destination: x}
                            }, j), (T, V) => D(e)(T.taskID, V)), y = Math.random().toString(36).substring(7),
                            b = `${e.indexName}_tmp_${y}`,
                            f = he({appId: e.appId, transporter: e.transporter, indexName: b}), p = [],
                            h = d(e.indexName, b, "copy", g(u({}, o), {scope: ["settings", "synonyms", "rules"]}));
                        p.push(h);
                        let S = (s ? h.wait(o) : h).then(() => {
                            let P = f(t, g(u({}, o), {autoGenerateObjectIDIfNotExist: n, batchSize: a}));
                            return p.push(P), s ? P.wait(o) : P
                        }).then(() => {
                            let P = d(b, e.indexName, "move", o);
                            return p.push(P), s ? P.wait(o) : P
                        }).then(() => Promise.all(p)).then(([P, x, v]) => ({
                            objectIDs: x.objectIDs,
                            taskIDs: [P.taskID, ...x.taskIDs, v.taskID]
                        }));
                        return l.createWaitablePromise(S, (P, x) => Promise.all(p.map(v => v.wait(x))))
                    }, bs = e => (t, r) => ye(e)(t, g(u({}, r), {clearExistingRules: !0})),
                    Ps = e => (t, r) => ge(e)(t, g(u({}, r), {replaceExistingSynonyms: !0})),
                    js = e => (t, r) => l.createWaitablePromise(he(e)([t], r).then(s => ({
                        objectID: s.objectIDs[0],
                        taskID: s.taskIDs[0]
                    })), (s, n) => D(e)(s.taskID, n)), he = e => (t, r) => {
                        let o = r || {}, {autoGenerateObjectIDIfNotExist: s} = o,
                            n = R(o, ["autoGenerateObjectIDIfNotExist"]), a = s ? k.AddObject : k.UpdateObject;
                        if (a === k.UpdateObject) {
                            for (let d of t) if (d.objectID === void 0) return l.createWaitablePromise(Promise.reject(ct()))
                        }
                        return te(e)(t, a, n)
                    }, Os = e => (t, r) => ye(e)([t], r), ye = e => (t, r) => {
                        let d = r || {}, {forwardToReplicas: s, clearExistingRules: n} = d,
                            a = R(d, ["forwardToReplicas", "clearExistingRules"]), o = q.createMappedRequestOptions(a);
                        return s && (o.queryParameters.forwardToReplicas = 1), n && (o.queryParameters.clearExistingRules = 1), l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/indexes/%s/rules/batch", e.indexName),
                            data: t
                        }, o), (y, b) => D(e)(y.taskID, b))
                    }, Is = e => (t, r) => ge(e)([t], r), ge = e => (t, r) => {
                        let d = r || {}, {forwardToReplicas: s, replaceExistingSynonyms: n} = d,
                            a = R(d, ["forwardToReplicas", "replaceExistingSynonyms"]), o = q.createMappedRequestOptions(a);
                        return s && (o.queryParameters.forwardToReplicas = 1), n && (o.queryParameters.replaceExistingSynonyms = 1), l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Post,
                            path: l.encode("1/indexes/%s/synonyms/batch", e.indexName),
                            data: t
                        }, o), (y, b) => D(e)(y.taskID, b))
                    }, ft = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Post,
                        path: l.encode("1/indexes/%s/query", e.indexName),
                        data: {query: t},
                        cacheable: !0
                    }, r), dt = e => (t, r, s) => e.transporter.read({
                        method: m.MethodEnum.Post,
                        path: l.encode("1/indexes/%s/facets/%s/query", e.indexName, t),
                        data: {facetQuery: r},
                        cacheable: !0
                    }, s), mt = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Post,
                        path: l.encode("1/indexes/%s/rules/search", e.indexName),
                        data: {query: t}
                    }, r), ht = e => (t, r) => e.transporter.read({
                        method: m.MethodEnum.Post,
                        path: l.encode("1/indexes/%s/synonyms/search", e.indexName),
                        data: {query: t}
                    }, r), As = e => (t, r) => {
                        let o = r || {}, {forwardToReplicas: s} = o, n = R(o, ["forwardToReplicas"]),
                            a = q.createMappedRequestOptions(n);
                        return s && (a.queryParameters.forwardToReplicas = 1), l.createWaitablePromise(e.transporter.write({
                            method: m.MethodEnum.Put,
                            path: l.encode("1/indexes/%s/settings", e.indexName),
                            data: t
                        }, a), (d, y) => D(e)(d.taskID, y))
                    },
                    D = e => (t, r) => l.createRetryablePromise(s => bt(e)(t, r).then(n => n.status !== "published" ? s() : void 0)),
                    Ss = {
                        AddObject: "addObject",
                        Analytics: "analytics",
                        Browser: "browse",
                        DeleteIndex: "deleteIndex",
                        DeleteObject: "deleteObject",
                        EditSettings: "editSettings",
                        ListIndexes: "listIndexes",
                        Logs: "logs",
                        Recommendation: "recommendation",
                        Search: "search",
                        SeeUnretrievableAttributes: "seeUnretrievableAttributes",
                        Settings: "settings",
                        Usage: "usage"
                    }, k = {
                        AddObject: "addObject",
                        UpdateObject: "updateObject",
                        PartialUpdateObject: "partialUpdateObject",
                        PartialUpdateObjectNoCreate: "partialUpdateObjectNoCreate",
                        DeleteObject: "deleteObject"
                    }, ee = {Settings: "settings", Synonyms: "synonyms", Rules: "rules"},
                    Ds = {None: "none", StopIfEnoughMatches: "stopIfEnoughMatches"}, Rs = {
                        Synonym: "synonym",
                        OneWaySynonym: "oneWaySynonym",
                        AltCorrection1: "altCorrection1",
                        AltCorrection2: "altCorrection2",
                        Placeholder: "placeholder"
                    };
                i.ApiKeyACLEnum = Ss;
                i.BatchActionEnum = k;
                i.ScopeEnum = ee;
                i.StrategyEnum = Ds;
                i.SynonymEnum = Rs;
                i.addApiKey = Rr;
                i.assignUserID = vr;
                i.assignUserIDs = xr;
                i.batch = pt;
                i.browseObjects = Yr;
                i.browseRules = Zr;
                i.browseSynonyms = es;
                i.chunkedBatch = te;
                i.clearObjects = ts;
                i.clearRules = rs;
                i.clearSynonyms = ss;
                i.copyIndex = Z;
                i.copyRules = qr;
                i.copySettings = Er;
                i.copySynonyms = Tr;
                i.createBrowsablePromise = Y;
                i.createMissingObjectIDError = ct;
                i.createObjectNotFoundError = ut;
                i.createSearchClient = Dr;
                i.createValidUntilNotFoundError = lt;
                i.deleteApiKey = Mr;
                i.deleteBy = ns;
                i.deleteIndex = as;
                i.deleteObject = os;
                i.deleteObjects = yt;
                i.deleteRule = is;
                i.deleteSynonym = cs;
                i.exists = us;
                i.findObject = ls;
                i.generateSecuredApiKey = wr;
                i.getApiKey = $;
                i.getLogs = kr;
                i.getObject = ds;
                i.getObjectPosition = ps;
                i.getObjects = ms;
                i.getRule = hs;
                i.getSecuredApiKeyRemainingValidity = Cr;
                i.getSettings = gt;
                i.getSynonym = ys;
                i.getTask = bt;
                i.getTopUserIDs = Ur;
                i.getUserID = Nr;
                i.hasPendingMappings = Wr;
                i.initIndex = L;
                i.listApiKeys = Hr;
                i.listClusters = _r;
                i.listIndices = Fr;
                i.listUserIDs = Br;
                i.moveIndex = Kr;
                i.multipleBatch = zr;
                i.multipleGetObjects = Gr;
                i.multipleQueries = $r;
                i.multipleSearchForFacetValues = Lr;
                i.partialUpdateObject = gs;
                i.partialUpdateObjects = Pt;
                i.removeUserID = Vr;
                i.replaceAllObjects = fs;
                i.replaceAllRules = bs;
                i.replaceAllSynonyms = Ps;
                i.restoreApiKey = Qr;
                i.saveObject = js;
                i.saveObjects = he;
                i.saveRule = Os;
                i.saveRules = ye;
                i.saveSynonym = Is;
                i.saveSynonyms = ge;
                i.search = ft;
                i.searchForFacetValues = dt;
                i.searchRules = mt;
                i.searchSynonyms = ht;
                i.searchUserIDs = Jr;
                i.setSettings = As;
                i.updateApiKey = Xr;
                i.waitTask = D
            });
            var It = I((on, Ot) => {
                Ot.exports = jt()
            });
            var At = I(re => {
                "use strict";
                Object.defineProperty(re, "__esModule", {value: !0});

                function vs() {
                    return {
                        debug(e, t) {
                            return Promise.resolve()
                        }, info(e, t) {
                            return Promise.resolve()
                        }, error(e, t) {
                            return Promise.resolve()
                        }
                    }
                }

                var xs = {Debug: 1, Info: 2, Error: 3};
                re.LogLevelEnum = xs;
                re.createNullLogger = vs
            });
            var Dt = I((un, St) => {
                St.exports = At()
            });
            var xt = I(fe => {
                "use strict";
                Object.defineProperty(fe, "__esModule", {value: !0});
                var Rt = require("http"), vt = require("https"), qs = require("url");

                function Es() {
                    let e = {keepAlive: !0}, t = new Rt.Agent(e), r = new vt.Agent(e);
                    return {
                        send(s) {
                            return new Promise(n => {
                                let a = qs.parse(s.url), o = a.query === null ? a.pathname : `${a.pathname}?${a.query}`,
                                    d = u({
                                        agent: a.protocol === "https:" ? r : t,
                                        hostname: a.hostname,
                                        path: o,
                                        method: s.method,
                                        headers: s.headers
                                    }, a.port !== void 0 ? {port: a.port || ""} : {}),
                                    y = (a.protocol === "https:" ? vt : Rt).request(d, h => {
                                        let S = "";
                                        h.on("data", O => S += O), h.on("end", () => {
                                            clearTimeout(f), clearTimeout(p), n({
                                                status: h.statusCode || 0,
                                                content: S,
                                                isTimedOut: !1
                                            })
                                        })
                                    }), b = (h, S) => setTimeout(() => {
                                        y.abort(), n({status: 0, content: S, isTimedOut: !0})
                                    }, h * 1e3), f = b(s.connectTimeout, "Connection timeout"), p;
                                y.on("error", h => {
                                    clearTimeout(f), clearTimeout(p), n({status: 0, content: h.message, isTimedOut: !1})
                                }), y.once("response", () => {
                                    clearTimeout(f), p = b(s.responseTimeout, "Socket timeout")
                                }), s.data !== void 0 && y.write(s.data), y.end()
                            })
                        }, destroy() {
                            return t.destroy(), r.destroy(), Promise.resolve()
                        }
                    }
                }

                fe.createNodeHttpRequester = Es
            });
            var Et = I((dn, qt) => {
                qt.exports = xt()
            });
            var kt = I((pn, Tt) => {
                "use strict";
                var Mt = Ee(), Ts = we(), W = st(), be = F(), Pe = it(), c = It(), Ms = Dt(), ws = Et(), ks = K();

                function wt(e, t, r) {
                    let s = {
                        appId: e,
                        apiKey: t,
                        timeouts: {connect: 2, read: 5, write: 30},
                        requester: ws.createNodeHttpRequester(),
                        logger: Ms.createNullLogger(),
                        responsesCache: Mt.createNullCache(),
                        requestsCache: Mt.createNullCache(),
                        hostsCache: Ts.createInMemoryCache(),
                        userAgent: ks.createUserAgent(be.version).add({
                            segment: "Node.js",
                            version: process.versions.node
                        })
                    };
                    return c.createSearchClient(g(u(u({}, s), r), {
                        methods: {
                            search: c.multipleQueries,
                            searchForFacetValues: c.multipleSearchForFacetValues,
                            multipleBatch: c.multipleBatch,
                            multipleGetObjects: c.multipleGetObjects,
                            multipleQueries: c.multipleQueries,
                            copyIndex: c.copyIndex,
                            copySettings: c.copySettings,
                            copyRules: c.copyRules,
                            copySynonyms: c.copySynonyms,
                            moveIndex: c.moveIndex,
                            listIndices: c.listIndices,
                            getLogs: c.getLogs,
                            listClusters: c.listClusters,
                            multipleSearchForFacetValues: c.multipleSearchForFacetValues,
                            getApiKey: c.getApiKey,
                            addApiKey: c.addApiKey,
                            listApiKeys: c.listApiKeys,
                            updateApiKey: c.updateApiKey,
                            deleteApiKey: c.deleteApiKey,
                            restoreApiKey: c.restoreApiKey,
                            assignUserID: c.assignUserID,
                            assignUserIDs: c.assignUserIDs,
                            getUserID: c.getUserID,
                            searchUserIDs: c.searchUserIDs,
                            listUserIDs: c.listUserIDs,
                            getTopUserIDs: c.getTopUserIDs,
                            removeUserID: c.removeUserID,
                            hasPendingMappings: c.hasPendingMappings,
                            generateSecuredApiKey: c.generateSecuredApiKey,
                            getSecuredApiKeyRemainingValidity: c.getSecuredApiKeyRemainingValidity,
                            destroy: be.destroy,
                            initIndex: n => a => c.initIndex(n)(a, {
                                methods: {
                                    batch: c.batch,
                                    delete: c.deleteIndex,
                                    getObject: c.getObject,
                                    getObjects: c.getObjects,
                                    saveObject: c.saveObject,
                                    saveObjects: c.saveObjects,
                                    search: c.search,
                                    searchForFacetValues: c.searchForFacetValues,
                                    waitTask: c.waitTask,
                                    setSettings: c.setSettings,
                                    getSettings: c.getSettings,
                                    partialUpdateObject: c.partialUpdateObject,
                                    partialUpdateObjects: c.partialUpdateObjects,
                                    deleteObject: c.deleteObject,
                                    deleteObjects: c.deleteObjects,
                                    deleteBy: c.deleteBy,
                                    clearObjects: c.clearObjects,
                                    browseObjects: c.browseObjects,
                                    getObjectPosition: c.getObjectPosition,
                                    findObject: c.findObject,
                                    exists: c.exists,
                                    saveSynonym: c.saveSynonym,
                                    saveSynonyms: c.saveSynonyms,
                                    getSynonym: c.getSynonym,
                                    searchSynonyms: c.searchSynonyms,
                                    browseSynonyms: c.browseSynonyms,
                                    deleteSynonym: c.deleteSynonym,
                                    clearSynonyms: c.clearSynonyms,
                                    replaceAllObjects: c.replaceAllObjects,
                                    replaceAllSynonyms: c.replaceAllSynonyms,
                                    searchRules: c.searchRules,
                                    getRule: c.getRule,
                                    deleteRule: c.deleteRule,
                                    saveRule: c.saveRule,
                                    saveRules: c.saveRules,
                                    replaceAllRules: c.replaceAllRules,
                                    browseRules: c.browseRules,
                                    clearRules: c.clearRules
                                }
                            }),
                            initAnalytics: () => n => W.createAnalyticsClient(g(u(u({}, s), n), {
                                methods: {
                                    addABTest: W.addABTest,
                                    getABTest: W.getABTest,
                                    getABTests: W.getABTests,
                                    stopABTest: W.stopABTest,
                                    deleteABTest: W.deleteABTest
                                }
                            })),
                            initRecommendation: () => n => Pe.createRecommendationClient(g(u(u({}, s), n), {
                                methods: {
                                    getPersonalizationStrategy: Pe.getPersonalizationStrategy,
                                    setPersonalizationStrategy: Pe.setPersonalizationStrategy
                                }
                            }))
                        }
                    }))
                }

                wt.version = be.version;
                Tt.exports = wt
            });
            var Ut = I((mn, je) => {
                var Ct = kt();
                je.exports = Ct;
                je.exports.default = Ct
            });
            var Ws = {};
            Vt(Ws, {default: () => Ks});
            var Oe = C(require("@yarnpkg/core")), E = C(require("@yarnpkg/core")),
                Ie = C(require("@yarnpkg/plugin-essentials")), Ht = C(require("semver"));
            var se = C(require("@yarnpkg/core")), Nt = C(Ut()), Cs = "e8e1bd300d860104bb8c58453ffa1eb4",
                Us = "OFCNCOG2CU", Wt = async (e, t) => {
                    var a;
                    let r = se.structUtils.stringifyIdent(e), n = Ns(t).initIndex("npm-search");
                    try {
                        return ((a = (await n.getObject(r, {attributesToRetrieve: ["types"]})).types) == null ? void 0 : a.ts) === "definitely-typed"
                    } catch (o) {
                        return !1
                    }
                }, Ns = e => (0, Nt.default)(Us, Cs, {
                    requester: {
                        async send(r) {
                            try {
                                let s = await se.httpUtils.request(r.url, r.data || null, {
                                    configuration: e,
                                    headers: r.headers
                                });
                                return {content: s.body, isTimedOut: !1, status: s.statusCode}
                            } catch (s) {
                                return {content: s.response.body, isTimedOut: !1, status: s.response.statusCode}
                            }
                        }
                    }
                });
            var _t = e => e.scope ? `${e.scope}__${e.name}` : `${e.name}`, Hs = async (e, t, r, s) => {
                if (r.scope === "types") return;
                let {project: n} = e, {configuration: a} = n, o = a.makeResolver(),
                    d = {project: n, resolver: o, report: new E.ThrowReport};
                if (!await Wt(r, a)) return;
                let b = _t(r), f = E.structUtils.parseRange(r.range).selector;
                if (!E.semverUtils.validRange(f)) {
                    let P = await o.getCandidates(r, new Map, d);
                    f = E.structUtils.parseRange(P[0].reference).selector
                }
                let p = Ht.default.coerce(f);
                if (p === null) return;
                let h = `${Ie.suggestUtils.Modifier.CARET}${p.major}`,
                    S = E.structUtils.makeDescriptor(E.structUtils.makeIdent("types", b), h),
                    O = E.miscUtils.mapAndFind(n.workspaces, P => {
                        var T, V;
                        let x = (T = P.manifest.dependencies.get(r.identHash)) == null ? void 0 : T.descriptorHash,
                            v = (V = P.manifest.devDependencies.get(r.identHash)) == null ? void 0 : V.descriptorHash;
                        if (x !== r.descriptorHash && v !== r.descriptorHash) return E.miscUtils.mapAndFind.skip;
                        let j = [];
                        for (let Ae of Oe.Manifest.allDependencies) {
                            let Se = P.manifest[Ae].get(S.identHash);
                            typeof Se != "undefined" && j.push([Ae, Se])
                        }
                        return j.length === 0 ? E.miscUtils.mapAndFind.skip : j
                    });
                if (typeof O != "undefined") for (let [P, x] of O) e.manifest[P].set(x.identHash, x); else {
                    try {
                        if ((await o.getCandidates(S, new Map, d)).length === 0) return
                    } catch {
                        return
                    }
                    e.manifest[Ie.suggestUtils.Target.DEVELOPMENT].set(S.identHash, S)
                }
            }, _s = async (e, t, r) => {
                if (r.scope === "types") return;
                let s = _t(r), n = E.structUtils.makeIdent("types", s);
                for (let a of Oe.Manifest.allDependencies) typeof e.manifest[a].get(n.identHash) != "undefined" && e.manifest[a].delete(n.identHash)
            }, Fs = (e, t) => {
                t.publishConfig && t.publishConfig.typings && (t.typings = t.publishConfig.typings), t.publishConfig && t.publishConfig.types && (t.types = t.publishConfig.types)
            }, Bs = {
                hooks: {
                    afterWorkspaceDependencyAddition: Hs,
                    afterWorkspaceDependencyRemoval: _s,
                    beforeWorkspacePacking: Fs
                }
            }, Ks = Bs;
            return Ws;
        })();
        return plugin;
    }
};