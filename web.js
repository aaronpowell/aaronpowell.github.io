var express = require('express');
var app = express();

app.get('/routes.json', function (req, res) {
    res.status(403).send('403 Forbidden');
})

app.use(express.static(__dirname + '/out'));

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

app.listen(process.env.PORT || 3000);