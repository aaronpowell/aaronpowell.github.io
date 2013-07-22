var docpadConfig, marked, moment, path;

marked = require('marked');

moment = require('moment');

path = require('path');

docpadConfig = {
  ignorePaths: [path.join(__dirname, 'src', 'files', 'get')],
  templateData: {
    site: {
      title: 'LINQ to Fail',
      author: 'Aaron Powell',
      email: 'me@aaron-powell.com',
      github: 'aaronpowell',
      twitter: 'slace',
      description: '.net, C#, asp.net, umbraco',
      url: 'http://www.aaron-powell.com'
    },
    contentTrim: function(str) {
      if (str.length > 200) {
        return str.slice(0, 197) + '...';
      } else {
        return str;
      }
    },
    relatedPosts: function(post) {
      var posts;

      posts = this.getCollection('posts').findAll({
        url: {
          '$ne': post.url
        }
      }, [{
          date: -1
        }
      ]).toJSON();

      return posts.map(function(p) {
        var matches;

        matches = post.tags.map(function(tag) {
          if (p.tags.indexOf(tag) >= 0) {
            return 1;
          } else {
            return 0;
          }
        }).reduce(function(x, y) {
          return x + y;
        }, 0);
        return {
          post: p,
          matches: matches
        };
      }).filter(function(x) {
        return x.matches > 0;
      }).sort(function(x, y) {
        if (x.matches < y.matches) {
          return -1;
        } else if (x.matches > y.matches) {
          return 1;
        }

        if (x.post.date < y.post.date) {
          return 1;
        } else if (x.post.date > y.post.date) {
          return -1;
        }
        return 0;
      }).map(function(x) {
        return x.post;
      });
    },
    parseMarkdown: function(str) {
      return marked(str);
    },
    formatDate: function(date) {
      return moment(date).format('Do MMMM YYYY');
    },
    generateSummary: function (post) {
      var description = post.description;
      return description ? this.parseMarkdown(description) : this.parseMarkdown(this.contentTrim(post.content));
    }
  },
  collections: {
    posts: function() {
      return this.getCollection('html').findAllLive({
        relativeOutDirPath: 'posts'
      }, [{
          date: -1
        }
      ]).on('add', function(model) {
        return model.setMetaDefaults({
          layout: 'post'
        });
      });
    }
  },
  events: {
    serverExtend: function(opts) {
      var docpadServer;

      docpadServer = opts.server;
      docpadServer.use(function(req, res, next) {
        var _ref;

        if ((_ref = req.headers.host) === 'aaron-powell.com' || _ref === 'apowell.me' || _ref === 'www.apowell.me') {
          return res.redirect(301, 'http://www.aaron-powell.com' + req.url);
        } else {
          return next();
        }
      });

      docpadServer.use(function (req, res, next) {
        if (req.path === '/feed') {
          return res.redirect(301, '/atom.xml');
        }
        return next();
      });
    }
  },
  plugins: {
    tagging: {
      indexPagePath: 'tagged'
    }
  }
};

module.exports = docpadConfig;