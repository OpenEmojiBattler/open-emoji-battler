const path = require("path")
const child_process = require("child_process")
const webpack = require("webpack")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin")

module.exports = (_env, argv) => {
  const isDevelopment = argv.mode === "development"

  return {
    entry: {
      index: "./src/index.ts",
    },
    module: {
      rules: [
        {
          test: /\.worker\.ts$/,
          use: {
            loader: "worker-loader",
            options: {
              inline: "no-fallback",
            },
          },
        },
        {
          test: /\.tsx?$/,
          use: [
            isDevelopment && {
              loader: "babel-loader",
              options: { plugins: ["react-refresh/babel"] },
            },
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
              },
            },
          ].filter(Boolean),
        },
        {
          test: /\.s[ac]ss$/,
          use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
        },
        {
          test: /\.svg$/,
          type: "asset/source",
        },
      ],
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser.js",
      }),
      new webpack.EnvironmentPlugin({
        OEB_ENV: undefined,
        GIT_VERSION: git("rev-parse --short HEAD"),
      }),
      isDevelopment && new ReactRefreshWebpackPlugin(),
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({ template: "./src/index.html" }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "src/"),
      },
      extensions: [".ts", ".tsx", ".mjs", ".js"],
      fallback: {
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
      },
    },
    performance: {
      hints: false,
    },
    devtool: isDevelopment ? "inline-source-map" : false,
    devServer: {
      stats: "minimal",
    },
  }
}

function git(command) {
  return child_process.execSync(`git ${command}`, { encoding: "utf8" }).trim()
}
