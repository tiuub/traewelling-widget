const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");
const PACKAGE = require('./package.json');

module.exports = {
  mode: "production",
  entry: {
    TraewellingWidget: './src/TraewellingWidget.js',
  },
  output: {
    path:path.resolve(__dirname, "dist"),
    filename: "TraewellingWidget.js"
  },
  experiments: {
    topLevelAwait: true,
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `// Variables used by Scriptable.\r\n// These must be at the very top of the file. Do not edit.\r\n// icon-color: orange; icon-glyph: magic;\r\n\r\n// ${PACKAGE.name}\r\n// by ${PACKAGE.author}\r\n\r\n// Version - ${PACKAGE.version} (${new Date().toUTCString()})\r\n// GitHub - ${PACKAGE.homepage}\r\n// Donate - ${PACKAGE.funding.url}\r\n// License - ${PACKAGE.license}\r\n`,
      raw: true
    }),
  ],
  optimization: {
    minimize: false,
  },
}