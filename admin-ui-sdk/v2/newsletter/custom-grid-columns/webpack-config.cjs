/*
 * Compiles the TypeScript Commerce config imported by Runtime actions.
 * @adobe/aio-commerce-lib-app;
 *
 * App Builder requires this file to use CommonJS.
 *
 * See: https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/configuration/webpack-configuration
 * See: https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/configuration/typescript-actions
 */
"use strict";

module.exports = {
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.[cm]?tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            compilerOptions: {
              noEmit: false,
            },
          },
        },
      },
    ],
  },
  resolve: {
    extensionAlias: {
      ".cjs": [".cjs", ".cts"],
      ".js": [".js", ".ts"],
      ".mjs": [".mjs", ".mts"],
    },
    extensions: [".ts", ".tsx", ".mts", ".cts"],
  },
};
