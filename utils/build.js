// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const config = require('../webpack.config');
const ZipPlugin = require('zip-webpack-plugin');

async function build() {
  try {
    delete config.chromeExtensionBoilerplate;

    config.mode = 'production';

    const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

    config.plugins = (config.plugins || []).concat(
      new ZipPlugin({
        filename: `${packageInfo.name}-${packageInfo.version}.zip`,
        path: path.join(__dirname, '../', 'zip'),
      })
    );

    await new Promise((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err) {
          console.error('Webpack build error:', err);
          reject(err);
        } else if (stats.hasErrors()) {
          const info = stats.toJson();
          console.error('Webpack build errors:', info.errors);
          reject(new Error('Webpack build failed with errors.'));
        } else {
          console.log('Webpack build completed successfully.');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

build();
