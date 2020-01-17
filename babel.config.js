module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 13 }
      }
    ]
  ],
  plugins: ['@babel/plugin-proposal-optional-chaining'],
  overrides: [
    {
      presets: ['@babel/preset-typescript'],
      test: /\.tsx?$/
    }
  ]
};
