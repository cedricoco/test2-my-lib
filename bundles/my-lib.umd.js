(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('d3')) :
    typeof define === 'function' && define.amd ? define('my-lib', ['exports', '@angular/core', 'd3'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global['my-lib'] = {}, global.ng.core, global.d3));
}(this, (function (exports, i0, d3) { 'use strict';

    var MyLibService = /** @class */ (function () {
        function MyLibService() {
        }
        return MyLibService;
    }());
    MyLibService.ɵfac = function MyLibService_Factory(t) { return new (t || MyLibService)(); };
    MyLibService.ɵprov = i0.ɵɵdefineInjectable({ token: MyLibService, factory: MyLibService.ɵfac, providedIn: 'root' });
    (function () {
        (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MyLibService, [{
                type: i0.Injectable,
                args: [{
                        providedIn: 'root'
                    }]
            }], function () { return []; }, null);
    })();

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b)
                if (Object.prototype.hasOwnProperty.call(b, p))
                    d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                        t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if (d = decorators[i])
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); };
    }
    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            } }
            function rejected(value) { try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function () { if (t[0] & 1)
                throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f)
                throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                        return t;
                    if (y = 0, t)
                        op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2])
                                _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                }
                catch (e) {
                    op = [6, e];
                    y = 0;
                }
                finally {
                    f = t = 0;
                }
            if (op[0] & 5)
                throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    var __createBinding = Object.create ? (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
    }) : (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        o[k2] = m[k];
    });
    function __exportStar(m, o) {
        for (var p in m)
            if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p))
                __createBinding(o, m, p);
    }
    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m)
            return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function () {
                    if (o && i >= o.length)
                        o = void 0;
                    return { value: o && o[i++], done: !o };
                }
            };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m)
            return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        }
        catch (error) {
            e = { error: error };
        }
        finally {
            try {
                if (r && !r.done && (m = i["return"]))
                    m.call(i);
            }
            finally {
                if (e)
                    throw e.error;
            }
        }
        return ar;
    }
    /** @deprecated */
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }
    /** @deprecated */
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++)
            s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }
    function __spreadArray(to, from) {
        for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
            to[j] = from[i];
        return to;
    }
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n])
            i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try {
            step(g[n](v));
        }
        catch (e) {
            settle(q[0][3], e);
        } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length)
            resume(q[0][0], q[0][1]); }
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
    }
    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", { value: raw });
        }
        else {
            cooked.raw = raw;
        }
        return cooked;
    }
    ;
    var __setModuleDefault = Object.create ? (function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function (o, v) {
        o["default"] = v;
    };
    function __importStar(mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    }
    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }
    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m")
            throw new TypeError("Private method is not writable");
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    var _c0 = ["root"];
    var _c1 = ["scroll"];
    var _c2 = ["zone"];
    function parseBool(s) {
        if (s == 'ON')
            return 1;
        else if (s == 'OFF')
            return 0;
        else
            return -1;
    }
    var MyLibComponent = /** @class */ (function () {
        function MyLibComponent(renderer) {
            this.renderer = renderer;
            this.width = 900;
            this.height = 200;
            this.data = [];
            this.domain = [0, 0];
            this.range = [0, 0];
            this.rangeChange = new i0.EventEmitter();
            this.currentTime = 0;
            this.currentTimeChange = new i0.EventEmitter();
            this.title = 'Timeline : ';
            this.margin = { top: 20, right: 20, bottom: 30, left: 50 }; //marge interne au svg 
            this.dataZoom = [];
            this.idZoom = 0;
            this.minTime = 0;
            this.maxTime = 0;
            this.lengthTime = 0;
            this.svgWidth = 0;
            this.svgHeight = 0;
            this.scaleX = d3.scaleTime();
            this.scaleY = d3.scaleLinear();
            this.area = [];
            this.line = [];
            this.lastDatalength = 0;
            this.modeToolTips = "normal";
            this.currentTimeSelected = false;
            this.scrollbarSelected = false;
            this.lastPos = 0;
        }
        /**
         * Copy data in dataZoom, and build title
         */
        MyLibComponent.prototype.ngOnInit = function () {
            var _this = this;
            this.dataZoom = __spread(this.data);
            this.lastDatalength = this.dataZoom.length;
            this.data.forEach(function (element, index) {
                if (index == _this.data.length - 1)
                    _this.title = _this.title + element.label + '.';
                else
                    _this.title = _this.title + element.label + ', ';
            });
        };
        /**
         * Initialize linechart
         */
        MyLibComponent.prototype.ngAfterViewInit = function () {
            var _this = this;
            if (this.timeline != undefined) {
                var w = this.timeline.nativeElement.width.animVal.value;
                var h = this.timeline.nativeElement.height.animVal.value;
                this.svgWidth = (w - this.margin.left) - this.margin.right;
                this.svgHeight = (h - this.margin.top) - this.margin.bottom;
            }
            this.data.forEach(function (element, index) { return _this.buildStyleData(element, index); });
            this.buildZoom();
            this.buildEvent();
            this.drawToolTips();
            this.drawAxis();
            this.drawLineAndPath();
            this.drawLineCurrentTime();
            this.drawScrollbar();
        };
        /**
         * Update linechart on data, range or current time changes
         * @param {SimpleChanges} changes
         */
        MyLibComponent.prototype.ngOnChanges = function (changes) {
            if (changes.data && !changes.data.firstChange)
                this.updateChart();
            if ((changes.data && !changes.data.firstChange && this.range[0] != 0 && this.range[1] != 0) || (changes.range && !changes.range.firstChange)) {
                this.idZoom = Math.round(Math.log(this.lengthTime / (this.range[1] - this.range[0])) / Math.log(1.5));
                this.range = this.controlRange(this.range[0], this.range[1] - this.range[0]);
                if (this.data.length != 0) {
                    this.updateDataZoom(this.range[0], this.range[1]);
                    this.updateSvg(this.range[0], this.range[1]);
                }
            }
            if (changes.currentTime && !changes.currentTime.firstChange && this.data.length != 0)
                this.updateCurrentTime();
        };
        /**
         * Add event listeners on the svg
         */
        MyLibComponent.prototype.buildEvent = function () {
            var _this = this;
            this.svg = d3.select(this.timeline.nativeElement)
                .append('g')
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
            d3.select(this.timeline.nativeElement).on("mousemove", function (event) {
                if (_this.currentTimeSelected)
                    _this.moveCurrentTime(event);
                else
                    _this.showInfo(event);
            })
                .on("mouseleave", function () { _this.currentTimeSelected = false; _this.hideInfo(); })
                .on("wheel", function (event) { return _this.activeZoom(event); })
                .on("mouseup", function () { return _this.currentTimeSelected = false; })
                .on("mouseover", function (event) { return event.preventDefault(); });
        };
        /**
         * Build the style (area, line or both) and the interpolation (stpe or linear) of lines
         * @param {Data} element
         * @param {number} index
         */
        MyLibComponent.prototype.buildStyleData = function (element, index) {
            var _this = this;
            if (element.style == "area" || element.style == "both") {
                if (element.interpolation == "step") {
                    this.area[index] = d3.area()
                        .x(function (d) { return _this.scaleX(d[0]); })
                        .y0(this.svgHeight)
                        .y1(function (d) { return _this.scaleY(d[1]); })
                        .curve(d3.curveStepAfter);
                }
                else {
                    this.area[index] = d3.area()
                        .x(function (d) { return _this.scaleX(d[0]); })
                        .y0(this.svgHeight)
                        .y1(function (d) { return _this.scaleY(d[1]); });
                }
            }
            if (element.style == "line" || element.style == "both") {
                if (element.interpolation == "step") {
                    this.line[index] = d3.line()
                        .x(function (d) { return _this.scaleX(d[0]); })
                        .y(function (d) { return _this.scaleY(d[1]); })
                        .curve(d3.curveStepAfter);
                }
                else {
                    this.line[index] = d3.line()
                        .x(function (d) { return _this.scaleX(d[0]); })
                        .y(function (d) { return _this.scaleY(d[1]); });
                }
            }
            if (!this.controlColor(element.color)) {
                element.color = "black";
            }
        };
        /**
         * Save information for zoom.
         */
        MyLibComponent.prototype.buildZoom = function () {
            this.minTime = this.scale(this.data, "xMin");
            this.maxTime = this.scale(this.data, "xMax");
            this.lengthTime = this.maxTime - this.minTime;
            this.idZoom = 0;
        };
        /**
         * Draw the tooltips's svg
         */
        MyLibComponent.prototype.drawToolTips = function () {
            var _this = this;
            this.tooltip = this.svg.append("g")
                .attr("id", "tooltip")
                .style("display", "none");
            // Le cercle extérieur bleu clair
            this.tooltip.append("circle")
                .attr("fill", "#CCE5F6")
                .attr("r", 10);
            // Le cercle intérieur bleu foncé
            this.tooltip.append("circle")
                .attr("fill", "#3498db")
                .attr("stroke", "#fff")
                .attr("stroke-width", "1.5px")
                .attr("r", 4);
            // Le tooltip en lui-même avec sa pointe vers le bas
            // Il faut le dimensionner en fonction du contenu
            var taille = this.dataZoom.length;
            if (this.modeToolTips == "normal") {
                this.tooltip.append("polyline")
                    .attr("points", "0,0 0," + (40 * taille) + ", 75," + (40 * taille) + ", 80," + (45 * taille) + " 85," + (40 * taille) + " 160," + (40 * taille) + " 160,0 0,0")
                    .style("fill", "#fafafa")
                    .style("stroke", "#3498db")
                    .style("opacity", "0.9")
                    .style("stroke-width", "1")
                    .attr("transform", "translate(-80, " + (-50 * taille) + ")");
                this.dataZoom.forEach(function (element, index) {
                    // Cet élément contiendra tout notre texte
                    var text = _this.tooltip.append("text")
                        .style("font-size", "13px")
                        .style("font-family", "Segoe UI")
                        .style("color", element.color)
                        .style("fill", element.color)
                        .attr("transform", "translate(-80," + (-42 * (index + 1)) + ")");
                    // Element pour la date avec positionnement spécifique
                    text.append("tspan")
                        .attr("dx", "7")
                        .attr("dy", "5")
                        .attr("id", "tooltip-date1" + index);
                    text.append("tspan")
                        .attr("dx", "-90")
                        .attr("dy", "15")
                        .attr("id", "tooltip-date2" + index);
                });
            }
            else {
                this.tooltip.append("polyline")
                    .attr("points", "0," + (95 + ((taille - 1) * 40)) + " , 0,55 , 75,55 , 80,50 , 85,55 , 160,55 , 160," + (95 + ((taille - 1) * 40)) + " 0," + (95 + ((taille - 1) * 40)) + "")
                    .style("fill", "#fafafa")
                    .style("stroke", "#3498db")
                    .style("opacity", "0.9")
                    .style("stroke-width", "1")
                    .attr("transform", "translate(-80, " + (-50 * 1) + ")");
                this.dataZoom.forEach(function (element, index) {
                    // Cet élément contiendra tout notre texte
                    var text = _this.tooltip.append("text")
                        .style("font-size", "13px")
                        .style("font-family", "Segoe UI")
                        .style("color", element.color)
                        .style("fill", element.color)
                        .attr("transform", "translate(-80," + (-30 * (index + 1)) + ")");
                    // Element pour la date avec positionnement spécifique
                    text.append("tspan")
                        .attr("dx", "7")
                        .attr("dy", 50 + 70 * index)
                        .attr("id", "tooltip-date1" + index);
                    text.append("tspan")
                        .attr("dx", "-80")
                        .attr("dy", "20")
                        .attr("id", "tooltip-date2" + index);
                });
            }
        };
        /**
         * Draw horizontal and vertical axis and scale
         */
        MyLibComponent.prototype.drawAxis = function () {
            this.scaleX.range([0, this.svgWidth]);
            this.scaleX.domain([this.minTime, this.maxTime]);
            this.scaleY = d3.scaleLinear();
            this.scaleY.range([this.svgHeight, 0]);
            this.scaleY.domain(this.controlDomain());
            // Configure the X Axis
            this.svg.append('g')
                .attr('transform', 'translate(0,' + this.svgHeight + ')')
                .attr('class', 'xAxis')
                .call(d3.axisBottom(this.scaleX));
            // Configure the Y Axis
            if (this.discreteValue(this.data)) {
                this.svg.append('g')
                    .attr('class', 'yAxis')
                    .call(d3.axisLeft(this.scaleY).ticks(this.scale(this.data, "yMax")));
            }
            else {
                this.svg.append('g')
                    .attr('class', 'yAxis')
                    .call(d3.axisLeft(this.scaleY));
            }
        };
        /**
         * Draw lines on the line chart
         */
        MyLibComponent.prototype.drawLineAndPath = function () {
            var _this = this;
            this.dataZoom.forEach(function (element, index) {
                if (element.style == "area" || element.style == "both") {
                    _this.svg.append('path')
                        .datum(_this.dataZoom[index].values)
                        .attr('class', 'area' + index)
                        .attr('d', _this.area[index])
                        .attr("stroke-width", 0.1)
                        .attr('opacity', 0.3)
                        .style('fill', element.color)
                        .style('stroke', element.color)
                        .style('stroke-width', '2px');
                }
                if (element.style == "line" || element.style == "both") {
                    _this.svg.append('path')
                        .datum(element.values)
                        .attr('class', 'line' + index)
                        .attr('d', _this.line[index])
                        .style('fill', 'none')
                        .style('stroke', element.color)
                        .style('stroke-width', '2px');
                }
            });
        };
        /**
         * Draw the vertical line which represents the current time
         */
        MyLibComponent.prototype.drawLineCurrentTime = function () {
            var _this = this;
            if (this.data.length != 0) {
                if (this.currentTime == 0) {
                    this.currentTime = this.scale(this.data, "xMin");
                }
                var x_1 = 0;
                this.svg.append('path')
                    .datum([[this.currentTime, this.controlDomain()[0]], [this.currentTime, this.svgHeight]])
                    .attr('class', 'currentTimeLine')
                    .attr('d', d3.line()
                    .x(function (d) { return x_1 = _this.scaleX(d[0]); })
                    .y(function (d) { return _this.scaleY(d[1]); }))
                    .style('fill', 'none')
                    .style('stroke', 'red')
                    .style('stroke-width', '3px');
                this.svg.append('circle')
                    .attr('class', 'currentTimeSelector')
                    .attr('cx', x_1)
                    .attr('cy', -13)
                    .attr('r', 7)
                    .attr('fill', 'red')
                    .on("mousedown", function () {
                    _this.currentTimeSelected = true;
                    _this.hideInfo();
                });
            }
        };
        /**
         * Draw the scrollbar and event listener on it
         */
        MyLibComponent.prototype.drawScrollbar = function () {
            var _this = this;
            this.zoneScrollbar.nativeElement.style.width = this.svgWidth + "px";
            this.zoneScrollbar.nativeElement.style.marginLeft = this.margin.left + "px";
            this.zoneScrollbar.nativeElement.style.height = "20px";
            this.zoneScrollbar.nativeElement.style.backgroundColor = "lightgrey";
            this.zoneScrollbar.nativeElement.style.borderRadius = "10px";
            this.scrollbar.nativeElement.style.width = this.svgWidth + "px";
            this.scrollbar.nativeElement.style.height = "20px";
            this.scrollbar.nativeElement.style.backgroundColor = "grey";
            this.scrollbar.nativeElement.style.borderRadius = "10px";
            this.renderer.listen(this.scrollbar.nativeElement, 'mousedown', function (event) { return _this.activeScrollbar(event); });
            this.renderer.listen(this.zoneScrollbar.nativeElement, 'mouseleave', function () { return _this.desactiveScrollbar(); });
            this.renderer.listen(this.zoneScrollbar.nativeElement, 'mouseup', function () { return _this.desactiveScrollbar(); });
            this.renderer.listen(this.zoneScrollbar.nativeElement, 'mousemove', function (event) { return _this.updateRange(event); });
        };
        /**
         * Update all the line chart (horizontal and vertical axis and scale, data, lines and range) on data changes.
         */
        MyLibComponent.prototype.updateChart = function () {
            var _this = this;
            this.dataZoom = __spread(this.data);
            this.data.forEach(function (element, index) {
                _this.buildStyleData(element, index);
                if (element.style == "area")
                    _this.svg.selectAll('.line' + index).remove();
                if (element.style == "line")
                    _this.svg.selectAll('.area' + index).remove();
                _this.title = 'Timeline : ';
                if (index == _this.data.length - 1)
                    _this.title = _this.title + element.label + '.';
                else
                    _this.title = _this.title + element.label + ', ';
            });
            this.buildZoom();
            this.scaleX.domain([this.minTime, this.maxTime]);
            this.scaleY.range([this.svgHeight, 0]);
            this.controlDomain();
            this.scaleY.domain(this.controlDomain());
            if (this.discreteValue(this.data)) {
                this.svg.selectAll('.yAxis')
                    .call(d3.axisLeft(this.scaleY).ticks(this.scale(this.data, "yMax")));
            }
            else {
                this.svg.selectAll('.yAxis')
                    .call(d3.axisLeft(this.scaleY));
            }
            this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));
            this.svg.selectAll('.currentTimeLine').remove();
            this.svg.selectAll('.currentTimeSelector').remove();
            this.updateLine();
            this.drawLineCurrentTime();
            this.updateScrollbar(this.minTime, this.maxTime);
            this.updateToolTips();
            for (var index = this.dataZoom.length; index < this.lastDatalength; index++) {
                this.svg.selectAll('.line' + index).remove();
                this.svg.selectAll('.area' + index).remove();
            }
            this.lastDatalength = this.dataZoom.length;
        };
        /**
         * Update horizontal axis, current time line, lines and scrollbar
         * @param {number} min of the new range
         * @param {number} max of the new range
         */
        MyLibComponent.prototype.updateSvg = function (min, max) {
            this.scaleX.domain([min, max]);
            this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));
            this.updateLine();
            this.updateCurrentTime();
            this.updateScrollbar(min, max);
        };
        /**
         * Update the display of lines
         */
        MyLibComponent.prototype.updateLine = function () {
            var _this = this;
            var lineUpdate;
            var areaUpdate;
            this.dataZoom.forEach(function (element, index) {
                if (element.style == "area" || element.style == "both") {
                    areaUpdate = _this.svg.selectAll('.area' + index).data([_this.dataZoom[index].values]);
                    areaUpdate
                        .enter()
                        .append("path")
                        .attr('class', 'area' + index)
                        .merge(areaUpdate)
                        .attr('d', _this.area[index])
                        .attr("stroke-width", 0.1)
                        .attr('opacity', 0.3)
                        .style('fill', element.color)
                        .style('stroke', element.color)
                        .style('stroke-width', '2px');
                }
                if (element.style == "line" || element.style == "both") {
                    lineUpdate = _this.svg.selectAll('.line' + index).data([_this.dataZoom[index].values]);
                    lineUpdate
                        .enter()
                        .append("path")
                        .attr('class', 'line' + index)
                        .merge(lineUpdate)
                        .attr('d', _this.line[index])
                        .style('fill', 'none')
                        .style('stroke', element.color)
                        .style('stroke-width', '2px');
                }
            });
        };
        /**
         * Update the position of the current time line
         */
        MyLibComponent.prototype.updateCurrentTime = function () {
            var _this = this;
            var lineUpdate = this.svg.selectAll('.currentTimeLine').datum([[this.currentTime, this.controlDomain()[0]], [this.currentTime, this.svgHeight]]);
            var x = 0;
            lineUpdate.enter()
                .append("path")
                .attr('class', 'currentTimeLine')
                .merge(lineUpdate)
                .attr('d', d3.line()
                .x(function (d) { return x = _this.scaleX(d[0]); })
                .y(function (d) { return _this.scaleY(d[1]); }))
                .style('fill', 'none')
                .style('stroke', 'red')
                .style('stroke-width', '3px');
            if (this.currentTime >= this.scale(this.dataZoom, "xMin") && this.currentTime <= this.scale(this.dataZoom, "xMax")) {
                this.svg.selectAll('.currentTimeLine').attr('display', 'block');
                this.svg.selectAll('.currentTimeSelector').attr('display', 'block');
            }
            else {
                this.svg.selectAll('.currentTimeLine').attr('display', 'none');
                this.svg.selectAll('.currentTimeSelector').attr('display', 'none');
            }
            this.svg.selectAll('.currentTimeSelector').attr('cx', x);
        };
        /**
         * Update the position of the scrollbar
         * @param {number} min of the new range
         * @param {number} max of the new range
         */
        MyLibComponent.prototype.updateScrollbar = function (min, max) {
            this.scrollbar.nativeElement.style.marginLeft = this.svgWidth * (min - this.minTime) / (this.lengthTime) + "px";
            this.scrollbar.nativeElement.style.width = this.svgWidth * (max - min) / (this.lengthTime) + "px";
        };
        /**
         * Change the range, control it, update datas, update the linechart and then emit the new range.
         * @param {MouseEvent} event
         */
        MyLibComponent.prototype.updateRange = function (event) {
            if (this.scrollbarSelected) {
                event.preventDefault();
                var lengthLocalTime = this.range[1] - this.range[0];
                var lastMinLocalTime = this.scale(this.dataZoom, "xMin");
                var pos = event.clientX - this.margin.left;
                if (this.lastPos == 0) {
                    this.lastPos = pos;
                }
                var minLocalTime = (pos - this.lastPos) * this.lengthTime / this.svgWidth + lastMinLocalTime;
                this.range = this.controlRange(minLocalTime, lengthLocalTime);
                this.updateDataZoom(this.range[0], this.range[1]);
                this.updateSvg(this.range[0], this.range[1]);
                this.rangeChange.emit(this.range);
                this.lastPos = pos;
            }
        };
        /**
         * Change this.dataZoom at range changes
         * @param {number} min of the new range
         * @param {number} max of the new range
         */
        MyLibComponent.prototype.updateDataZoom = function (min, max) {
            var _this = this;
            this.data.forEach(function (element, index) {
                _this.dataZoom[index] = {
                    label: element.label,
                    values: element.values.filter(function (element) { return min <= element[0] && element[0] <= max; }),
                    color: element.color,
                    style: element.style,
                    interpolation: element.interpolation
                };
            });
            var time;
            this.data.forEach(function (element, index) {
                time = [];
                element.values.forEach((function (element) { return time.push(element[0]); }));
                var i = d3.bisectLeft(time, min) - 1;
                if (i >= 0 && i < _this.data[index].values.length) {
                    _this.dataZoom[index].values.unshift([min, (_this.data[index].values[i][1])]);
                }
                _this.dataZoom[index].values.push([max, _this.dataZoom[index].values[_this.dataZoom[index].values.length - 1][1]]);
            });
        };
        /**
         * Remove and build a new tooltips
         */
        MyLibComponent.prototype.updateToolTips = function () {
            this.tooltip.remove();
            this.drawToolTips();
        };
        /**
         * Active movement of scrollbar on mousedown on it
         * @param {MouseEvent} event
         */
        MyLibComponent.prototype.activeScrollbar = function (event) {
            this.scrollbarSelected = true;
            this.lastPos = event.clientX - this.margin.left;
        };
        /**
         * Desactive movement of scrollbar on mouseup or mouseleave on it
         */
        MyLibComponent.prototype.desactiveScrollbar = function () {
            this.scrollbarSelected = false;
            this.lastPos = 0;
        };
        /**
         * Show the tooltips on the movement of the mouse
         * @param {MouseEvent} event
         */
        MyLibComponent.prototype.showInfo = function (event) {
            var _this = this;
            var time = [];
            if (this.dataZoom[0] != undefined) {
                this.dataZoom[0].values.forEach(function (element) { return time.push(element[0]); });
                this.tooltip.style("display", "block");
                this.tooltip.style("opacity", 100);
                var x0 = this.scaleX.invert(event.clientX - this.margin.left).getTime();
                var x_2 = d3.bisectRight(time, x0);
                if (x_2 > this.dataZoom[0].values.length - 1)
                    x_2 = this.dataZoom[0].values.length - 1;
                else if (x_2 < 0)
                    x_2 = 0;
                var d = this.dataZoom[0].values[x_2][1];
                var t = this.dataZoom[0].values[x_2][0];
                if (this.scaleY(d) <= 40 * this.dataZoom.length) {
                    if (this.modeToolTips != "inverse") {
                        this.modeToolTips = "inverse";
                        this.updateToolTips();
                    }
                }
                else {
                    if (this.modeToolTips != "normal") {
                        this.modeToolTips = "normal";
                        this.updateToolTips();
                    }
                }
                this.dataZoom.forEach(function (element, index) {
                    var i = x_2;
                    if (i > element.values.length - 1)
                        i = _this.dataZoom[index].values.length - 1;
                    else if (i < 0)
                        i = 0;
                    var d = element.values[i][1];
                    var t = element.values[i][0];
                    var date = new Date(t).toLocaleDateString("fr", { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
                    d3.selectAll('#tooltip-date1' + index)
                        .text(date);
                    d3.selectAll('#tooltip-date2' + index)
                        .text(_this.roundDecimal(d, 2));
                });
                this.tooltip.attr("transform", "translate(" + this.scaleX(t) + "," + this.scaleY(d) + ")");
            }
        };
        /**
         * Hide the tooltips when the mouse leave the svg
         */
        MyLibComponent.prototype.hideInfo = function () {
            this.tooltip.style("display", "none");
        };
        /**
         * Update the range (reduce or increase) of the linechart on scroll
         * @param {WheelEvent} event
         */
        MyLibComponent.prototype.activeZoom = function (event) {
            event.preventDefault();
            var lastLengthLocalTime = this.lengthTime / Math.pow(1.5, this.idZoom);
            var lastMinLocalTime = this.scale(this.dataZoom, "xMin");
            if ((event.deltaY > 0 && this.idZoom > 0) || event.deltaY < 0) {
                if (event.deltaY > 0 && this.idZoom > 0) {
                    this.idZoom--;
                }
                else if (event.deltaY < 0) {
                    this.idZoom++;
                }
                var pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
                var lengthLocalTime = this.lengthTime / Math.pow(1.5, this.idZoom);
                var minLocalTime = (lastMinLocalTime - pos) * (lengthLocalTime / lastLengthLocalTime) + pos;
                this.range = this.controlRange(minLocalTime, lengthLocalTime);
                if (lengthLocalTime > 10000) {
                    this.updateDataZoom(this.range[0], this.range[1]);
                    this.updateSvg(this.range[0], this.range[1]);
                    this.rangeChange.emit(this.range);
                }
                else {
                    this.idZoom--;
                }
            }
        };
        /**
         * Update the value of current time on the movement of the mouse
         * @param {MouseEvent} event
         */
        MyLibComponent.prototype.moveCurrentTime = function (event) {
            event.preventDefault();
            var pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
            if (pos < this.scale(this.dataZoom, "xMin")) {
                this.currentTime = this.scale(this.dataZoom, "xMin");
            }
            else if (pos > this.scale(this.dataZoom, "xMax")) {
                this.currentTime = this.scale(this.dataZoom, "xMax");
            }
            else {
                this.currentTime = pos;
            }
            this.updateCurrentTime();
            this.currentTimeChange.emit(this.currentTime);
        };
        /**
         * Control the range based on data's timestamp and the new range
         * @param {number} min of the new range
         * @param {number} length of the new range
         * @returns a adjusted range based on data's timestamp
         */
        MyLibComponent.prototype.controlRange = function (min, length) {
            if (this.minTime > min)
                min = this.minTime;
            var max = min + length;
            if (this.maxTime < max) {
                max = this.maxTime;
                min = max - length;
            }
            if (this.minTime > min)
                min = this.minTime;
            return [min, max];
        };
        /**
         * Control the domain based on data's value type and the input domain
         * @returns a new domain auto-scaled if the input domain is equal to [0,0] or the data's value are positive integers, else return the input domain
         */
        MyLibComponent.prototype.controlDomain = function () {
            if ((this.domain[0] == 0 && this.domain[1] == 0) || this.discreteValue(this.data)) {
                return [this.scale(this.data, "yMin"), this.scale(this.data, "yMax")];
            }
            else {
                return this.domain;
            }
        };
        MyLibComponent.prototype.controlColor = function (color) {
            var s = new Option().style;
            s.color = color;
            return s.color != "";
        };
        /**
         * Determine the minimum or maximum of the horizontal or vertical axis in data
         * @param {Data[]} data Array of Data
         * @param {"xMin" | "xMax" | "yMin" | "yMax"} s precise wihch scale we want
         * @returns the value that matches with the parameter s in data
         */
        MyLibComponent.prototype.scale = function (data, s) {
            var res = 0;
            data.forEach(function (elements, index) { return elements.values.forEach(function (element, i) {
                if ((s == "yMin" && ((i == 0 && index == 0) || element[1] < res)) || (s == "yMax" && ((i == 0 && index == 0) || element[1] > res)))
                    res = element[1];
                else if ((s == "xMin" && ((i == 0 && index == 0) || element[0] < res)) || (s == "xMax" && ((i == 0 && index == 0) || element[0] > res)))
                    res = element[0];
            }); });
            return res;
        };
        /**
        *Check type of data (positive integer or float)
        *@param {Data[]} data Array of Data
        *@returns false if there is at least one value in data that's not a positive integer
        */
        MyLibComponent.prototype.discreteValue = function (data) {
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].values.length; j++) {
                    if (data[i].values[j][1] != Math.round(data[i].values[j][1]))
                        return false;
                }
            }
            return true;
        };
        /**
         * Round a number with a precision
         * @param {number} num
         * @param {number} precision
         * @returns a num with a number of decimal (precision)
         */
        MyLibComponent.prototype.roundDecimal = function (num, precision) {
            var tmp = Math.pow(10, precision);
            return Math.round(num * tmp) / tmp;
        };
        return MyLibComponent;
    }());
    MyLibComponent.ɵfac = function MyLibComponent_Factory(t) { return new (t || MyLibComponent)(i0.ɵɵdirectiveInject(i0.Renderer2)); };
    MyLibComponent.ɵcmp = i0.ɵɵdefineComponent({ type: MyLibComponent, selectors: [["lib-my-lib"]], viewQuery: function MyLibComponent_Query(rf, ctx) {
            if (rf & 1) {
                i0.ɵɵviewQuery(_c0, 1);
                i0.ɵɵviewQuery(_c1, 1);
                i0.ɵɵviewQuery(_c2, 1);
            }
            if (rf & 2) {
                var _t = void 0;
                i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.timeline = _t.first);
                i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.scrollbar = _t.first);
                i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.zoneScrollbar = _t.first);
            }
        }, inputs: { width: "width", height: "height", data: "data", domain: "domain", range: "range", currentTime: "currentTime" }, outputs: { rangeChange: "rangeChange", currentTimeChange: "currentTimeChange" }, features: [i0.ɵɵNgOnChangesFeature], decls: 8, vars: 3, consts: [["root", ""], ["zone", ""], ["scroll", ""]], template: function MyLibComponent_Template(rf, ctx) {
            if (rf & 1) {
                i0.ɵɵelementStart(0, "h2");
                i0.ɵɵtext(1);
                i0.ɵɵelementEnd();
                i0.ɵɵnamespaceSVG();
                i0.ɵɵelement(2, "svg", null, 0);
                i0.ɵɵnamespaceHTML();
                i0.ɵɵelementStart(4, "div", null, 1);
                i0.ɵɵelement(6, "div", null, 2);
                i0.ɵɵelementEnd();
            }
            if (rf & 2) {
                i0.ɵɵadvance(1);
                i0.ɵɵtextInterpolate(ctx.title);
                i0.ɵɵadvance(1);
                i0.ɵɵattribute("width", ctx.width)("height", ctx.height);
            }
        }, encapsulation: 2 });
    (function () {
        (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MyLibComponent, [{
                type: i0.Component,
                args: [{
                        selector: 'lib-my-lib',
                        template: "\n  <h2>{{ title }}</h2>\n  <svg #root [attr.width]=\"width\" [attr.height]=\"height\"></svg>\n  <div #zone><div #scroll></div></div>\n  ",
                        styles: []
                    }]
            }], function () { return [{ type: i0.Renderer2 }]; }, { width: [{
                    type: i0.Input
                }], height: [{
                    type: i0.Input
                }], data: [{
                    type: i0.Input
                }], domain: [{
                    type: i0.Input
                }], timeline: [{
                    type: i0.ViewChild,
                    args: ['root']
                }], scrollbar: [{
                    type: i0.ViewChild,
                    args: ['scroll']
                }], zoneScrollbar: [{
                    type: i0.ViewChild,
                    args: ['zone']
                }], range: [{
                    type: i0.Input
                }], rangeChange: [{
                    type: i0.Output
                }], currentTime: [{
                    type: i0.Input
                }], currentTimeChange: [{
                    type: i0.Output
                }] });
    })();

    var MyLibModule = /** @class */ (function () {
        function MyLibModule() {
        }
        return MyLibModule;
    }());
    MyLibModule.ɵfac = function MyLibModule_Factory(t) { return new (t || MyLibModule)(); };
    MyLibModule.ɵmod = i0.ɵɵdefineNgModule({ type: MyLibModule });
    MyLibModule.ɵinj = i0.ɵɵdefineInjector({ imports: [[]] });
    (function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(MyLibModule, { declarations: [MyLibComponent], exports: [MyLibComponent] }); })();
    (function () {
        (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MyLibModule, [{
                type: i0.NgModule,
                args: [{
                        declarations: [
                            MyLibComponent
                        ],
                        imports: [],
                        exports: [
                            MyLibComponent
                        ]
                    }]
            }], null, null);
    })();

    /*
     * Public API Surface of my-lib
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.MyLibComponent = MyLibComponent;
    exports.MyLibModule = MyLibModule;
    exports.MyLibService = MyLibService;
    exports.parseBool = parseBool;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=my-lib.umd.js.map
