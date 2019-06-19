module.exports = {
  rules: {
    "prettier/prettier": "error",
    "indent": ["error", 2, {"SwitchCase": 1}],
    "strict": [2, "never"],
    "no-undef": 2,
    "no-var": 1,
    "no-unused-vars": [1, {"vars": "all", "args": "none"}],
    "no-empty": [1, { "allowEmptyCatch": true }],
    "curly": [1, "all"],
    "import/no-commonjs": 1,
    "no-console": 0,
    "react/no-is-mounted": 2,
    "react/prefer-es6-class": 2,
    "react/display-name": 1,
    "react/prop-types": 0,
    "react/no-did-mount-set-state": 0,
    "react/no-did-update-set-state": 0,
    "react/no-find-dom-node": 0,
    "no-color-literals": 1
  },
  globals: {
    "pending": false
  },
  env: {
    "browser": true,
    "es6": true,
    "commonjs": true,
    "jest": true
  },
  parser: "babel-eslint",
  plugins: [
    "react",
    "import",
    "prettier"
  ],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "prettier",
    "prettier/react"
  ],
  settings: {
    "import/resolver": {
      "webpack": {
        "config": __dirname + "/webpack.dev.js"
      }
    },
    "import/ignore": ["\\.css$"]
  }
}
