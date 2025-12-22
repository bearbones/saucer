import baseConfig from "@graysky/eslint-config/base";
import nextjsConfig from "@graysky/eslint-config/nextjs";
import reactConfig from "@graysky/eslint-config/react";

export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
];
