const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  entry: {}, // MF plugin provides entries via exposes — no default entry needed
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/emr-ai/static/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[local]',
              },
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: '_path_drc_esm_ambient_scribe_app',
      filename: 'main.js',
      library: { type: 'window', name: '_path_drc_esm_ambient_scribe_app' },
      exposes: {
        './start': './src/index.ts',
      },
      shared: {
        react: { singleton: true, eager: false, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, eager: false, requiredVersion: '^18.2.0' },
        'react-router-dom': { singleton: true, eager: false, requiredVersion: '^6.0.0' },
        '@openmrs/esm-framework': { singleton: true, eager: false },
        '@carbon/react': { singleton: true, eager: false },
      },
    }),
  ],
};
