import Joi from '@hapi/joi';
import {
  Pkg,
  ValidationResult,
  AlfredConfigWithUnresolvedInterfaces,
  RawSkill,
  SkillInterfaceModule
} from '@alfred/types';
import Config from './config';

type Person = {
  name: string;
  email: string;
  url: string;
  web?: string;
};

type MailToObj = {
  email: string;
  mail: string;
  url: string;
  web: string;
};

type Out = {
  valid: boolean;
  critical: boolean;
  criticalMessage: string;
  warnings: string[];
  recommendations: string[];
  errors: string[];
  messagesCount: number;
};

type Field = {
  types?: string[];
  type?: string;
  warning?: boolean;
  required?: boolean;
  recommended?: boolean;
  validate?: Function;
  format?: Function | RegExp;
  or?: string;
};

type Errors = string[];
type Recommendations = string[];
type Warnings = string[];

type Obj = { type: string; url: string };

/* Parse the incoming string as JSON, validate it against the spec for package.json
 * See README for more details
 */
export class PkgValidation {
  static packageFormat = /^[a-zA-Z0-9@/][a-zA-Z0-9@/.\-_]*$/;

  static versionFormat = /^[0-9]+\.[0-9]+[0-9+a-zA-Z.-]+$/;

  static urlFormat = /^https*:\/\/[a-z.\-0-9]+/;

  static emailFormat = /\S+@\S+/;

  // I know this isn't thorough. it's not supposed to be.
  static getSpecMap(): {
    [name: string]: Field;
  } {
    // https://npmjs.org/doc/json.html
    return {
      name: {
        type: 'string',
        required: true,
        format: PkgValidation.packageFormat
      },
      version: {
        type: 'string',
        required: true,
        format: PkgValidation.versionFormat
      },
      description: { type: 'string', warning: true },
      keywords: { type: 'array', warning: true },
      homepage: {
        type: 'string',
        recommended: true,
        format: PkgValidation.urlFormat
      },
      bugs: { warning: true, validate: PkgValidation.validateUrlOrMailto },
      licenses: {
        type: 'array',
        warning: true,
        validate: PkgValidation.validateUrlTypes,
        or: 'license'
      },
      license: { type: 'string' },
      // @TODO author and contributors should be validated to check if they are mutually
      //       exclusive
      author: { validate: PkgValidation.validatePeople },
      contributors: { validate: PkgValidation.validatePeople },
      files: { type: 'array' },
      main: { type: 'string' },
      bin: { types: ['string', 'object'] },
      man: { types: ['string', 'array'] },
      directories: { type: 'object' },
      repository: {
        types: ['string', 'object'],
        warning: true,
        validate: PkgValidation.validateUrlTypes,
        or: 'repositories'
      },
      scripts: { type: 'object' },
      config: { type: 'object' },
      dependencies: {
        type: 'object',
        validate: PkgValidation.validateDependencies
      },
      devDependencies: {
        type: 'object',
        validate: PkgValidation.validateDependencies
      },
      bundledDependencies: { type: 'array' },
      bundleDependencies: { type: 'array' },
      optionalDependencies: {
        type: 'object',
        validate: PkgValidation.validateDependencies
      },
      engines: { type: 'object', recommended: true },
      engineStrict: { type: 'boolean' },
      os: { type: 'array' },
      cpu: { type: 'array' },
      preferGlobal: { type: 'boolean' },
      private: { type: 'boolean' },
      publishConfig: { type: 'object' }
    };
  }

  static parse(
    data: string | Record<string, any>
  ): Record<string, any> | string {
    if (typeof data !== 'string') {
      // It's just a string
      return 'Invalid data - Not a string';
    }
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      return `Invalid JSON - ${e.toString()}`;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return `Invalid JSON - Not an object. Received type of ${typeof parsed}`;
    }

