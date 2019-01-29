// @flow
import Joi from 'joi';

const skill = [Joi.string(), Joi.array()];
const skills = [Joi.string(), Joi.array().items(skill)];

/**
 * @TODO Move this to core/configs
 */
export default function Validate(alfredPkg: { [x: string]: any }) {
  // @TODO Move to helpers
  const schema = Joi.object().keys({
    showConfigs: Joi.boolean(),
    extends: [Joi.string(), Joi.array().items(Joi.string())],
    skills,
    app: Joi.object().keys({
      targets: [Joi.string(), Joi.object(), Joi.array()]
    }),
    lib: Joi.object().keys({
      recommendSkills: skills
    })
  });
  return Joi.assert(alfredPkg, schema);
}
