var gulp = require('gulp');
var docpad = require('docpad');
var docpadConfig = require('./docpad.js');

gulp.task('docpad', function (cb) {
    docpad.createInstance(docpadConfig, function (err, docpadInstance) {
        if (err) {
            console.error(err);
            cb();
        }

        docpadInstance.action('generate', function (err, result) {
            if (err) {
                console.error(err);
            }
            
            console.log('Generated!');
            cb();
        });
    });
});