    return parsed;
  }

  static validate(
    data: string | Pkg,
    options: { recommendations: boolean; warnings: boolean } = {
      recommendations: true,
      warnings: true
    }
  ): ValidationResult {
    const parsed = PkgValidation.parse(data);
    const out: Out = {
      valid: false,
      critical: true,
      criticalMessage: '',
      warnings: [],
      recommendations: [],
      errors: [],
      messagesCount: 0
    };

    if (typeof parsed === 'string') {
      out.criticalMessage = parsed;
      return out;
    }

    const map = PkgValidation.getSpecMap();
    let errors: Errors = [];
    const warnings: Warnings = [];
    const recommendations: Recommendations = [];

    /*  */

    Object.entries(map).forEach(([name, field]) => {
      if (
        parsed[name] === undefined &&
        (!field.or || (field.or && parsed[field.or] === undefined))
      ) {
        if (field.required) {
          errors.push(`Missing required field: ${name}`);
        } else if (field.warning) {
          warnings.push(`Missing recommended field: ${name}`);
        } else if (field.recommended) {
          recommendations.push(`Missing optional field: ${name}`);
        }
        return;
      }
      if (!parsed[name]) {
        // It's empty, but not necessary
        return;
      }

      // Type checking
      if (field.types || field.type) {
        const typeErrors = PkgValidation.validateType(
          name,
          field,
          parsed[name]
        );
        if (typeErrors.length > 0) {
          errors = errors.concat(typeErrors);
          return;
        }
      }

      // Regexp format check
      if (field.format instanceof RegExp && !field.format.test(parsed[name])) {
        errors.push(
          `Value for field ${name}, ${
            parsed[name]
          } does not match format: ${field.format?.toString()}`
        );
      }

      // PkgValidation function check
      if (typeof field.validate === 'function') {
        // PkgValidation is expected to return an array of errors (empty means no errors)
        errors = errors.concat(field.validate(name, parsed[name]));
      }
    });

    out.valid = !(errors.length > 0);
    if (errors.length > 0) {
      out.errors = errors;
    }
    if (options.warnings !== false && warnings.length > 0) {
      out.warnings = warnings;
    }
    if (options.recommendations !== false && recommendations.length > 0) {
      out.recommendations = recommendations;
    }

    out.messagesCount =
      out.recommendations.length +
      out.recommendations.length +
      out.errors.length;

    return out;
  }

  static validateType(name: string, field: Field, value: any): Errors {
    const { types, type } = field;
    const errors = [];
    const validFieldTypes: Array<string | undefined> = types || [type];
    const valueType = value instanceof Array ? 'array' : typeof value;
    if (!validFieldTypes.includes(valueType)) {
      errors.push(
        `Type for field ${name}, was expected to be ${validFieldTypes.join(
          ' or '
        )}, not ${typeof value}`
      );
    }
    return errors;
  }

  // Validates dependencies, making sure the object is a set of key value pairs
  // with package names and versions
  static validateDependencies(
    name: string,
    deps: { [dep: string]: string }
  ): Errors {
    const errors: Errors = [];
    Object.entries(deps).forEach(([pkgName, pkgSemver]) => {
      if (!PkgValidation.packageFormat.test(pkgName)) {
        errors.push(`Invalid dependency package name: "${pkgName}"`);
      }

      if (!PkgValidation.isValidVersionRange(pkgSemver)) {
        errors.push(
          `Invalid version range for dependency "${JSON.stringify({
            [pkgName]: pkgSemver
          })}`
        );
      }
    });
    return errors;
  }

  // Taken from https://github.com/isaacs/npm/blob/master/doc/cli/json.md#dependencies
  static isValidVersionRange(version: string): boolean {
    return (
      /^[\^<>=~]{0,2}[0-9.x]+/.test(version) ||
      PkgValidation.urlFormat.test(version) ||
      version === '*' ||
      version === '' ||
      version === 'latest' ||
      (typeof version === 'string' && version.includes('file')) ||
      (typeof version === 'string' && version.includes('git')) ||
      false
    );
  }

  // Allows for a url as a string, or an object that looks like:
  // {
  //   "url" : "http://github.com/owner/project/issues",
  //   "email" : "project@hostname.com"
  // }
  // or
  // {
  //   "mail": "dev@example.com",
  //   "web": "http://www.example.com/bugs"
  // }
  static validateUrlOrMailto(name: string, obj: MailToObj): Errors {
    /* jshint maxcomplexity: 10 */
    const errors = [];
    if (typeof obj === 'string') {
      if (
        !PkgValidation.urlFormat.test(obj) &&
        !PkgValidation.emailFormat.test(obj)
      ) {
        errors.push(`${name} should be an email or a url`);
      }
    } else if (typeof obj === 'object') {
      if (!obj.email && !obj.url && !obj.mail && !obj.web) {
        errors.push(`${name} field should have one of: email, url, mail, web`);
      } else {
        if (obj.email && !PkgValidation.emailFormat.test(obj.email)) {
          errors.push(`Email not valid for ${name}: ${obj.email}`);
        }
        if (obj.mail && !PkgValidation.emailFormat.test(obj.mail)) {
          errors.push(`Email not valid for ${name}: ${obj.mail}`);
        }
        if (obj.url && !PkgValidation.urlFormat.test(obj.url)) {
          errors.push(`Url not valid for ${name}: ${obj.url}`);
        }
        if (obj.web && !PkgValidation.urlFormat.test(obj.web)) {
          errors.push(`Url not valid for ${name}: ${obj.web}`);
        }
      }
    } else {
      errors.push(`Type for field ${name} should be a string or an object`);
    }
    return errors;
  }

  static validatePerson(
    person: Person | string,
    errors: Array<string> = [],
    name?: string
  ): void {
    if (typeof person === 'string') {
      const authorRegex = /^([^<(\s]+[^<(]*)?(\s*<(.*?)>)?(\s*\((.*?)\))?/;
      const authorFields = authorRegex.exec(person);
      if (!authorFields) {
        throw new Error('failed on author fields');
      }
      const authorName = authorFields[1] as string;
      const authorEmail = authorFields[3] as string;
      const authorUrl = authorFields[5] as string;
      PkgValidation.validatePerson({
        name: authorName,
        email: authorEmail,
        url: authorUrl
      });
    } else if (typeof person === 'object' && name && errors) {
      if (!person.name) {
        errors.push(`${name} field should have name`);
      }
      if (person.email && !PkgValidation.emailFormat.test(person.email)) {
        errors.push(`Email not valid for ${name}: ${person.email}`);
      }
      if (person.url && !PkgValidation.urlFormat.test(person.url)) {
        errors.push(`Url not valid for ${name}: ${person.url}`);
      }
      if (person.web && !PkgValidation.urlFormat.test(person.web)) {
        errors.push(`Url not valid for ${name}: ${person.web}`);
      }
    } else {
      errors.push('People field must be an object or a string');
    }
  }

  /* Validate 'people' fields, which can be an object like this:
    { "name" : "Barney Rubble",
      "email" : "b@rubble.com",
      "url" : "http://barnyrubble.tumblr.com/"
    }
    Or a single string like this:
    "Barney Rubble <b@rubble.com> (http://barnyrubble.tumblr.com/)
    Or an array of either of the above.
    */
  static validatePeople(
    name: string,
    obj: string | Array<Person> | Person
  ): Array<string> {
    const errors: Errors = [];

    if (obj instanceof Array) {
      for (let i = 0; i < obj.length; i += 1) {
        PkgValidation.validatePerson(obj[i], errors, name);
      }
    } else {
      PkgValidation.validatePerson(obj, errors, name);
    }
    return errors;
  }

  /* Format for license(s) and repository(s):
   * url as a string
   * or
   * object with "type" and "url"
   * or
   * array of objects with "type" and "url"
   */
  static validateUrlTypes(name: string, obj: string | Obj | Obj[]): Errors {
    const errors = [];

    function validateUrlType({
      type,
      url
    }: {
      type: string;
      url: string;
    }): void {
      if (!type) {
        errors.push(`${name} field should have type`);
      }
      if (!url) {
        errors.push(`${name} field should have url`);
      }
    }

    if (typeof obj === 'string') {
      if (!PkgValidation.urlFormat.test(obj)) {
        errors.push(`Url not valid for ${name}: ${obj}`);
      }
    } else if (obj instanceof Array) {
      for (let i = 0; i < obj.length; i += 1) {
        validateUrlType(obj[i]);
      }
    } else if (typeof obj === 'object') {
      validateUrlType(obj);
    } else {
      errors.push(`Type for field ${name} should be a string or an object`);
    }

    return errors;
  }
}

export function validateInterface(skillInterface: SkillInterfaceModule): void {
  const interfaceSchema = Joi.object({
    description: Joi.string().required(),
    subcommand: Joi.string().required(),
    runForEachTarget: Joi.boolean().required(),
    resolveSkill: Joi.function().required(),
    handleFlags: Joi.function()
  });
  return Joi.assert(skillInterface, interfaceSchema);
}

export function validateSkill(skill: RawSkill): void {
  const skillSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    supports: Joi.object({
      envs: Joi.array().items(
        Joi.string().valid('test', 'production', 'development')
      ),
      platforms: Joi.array().items(Joi.string().valid('node', 'browser')),
      projects: Joi.array().items(Joi.string().valid('app', 'lib'))
    }),
    pkg: Joi.object(),
    dependencies: Joi.object(),
    devDependencies: Joi.object(),
    dirs: Joi.array().items(
      Joi.object({
        src: Joi.string().required(),
        dest: Joi.string().required()
      })
    ),
    files: Joi.array().items(
      Joi.object({
        alias: Joi.string(),
        src: Joi.string(),
        dest: Joi.string().required(),
        content: Joi.string(),
        condition: Joi.function()
      }).xor('src', 'content')
    ),
    configs: Joi.array().items(
      Joi.object({
        alias: Joi.string(),
        filename: Joi.string().required(),
        config: Joi.object().required(),
        fileType: Joi.string().valid('commonjs', 'module', 'json'),
        write: Joi.boolean()
      })
    ),
    interfaces: Joi.array().items(
      Joi.string(),
      Joi.array().items(Joi.string().required(), Joi.object().required())
    ),
    hooks: Joi.object(),
    transforms: Joi.object(),
    default: Joi.boolean()
  });
  return Joi.assert(skill, skillSchema);
}

