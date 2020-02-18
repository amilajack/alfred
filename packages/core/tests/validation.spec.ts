import validateConfig from '../src/validation';

describe('validation', () => {
  describe('alfred config', () => {
    it('should validate types of basic properties', () => {
      expect(() =>
        validateConfig({
          showConfigs: 'false',
          configsDir: false
        })
      ).toThrow();
    });

    it('should not allow mutually exclusive configsDir and showConfigs', () => {
      expect(() =>
        validateConfig({
          showConfigs: false,
          configsDir: '/'
        })
      ).toThrow('showConfigs must be true for configsDir property to be set');
    });

    it('should take multiple extends values', () => {
      validateConfig({
        extends: ['alfred-config-1', 'alfred-config-2']
      });
      validateConfig({
        extends: 'alfred-config-1'
      });
    });

    it('should validate skills', () => {
      validateConfig({
        skills: ['alfred-skill-1', 'alfred-skill-2']
      });
      validateConfig({
        skills: [['alfred-skill-1', {}], 'alfred-skill-2']
      });
      expect(() =>
        validateConfig({
          skills: 'alfred-skill-1'
        })
      ).toThrow();
    });
  });

  describe('skills', () => {});
});
