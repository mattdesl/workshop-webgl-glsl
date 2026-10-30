export interface TransformRequireResult {
    code: string;
    replaced: boolean;
}
export declare function transformRequire(code: string, id: string): TransformRequireResult;
export declare function isCommonJS(code: string): boolean;
