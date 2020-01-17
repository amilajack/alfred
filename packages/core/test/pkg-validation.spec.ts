import { PkgValidation } from '../src/validation';

function getPackageJson(
  extra = {}
): { name: string; version: string; license?: string; licenses?: string[] } {
  return {
    name: 'test-package',
    version: '0.5.0',
    ...extra
  };
}

// A fixture that has all properties which should throw warnings
const npmWarningFields = {
  description: 'This is my description',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  bugs: 'http://example.com/bugs',
  repository: {
    type: 'git',
    url: 'git@github.com:gorillamania/package.json-validator.git'
  },
  licenses: [{ type: 'MIT', url: 'http://example.com/license' }]
};

describe('Basic', () => {
  it('Input types', () => {
    expect(PkgValidation.validate('string').criticalMessage).toEqual(
      'Invalid JSON - SyntaxError: Unexpected token s in JSON at position 0'
    );
    expect(PkgValidation.validate('{').criticalMessage).toEqual(
      'Invalid JSON - SyntaxError: Unexpected end of JSON input'
    );
    expect(PkgValidation.validate('[]').criticalMessage).toEqual(
      'Invalid JSON - Not an object. Received type of object'
    );
    expect(PkgValidation.validate('"malformed"').criticalMessage).toEqual(
      'Invalid JSON - Not an object. Received type of string'
    );
    expect(PkgValidation.validate('42').criticalMessage).toEqual(
      'Invalid JSON - Not an object. Received type of number'
    );
    expect(PkgValidation.validate('null').criticalMessage).toEqual(
      'Invalid JSON - Not an object. Received type of object'
    );
    expect(PkgValidation.validate('true').criticalMessage).toEqual(
      'Invalid JSON - Not an object. Received type of boolean'
    );
    expect(PkgValidation.validate('false').criticalMessage).toEqual(
      'Invalid JSON - Not an object. Received type of boolean'
    );
    // @ts-ignore
    expect(PkgValidation.validate({}).criticalMessage).toEqual(
      'Invalid data - Not a string'
    );
  });
});

describe('NPM', () => {
  it('should handle npm package properties', () => {
    expect(PkgValidation.packageFormat.test('a')).toEqual(true);
    expect(PkgValidation.packageFormat.test('abcABC123._-')).toEqual(true);
    expect(PkgValidation.validatePeople('people', 'Barney Rubble')).toEqual([]);
    expect(
      PkgValidation.validatePeople(
        'people',
        'Barney Rubble <b@rubble.com> (http://barneyrubble.tumblr.com/)'
      )
    ).toEqual([]);
    expect(
      PkgValidation.validatePeople(
        'people',
        '<b@rubble.com> (http://barneyrubble.tumblr.com/)'
      )
    ).toEqual([]);
    expect(
      PkgValidation.validate(
        JSON.stringify(getPackageJson({ bin: './path/to/program' }))
      )
    ).toMatchSnapshot();
    expect(
      PkgValidation.validate(
        JSON.stringify(
          getPackageJson({ bin: { 'my-project': './path/to/program' } })
        )
      )
    ).toMatchSnapshot();
    expect(
      PkgValidation.validate(
        JSON.stringify(getPackageJson({ bin: ['./path/to/program'] }))
      )
    ).toMatchSnapshot();
    expect(
      PkgValidation.validate(
        JSON.stringify(
          getPackageJson({ dependencies: { bad: { version: '3.3.3' } } })
        )
      )
    ).toMatchSnapshot();
  });
});

