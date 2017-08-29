module.exports = {
	plugins: ["react"],
	// Enable core eslint rules, see: http://eslint.org/docs/rules/
	extends: ["eslint:recommended", "plugin:react/recommended"],
	// Additional rules
	rules: {
		"brace-style": ["warn", "1tbs"],
		"indent": ["warn", 4, {"SwitchCase": 1}],
		"max-len": ["warn", 100, {"ignoreUrls": true, ignoreTemplateLiterals: true}],
		"no-mixed-spaces-and-tabs": "warn",
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
		"react": { "pragma": "h" }
	},
	globals: {
		Phaser: true,
		$: true
	}
};