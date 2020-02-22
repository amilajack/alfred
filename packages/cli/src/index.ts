import path from 'path';
import fs from 'fs';
import { formatPkgJson } from '@alfred/core';
import handlebars from 'handlebars';
import { Entrypoint } from '@alfred/types';

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

export type ValidPkgNameResult = {
  validForNewPackages: boolean;
  validForOldPackages: boolean;
  errors?: string[];
  warnings?: string[];
};

export type RawTemplateData = {
  entrypoint?: Entrypoint;
  'alfred-pkg'?: {
    semver: string;
  };
};

export type TemplateData = {
  entrypoint: Entrypoint;
  'alfred-pkg': {
    semver: string;
  };
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
  rawTemplateData: RawTemplateData,
  root: string,
  entrypoints: Array<Entrypoint>
): Promise<void> {
  const [
    APP_TEMPLATE,
    LIB_TEMPLATE,
    APP_BROWSER_HTML_TEMPLATE,
    TEST_TEMPLATE
  ] = await Promise.all(
    ['app.js.hbs', 'lib.js.hbs', 'index.html.hbs', 'test.js.hbs'].map(
      compileTemplate
    )
  );

  const writeIndexHtml = (): { file: string; content: string }[] => {
    if (
      entrypoints.some(entrypoint => entrypoint.filename === 'app.browser.js')
    ) {
      const templateData = {
        ...rawTemplateData,
        project: {
          project: 'app',
          platform: 'browser',
          isApp: true,
          isBrowser: true
        }
      };
      return [
        {
          file: './src/index.html',
          content: APP_BROWSER_HTML_TEMPLATE(templateData)
        }
      ];
    }
    return [];
  };

  await Promise.all(
    entrypoints
      .map(entrypoint => {
        const { project, platform } = entrypoint;
        const isApp = project === 'app';
        const isBrowser = platform === 'browser';

        const templateData = {
          ...rawTemplateData,
          project: { project, platform, isApp, isBrowser }
        };

        return [
          {
            file: `./src/${project}.${platform}.js`,
            content: (isApp ? APP_TEMPLATE : LIB_TEMPLATE)(templateData)
          },
          {
            file: `./tests/${project}.${platform}.spec.js`,
            content: TEST_TEMPLATE(templateData)
          }
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
    NPM_TEMPLATE,
    README_TEMPLATE,
    EDITORCONFIG_TEMPLATE
  ] = await Promise.all(
    [
      '.gitignore.hbs',
      'package.json.hbs',
      'README.md.hbs',
      '.editorconfig.hbs'
    ].map(compileTemplate)
  );

  await Promise.all(
    [
      {
        file: '.gitignore',
        content: GITIGNORE_TEMPLATE(templateData)
      },
      {
        file: '.editorconfig',
        content: EDITORCONFIG_TEMPLATE(templateData)
      },
      {
        file: 'README.md',
        content: README_TEMPLATE(templateData)
      }
    ].map(({ file, content }) =>
      fs.promises.writeFile(path.join(root, file), content)
    )
  );

  const pkgPath = path.join(root, 'package.json');
  const formattedPkg = await formatPkgJson(
    JSON.parse(NPM_TEMPLATE(templateData))
  );
  await fs.promises.writeFile(pkgPath, formattedPkg);
  const { project, platform } = templateData.entrypoint;

  const entrypoints = [
    {
      project,
      platform,
      filename: [project, platform, 'js'].join('.')
    }
  ];
  await addEntrypoints(templateData, root, entrypoints);
}

export function getSingleSubcommandFromArgs(args: Array<string>): string {
  if (args.length === 0) throw new Error('One subcommand must be passed');
  if (args.length > 1) throw new Error('Only one subcommand can be passed');
  return args[0];
}