declare module 'format-package' {
  export default function formatPkg(
    pkg: Record<string, any>,
    opts?: Record<string, any>
  ): Promise<string>;
}