export default function validateConfig(
  alfredConfig: AlfredConfigWithUnresolvedInterfaces
): void {
  const skills = Joi.array().items(
    Joi.string(),
    Joi.array().items(Joi.string().required(), Joi.object().required())
  );
  const alfredConfigSchema = Joi.object({
    npmClient: Joi.string().valid('npm', 'yarn'),
    rawConfig: Joi.object(),
    showConfigs: Joi.boolean(),
    configsDir: Joi.string(),
    extends: [Joi.string(), Joi.array()],
    autoInstall: Joi.bool(),
    skills,
    lib: Joi.object({
      recommendSkills: skills
    })
  });

  if (
    alfredConfig.showConfigs === false &&
    'configsDir' in alfredConfig &&
    alfredConfig.configsDir !== Config.DEFAULT_CONFIG.configsDir
  ) {
    throw new Error(
      'showConfigs must be true for configsDir property to be set'
    );
  }

  if ('extends' in alfredConfig) {
    // Validate if each config in `.extends` is a string
    if (Array.isArray(alfredConfig.extends)) {
      alfredConfig.extends.forEach(extendConfigs => {
        if (typeof extendConfigs !== 'string') {
          throw new Error(
            `Values in ".extends" property in Alfred config must be a string. Instead passed ${JSON.stringify(
              alfredConfig.extends
            ) || String(alfredConfig.extends)}`
          );
        }
      });
    } else if (typeof alfredConfig.extends !== 'string') {
      throw new Error(
        `Values in ".extends" property in Alfred config must be a string. Instead passed ${JSON.stringify(
          alfredConfig.extends
        ) || String(alfredConfig.extends)}`
      );
    }
  }

  return Joi.assert(alfredConfig, alfredConfigSchema);
}
