const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: path.resolve(__dirname, 'src/index.tsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      publicPath: '/',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: 'ts-loader',
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        title: 'StockObs - Volume Anomaly Radar',
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      port: 3000,
      hot: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api/yahoo'],
          target: 'https://query1.finance.yahoo.com',
          pathRewrite: { '^/api/yahoo': '' },
          changeOrigin: true,
          secure: false,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
      ],
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};

