const fs = require("fs");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const generateHtmlPlugins = (templateDir) => {
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map((item) => {
    const parts = item.split(".");
    const name = parts[0];
    const extension = parts[1];
    return new HtmlWebpackPlugin({
      inject: true,
      chunks: [`${name}`],
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
    });
  });
};

const htmlPlugins = generateHtmlPlugins("src/html/views");

const config = {
  entry: {
    index: "./src/js/views/index.js",
    ui: "./src/js/views/ui.js",
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, "build"),
    filename: "js/[name].[contenthash].js",
    assetModuleFilename: "[name][ext]",
  },
  resolve: {
    extensions: ['.js', '.scss'],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles/[name].[contenthash].css",
    }),
    ...htmlPlugins,
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/i,
        use: [
          {
            loader: "html-loader",
            options: {
              esModule: false,
              preprocessor: (content, loaderContext) => {
                const INCLUDE_PATTERN = /<include src="(.+)"\s*\/?>(?:<\/include>)?/gi;
                if (INCLUDE_PATTERN.test(content)) {
                  const contentWithInclude = content.replace(INCLUDE_PATTERN, (_m, src) => {
                    const filePath = path.resolve(__dirname, `src/html/${src}`)
                    loaderContext.dependency(filePath)
                    return loaderContext.fs.readFileSync(filePath, 'utf8');
                  })
                  return contentWithInclude;
                }
                return content;
              }
            }
          }
        ],
      },
      {
        test: /\.scss$/i,
        include: path.resolve(__dirname, "src/styles"),
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/img/[hash][ext][query]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/i,
        type: 'asset',
        use: ['svgo-loader'],
        generator: {
          filename: 'assets/img/[hash][ext][query]'
        }
      },
    ],
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
};

module.exports = (_, arg) => {
  if (arg.mode === "development") {
    config.devServer = {
      host: 'localhost',
      port: 3015,
      hot: false,
      open: true,
      liveReload: true,
      watchFiles: ['src/**/*'],
    }
  }
  return config;
};
