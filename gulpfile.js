var gulp = require('gulp-help')(require('gulp'));
var ts = require('gulp-typescript'),
    karma = require('karma'),
    webpack = require('webpack-stream'),
    webpackConfig = require('./webpack.config'),
    webpackTestConfig = require('./webpack.test.config'),
    runSequence = require('run-sequence'),
    merge2 = require('merge2'),
    argv = require('yargs').argv
    ;

gulp.task('build', 'Compile source files', function () {
    return gulp.src(['typings/**/*.d.ts', './src/**/*.ts'])
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest('./dist'));
});

gulp.task('test', 'Run all tests', function (done) {
    return runSequence(
        'compile:spec',
        'test:spec',
        done
    )
});

gulp.task('compile:spec', 'Compile typescript for tests', function () {
    return gulp.src(['./test/windowPostMessageProxy.spec.ts'])
        .pipe(webpack(webpackTestConfig))
        .pipe(gulp.dest('./tmp'));
});

gulp.task('test:spec', 'Runs spec tests', function (done) {
    new karma.Server.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: argv.watch ? false : true,
        captureTimeout: argv.timeout || 20000
    }, done);
});