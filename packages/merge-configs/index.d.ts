declare function mergeConfigs(
  ...objs: Array<Record<string, any> | {}>
): Record<string, any>;

export = mergeConfigs;
