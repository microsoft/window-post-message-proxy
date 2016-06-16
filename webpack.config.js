module.exports = {  
  entry: './src/windowPostMessageProxy.ts',
  output: {
    path: __dirname + "/dist",
    filename: 'windowPostMessageProxy.js',
    library: 'window-post-message-proxy',
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