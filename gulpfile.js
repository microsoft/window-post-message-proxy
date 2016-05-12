var gulp = require('gulp-help')(require('gulp'));
var ts = require('gulp-typescript'),
    karma = require('karma'),
    webpack = require('webpack-stream'),
    webpackConfig = require('./webpack.config'),
    runSequence = require('run-sequence'),
    merge2 = require('merge2'),
    argv = require('yargs').argv
    ;

gulp.task('test', 'Run unit tests', function (done) {
    return runSequence(
        'compile:ts',
        'compile:spec',
        'copy',
        'test:spec',
        done
    )
});

gulp.task('compile:ts', 'Compile typescript for powerbi library', function() {
    var tsProject = ts.createProject('tsconfig.json');
    var tsResult = tsProject.src()
        .pipe(ts(tsProject))
        ;
        
    return merge2(
        tsResult.js.pipe(gulp.dest('./dist')),
        tsResult.dts.pipe(gulp.dest('./dist'))
    );
    // return gulp.src(['./spec/**/*.ts', './test/**/*.ts'])
    //     .pipe(webpack(webpackConfig))
    //     .pipe(gulp.dest('./dist'));
});

gulp.task('compile:spec', 'Compile typescript for tests', function () {
    // var tsProject = ts.createProject('tsconfig.json');
    // var tsResult = gulp.src(['typings/browser/**/*.d.ts', './dist/**/*.js', './test/**/*.ts'])
    //     .pipe(ts())
    //     ;
        
    // return tsResult.js.pipe(gulp.dest('./test'));
    
    return gulp.src(['typings/browser/**/*.d.ts', './src/**/*.ts', './test/**/*.spec.ts'])
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest('./tmp'));
});

gulp.task('copy', 'Copy test utilities', function () {
    return gulp.src(['./test/utility/**/*'])
        .pipe(gulp.dest('./tmp'));
});

gulp.task('test:spec', 'Runs spec tests', function(done) {
    new karma.Server.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: argv.watch ? false : true,
        captureTimeout: argv.timeout || 20000
    }, done);
});