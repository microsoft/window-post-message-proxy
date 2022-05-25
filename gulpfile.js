var gulp = require('gulp');
var del = require('del'),
  ghPages = require('gulp-gh-pages'),
  header = require('gulp-header'),
  help = require('gulp-help-four'),
  fs = require('fs'),
  moment = require('moment'),
  rename = require('gulp-rename'),
  replace = require('gulp-replace'),
  eslint = require('gulp-eslint'),
  typedoc = require("gulp-typedoc"),
  uglify = require('gulp-uglify'),
  karma = require('karma'),
  webpack = require('webpack'),
  webpackStream = require('webpack-stream'),
  webpackConfig = require('./webpack.config'),
  webpackTestConfig = require('./webpack.test.config'),
  runSequence = require('gulp4-run-sequence'),
  argv = require('yargs').argv,
  saveLicense = require('uglify-save-license')
  ;

help(gulp, undefined);

var package = require('./package.json');
var webpackBanner = package.name + " v" + package.version + " | (c) 2016 Microsoft Corporation " + package.license;
var gulpBanner = "/*! " + webpackBanner + " */\n";

gulp.task('build', 'Build for release', function (done) {
  return runSequence(
    'lint:ts',
    'clean:dist',
    'compile:ts',
    'min',
    'generatecustomdts',
    'header',
    done
  );
});

gulp.task('test', 'Run all tests', function (done) {
  return runSequence(
    'lint:ts',
    'clean:tmp',
    'compile:spec',
    'test:spec',
    done
  );
});

gulp.task('ghpages', 'Deploy documentation to gh-pages', ['nojekyll'], function () {
  return gulp.src(['./docs/**/*'], {
    dot: true
  })
    .pipe(ghPages({
      force: true,
      message: 'Update ' + moment().format('LLL')
    }));
});

gulp.task('nojekyll', 'Add .nojekyll file to docs directory', function (done) {
  fs.writeFile('./docs/.nojekyll', '', function (error) {
    if (error) {
      throw error;
    }

    done();
  });
});

gulp.task('compile:ts', 'Compile source files', function () {
  webpackConfig.plugins = [
    new webpack.BannerPlugin(webpackBanner)
  ];

  return gulp.src(['./src/**/*.ts'])
    .pipe(webpackStream(webpackConfig))
    .pipe(gulp.dest('./dist'));
});

gulp.task('header', 'Add header to distributed files', function () {
  return gulp.src(['./dist/*.d.ts'])
    .pipe(header(gulpBanner))
    .pipe(gulp.dest('./dist'));
});

gulp.task('min', 'Minify build files', function () {
  return gulp.src(['./dist/*.js'])
    .pipe(uglify({
      output: {
          comments: saveLicense
      }
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('clean:dist', 'Clean dist directory', function () {
  return del([
    './dist/**/*'
  ]);
});

gulp.task('clean:tmp', 'Clean tmp directory', function () {
  return del([
    './tmp/**/*'
  ]);
});

gulp.task('compile:spec', 'Compile typescript for tests', function () {
  return gulp.src(['./test/windowPostMessageProxy.spec.ts'])
    .pipe(webpackStream(webpackTestConfig))
    .pipe(gulp.dest('./tmp'));
});

gulp.task('generatecustomdts', 'Generate dts with no exports', function (done) {
  return gulp.src(['./dist/*.d.ts'])
    .pipe(replace(/export\s/g, ''))
    .pipe(rename(function (path) {
      path.basename = "windowPostMessageProxy-noexports.d";
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('test:spec', 'Runs spec tests', function (done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: argv.watch ? false : true,
    captureTimeout: argv.timeout || 20000
  }, function () {
    done();
  }).start();
});

gulp.task('lint:ts', 'Lints all TypeScript', function () {
  return gulp.src(['./src/**/*.ts', './test/**/*.ts'])
    .pipe(eslint({
      formatter: "verbose"
    }))
    .pipe(eslint.format());
});