var path = require('path');

module.exports = {
  entry: './src/src/automerge.ts',
  mode: 'development',
  output: {
    filename: 'automerge.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: [".ts", ".ts", ".js"]
  },
  devtool: 'source-map',
  module: {
    rules: [{
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: ['babel-loader', 'ts-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  }
}