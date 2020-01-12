module.exports = {
  extends: [
    'bliss',
    'plugin:import/errors',
    'plugin:import/typescript',
    'prettier',
    'prettier/flowtype'
  ],
  parser: 'babel-eslint',
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        '@typescript-eslint/array-type': ['error', {default: 'generic'}],
        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {argsIgnorePattern: '^_'},
        ],
        // Since we do `export =`. Remove for Jest 25
        'import/default': 'off',
        'import/order': 'error',
        'no-dupe-class-members': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
  rules: {
    'flowtype-errors/show-errors': 'off',
    'import/extensions': 'off'
  }
};
