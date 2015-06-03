/// <reference name="MicrosoftAjax.js"/>

Error.emptyCollection = function() {
    var displayMessage = "Sequence contains no elements";
    var e = Error.create(displayMessage, {});
    e.popStackFrame();
    return e;
}
Error.noMatch = function() {
    var displayMessage = "Sequence contains no matching elements";
    var e = Error.create(displayMessage, {});
    e.popStackFrame();
    return e;
}
Error.multipleElements = function() {
    var displayMessage = "Sequence contains multiple matching elements";
    var e = Error.create(displayMessage, {});
    e.popStackFrame();
    return e;
}

Array.prototype.indexOf = function(item) {
    /// <summary>Locates the index of the given item in the array</summary>
    /// <returns type="Number">Item index or -1 if not found</returns>
    if (!item) throw Error.argumentNull("item");
    for (var i = 0; i < this.length; i++) {
        if (this[i] === item) return i;
    }
    return -1;
}

Array.prototype.where = function(fn) {
    /// <summary>Filters the array</summary>
    /// <param name="fn" mayBeNull="false" type="Function">Filtering function</param>
    /// <returns type="Array"></returns>
    if (typeof (fn) !== typeof (Function)) throw Error.argumentType("fn", typeof (fn), typeof (Function), "where takes a function to filter on");
    var coll = new Array();
    for (var i = 0; i < this.length; i++) {
        var ret = fn(this[i]);
        if (typeof (ret) !== "boolean") throw Error.argumentType("fn", typeof (ret), typeof (Boolean), "function provided to where much return bool");
        else if (ret) coll.push(this[i]);
    }
    return coll;
}

Array.prototype.orderBy = function(fn) {
    /// <summary>Orders the current collection by the given function</summary>
    /// <returns type="Array"></returns>
    if (!fn) return this.sort();
    else return this.sort(fn);
}

Array.prototype.orderByDecending = function(fn) {
    /// <summary>Orders the current collection by the given function in decending order</summary>
    /// <returns type="Array"></returns>
    if (!fn) return this.sort().reverse();
    else return this.sort(fn).reverse();
}

Array.prototype.first = function(fn) {
    /// <summary>Get first item matching function</summary>
    /// <param name="fn" mayBeNull="true" type="Function"></param>
    /// <returns type="Object"></returns>
    if (this.length === 0) throw Error.emptyCollection();
    if (!fn) return this[0];
    else {
        if (typeof (fn) !== typeof (Function)) {
            throw Error.argumentType("fn", typeof (fn), typeof (Function), "'first' takes a function to filter on");
        }
        for (var i = 0; i < this.length; i++) {
            var ret = fn(this[i]);
            if (typeof (ret) !== "boolean") throw Error.argumentType("fn", typeof (ret), typeof (Boolean), "function provided to 'first' much return bool");
            else if (ret) return this[i];
        }
    }
    throw Error.noMatch();
}

Array.prototype.firstOrDefault = function(fn) {
    /// <summary>Get first item matching function or returns null</summary>
    /// <param name="fn" mayBeNull="true" type="Function"></param>
    /// <returns type="Object"></returns>
    if (this.length === 0) return null;
    if (!fn) return this[0];
    else {
        if (typeof (fn) !== typeof (Function)) {
            throw Error.argumentType("fn", typeof (fn), typeof (Function), "'first' takes a function to filter on");
        }
        for (var i = 0; i < this.length; i++) {
            var ret = fn(this[i]);
            if (typeof (ret) !== "boolean") throw Error.argumentType("fn", typeof (ret), typeof (Boolean), "function provided to 'first' much return bool");
            else if (ret) return this[i];
        }
    }
    return null;
}

Array.prototype.single = function(fn) {
    /// <summary>Get a single item matching function</summary>
    /// <param name="fn" mayBeNull="true" type="Function"></param>
    /// <returns type="Object"></returns>
    if (this.length === 0) throw Error.emptyCollection();
    if (!fn && this.length !== 1) throw Error.multipleElemets();
    else {
        var items = this.where(fn);
        if (items.length === 0) throw Error.noMatch();
        if (items.length !== 1) throw Error.multipleElements();
        else return items[0];
    }
    throw Error.noMatch();
}

