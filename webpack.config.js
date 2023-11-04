const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");
const PACKAGE = require('./package.json');

module.exports = {
  mode: "production",
  entry: {
    TraewellingWidget: './src/Traewelling Widget.js',
  },
  output: {
    path:path.resolve(__dirname, "dist"),
    filename: "Traewelling Widget.js"
  },
  experiments: {
    topLevelAwait: true,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            preamble: `// Variables used by Scriptable.\r\n// These must be at the very top of the file. Do not edit.\r\n// icon-color: orange; icon-glyph: magic;\r\n\r\n// ${PACKAGE.name}\r\n// by ${PACKAGE.author}\r\n\r\n// Version - ${PACKAGE.version} (${new Date().toUTCString()})\r\n// GitHub - ${PACKAGE.homepage}\r\n// Donate - ${PACKAGE.funding.url}\r\n// License - ${PACKAGE.license}\r\n`,
            comments: false
          }
        }
        /*minify: (file, map, minimizerOptions) => {
          let code = file[Object.keys(file)[0]];
          const pattern = /\/\/ Variables used by Scriptable([^\0]*?)\/[\*]+\//;
          const matches = code.match(pattern)
          code = matches[0] + '\n' + code.replace(pattern, '');

          return { map, code };
        },*/
      }),
    ],
  },
}