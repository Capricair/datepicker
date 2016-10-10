(function () {

    "use strict";

    var cache = [];

    function $(selector) {
        if (typeof(selector) === "string" && cache[selector]){
            return cache[selector];
        } else if (selector instanceof HTMLElement || selector instanceof HTMLDocument){
            for (let i=0; i<cache.length; i++){
                if (cache[i].elements[0] === selector && cache[i].length === 1){
                    return cache[i];
                }
            }
        } else if (selector instanceof Array){
            for(var i=0; i<cache.length; i++){
                var item = cache[i];
                for (var j=0; j<item.elements.length; j++){
                    if (item.elements.length !== selector.length || item.elements[j] != selector[j]){
                        break;
                    }
                    if (j === selector.length - 1){
                        return cache[i];
                    }
                }
            }
        }
        var obj = new iQuery(selector);
        cache.push(obj);
        return obj;
    }

    function iQuery(selector) {

        if (!selector) return;

        var that = this, EVENTS = createEventsObject();
        that.prefix = ["-webkit-", "-moz-", "-ms-", "-o-"];
        that.selector = null;
        that.elements = [];
        that.typeName = "iQuery";

        if (selector instanceof Array){
            that.elements = selector;
        } else if (selector instanceof NodeList) {
            that.elements = nodeListToArray(selector);
        } else if (selector instanceof HTMLElement || selector instanceof HTMLDocument) {
            that.elements = [selector];
        } else if (selector.typeName === "iQuery") {
            that.elements = selector.elements;
        } else if (typeof selector === "string"){
            if (/<.*?>/i.test(selector)){
                that.elements = nodeListToArray(parseHTML(selector));
            } else {
                that.selector = selector;
                that.elements = nodeListToArray(document.querySelectorAll(selector));
            }
        } else {
            console.log(`iQuery Notice: selector invalid.`);
        }

        Object.defineProperty(that, "length", {
            get: function () {
                return that.elements.length;
            }
        });

        that.elements.forEach(function (el, i) {
            that[i] = el;
        });

        ["top", "left", "right", "bottom", "width", "height"].forEach(function (attr) {
            that[attr] = function (value) {
                if (typeof(value) === "undefined"){
                    return getBoundingClientRect()[attr];
                } else {
                    that.css(attr, /\d+[^\d]/.test(value) ? value : `${value}px`);
                    return that;
                }
            }
        });

        this.val = function (value) {
            if (typeof value === "undefined"){
                return that[0].value;
            } else {
                that[0].value = value;
                return that;
            }
        };

        this.attr = function (name, value) {
            if (typeof name === "string") {
                if (typeof(value) === "undefined"){
                    if (that.length > 0 && that.elements[0].getAttribute){
                        return that.elements[0].getAttribute(name);
                    } else {
                        return "";
                    }
                } else {
                    that.elements.forEach(function (el) {
                        el.setAttribute(name, value);
                    });
                    return that;
                }
            } else if (typeof name === "object") {
                for (var key in name){
                    (function (k) {
                        that.elements.forEach(function (el) {
                            el.setAttribute(k, value);
                        });
                    })(key);
                }
                return that;
            }
        };

        this.css = function (name, value, hasPrefix) {
            if (typeof name === "string"){
                if (typeof(value) === "undefined"){
                    return that.elements[0].style[name];
                } else {
                    setStyle(name, value, hasPrefix);
                    return that;
                }
            } else if (typeof name === "object") {
                for (var key in name){
                    setStyle(key, name[key], hasPrefix);
                }
                return that;
            }
        };

        this.show = function () {
            setStyle("display", "");
        };

        this.hide = function () {
            setStyle("display", "none");
        };

        this.addClass = function (className) {
            that.elements.forEach(function (el) {
                el.classList.add(className);
            });
            return that;
        };

        this.removeClass = function (className) {
            that.elements.forEach(function (el) {
                el.classList.remove(className);
            });
            return that;
        };

        this.hasClass = function (className) {
            return that.elements[0].classList.contains(className);
        };

        this.toggleClass = function (className) {
            that.hasClass(className) ? that.removeClass(className) : that.addClass(className);
            return this;
        };

        this.html = function (str) {
            if (typeof(str) === "undefined"){
                return that.elements[0].innerHTML;
            } else {
                that.elements.forEach(function (el) {
                    el.innerHTML = str;
                });
            }
            return that;
        };

        this.append = function (html) {
            that.elements.forEach(function (el) {
                if (html instanceof HTMLElement){
                    el.appendChild(html);
                } else if (html.typeName === "iQuery"){
                    html.elements.forEach(function (child) {
                        el.appendChild(child);
                    });
                } else if (typeof html === "string"){
                    var nodes = parseHTML(html);
                    for (var i=0; i<nodes.length; i++){
                        el.appendChild(nodes[i]);
                    }
                }
            });
            return that;
        };

        this.find = function (selector) {
            var list = [];
            that.elements.forEach(function (el) {
                $(el.querySelectorAll(selector)).each(function (child) {
                    list.push(child);
                });
            });
            return $(list);
        };

        this.parent = function () {
            var parents = [];
            that.elements.forEach(function (el) {
                if (el.parentElement){
                    parents.push(el.parentElement);
                }
            });
            return $(parents);
        };

        this.parents = function () {
            var parents = [];
            that.elements.forEach(function (el) {
                while (el.parentElement){
                    parents.push(el.parentElement);
                    el = el.parentElement;
                }
            });
            return parents;
        };

        this.closest = function (selector) {
            var parents = [], matched = false;
            that.elements.forEach(function (el) {
                var els = $(document).find(selector);
                while (el.parentElement){
                    for (var i=0; i<els.length; i++){
                        if (els[i] === el.parentElement){
                            parents.push(els[i]);
                            matched = true;
                            break;
                        }
                    }
                    if (matched) break;
                    el = el.parentElement;
                }
            });
            return $(parents);
        };

        this.children = function (selector) {
            var list = [];
            that.elements.forEach(function (el) {
                list.push(el.children);
            });
            return $(list);
        };

        this.each = function (callback) {
            that.elements.forEach(callback);
        };

        this.reverse = function () {
            that.elements.reverse();
            return that;
        };

        this.indexOf = function (element) {
            for (var i=0; i<that.length; i++){
                if (that[i] === element){
                    return i;
                }
            }
            return -1;
        };

        this.on = function (eventName, selector, handle, useCapture) {
            var IsDelegate = true;
            if (typeof selector === "function") {
                IsDelegate = false;
                handle = selector;
            }
            that.elements.forEach(function (el) {
                var delegate = IsDelegate === false ? handle : function (e) {
                    var children = el.querySelectorAll(selector);
                    for (var i=0; i<children.length; i++){
                        var child = children[i];
                        if (child === e.target) {
                            handle.call(child, e);
                            break;
                        }
                    }
                };
                EVENTS.push({
                    target: el,
                    event: eventName,
                    selector: selector,
                    handle: delegate
                });
                eventName.split(" ").forEach(function (name) {
                    el.addEventListener(name, delegate, useCapture);
                });
            });
            return this;
        };

        this.off = function (eventName, handle, useCapture) {
            that.elements.forEach(function (el) {
                if (!handle){
                    var evt = EVENTS.find(el, eventName);
                    if (evt) handle = evt.handle;
                }
                eventName.split(" ").forEach(function (name) {
                    el.removeEventListener(name, handle, useCapture);
                })
            });
            return this;
        };

        this.one = function (eventName, handle, useCapture) {
            that.on(eventName, function (e) {
                that.off(eventName);
                handle.call(this, e);
            }, useCapture);
            return this;
        };

        this.once = function (eventName, handle, useCapture, timespan) {
            var locker = 0;
            var date1 = new Date();
            that.on(eventName, function (e) {
                var date2 = new Date();
                if (locker === 0 && date2 - date1 > timespan){
                    locker++;
                    date1 = date2;
                    try{
                        handle.call(this, e);
                    } finally {
                        locker = 0;
                    }
                }
            }, useCapture);
        };

        this.trigger = function (eventName, args) {
            that.elements.forEach(function (el) {
                var evt = EVENTS.find(el, eventName);
                if (evt){
                    evt.handle.apply(el, args);
                } else {
                    if (!EVENTS[eventName]) EVENTS[eventName] = new Event(eventName);
                    el.dispatchEvent(EVENTS[eventName]);
                }
            });
            return that;
        };

        function setStyle(name, value, hasPrefix) {
            that.elements.forEach(function (el) {
                hasPrefix && setPrefixStyle(el, name, value);
                el.style[name] = value;
            })
        }

        function setPrefixStyle(el, name, value) {
            that.prefix.forEach(function (pre) {
                el.style[pre + name] = value;
            })
        }

        function getBoundingClientRect() {
            if (that.elements[0]){
                return that.elements[0].getBoundingClientRect();
            }
            return {};
        }

        function createEventsObject() {
            var events = [];
            events.find = function (target, eventName) {
                for (var i=0; i<this.length; i++){
                    var evt = EVENTS[i];
                    if (evt.target === target && evt.event === eventName){
                        return evt;
                    }
                }
            };
            return events;
        }

        function nodeListToArray(nodeList) {
            var arr = [];
            for (var i=0; i<nodeList.length; i++){
                arr.push(nodeList[i]);
            }
            return arr;
        }

        function parseHTML(str) {
            var wrap = document.createElement("div");
            wrap.innerHTML = str;
            return wrap.children;
        }

    }

    function _extend(obj) {
        for (var i=1; i<arguments.length; i++){
            var ext = arguments[i];
            for (var key in ext){
                if (obj[key] && typeof ext[key] === "object"){
                    _extend(obj[key], ext[key]);
                } else if (typeof ext[key] !== "undefined"){
                    obj[key] = ext[key];
                }
            }
        }
        return obj;
    }

    $.extend = _extend;

    window.$ = $;

})();