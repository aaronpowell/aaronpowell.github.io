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
    var _ref, PagedPluginFix;

    return PagedPluginFix = (function (_super) {
        __extends(PagedPluginFix, _super);

        function PagedPluginFix() {
          _ref = PagedPluginFix.__super__.constructor.apply(this, arguments);
          return _ref;
        }

        PagedPluginFix.prototype.name = 'pagedfix';

        PagedPluginFix.prototype.docpadReady = function(opts, next) {
            var paged = docpad.getPlugin('paged');

            if (paged) {
                opts.docpad.DocumentModel.prototype.getPagedUrl = function(pageNumber) {
                    var baseName, cleanUrls, firstPage, firstPageUrl, newUrl, outExtension, prefix;

                    firstPage = this.get('firstPageDoc');
                    outExtension = firstPage.get('outExtension');
                    baseName = firstPage.get('basename');
                    if (pageNumber === 0) {
                        return firstPage.get('url');
                    }
                    firstPageUrl = firstPage.get('firstPageUrl');
                    if (firstPageUrl === '/') {
                        prefix = '/index';
                    } else {
                        prefix = firstPageUrl.replace(/\.html/, '');
                    }
                    newUrl = prefix + '.' + pageNumber;
                    cleanUrls = docpad.getPlugin('cleanurls');
                    if (!cleanUrls) {
                        newUrl += '.html';
                    }
                    return newUrl;
                };
            }

            next();
        };

        PagedPluginFix.prototype.renderDocument = function(opts, next) {
            var file = opts.file;

            if (file.get('isPaged')) {
                file.setUrl(file.get('url'));
            }

            next();
        };

        return PagedPluginFix;
    })(BasePlugin);
};