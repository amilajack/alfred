import { ProviderInput, ProviderInterface } from './provider-interface';
export default class EslintProvider implements ProviderInterface {
    providerName: string;
    priority: number;
    safe: boolean;
    transform(files: Array<string>): Promise<void>;
    provide(input: ProviderInput): Promise<ProviderInput>;
}
//# sourceMappingURL=eslint-provider.d.ts.map