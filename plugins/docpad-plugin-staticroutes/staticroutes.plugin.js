var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key)) 
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype; return child;
    };

module.exports = function (BasePlugin) {
    var _ref, StaticRoutes,
        fs = require('fs'),
        path = require('path');

    return StaticRoutes = (function (_super) {
        __extends(StaticRoutes, _super);

        function StaticRoutes() {
          _ref = StaticRoutes.__super__.constructor.apply(this, arguments);
          return _ref;
        }

        StaticRoutes.prototype.name = 'staticroutes';

        StaticRoutes.prototype.writeAfter = function(opts, next) {
            var docs = this.docpad.getCollection('documents').toJSON();

            var routes = docs.map(function (doc) {
                return {
                    url: doc.url,
                    redirects: doc.urls.filter(function (x) { return x !== doc.url; })
                };
            }).filter(function (route) {
                return !!route.redirects.length;
            });

            fs.writeFile(
                path.join(this.docpad.config.outPath, 'routes.json'),
                JSON.stringify({
                    routes: routes
                }, null, '\t'),
                next
            );
        };

        return StaticRoutes;
    })(BasePlugin);
};