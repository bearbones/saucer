import baseConfig from "@graysky/eslint-config/base";
import reactConfig from "@graysky/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [
      ".expo/**",
      "expo-plugins/**",
      "ios",
      "android",
      "Graysky.app",
      "OpenInGrayskyExtension",
    ],
  },
  ...baseConfig,
  ...reactConfig,
];
