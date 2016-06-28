var package = require('./package.json');

module.exports = {
  entry: {
    'windowPostMessageProxy': './src/windowPostMessageProxy.ts'
  },
  output: {
    path: __dirname + "/dist",
    filename: '[name].js',
    library: package.name,
    libraryTarget: 'umd'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  }
}