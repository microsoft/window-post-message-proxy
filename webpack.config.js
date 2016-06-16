var webpack = require('webpack');

module.exports = {
  entry: {
    'windowPostMessageProxy': './src/windowPostMessageProxy.ts',
    'windowPostMessageProxy.min': './src/windowPostMessageProxy.ts'
  },
  output: {
    path: __dirname + "/dist",
    filename: '[name].js',
    library: 'window-post-message-proxy',
    libraryTarget: 'umd'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    })
  ],
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