describe('misc', () => {
  it('Dependencies Ranges', () => {
    const json = getPackageJson({
      dependencies: {
        star: '*',
        empty: '',
        url: 'https://github.com/gorillamania/package.json-validator',
        'caret-first': '^1.0.0',
        'tilde-first': '~1.2',
        'x-version': '1.2.x',
        'tilde-top': '~1',
        'caret-top': '^1',
        file: 'file:./'
      },
      devDependencies: {
        range: '1.2.3 - 2.3.4',
        lteq: '<=1.2.3',
        gteq: '>=1.2.3',
        'verion-build': '1.2.3+build2012',
        lt: '<1.2.3',
        gt: '>1.2.3'
      }
    });
    const result = PkgValidation.validate(JSON.stringify(json), {
      warnings: false,
      recommendations: false
    });
    expect(result).toEqual({
      critical: true,
      messagesCount: 0,
      criticalMessage: '',
      errors: [],
      recommendations: [],
      valid: true,
      warnings: []
    });
  });

  it('Dependencies with scope', () => {
    // reference: https://github.com/gorillamania/package.json-validator/issues/49
    const json = getPackageJson({
      dependencies: {
        star: '*',
        empty: '',
        url: 'https://github.com/gorillamania/package.json-validator',
        '@reactivex/rxjs': '^5.0.0-alpha.7'
      }
    });
    const result = PkgValidation.validate(JSON.stringify(json), {
      warnings: false,
      recommendations: false
    });
    expect(result).toEqual({
      critical: true,
      messagesCount: 0,
      criticalMessage: '',
      errors: [],
      recommendations: [],
      valid: true,
      warnings: []
    });
  });

  it('Required fields', () => {
    let json = getPackageJson();
    let result = PkgValidation.validate(JSON.stringify(json), {
      warnings: false,
      recommendations: false
    });
    expect(result).toEqual({
      critical: true,
      messagesCount: 0,

      criticalMessage: '',
      errors: [],
      recommendations: [],
      valid: true,
      warnings: []
    });

    ['name', 'version'].forEach(field => {
      json = getPackageJson();
      delete json[field];
      result = PkgValidation.validate(JSON.stringify(json), {
        warnings: false,
        recommendations: false
      });

      expect(result).toEqual({
        critical: true,
        messagesCount: 1,
        criticalMessage: '',
        errors: [`Missing required field: ${field}`],
        recommendations: [],
        valid: false,
        warnings: []
      });
    });
  });

  it('Warning fields', () => {
    let json = getPackageJson(npmWarningFields);
    let result = PkgValidation.validate(JSON.stringify(json), {
      warnings: true,
      recommendations: false
    });
    expect(result).toEqual({
      critical: true,
      messagesCount: 0,
      criticalMessage: '',
      errors: [],
      recommendations: [],
      valid: true,
      warnings: []
    });

    Object.keys(npmWarningFields).forEach(npmWarningField => {
      json = getPackageJson(npmWarningFields);
      delete json[npmWarningField];
      result = PkgValidation.validate(JSON.stringify(json), {
        warnings: true,
        recommendations: false
      });
      expect(result).toEqual({
        critical: true,
        messagesCount: 0,
        criticalMessage: '',
        errors: [],
        recommendations: [],
        valid: true,
        warnings: [`Missing recommended field: ${npmWarningField}`]
      });
    });
  });

  it('Recommended fields', () => {
    const recommendedFields = {
      homepage: 'http://example.com',
      engines: { node: '>=0.10.3 <0.12' }
    };
    let json = getPackageJson(recommendedFields);
    let result = PkgValidation.validate(JSON.stringify(json), {
      warnings: false,
      recommendations: true
    });
    expect(result).toEqual({
      critical: true,
      messagesCount: 0,
      criticalMessage: '',
      errors: [],
      recommendations: [],
      valid: true,
      warnings: []
    });

    Object.entries(recommendedFields).forEach(([recommendedField]) => {
      json = getPackageJson(recommendedFields);
      delete json[recommendedField];
      result = PkgValidation.validate(JSON.stringify(json), {
        warnings: false,
        recommendations: true
      });
      expect(result).toEqual({
        critical: true,
        messagesCount: expect.any(Number),
        criticalMessage: '',
        errors: [],
        recommendations: [`Missing optional field: ${recommendedField}`],
        valid: true,
        warnings: []
      });
    });
  });

  it('Licenses', () => {
    // https://npmjs.org/doc/json.html#license

    // licenses as an array
    let json = getPackageJson(npmWarningFields);
    let result = PkgValidation.validate(JSON.stringify(json), {
      warnings: true,
      recommendations: false
    });
    expect(result).toEqual({
      critical: true,
      messagesCount: 0,
      criticalMessage: '',
      errors: [],
      recommendations: [],
      valid: true,
      warnings: []
    });

    // licenses as a single type
    json = getPackageJson(npmWarningFields);
    delete json.licenses;
    json.license = 'MIT';
    result = PkgValidation.validate(JSON.stringify(json), {
      warnings: true,
      recommendations: false
    });
    expect(result).toEqual({
      critical: true,
      messagesCount: 0,
      criticalMessage: '',
      errors: [],
      recommendations: [],
      valid: true,
      warnings: []
    });

    // neither
    json = getPackageJson(npmWarningFields);
    delete json.licenses;
    result = PkgValidation.validate(JSON.stringify(json), {
      warnings: true,
      recommendations: false
    });
    expect(result).toEqual({
      critical: true,
      messagesCount: 0,
      criticalMessage: '',
      errors: [],
      recommendations: [],
      valid: true,
      warnings: ['Missing recommended field: licenses']
    });
  });
});
