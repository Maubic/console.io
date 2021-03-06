/**
 * Created with IntelliJ IDEA.
 * User: nisheeth
 * Date: 27/08/13
 * Time: 11:16
 * Email: nisheeth.k.kashyap@gmail.com
 * Repositories: https://github.com/nkashyap
 *
 * Console wrapper
 */

(function (exports, global) {

    var console = exports.console = new exports.EventEmitter(),
        nativeConsole = global.console,
        withoutScope = ['dir', 'dirxml'],
        counters = {},
        timeCounters = {};


    function send(type, args, value, callStack) {
        if (nativeConsole && exports.getConfig().nativeConsole) {
            if (nativeConsole[type]) {
                if (withoutScope.indexOf(type) > -1) {
                    nativeConsole[type](args);
                } else {
                    nativeConsole[type].apply(nativeConsole, args);
                }
            }
        }

        if (args && args.hasOwnProperty("length")) {
            if (args.length > 0) {
                args = exports.util.toArray(args);
            }
        }

        console.emit('console', {
            type: type,
            message: value || exports.stringify.parse(args),
            stack: callStack ? exports.stringify.parse(callStack) : ''
        });
    }

    console._native = nativeConsole;

    console.assert = function assert(x) {
        if (!x) {
            var args = ['Assertion failed:'],
                traceList = exports.stacktrace.get(exports.stacktrace.create());

            args = args.concat(exports.util.toArray(arguments).slice(1));
            traceList.splice(0, 3);

            send("assert", arguments, exports.stringify.parse(args), traceList);
        } else {
            send("assert", arguments);
        }
    };

    console.count = function count(key) {
        var frameId = (key || '_GLOBAL_'),
            frameCounter = counters[frameId];

        if (!frameCounter) {
            counters[frameId] = frameCounter = {
                key: key || '',
                count: 1
            };
        } else {
            ++frameCounter.count;
        }

        send("count", arguments, (key || '') + ": " + frameCounter.count);
    };

    console.time = function time(name, reset) {
        if (!name) {
            return false;
        }

        var key = "KEY" + name.toString();

        if (!reset && timeCounters[key]) {
            return false;
        }

        timeCounters[key] = (new Date()).getTime();

        send("time", arguments);
    };

    console.timeEnd = function timeEnd(name) {
        if (!name) {
            return false;
        }

        var key = "KEY" + name.toString(),
            timeCounter = timeCounters[key];

        if (timeCounter) {
            delete timeCounters[key];

            send("timeEnd", arguments, name + ": " + ((new Date()).getTime() - timeCounter) + "ms");
        }
    };

    console.debug = function debug() {
        send("debug", arguments);
    };

    console.warn = function warn() {
        send("warn", arguments);
    };

    console.info = function info() {
        send("info", arguments);
    };

    console.log = function log() {
        send("log", arguments);
    };

    console.dir = function dir(obj) {
        send("dir", obj);
    };

    console.dirxml = function dirxml(node) {
        var value,
            nodeType = node.nodeType;

        if (nodeType === 9) {
            node = node.documentElement;
        }

        value = node ? node.outerHTML || node.innerHTML || node.toString() || exports.stringify.parse(node) : null;

        if (value) {
            value = value.replace(/</img, '&lt;');
            value = value.replace(/>/img, '&gt;');
        }

        send("dirxml", node, value);
    };

    console.group = function group() {
        send("group", arguments);
    };

    console.groupCollapsed = function groupCollapsed() {
        send("groupCollapsed", arguments);
    };

    console.groupEnd = function groupEnd() {
        send("groupEnd");
    };

    console.markTimeline = function markTimeline() {
        send("markTimeline", arguments);
    };

    console.timeStamp = function timeStamp(name) {
        send("timeStamp", arguments);
    };

    console.profile = function profile(title) {
        send("profile", arguments, 'Profile "' + exports.profiler.start(title) + '" started.');
    };

    console.profileEnd = function profileEnd(title) {
        title = exports.profiler.finish(title);
        if (title) {
            send("profileEnd", arguments, 'Profile "' + title + '" finished.');
        }
    };

    console.error = function error(e) {
        var traceList,
            message = null;

        if (!e) {
            message = "Unknown Error";
            e = exports.stacktrace.create(message);
        }

        traceList = exports.stacktrace.get(e);

        if (message === "Unknown Error") {
            traceList.splice(0, 3);
        }

        send("error", arguments, message, traceList);
    };

    console.exception = function exception(e) {
        send("error", arguments);
    };

    console.trace = function trace() {
        var traceList = exports.stacktrace.get(exports.stacktrace.create());
        traceList.splice(0, 3);
        send("trace", arguments, "console.trace()", traceList);
    };

    console.clear = function clear() {
        counters = {};
        timeCounters = {};
        send("clear", arguments);
    };

    console.command = function command() {
        send("command", arguments);
    };

    global.console = console;

}('undefined' !== typeof ConsoleIO ? ConsoleIO : module.exports, this));