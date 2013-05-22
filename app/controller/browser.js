/**
 * Created with IntelliJ IDEA.
 * User: nisheeth
 * Date: 18/05/13
 * Time: 20:43
 * To change this template use File | Settings | File Templates.
 */

ConsoleIO.namespace("ConsoleIO.App.Browser");

ConsoleIO.App.Browser = function BrowserController(parent, model) {
    this.parent = parent;
    this.model = model;
    this.store = {
        os: [],
        browser: [],
        offline: [],
        subscribed: []
    };

    this.view = new ConsoleIO.View.Browser(this, this.model);

    ConsoleIO.Service.Socket.on('user:registeredDevice', this.add, this);
    ConsoleIO.Service.Socket.on('user:subscribed', this.subscribed, this);
    ConsoleIO.Service.Socket.on('user:unSubscribed', this.unSubscribed, this);

    ConsoleIO.Service.Socket.on('device:registered', this.add, this);
    ConsoleIO.Service.Socket.on('device:online', this.online, this);
    ConsoleIO.Service.Socket.on('device:offline', this.offline, this);
};

ConsoleIO.App.Browser.prototype.online = function online(data) {
    var index = this.store.offline.indexOf(data.guid);
    if (index > -1) {
        this.store.offline.splice(index, 1);
    }
    this.view.setIcon(data.guid, 'online.png');
};

ConsoleIO.App.Browser.prototype.offline = function offline(data) {
    if (this.store.offline.indexOf(data.guid) === -1) {
        this.store.offline.push(data.guid);
    }
    this.view.setIcon(data.guid, 'offline.png');
};

ConsoleIO.App.Browser.prototype.subscribed = function subscribed(data) {
    if (this.store.subscribed.indexOf(data.guid) === -1) {
        this.store.subscribed.push(data.guid);
    }
    this.view.setIcon(data.guid, 'subscribe.gif');
};

ConsoleIO.App.Browser.prototype.unSubscribed = function unSubscribed(data) {
    var index = this.store.subscribed.indexOf(data.guid);
    if (index > -1) {
        this.store.subscribed.splice(index, 1);
        if (this.store.offline.indexOf(data.guid) === -1) {
            this.online(data);
        } else {
            this.offline(data);
        }
    }
};

ConsoleIO.App.Browser.prototype.add = function add(data) {
    var name = data.browser + '-' + data.version;

    if (this.store.os.indexOf(data.os) === -1) {
        this.view.add(data.os, data.os, 0, data.os.toLowerCase() + '.png');
        this.store.os.push(data.os);
    }

    if (this.store.browser.indexOf(name) === -1) {
        this.view.add(data.browser, data.browser, data.os, data.browser.toLowerCase() + '.png');
        this.view.add(name, data.version, data.browser, 'version.gif');
        this.store.browser.push(name);
    }

    this.view.add(data.guid, data.browser, name);

    //set correct icon
    if (data.subscribed) {
        this.subscribed(data);
    } else if (data.online) {
        this.online(data);
    } else {
        this.offline(data);
    }
};

ConsoleIO.App.Browser.prototype.render = function render(target) {
    this.parent.setTitle(this.model.contextId || this.model.guid, this.model.title);
    this.view.render(target);
};

ConsoleIO.App.Browser.prototype.buttonClick = function buttonClick(btnId) {
    if (btnId === 'refresh') {
        ConsoleIO.forEach(this.store.os, function (os) {
            this.deleteItem(os);
        }, this.view);

        this.store = {
            os: [],
            browser: [],
            offline: [],
            subscribed: []
        };

        ConsoleIO.Service.Socket.emit('reloadDevices');
    }
};

ConsoleIO.App.Browser.prototype.subscribe = function subscribe(guid) {
    var index = this.store.subscribed.indexOf(guid);
    if (index === -1) {
        ConsoleIO.Service.Socket.emit('subscribe', guid);
    }
};