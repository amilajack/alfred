export function requireModule(moduleName: string): any {
  const requiredModule = require(moduleName);
  return requiredModule.default || requiredModule;
}
