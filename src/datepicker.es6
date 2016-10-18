(function () {

    'use strict';

    var cache = [];

    function DatePicker() {

        var config,
            $container,
            $year,
            $month,
            $day,
            controls = {},
            isMobile = /Android|iOS|W(eb)?OS|iPhone|iPad|iPod|BlackBerry|Windows\s?Phone/i.test(window.navigator.userAgent);

        var defaults = {
            year: { start: 1700, end: 3000 },
            month: { start: 1, end: 12 },
            day: { start: 1, end: 31 },
            opened: false,
            smoothScroll: true
        };

        var global = {
            time: { start: 0, end: 0 },
            touch: { start: 0, end: 0 }
        };

        (function main() {
            config = $.extend({}, defaults);
            createHTML();
            controls = createTouchControls();
            controls.setDate(new Date());
            bindActions();
        })();
        
        /**************************************************
         * 以下为各函数具体实现
         **************************************************/

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
            if ($("#datepicker").length === 0){
                $("body").append(baseHTML);
            } else {
                $("#datepicker").html($(baseHTML).children()[0].outerHTML);
            }

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
            var touchEvents = isMobile ? ["touchstart", "touchmove", "touchend"] : ["mousedown", "mousemove", "mouseup"];
            var isMouseDown = false;

            // 优化
            $(document).on(touchEvents.join(" "), function (e) {
                var $target = $(e.target);
                if ($target.closest("#datepicker").length > 0 && config.opened){
                    if (e.type === touchEvents[0]){
                        $target.closest("ul").parent().trigger("datepicker.scroll.touchstart", e);
                    } else if (e.type === touchEvents[1] && isMouseDown){
                        $target.closest("ul").parent().trigger("datepicker.scroll.touchmove", e);
                    } else if (e.type === touchEvents[2]){
                        $target.closest("ul").parent().trigger("datepicker.scroll.touchend", e);
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

                this.setActive = function (index, triggerValueChanged=true) {
                    setActiveClass(index);
                    activeIndex = index;
                    triggerValueChanged && $container.trigger("datepicker.value.changed");
                };

                this.setCurrent = function (index, scrollDuration, triggerValueChanged=true) {
                    transitionMove(getTopByIndex(index), scrollDuration);
                    that.setActive(index, triggerValueChanged);
                };

                this.getActiveIndex = function () {
                    return activeIndex;
                };

                this.getValue = function () {
                    return parseInt($list.find("li.active").attr("data-value"));
                };

                function touchStartHandler(e) {
                    isMouseDown = true;
                    var clientY = getClientY(e);
                    $list.css("transition", "none", true);
                    global.time.start = new Date().getTime();
                    global.touch.start = clientY;
                    touch.start = touch.current;
                }

                function touchMoveHandler(e) {
                    var clientY = getClientY(e);
                    touch.current = touch.start + clientY - global.touch.start;
                    move(touch.current);
                }

                function touchEndHandler(e) {
                    isMouseDown = false;
                    var clientY = getClientY(e);
                    global.time.end = new Date().getTime();
                    global.touch.end = clientY;
                    touch.direction = touch.end > touch.start ? "down" : "up";
                    config.smoothScroll ? inertiaScrolling() : jointing();
                    rebound();
                }

                function getClientY(e) {
                    if (isMobile){
                        return (e.touch ? e.touches[0] : e.changedTouches[0]).clientY;
                    }
                    return e.clientY;
                }

                function inertiaScrolling() {
                    var t = global.time.end - global.time.start;
                    var s = global.touch.end - global.touch.start;
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

                var yearData = createSetDateData(config.year.start, date.getFullYear());
                var monthData = createSetDateData(config.month.start, date.getMonth() + 1);
                var dayData = createSetDateData(config.day.start, date.getDate());
                var isChanged = 0;

                if (yearData.value > config.year.start && yearData.value < config.year.end){
                    if (controls.year.getValue() !== yearData.value){
                        isChanged++;
                        controls.year.setTop(yearData.top);
                        controls.year.setActive(yearData.index, false);
                    }
                    if (controls.month.getValue() !== monthData.value){
                        isChanged++;
                        controls.month.setTop(monthData.top);
                        controls.month.setActive(monthData.index, false);
                    }
                    if (controls.day.getValue() !== dayData.value){
                        isChanged++;
                        controls.day.setTop(dayData.top);
                        controls.day.setActive(dayData.index, false);
                    }
                    if (isChanged > 0){
                        $container.trigger("datepicker.value.changed");
                    }
                }

                function createSetDateData(start, current) {
                    var obj = {};
                    obj.value = current;
                    obj.top = (start - current + 2) * itemHeight;
                    obj.index = getActiveIndex(obj.top, itemHeight);
                    return obj;
                }

            }

            function getDateString(formatter) {
                var year = controls.year.getValue();
                var month = controls.month.getValue();
                var day = controls.day.getValue();
                return formatter.replace(/y+/, year).replace(/M+/, padLeft(month, 0, 2)).replace(/d+/, padLeft(day, 0, 2))
            }

            function padLeft(str, char, length) {
                var len = length - str.toString().length;
                for (var i=0; i<len; i++){
                    str = char.toString() + str.toString();
                }
                return str;
            }

            return {
                year:  new TouchControl($year),
                month: new TouchControl($month),
                day:   new TouchControl($day),
                setDate: setDate,
                // getDate: getDate,
                getDateString: getDateString
            }
        }

        function isLeapYear(year) {
            return (year % 4 == 0) && (year % 100 != 0 || year % 400 == 0);
        }

        function bindActions() {

            var $input = null;
            var $datepickers = $("[role='datepicker']");
            var clickEvent = isMobile ? "touchend" : "click";
            var touch = { x: 0, y: 0, timestamp: 0 };

            $container.on("datepicker.value.changed", function (e) {
                checkDateValid();
                setInputValue();
            });

            $(document).on("touchstart", function (e) {
                touch.x = e.touches[0].clientX;
                touch.y = e.touches[0].clientY;
                touch.timestamp = new Date().getTime();
            });

            $(document).on(clickEvent, function (e) {

                var $target = $(e.target);

                //移动端判断是滑动还是点击
                if (isMobile && (touch.x !== e.changedTouches[0].clientX
                    || touch.y !== e.changedTouches[0].clientY
                    || new Date().getTime() - touch.timestamp > 160)){
                    return;
                }

                if ($datepickers.indexOf(e.target) > -1){

                    $input = $target;

                    var unitedValue = $input.val().replace(/-/g, "/"); //iOS只识别yyyy/MM/dd格式
                    var date = new Date(unitedValue);

                    //控制是否显示月份和日期选择
                    setControlsVisible();

                    //设置input默认值，用于点击取消后恢复原始值
                    $input.attr("data-default-value", $input.val());

                    //如果日期不正确，则获取当前日期
                    if (isNaN(date.getDate())){
                        date = new Date();
                    }

                    //设置日期控件当前日期
                    controls.setDate(date, false);

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

            $container.find("[data-dismiss='datepicker']").on(clickEvent, function () {
                closeDatePicker();
            });

            $container.find(".btn-cancel").on(clickEvent, function () {
                $input.val($input.attr("data-default-value"));
                closeDatePicker();
            });

            function setControlsVisible() {
                var format = getFormat();
                $year.show();
                $month.show();
                $day.show();
                if (!/d+/.test(format)){
                    $day.hide();
                }
                if (!/M+/.test(format)){
                    $month.hide();
                }
            }

            function getFormat() {
                return $input.attr("data-format") || "yyyy-MM-dd";
            }

            function setInputValue() {
                var format = getFormat();
                $input.val(controls.getDateString(format));
            }

            function checkDateValid() {
                var year = controls.year.getValue();
                var month = controls.month.getValue();
                var day = controls.day.getValue();
                if (month === 2){
                    if (isLeapYear(year)){
                        if (day > 29) setDay(29);
                    } else {
                        setDay(28);
                    }
                } else if ([1,3,5,7,8,10,12].indexOf(month) === -1 && day > 30){
                    setDay(30);
                }
                function setDay(day) {
                    controls.day.setCurrent(day, 0.3, false);
                }
            }
        }

        function openDatePicker() {
            $("body").addClass("datepicker-open");
            config.opened = true;
        }

        function closeDatePicker() {
            $("body").removeClass("datepicker-open");
            config.opened = false;
        }

        window.datepicker = {
            init: function (options) {
                $.extend(config, options);
                createHTML();
            },
            open: openDatePicker,
            close: closeDatePicker
        }
    }

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
            return $(that.elements.map(function (el) {
                return el.children;
            }));
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

        this.trigger = function (eventName) {
            var args = arguments;
            that.elements.forEach(function (el) {
                var evt = EVENTS.find(el, eventName);
                if (evt){
                    evt.handle.apply(el, Array.prototype.slice.call(args, 1));
                } else {
                    if (!EVENTS[eventName])
                        EVENTS[eventName] = new Event(eventName);
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
            return Array.prototype.slice.call(nodeList, 0);
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
    DatePicker();

})();