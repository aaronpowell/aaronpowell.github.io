var express = require('express');
var app = express();
var fs = require('fs');

app.get('/routes.json', function (req, res) {
    res.status(403).send('403 Forbidden');
})

app.use(express.static(__dirname + '/out'));
app.use('/get', express.static(__dirname + '/src/files/get'));

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