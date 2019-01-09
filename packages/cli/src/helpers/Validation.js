// @flow
import Joi from 'joi';

export default function Validate(alfredPkg: { [x: string]: any }) {
  // @TODO Move to helpers
  const schema = Joi.object().keys({
    skills: Joi.array().items(Joi.string())
  });
  return Joi.assert(alfredPkg, schema);
}
