var express = require('express');
var app = express();
var fs = require('fs');

var docpad = require('docpad');
var docpadConfig = require('./docpad.js');

docpad.createInstance(docpadConfig, function (err, docpadInstance) {
    if (err) {
        return console.error(err);
    }

    docpadInstance.action('generate', function (err, result) {
        if (err) {
            return console.error(err);
        }

        var routes = require('./out/routes.json').routes;

        var redirector = function (dest) {
            return function (req, res) {
                res.redirect(301, dest);
            };
        };

        routes.map(function (route) {
            if (route.redirects) {
                return route.redirects.map(function (redirect) {
                    return app.get(redirect, redirector(route.url));
                });
            }
            return;
        });

        for (var k in app.routes.get) {
          if (app.routes.get[k].path + "" === "*") {
            app.routes.get.splice(k,1);
            break;
          }
        }
    });
});

app.get('*', function (req, res) {
    res.status(202);
    res.set('Location', req.protocol + '://' + req.host + req.originalUrl);
    res.send('Hold on, I have just hit the publish button and because DocPad is so slow at generating a static site you are seeing this while we generate the content. Want to try refreshing in like 5 minutes time?');
})

app.get('/routes.json', function (req, res) {
    res.status(403).send('403 Forbidden');
});

app.use(express.static(__dirname + '/out'));
app.use('/get', express.static(__dirname + '/src/files/get'));

app.get(/^\/tagged\/(\w+)$/, function (req, res) {
    res.redirect(301, req.path + '.html');
});

app.get('/feed', function (req, res) {
    fs.readFile(__dirname + '/out/atom.xml', 'utf8', function (err, data) {
        res.set('Content-Type', 'application/xml');
        res.send(data);
    })
});

app.get('/feeds/rss', function (req, res) {
    fs.readFile(__dirname + '/out/atom.xml', 'utf8', function (err, data) {
        res.set('Content-Type', 'application/xml');
        res.send(data);
    })
});

app.listen(process.env.PORT || 3000);