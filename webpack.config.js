const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');

const environment = process.env.NODE_ENV || 'development';
const isProd = environment === 'production';

module.exports = {
  optimization: {
    noEmitOnErrors: true,
  },
  mode: environment,
  entry: {
    main: ['@babel/polyfill', './src/app.ts'],
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
              configFileName: isProd ? 'tsconfig.prod.json' : 'tsconfig.json',
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
  plugins: [
    new NodemonPlugin({
      watch: path.resolve('./dist/main.js'),
      script: './dist/main.js',
      delay: '1000',
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    modules: [path.resolve(__dirname, 'node_modules/')],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
