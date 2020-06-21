import fs from 'fs';
import path from 'path';
import { execBinInProject } from '@alfred/helpers';
import { Skill, RawSkill, SkillConfig } from '@alfred/types';

const skill: RawSkill = {
  name: 'jest',
  tasks: ['@alfred/task-test'],
  default: true,
  configs: [
    {
      alias: 'jest',
      filename: 'jest.config.js',
      pkgProperty: 'jest',
      config: {
        moduleNameMapper: {
          '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
          '\\.(css|less)$': 'identity-obj-proxy',
        },
      },
    },
  ],
  hooks: {
    async run({ skill, skillMap, project, event }): Promise<void> {
      const { filename: configPath, write } = skill.configs.get(
        'jest'
      ) as SkillConfig;
      const { root } = project;

      // Create the node_modules dir if it doesn't exist
      const nodeModulesPath = path.join(root, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        await fs.promises.mkdir(nodeModulesPath);
      }

      if (write !== 'pkg') {
        const { config: jestConfig } = skill.configs.get('jest') as SkillConfig;
        const fullConfig = {
          ...jestConfig,
          transform: {
            '^.+.jsx?$': '<rootDir>/node_modules/jest-transformer.js',
          },
          rootDir: root,
        };
        await fs.promises.writeFile(
          configPath,
          `module.exports = ${JSON.stringify(fullConfig)};`
        );
        const babelJestPath = require.resolve('../babel-jest.js');
        const jestTransformerPath = path.join(
          root,
          'node_modules',
          'jest-transformer.js'
        );
        const { config: babelConfig } = skillMap
          .get('babel')
          ?.configs.get('babel') as SkillConfig;
        await fs.promises.writeFile(
          jestTransformerPath,
          `const babelJestTransform = require(${JSON.stringify(babelJestPath)});
        module.exports = babelJestTransform.createTransformer(${JSON.stringify(
          babelConfig
        )});`
        );
      }

      execBinInProject(project, [
        'jest',
        write === 'pkg' ? '' : `--config ${configPath}`,
        JSON.stringify(root),
        ...event.flags,
      ]);
    },
  },
  transforms: {
    babel(skill: Skill): Skill {
      const { write } = skill.configs.get('jest') as SkillConfig;
      return write === 'pkg'
        ? skill
        : skill.extendConfig('jest', {
            transform: {
              '^.+\\.jsx?$': './node_modules/jest-transformer.js',
            },
          });
    },
    webpack(skill: Skill, { config }): Skill {
      return skill
        .extendConfig('jest', {
          moduleNameMapper: {
            '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': `<rootDir>/${config.configsDir}/mocks/fileMock.js`,
            '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
          },
        })
        .addDepsFromPkg('identity-obj-proxy');
    },
  },
};

export default skill;
