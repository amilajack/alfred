module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 13 }
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: ['@babel/plugin-proposal-optional-chaining']
};
