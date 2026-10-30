export declare const WORD_SEPARATORS: Set<string>;
export declare const SENTENCE_TERMINATORS: Set<string>;
export declare const TITLE_TERMINATORS: Set<string>;
export declare const SMALL_WORDS: Set<string>;
export interface Options {
    locale?: string | string[];
    sentenceCase?: boolean;
    sentenceTerminators?: Set<string>;
    smallWords?: Set<string>;
    titleTerminators?: Set<string>;
    wordSeparators?: Set<string>;
}
export declare function titleCase(input: string, options?: Options | string[] | string): string;
