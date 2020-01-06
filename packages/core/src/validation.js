/* eslint import/no-dynamic-require: off */
import Joi from 'joi';
import type { Pkg } from './types';

type ValidationResult = {
  valid: boolean,
  critical: boolean,
  criticalMessage: string,
  errors: Array<string>,
  warnings: Array<string>,
  recommendations: Array<string>,
  messagesCount: number
};

/* Parse the incoming string as JSON, validate it against the spec for package.json
 * See README for more details
 */
export class PkgValidation {
  static packageFormat = /^[a-zA-Z0-9@/][a-zA-Z0-9@/.\-_]*$/;

  static versionFormat = /^[0-9]+\.[0-9]+[0-9+a-zA-Z.-]+$/;

  static urlFormat = /^https*:\/\/[a-z.\-0-9]+/;

  static emailFormat = /\S+@\S+/;

  // I know this isn't thorough. it's not supposed to be.
  static getSpecMap() {
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

  static parse(data: string | Object): Object {
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

  static validate(data: string | Pkg, options: Object = {}): ValidationResult {
    const parsed = PkgValidation.parse(data);
    const out = {
      valid: false,
      critical: true,
      criticalMessage: '',
      warnings: [],
      recommendations: [],
      errors: []
    };

    if (typeof parsed === 'string') {
      out.criticalMessage = parsed;
      return out;
    }

    const map = PkgValidation.getSpecMap();
    let errors = [];
    const warnings = [];
    const recommendations = [];

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
      if (field.format && !field.format.test(parsed[name])) {
        errors.push(
          `Value for field ${name}, ${
            parsed[name]
          } does not match format: ${field.format.toString()}`
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

  static validateType(
    name: string,
    a: { types: Array<string>, type: string },
    value: any
  ) {
    const { types, type } = a;
    const errors = [];
    const validFieldTypes = types || [type];
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
  static validateDependencies(name: string, deps: { [dep: string]: string }) {
    const errors = [];
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
  static isValidVersionRange(version: string) {
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
  static validateUrlOrMailto(name: string, obj: Object) {
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
    person: Object | string,
    name?: string,
    errors?: Array<string> = []
  ) {
    /* jshint maxcomplexity: 10 */
    if (typeof person === 'string') {
      const authorRegex = /^([^<(\s]+[^<(]*)?(\s*<(.*?)>)?(\s*\((.*?)\))?/;
      const authorFields = authorRegex.exec(person);
      if (!authorFields) {
        throw new Error('failed on author fields');
      }
      const authorName = authorFields[1];
      const authorEmail = authorFields[3];
      const authorUrl = authorFields[5];
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
  static validatePeople(name: string, obj: Object): Array<string> {
    const errors = [];

    if (obj instanceof Array) {
      for (let i = 0; i < obj.length; i += 1) {
        PkgValidation.validatePerson(obj[i], name, errors);
      }
    } else {
      PkgValidation.validatePerson(obj, name, errors);
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
  static validateUrlTypes(name: string, obj: Object) {
    const errors = [];
    function validateUrlType({ type, url }) {
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

const skill = [Joi.string(), Joi.array()];
const skills = [Joi.string(), Joi.array().items(skill)];

export default function ValidateAlfredConfig(alfredConfig: {
  [x: string]: any
}) {
  const schema = Joi.object().keys({
    npmClient: Joi.string().valid(['npm', 'yarn']),
    showConfigs: Joi.boolean(),
    extends: [Joi.string(), Joi.array().items(Joi.string())],
    autoInstall: Joi.bool(),
    skills,
    app: Joi.object().keys({
      targets: [Joi.string(), Joi.object(), Joi.array()]
    }),
    lib: Joi.object().keys({
      recommendSkills: skills
    })
  });
  if (!alfredConfig.extends) return alfredConfig;
  // Validate if each config in `.extends` is a string
  if (Array.isArray(alfredConfig.extends)) {
    alfredConfig.extends.forEach(_config => {
      if (typeof _config !== 'string') {
        throw new Error(
          `Values in ".extends" property in Alfred config must be a string. Instead passed ${JSON.stringify(
            alfredConfig.extends
          )}`
        );
      }
    });
  } else if (typeof alfredConfig.extends !== 'string') {
    throw new Error(
      `Values in ".extends" property in Alfred config must be a string. Instead passed ${JSON.stringify(
        alfredConfig.extends
      )}`
    );
  }
  return Joi.assert(alfredConfig, schema);
}
