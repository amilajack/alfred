/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 13 }
      }
    ]
  ],
  overrides: [
    {
      presets: ['@babel/preset-typescript'],
      test: /\.tsx?$/
    }
  ]
};
