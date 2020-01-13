import { ProjectInterface } from '@alfred/core/lib/types';
import { UserProviderInput } from './provider-interface';
export declare function handleInput(userInput: UserProviderInput, project: ProjectInterface): Promise<string[]>;
export default function Providers(userInput: UserProviderInput, project: ProjectInterface): Promise<Array<string> | void | Array<string>>;
//# sourceMappingURL=index.d.ts.map