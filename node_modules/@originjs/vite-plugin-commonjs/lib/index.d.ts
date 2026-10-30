import { Plugin } from "vite";
export declare type Options = {
    include?: string | string[] | undefined;
    exclude?: string | string[] | undefined;
    skipPreBuild?: boolean;
};
export declare function viteCommonjs(options?: Options): Plugin;
export declare function esbuildCommonjs(include?: string[]): {
    name: string;
    setup(build: any): void;
};
