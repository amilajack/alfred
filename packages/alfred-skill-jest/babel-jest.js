/* eslint-disable */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  transformSync: babelTransform,
  loadPartialConfig
} = require('@babel/core');

const THIS_FILE = fs.readFileSync(__filename);
const jestPresetPath = require.resolve('babel-preset-jest');
const babelIstanbulPlugin = require.resolve('babel-plugin-istanbul');

const createTransformer = options => {
  options = {
    ...options,
    caller: {
      name: 'babel-jest',
      supportsStaticESM: false
    },
    compact: false,
    plugins: (options && options.plugins) || [],
    presets: ((options && options.presets) || []).concat(jestPresetPath),
    sourceMaps: 'both'
  };

  delete options.cacheDirectory;
  delete options.filename;

  const loadBabelConfig = (cwd, filename) =>
    // `cwd` first to allow incoming options to override it
    loadPartialConfig({ cwd, ...options, filename });

  return {
    canInstrument: true,
    getCacheKey(
      fileData,
      filename,
      configString,
      { config, instrument, rootDir }
    ) {
      const babelOptions = loadBabelConfig(
        JSON.parse(configString).cwd,
        filename
      );
      const configPath = [
        babelOptions.config || '',
        babelOptions.babelrc || ''
      ];

      return crypto
        .createHash('md5')
        .update(THIS_FILE)
        .update('\0', 'utf8')
        .update(JSON.stringify(babelOptions.options))
        .update('\0', 'utf8')
        .update(fileData)
        .update('\0', 'utf8')
        .update(path.relative(rootDir, filename))
        .update('\0', 'utf8')
        .update(configString)
        .update('\0', 'utf8')
        .update(configPath.join(''))
        .update('\0', 'utf8')
        .update(instrument ? 'instrument' : '')
        .update('\0', 'utf8')
        .update(process.env.NODE_ENV || '')
        .update('\0', 'utf8')
        .update(process.env.BABEL_ENV || '')
        .digest('hex');
    },
    process(src, filename, config, transformOptions) {
      const babelOptions = { ...loadBabelConfig(config.cwd, filename).options };

      if (transformOptions && transformOptions.instrument) {
        babelOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
        // Copied from jest-runtime transform.js
        babelOptions.plugins = babelOptions.plugins.concat([
          [
            babelIstanbulPlugin,
            {
              // files outside `cwd` will not be instrumented
              cwd: config.rootDir,
              exclude: []
            }
          ]
        ]);
      }

      const transformResult = babelTransform(src, babelOptions);

      return transformResult || src;
    }
  };
};

module.exports = createTransformer();
module.exports.createTransformer = createTransformer;
