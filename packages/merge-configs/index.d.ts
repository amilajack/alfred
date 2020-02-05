import { AlfredConfigWithUnresolvedInterfaces } from '@alfred/types';

declare function mergeConfigs(
  ...objs: Array<
    Record<string, any> | AlfredConfigWithUnresolvedInterfaces | {}
  >
): Record<string, any> | AlfredConfigWithUnresolvedInterfaces;

export = mergeConfigs;
