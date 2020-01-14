module.exports = {
  extends: [
    'plugin:import/errors',
    'plugin:import/typescript',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'plugin:promise/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module" // Allows for the use of imports
  },
  parser: 'babel-eslint',
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: "@typescript-eslint/parser", // Specifies the ESLint parser
      extends: [
        "plugin:react/recommended", // Uses the recommended rules from @eslint-plugin-react
        "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        "prettier/@typescript-eslint", // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        "plugin:prettier/recommended" // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
      ],
      parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: "module" // Allows for the use of imports
      },
      rules: {
        'flowtype-errors/show-errors': 'off',
        'import/extensions': 'off',
        'import/default': 'off',
        'jest/no-export': 'off',
        "prettier/prettier": ["error", {"singleQuote": true}],
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
  ],
  rules: {
    'flowtype-errors/show-errors': 'off',
    'import/extensions': 'off',
    'import/default': 'off',
    'jest/no-export': 'off',
    "prettier/prettier": ["error", {"singleQuote": true}]
  }
};
