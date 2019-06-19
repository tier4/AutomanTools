const path = require('path')
const JSX_PATH = __dirname + '/app';

module.exports = {
  entry: {
    application: path.resolve(__dirname, 'app/dashboard/application'),
    label_tool: path.resolve(__dirname, 'app/labeling_tool/label_tool'),
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'stage-1']
        }
      },
    ]
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx'],
    alias: {
      "automan": JSX_PATH,
    },
  }
}
