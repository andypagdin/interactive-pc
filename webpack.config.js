const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.(glb|gltf)$/,
        use:
          [
            {
              loader: 'file-loader',
              options: { outputPath: 'assets/models/' }
            }
          ]
      },
      {
        test: /\.(jpg|jpeg|png|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: { outputPath: 'assets/' }
          }
        ],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: [
          'raw-loader',
          'glslify-loader'
        ]
      }
    ]
  },
  devServer: {
    contentBase: './dist'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]
}
