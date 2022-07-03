const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index.js",
    matt: "./src/index.js",
    steve: "./src/index.js",
    colorTest: "./src/colorTest.js",
    stellar: "./src/v2/stellar.js"
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].js",
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new HtmlWebPackPlugin({
      name: "index",
      template: "./src/index.html",
      filename: "index.html",
      chunks: ['index']
    }),
    new HtmlWebPackPlugin({
      name: "matt",
      template: "./src/index.html",
      filename: "matt.html",
      chunks: ['matt']
    }),
    new HtmlWebPackPlugin({
      name: "steve",
      template: "./src/index.html",
      filename: "steve.html",
      chunks: ['steve']
    }),
    new HtmlWebPackPlugin({
      name: "colorTest",
      template: "./src/colorTest.html",
      filename: "colorTest.html",
      chunks: ['colorTest']
    }),
    new HtmlWebPackPlugin({
      name: "stellar",
      template: "./src/index.html",
      filename: "stellar.html",
      chunks: ['stellar']
    }),
  ],
  devtool: "source-map",
}