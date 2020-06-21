import {
  validateAlfredConfig,
  validateSkill,
  validateTask,
} from '../src/validation';

describe('validation', () => {
  describe('alfred config', () => {
    it('should validate types of basic properties', () => {
      expect(() =>
        validateAlfredConfig({
          configsDir: false,
        })
      ).toThrow();
    });

    it('should require config to be an object', () => {
      expect(() => validateAlfredConfig(true)).toThrow();
    });

    it('should take multiple extends values', () => {
      validateAlfredConfig({
        extends: ['alfred-config-1', 'alfred-config-2'],
      });
      validateAlfredConfig({
        extends: 'alfred-config-1',
      });
    });

    it('should validate config skills', () => {
      validateAlfredConfig({
        skills: ['alfred-skill-1', 'alfred-skill-2'],
      });
      validateAlfredConfig({
        skills: [['alfred-skill-1', {}], 'alfred-skill-2'],
      });
      expect(() =>
        validateAlfredConfig({
          skills: 'alfred-skill-1',
        })
      ).toThrow();
    });
  });

  describe('skills', () => {
    it('should pass validation with minimal properties', () => {
      validateSkill({
        name: 'alfred-skill-1',
      });
    });

    it('should fail validation with incorrect types', () => {
      expect(() =>
        validateSkill({
          name: true,
        })
      ).toThrow();
    });
  });

  describe('tasks', () => {
    it('should pass validation with minimal properties', () => {
      validateTask({
        description: 'build your alfred project',
        subcommand: 'build',
        runForEachTarget: true,
        resolveSkill: (skills) => {
          return skills[0];
        },
      });
    });

    it('should fail with invalid input', () => {
      expect(() => validateTask({})).toThrow();
    });
  });
});
