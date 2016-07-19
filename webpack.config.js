'use strict';

const path = require('path');

const SRC_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'build');

const config = {
    context: SRC_DIR,
    devtool: '#cheap-module-eval-source-map',
    // Needed for WriteFilePlugin to work
    devServer: {outputPath: BUILD_DIR},

    plugins: [],

    entry: {
        mines: ['./mines.react.js']
    },

    output: {
        path: BUILD_DIR,
        filename: '[name]-bundle.js',
        publicPath: '/build/'
    },

    externals: {},

    module: {
        loaders: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            include: SRC_DIR,
            query: {
                presets: ['es2015', 'react']
            }
        }]
    }
};

module.exports = config;
