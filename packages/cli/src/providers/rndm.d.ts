declare module 'rndm' {
  export default function rndm(): number;
}

declare module 'gitignore-parser' {
  export function compile(str: string): { accepts: (str: string) => boolean }
}

declare module 'lebab' {
  export function transform(str: string, b: string[]): {warnings: string[], code: string}
}
