const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    // IMPORTANT: your entry file is in src/pages/index.js
    entry: path.resolve(__dirname, "src", "pages", "index.js"),
    output: {
        filename: "main.[contenthash].js",
        assetModuleFilename: "assets/[hash][ext][query]",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    module: {
        rules: [
            { test: /\.js$/i, exclude: /node_modules/, use: "babel-loader" },
            { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"] },
            { test: /\.(png|jpe?g|gif|svg)$/i, type: "asset/resource" },
            { test: /\.(woff2?|eot|ttf|otf)$/i, type: "asset/resource" }
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "index.html"),
        }),
        new MiniCssExtractPlugin({
            filename: "styles.[contenthash].css",
        }),
    ],
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    devServer: {
        static: { directory: path.join(__dirname, "dist") },
        port: 8080,
        open: true,
        hot: true,
    },
};