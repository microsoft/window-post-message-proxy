module.exports = {  
  entry: './test/windowPostMessageProxy.spec.ts',
  output: {
    path: __dirname + "/build",
    filename: 'windowPostMessageProxy.spec.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  ts: {
    configFileName: "webpack.tsconfig.json"
  }
}