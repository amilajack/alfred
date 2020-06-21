import path from 'path';
import fs from 'fs';
import { formatPkgJson } from '@alfred/core';
import handlebars from 'handlebars';
import { Entrypoint, ProjectEnum, Platform, NpmClient } from '@alfred/types';
import Config from '@alfred/core/lib/config';

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

export type ValidPkgNameResult = {
  validForNewPackages: boolean;
  validForOldPackages: boolean;
  errors?: string[];
  warnings?: string[];
};

export type RawTemplateData = {
  description?: string;
  repository?: string;
  author?: string;
  email?: string;
  license?: string;
  npmClient?: NpmClient;
  project?: ProjectEnum;
  platform?: Platform;
  name?: { npm: { full: string } };
  main?: string;
  targetFile?: string;
  module?: string;
  alfredPkgSemver?: string;
  isApp?: boolean;
  isLib?: boolean;
  isBrowser?: boolean;
};

export type TemplateData = {
  description: string;
  repository: string;
  author: string;
  email: string;
  license: string;
  npmClient: NpmClient;
  project: ProjectEnum;
  platform: Platform;
  name: { npm: { full: string } };
  main: string;
  targetFile: string;
  module: string;
  alfredPkgSemver: string;
  isApp: boolean;
  isLib: boolean;
  isBrowser: boolean;
};

export const TEMPLATE_DATA_DEFAULTS = {
  description: '',
  repository: '',
  author: '',
  email: '',
  license: '',
  npmClient: Config.DEFAULT_CONFIG.npmClient,
  name: { npm: { full: '' } },
  main: '',
  targetFile: '',
  module: '',
  alfredPkgSemver: '',
};

export type GitConfig = {
  user: {
    name: string;
    email: string;
  };
};

async function compileTemplate(
  templateFilename: string
): Promise<HandlebarsTemplateDelegate> {
  const source = await fs.promises.readFile(
    path.resolve(TEMPLATES_DIR, templateFilename)
  );
  return handlebars.compile(source.toString(), { noEscape: true });
}

export async function addEntrypoints(
  root: string,
  entrypoints: Array<Entrypoint>
): Promise<void> {
  const [
    APP_TEMPLATE,
    LIB_TEMPLATE,
    APP_BROWSER_HTML_TEMPLATE,
    TEST_TEMPLATE,
  ] = await Promise.all(
    ['app.js.hbs', 'lib.js.hbs', 'index.html.hbs', 'test.js.hbs'].map(
      compileTemplate
    )
  );

  const writeIndexHtml = (): { file: string; content: string }[] => {
    if (
      entrypoints.some((entrypoint) => entrypoint.filename === 'app.browser.js')
    ) {
      const templateData: TemplateData = {
        ...TEMPLATE_DATA_DEFAULTS,
        project: 'app',
        platform: 'browser',
        isApp: true,
        isBrowser: true,
        isLib: false,
      };
      return [
        {
          file: './src/index.html',
          content: APP_BROWSER_HTML_TEMPLATE(templateData),
        },
      ];
    }
    return [];
  };

  await Promise.all(
    entrypoints
      .map((entrypoint) => {
        const { project, platform } = entrypoint;
        const isApp = project === 'app';
        const isBrowser = platform === 'browser';

        const templateData: TemplateData = {
          ...TEMPLATE_DATA_DEFAULTS,
          project,
          platform,
          isApp,
          isLib: !isApp,
          isBrowser,
        };

        return [
          {
            file: `./src/${project}.${platform}.js`,
            content: (isApp ? APP_TEMPLATE : LIB_TEMPLATE)(templateData),
          },
          {
            file: `./tests/${project}.${platform}.spec.js`,
            content: TEST_TEMPLATE(templateData),
          },
        ];
      })
      .flat()
      .concat(writeIndexHtml())
      .map(({ file, content }) =>
        fs.promises.writeFile(path.join(root, file), content)
      )
  );
}

// This function lives here because it is used in both tests and the cli
export async function addBoilerplate(
  templateData: TemplateData,
  root: string
): Promise<void> {
  const [
    GITIGNORE_TEMPLATE,
    PACKAGE_JSON_TEMPLATE,
    README_TEMPLATE,
    EDITORCONFIG_TEMPLATE,
  ] = await Promise.all(
    [
      '.gitignore.hbs',
      'package.json.hbs',
      'README.md.hbs',
      '.editorconfig.hbs',
    ].map(compileTemplate)
  );

  await Promise.all(
    [
      {
        file: '.gitignore',
        content: GITIGNORE_TEMPLATE(templateData),
      },
      {
        file: '.editorconfig',
        content: EDITORCONFIG_TEMPLATE(templateData),
      },
      {
        file: 'README.md',
        content: README_TEMPLATE(templateData),
      },
    ].map(({ file, content }) =>
      fs.promises.writeFile(path.join(root, file), content)
    )
  );

  const pkgPath = path.join(root, 'package.json');
  const formattedPkg = await formatPkgJson(
    JSON.parse(PACKAGE_JSON_TEMPLATE(templateData))
  );
  await fs.promises.writeFile(pkgPath, formattedPkg);
  const { project, platform } = templateData;

  const entrypoints: Entrypoint[] = [
    {
      project,
      platform,
      filename: [project, platform, 'js'].join('.'),
    },
  ];
  await addEntrypoints(root, entrypoints);
}

export function getSingleSubcommandFromArgs(args: Array<string>): string {
  if (args.length === 0) throw new Error('One subcommand must be passed');
  if (args.length > 1) throw new Error('Only one subcommand can be passed');
  return args[0];
}
