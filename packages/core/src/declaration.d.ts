declare module 'highlight.js/lib/languages/diff' {
  export default function(
    lang: string,
    code: string
  ): {
    value: string;
  };
}

declare module 'emphasize/lib/core' {
  type Parser = (
    lang: string,
    code: string
  ) => {
    value: string;
  };
  export function registerLanguage(lang: string, parser: Parser): void;

  export function highlight(
    lang: string,
    code: string
  ): {
    value: string;
  };
}
