var argv = require('yargs').argv;

module.exports = function (config) {
    config.set({
        frameworks: ['jasmine'],
        // See: https://github.com/karma-runner/karma/issues/736
        files: [
          './node_modules/jquery/dist/jquery.js',
          './node_modules/es6-promise/dist/es6-promise.js',
          './tmp/**/*.js',
          { pattern: './tmp/**/*.html', served: true, included: false }
        ],
        exclude: [],
        reporters: argv.debug ? ['spec'] : ['spec', 'coverage'],
        autoWatch: true,
        browsers: [argv.debug ? 'Chrome' : 'PhantomJS'],
        plugins: [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-spec-reporter',
            'karma-sourcemap-loader',
            'karma-phantomjs-launcher',
            'karma-coverage'
        ],
        preprocessors: {
            // './dist/**/*.js': ['coverage'],
            './tmp/**/*.js': ['sourcemap']
        },
        coverageReporter: {
            reporters: [
                { type: 'html' },
                { type: 'text-summary' }
            ]
        },
        logLevel: argv.debug ? config.LOG_DEBUG : config.LOG_INFO
    });
};