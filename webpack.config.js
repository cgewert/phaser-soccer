const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  devServer: {
    static: "./dist",
    devMiddleware: {
      index: true,
      writeToDisk: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    mainFields: ['main', 'browser'],
    /*alias: {
      Scenes: path.resolve(__dirname, 'src/scenes/')
    },*/
    fallback: {
      fs: false,  // Look for a polyfill when needed
      net: false,  // Look for a polyfill when needed
    }
  },
  target: ['web'],
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {from: '*.css', context: 'src/'},
        {from: 'src/index.html'},
        {from: 'src/assets/gfx', to: 'assets/gfx/'},
        {from: 'src/assets/fonts', to: 'assets/fonts/'},
        {from: '**/*.json', context: 'src/assets/maps', to: 'assets/maps'}
      ],
    }),
    new NodePolyfillPlugin(),
  ],
};
