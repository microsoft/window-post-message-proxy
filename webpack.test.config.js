const webpack = require('webpack'); // To access built-in plugins

module.exports = {
  mode: 'development',
  entry: './test/windowPostMessageProxy.spec.ts',
  output: {
    path: __dirname + "/tmp",
    filename: 'windowPostMessageProxy.spec.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader' }
    ]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
        ts: {
            configFileName: "webpack.test.tsconfig.json"
        }
    })
  ]
}