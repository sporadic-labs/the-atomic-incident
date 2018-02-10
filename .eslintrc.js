module.exports = {
  parser: "babel-eslint",
  plugins: ["react", "prettier"],
  // Enable core eslint rules, see: http://eslint.org/docs/rules/
  extends: ["eslint:recommended", "plugin:react/recommended", "prettier", "prettier/react"],
  // Additional rules
  rules: {
    "no-var": 1,
    "brace-style": ["warn", "1tbs"],
    "no-unused-vars": ["error", { args: "none" }],
    indent: ["warn", 2, { SwitchCase: 1 }],
    "max-len": ["warn", 100, { ignoreUrls: true, ignoreTemplateLiterals: true }],
    "no-console": "off",
    "react/prop-types": "off",
    "react/no-unknown-property": "off"
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true
    }
  },
  settings: {
    react: { pragma: "h" }
  },
  globals: {
    Phaser: true
  }
};
