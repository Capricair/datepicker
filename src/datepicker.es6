(function () {

    'use strict';

    function DatePicker() {

        initTools();

        var cache = [],
            config,
            $container,
            $year,
            $month,
            $day,
            $input,
            controls = {};

        var defaults = {
            year: { start: 1700, end: 3000 },
            month: { start: 1, end: 12 },
            day: { start: 1, end: 31 },
            time: { start: 0, end: 0 },
            touch: { start: 0, end: 0 },
            opened: false,
            smoothScroll: true
        };

        config = $.extend({}, defaults);

        (function main() {
            createHTML();
            controls = createTouchControls();
            controls.setDate(new Date());
            bindActions();
        })();

        /**************************************************
         * 以下为各函数具体实现
         **************************************************/
        function initTools() {
            $.extend = _extend;
        }

        function createHTML() {

            var baseHTML = `<div id="datepicker" class="datepicker-container">
                                <div class="datepicker-wrapper">
                                    <div class="datepicker-head">
                                        <a href="javascript:;" class="btn-cancel">取消</a>
                                        <a href="javascript:;" class="btn-confirm" data-dismiss="datepicker">确定</a>
                                    </div>
                                    <div class="datepicker-body">
                                        <div class="datepicker-year">
                                            <ul></ul>
                                        </div>
                                        <div class="datepicker-month">
                                            <ul></ul>
                                        </div>
                                        <div class="datepicker-day">
                                            <ul></ul>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
            $("body").append(baseHTML);

            $container = $("#datepicker");
            $year = $container.find(".datepicker-year");
            $month = $container.find(".datepicker-month");
            $day = $container.find(".datepicker-day");

            $year.find("ul").html(createList(config.year.start, config.year.end, "年"));
            $month.find("ul").html(createList(config.month.start, config.month.end, "月"));
            $day.find("ul").html(createList(config.day.start, config.day.end, "日"));

            function createList(min, max, unit) {
                var html = "";
                for (let i=min; i<=max; i++){
                    html += `<li data-value="${i}">${i}${unit}</li>`;
                }
                return html;
            }
        }

        function createTouchControls() {

            var itemHeight = getItemHeight();

            // 优化
            $(document).on("touchstart touchmove touchend", function (e) {
                var $target = $(e.target);
                if ($target.closest("#datepicker").length > 0 && config.opened){
                    if (e.type === "touchstart"){
                        $target.closest("ul").parent().trigger("datepicker.scroll.touchstart", [e]);
                    } else if (e.type === "touchmove"){
                        $target.closest("ul").parent().trigger("datepicker.scroll.touchmove", [e]);
                    } else if (e.type === "touchend"){
                        $target.closest("ul").parent().trigger("datepicker.scroll.touchend", [e]);
                    }
                    // 阻止页面滚动
                    e.preventDefault();
                }
            });

            function TouchControl($ctrl) {

                var that = this;
                var $list = $ctrl.find("ul");
                var scrollViewHeight = $ctrl.height();
                var listHeight = $list.height();
                var touch = {
                    start: 0,
                    end: 0,
                    current: 0,
                    direction: "up"
                };
                var limit = {
                    top: itemHeight * 2,
                    bottom: scrollViewHeight - listHeight - itemHeight * 2
                };
                var activeIndex = 0;

                $ctrl.on("datepicker.scroll.touchstart", touchStartHandler);
                $ctrl.on("datepicker.scroll.touchmove", touchMoveHandler);
                $ctrl.on("datepicker.scroll.touchend", touchEndHandler);

                $list.once("webkitTransitionEnd transitionend", function () {
                    $list.trigger("datepicker.scroll.stop");
                }, false, 500);

                $list.on("datepicker.scroll.stop", function () {
                    jointing();
                    that.setActive(getActiveIndex(touch.current, itemHeight));
                });

                this.setTop = function (top) {
                    move(top);
                };

                this.setActive = function (index) {
                    setActiveClass(index);
                    activeIndex = index;
                    $(document).trigger("datepicker.input.change");
                };

                this.setCurrent = function (index) {
                    move(getTopByIndex(index));
                    that.setActive(index);
                };

                this.getActiveIndex = function () {
                    return activeIndex;
                };

                this.getValue = function () {
                    return parseInt($list.find("li.active").attr("data-value"));
                };

                function touchStartHandler(e) {
                    $list.css("transition", "", true);
                    config.time.start = new Date().getTime();
                    config.touch.start = e.touches[0].clientY;
                    touch.start = touch.current;
                }

                function touchMoveHandler(e) {
                    touch.current = touch.start + e.touches[0].clientY - config.touch.start;
                    move(touch.current);
                }

                function touchEndHandler(e) {
                    config.time.end = new Date().getTime();
                    config.touch.end = e.changedTouches[0].clientY;
                    touch.direction = touch.end > touch.start ? "down" : "up";
                    config.smoothScroll ? inertiaScrolling() : jointing();
                    rebound();
                }

                function inertiaScrolling() {
                    var t = config.time.end - config.time.start;
                    var s = config.touch.end - config.touch.start;
                    var v = velocity(s, t);
                    var top = touch.current + s * v * 1.5;
                    var time = v;
                    transitionMove(top, time, "cubic-bezier(.14,.41,.39,.69)");
                }

                function jointing() {
                    var index = parseFloat((touch.current / itemHeight).toFixed(1));
                    touch.current = Math.round(index) * itemHeight;
                    transitionMove(touch.current);
                }

                function rebound() {
                    if (touch.current > limit.top){
                        touch.current = limit.top;
                        transitionMove(touch.current);
                    } else if (touch.current < limit.bottom) {
                        touch.current = limit.bottom;
                        transitionMove(touch.current);
                    }
                }

                function move(top) {
                    touch.current = top;
                    $list.css("transform", `translate3d(0, ${top}px, 0)`, true);
                }

                function transitionMove(top, time=0.3, ease="ease") {
                    touch.current = top;
                    $list.css("transition", `transform ${time}s ${ease}`, true)
                         .css("transform", `translate3d(0, ${top}px, 0)`, true);
                }

                function setActiveClass(index, activeClass = "active") {
                    $list.find("li.active").removeClass(activeClass);
                    $list.find(`li:nth-child(${index})`).addClass(activeClass);
                }
            }

            function velocity(s, t) {
                return parseFloat(Math.abs(s / t).toFixed(2));
            }

            function getItemHeight() {
                return $year.find("ul > li:first-child").height();
            }

            function getTopByIndex(index) {
                return (3 - index) * itemHeight;
            }

            function getActiveIndex(top, itemHeight) {
                return parseInt(3 - (top / itemHeight));
            }

            function setDate(date) {

                var year = createSetDateData(config.year.start, date.getFullYear());
                var month = createSetDateData(config.month.start, date.getMonth()+1);
                var day = createSetDateData(config.day.start, date.getDate());

                if (year.value > config.year.start && year.value < config.year.end){
                    controls.year.setTop(year.top);
                    controls.year.setActive(year.index);
                    controls.month.setTop(month.top);
                    controls.month.setActive(month.index);
                    controls.day.setTop(day.top);
                    controls.day.setActive(day.index);
                }
            }

            function getDateString(formatter) {
                var year = controls.year.getValue();
                var month = controls.month.getValue();
                var day = controls.day.getValue();
                return formatter.replace(/y+/, year).replace(/M+/, padLeft(month, 0, 2)).replace(/d+/, padLeft(day, 0, 2))
            }

            function padLeft(str, char, length) {
                for (var i=0; i<length; i++){
                    str = char + str;
                }
                return str;
            }

            function createSetDateData(start, current) {
                var obj = {};
                obj.value = current;
                obj.top = (start - current + 2) * itemHeight;
                obj.index = getActiveIndex(obj.top, itemHeight);
                return obj;
            }

            return {
                year:  new TouchControl($year),
                month: new TouchControl($month),
                day:   new TouchControl($day),
                setDate: setDate,
                getDateString: getDateString
            }
        }

        function $(selector) {
            if (typeof(selector) === "string" && cache[selector]){
                return cache[selector];
            } else if (selector instanceof HTMLElement || selector instanceof HTMLDocument){
                for (let i=0; i<cache.length; i++){
                    if (cache[i].elements[0] === selector){
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
            this.prefix = ["-webkit-", "-moz-", "-ms-", "-o-"];
            this.elements = [];
            this.typeName = this.constructor.name;

            if (selector instanceof Array){
                that.elements = selector;
            } else if (selector instanceof NodeList) {
                that.elements = nodeListToArray(selector);
            } else if (selector instanceof HTMLElement || selector instanceof HTMLDocument) {
                that.elements = [selector];
            } else if (selector.typeName === "iQuery") {
                that.elements = selector.elements;
            } else if (typeof selector === "string"){
                that.selector = selector;
                that.elements = nodeListToArray(document.querySelectorAll(selector));
            } else {
                console.log(`iQuery Notice: selector invalid.\n`);
                console.log(`selector: ${selector}`)
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
                        if (that.elements[0].getAttribute)
                        return that.elements[0].getAttribute(name);
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
                        el.appendChild(parseHTML(html));
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

            function parseHTML(str) {
                var wrap = document.createElement("div");
                wrap.innerHTML = str;
                return wrap.children[0];
            }

        }

        function nodeListToArray(nodeList) {
            var arr = [];
            for (var i=0; i<nodeList.length; i++){
                arr.push(nodeList[i]);
            }
            return arr;
        }

        function _extend(obj) {
            for (var i=1; i<arguments.length; i++){
                var ext = arguments[i];
                for (var key in ext){
                    if (typeof ext[key] !== "undefined"){
                        obj[key] = ext[key];
                    }
                }
            }
            return obj;
        }

        function openDatePicker() {
            $("body").addClass("datepicker-open");
            config.opened = true;
        }

        function closeDatePicker() {
            $("body").removeClass("datepicker-open");
            config.opened = false;
        }

        function setInputValue() {
            var formatter = $input.attr("data-format") || "yyyy-MM-dd";
            $input.val(controls.getDateString(formatter));
        }

        function bindActions() {

            var $datepickers = $("[role='datepicker']");

            $(document).on("datepicker.input.change", function (e) {
                setInputValue();
            });

            $(document).on("touchstart", function (e) {

                var $target = $(e.target);

                if ($datepickers.indexOf(e.target) > -1){

                    $input = $target;
                    var value = $input.val().replace(/-/g, "/");
                    var date = new Date(value);

                    //设置input默认值，用于点击取消后恢复原始值
                    $input.attr("data-default-value", value);

                    //如果日期不正确，则获取当前日期
                    if (isNaN(date.getDate())){
                        date = new Date();
                    }

                    //设置日期控件当前日期
                    controls.setDate(date);

                    //给当前input赋值
                    setInputValue();
                }

                // 点击其他地方关闭控件体验不好故取消
                /*if (config.opened
                    && $target.parents().indexOf($container[0]) === -1
                    && $target.attr("role") !== "datepicker"){
                    closeDatePicker();
                } else if ($target.attr("role") === "datepicker") {
                    openDatePicker();
                }*/

                if ($target.attr("role") === "datepicker") {
                    openDatePicker();
                }

            });

            $container.find("[data-dismiss='datepicker']").on("touchstart", function () {
                closeDatePicker();
            });

            $container.find(".btn-cancel").on("touchstart", function () {
                $input.val($input.attr("data-default-value"));
                closeDatePicker();
            });

        }

        window.DatePicker = {
            setOptions: function (options) {
                $.extend(config, options);
            }
        }

    }

    try {
        DatePicker();
    } catch (e) {
        console.log(`DatePicker Error: ${e}`);
    }

})();