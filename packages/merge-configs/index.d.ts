import { AlfredConfigWithUnresolvedInterfaces } from '@alfred/types';

declare function mergeConfigs(
  ...objs: Array<AlfredConfigWithUnresolvedInterfaces | {}>
): AlfredConfigWithUnresolvedInterfaces;

export = mergeConfigs;
