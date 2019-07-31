const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = [
  {
    name: 'statistics',
    optimization: {
      noEmitOnErrors: true,
    },
    mode: 'development',
    entry: {
      summoners: ['@babel/polyfill', path.resolve(__dirname, 'src', 'scripts', 'summoners.ts')],
      statistics: ['@babel/polyfill', path.resolve(__dirname, 'src', 'scripts', 'statistics.ts')],
      reorganization: ['@babel/polyfill', path.resolve(__dirname, 'src', 'scripts', 'reorganization.ts')],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
    },
    target: 'node',
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: path.resolve(__dirname, 'src'),
          use: [
            {
              loader: 'awesome-typescript-loader',
              options: {
                useBabel: true,
                babelCore: '@babel/core',
                useCache: true,
                configFileName: 'tsconfig.json',
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx'],
      modules: [path.resolve(__dirname, 'node_modules/')],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
];