Array.prototype.singleOrDefault = function(fn) {
    /// <summary>Get a single item matching function or returns null</summary>
    /// <param name="fn" mayBeNull="true" type="Function"></param>
    /// <returns type="Object"></returns>
    if (this.length === 0) return null;
    if (!fn && this.length !== 1) throw Error.multipleElemets();
    else {
        var items = this.where(fn);
        if (items.length === 0) return null;
        if (items.length !== 1) throw Error.multipleElements();
        else return items[0];
    }
    return null;
}


Array.prototype.last = function(fn) {
    /// <summary>Get the last item matching function</summary>
    /// <param name="fn" mayBeNull="true" type="Function"></param>
    /// <returns type="Object"></returns>
    if (this.length === 0) throw Error.emptyCollection();
    if (!fn) return this[this.length - 1];
    else {
        var items = this.where(fn);
        if (items.length === 0) throw Error.noMatch();
        else return items[items.length - 1];
    }
    throw Error.noMatch();
}

Array.prototype.lastOrDefault = function(fn) {
    /// <summary>Get the last item matching function or returns null</summary>
    /// <param name="fn" mayBeNull="true" type="Function"></param>
    /// <returns type="Object"></returns>
    if (this.length === 0) return null;
    if (!fn) return this[this.length - 1];
    else {
        var items = this.where(fn);
        if (items.length === 0) return null;
        else return items[items.length - 1];
    }
    return null;
}

Array.prototype.select = function(fn) {
    /// <summary>Selects the current object as a new object</summary>
    /// <returns type="Array"></returns>
    if (!fn || typeof (fn) !== typeof (Function)) {
        throw Error.argumentType("fn", typeof (fn), typeof (Function), "select takes a function to filter on");
    }
    var ret = new Array();
    for (var i = 0; i < this.length; i++) {
        ret.push(fn(this[i]));
    }
    return ret;
}

Array.prototype.groupBy = function(fn) {
    /// <summary>Groups the collection using the given grouping selector</summary>
    /// <returns type="Array">Array of items in object notation: { key: "grouping key", items: [] }</returns>
    if (!fn || typeof (fn) !== typeof (Function)) {
        throw Error.argumentType("fn", typeof (fn), typeof (Function), "groupBy takes a function to filter on");
    }
    var ret = new Array();
    for (var i = 0; i < this.length; i++) {
        var key = fn(this[i]);
        var keyNode = ret.singleOrDefault(function(item) { return item.key === key; });

        if (!keyNode) {
            ret[ret.length] = { "key": key, "items": new Array() };
            ret[ret.length - 1].items.push(this[i]);
        } else {
            ret[ret.indexOf(keyNode)].items.push(this[i]);
        }
    }

    return ret;
}

Array.prototype.skip = function(count) {
    /// <summary>Skips over the specified number of items</summary>
    /// <returns type="Array"></returns>
    if (isNaN(count)) throw Error.argumentType("count", typeof (count), typeof (Number), "Count must be a number");
    var ret = new Array();
    for (var i = 0; i < this.length; i++) {
        if (i > count) ret.push(this[i]);
    }
    return ret;
}

Array.prototype.skipWhile = function(fn) {
    /// <summary>Skips over the items while the skipping function returns true</summary>
    /// <param name="fn" type="Function">Skipping function</param>
    /// <returns type="Array"></returns>
    if (!fn || typeof (fn) !== typeof (Function)) {
        throw Error.argumentType("fn", typeof (fn), typeof (Function), "skipWhile takes a function to filter on");
    }
    var coll = new Array();
    for (var i = 0; i < this.length; i++) {
        var ret = fn(this[i], i);
        if (typeof (ret) !== "boolean") throw Error.argumentType("fn", typeof (ret), typeof (Boolean), "function provided to where much return bool");
        else if (ret) coll.push(this[i]);
    }
    return coll;
}

Array.prototype.take = function(count) {
    /// <summary>Takes the first x number of items in the array</summary>
    /// <returns type="Array"></returns>
    if (isNaN(count)) throw Error.argumentType("count", typeof (count), typeof (Number), "Count must be a number");
    var ret = new Array();
    for (var i = 0; i < count; i++) {
        ret.push(this[i]);
    }
    return ret;
}

Object.prototype.dump = function(msg) {
    Sys.Debug.traceDump(this, msg);
    return this;
}