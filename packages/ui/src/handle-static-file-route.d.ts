import type { BrandTheme } from "./styles/theme";
export declare function handleStaticFileRoute(filepath: string, theme: {
    darkTheme: BrandTheme;
    lightTheme: BrandTheme;
}, staticDirs: readonly string[]): Promise<Response>;
