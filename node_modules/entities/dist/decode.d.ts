/**
 * Decoding mode for named entities.
 */
export declare enum DecodingMode {
    /** Entities in text nodes that can end with any character. */
    Legacy = 0,
    /** Only allow entities terminated with a semicolon. */
    Strict = 1,
    /** Entities in attributes have limitations on ending characters. */
    Attribute = 2
}
/**
 * Producers for character reference errors as defined in the HTML spec.
 */
export interface EntityErrorProducer {
    missingSemicolonAfterCharacterReference(): void;
    absenceOfDigitsInNumericCharacterReference(consumedCharacters: number): void;
    /**
     * Validate the accumulated numeric value, before Unicode replacement.
     * Values beyond the JavaScript number range are positive infinity.
     */
    validateNumericCharacterReference(code: number): void;
}
/**
 * Token decoder with support of writing partial entities.
 */
export declare class EntityDecoder {
    /** The predefined HTML or XML decode tree. */
    private readonly decodeTree;
    /**
     * The function that is called when a codepoint is decoded.
     *
     * For named entities that decode to multiple code points, this will
     * be called multiple times, with the second codepoint, and the same
     * `consumed` value.
     * @param codepoint The decoded codepoint.
     * @param consumed The number of characters consumed by the decoder.
     */
    private readonly emitCodePoint;
    /** An object that is used to produce errors. */
    private readonly errors?;
    /** The current state of the decoder. */
    private state;
    /** Characters that were consumed while parsing an entity. */
    private consumed;
    /**
     * The result of the entity.
     *
     * For named entities: the trie index of the best legacy match so far
     * (0 = none). For numeric entities: the accumulated code point.
     */
    private result;
    /** The current index in the decode tree. */
    private treeIndex;
    /**
     * Characters consumed since the last recorded legacy match, plus one.
     * Invariant at the top of the `stateNamedEntity` loop: `excess` equals
     * the number of unrecorded consumed characters + 1.
     */
    private excess;
    /** The mode in which the decoder is operating. */
    private decodeMode;
    /** The number of characters that have been consumed in the current run. */
    private runConsumed;
    constructor(
    /** The predefined HTML or XML decode tree. */
    decodeTree: Uint16Array, 
    /**
     * The function that is called when a codepoint is decoded.
     *
     * For named entities that decode to multiple code points, this will
     * be called multiple times, with the second codepoint, and the same
     * `consumed` value.
     * @param codepoint The decoded codepoint.
     * @param consumed The number of characters consumed by the decoder.
     */
    emitCodePoint: (cp: number, consumed: number) => void, 
    /** An object that is used to produce errors. */
    errors?: EntityErrorProducer | undefined);
    /**
     * Resets the instance to make it reusable.
     * @param decodeMode Entity decoding mode to use.
     */
    startEntity(decodeMode: DecodingMode): void;
    /**
     * Write an entity to the decoder. This can be called multiple times with partial entities.
     * If the entity is incomplete, the decoder will return -1.
     *
     * Mirrors the non-streaming `decodeWithTrie`, but with the ability to stop decoding if the
     * entity is incomplete, and resume when the next string is written.
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    write(input: string, offset: number): number;
    /**
     * Switches between the numeric decimal and hexadecimal states.
     *
     * Equivalent to the `Numeric character reference state` in the HTML spec.
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    private stateNumericStart;
    /**
     * Parses a hexadecimal numeric entity.
     *
     * Equivalent to the `Hexademical character reference state` in the HTML
     * spec. Digit parsing matches the hex loop in `parseNumericEntity`.
     * The accumulated value is preserved for numeric validation callbacks.
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    private stateNumericHex;
    /**
     * Parses a decimal numeric entity.
     *
     * Equivalent to the `Decimal character reference state` in the HTML
     * spec. Digit parsing matches the decimal loop in `parseNumericEntity`.
     * The accumulated value is preserved for numeric validation callbacks.
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    private stateNumericDecimal;
    /**
     * Validate and emit a numeric entity.
     *
     * Implements the logic from the `Hexademical character reference start
     * state` and `Numeric character reference end state` in the HTML spec.
     * @param lastCp The last code point of the entity. Used to see if the
     *               entity was terminated with a semicolon.
     * @param expectedLength The minimum number of characters that should be
     *                       consumed. Used to validate that at least one digit
     *                       was consumed.
     * @returns The number of characters that were consumed.
     */
    private emitNumericEntity;
    /**
     * Flush locally-tracked walk state back to the fields, then emit the
     * recorded legacy match or reject (cold path — at most once per
     * entity). Called after failed navigation (leaf node, branch miss, or
     * compact-run mismatch). In attribute mode, reject if no legacy was
     * recorded at the current node, if we descended past it, or if the
     * pending input character is an invalid attribute terminator.
     * @param consumed Locally-tracked consumed count.
     * @param excess Locally-tracked excess count.
     * @param char Pending input character (may be the mismatching char).
     * @param valueLength Value length at the current trie node.
     */
    private flushAndEmitLegacyOrReject;
    /**
     * Parses a named entity.
     *
     * Equivalent to the `Named character reference state` in the HTML spec.
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    private stateNamedEntity;
    /**
     * Emit a named entity that was not terminated with a semicolon.
     * @returns The number of characters consumed.
     */
    private emitNotTerminatedNamedEntity;
    /**
     * Emit a named entity.
     * @param result The index of the entity in the decode tree.
     * @param valueLength Encoded value length (header plus any value words).
     * @param consumed The number of characters consumed.
     * @returns The number of characters consumed.
     */
    private emitNamedEntityData;
    /**
     * Signal to the parser that the end of the input was reached.
     *
     * Remaining data will be emitted and relevant errors will be produced.
     * @returns The number of characters consumed.
     */
    end(): number;
}
/**
 * Determines the branch of the current node that is taken given the current
 * character. This function is used to traverse the trie.
 *
 * See `BinTrieFlags` for the branch-data layouts handled here.
 * @param decodeTree The trie.
 * @param current The current node's header word.
 * @param nodeIndex Index of the node's first branch-data word (the header
 *   plus any value words have been skipped by the caller).
 * @param char The current character.
 * @returns The index of the next node, or -1 if no branch is taken.
 */
export declare function determineBranch(decodeTree: Uint16Array, current: number, nodeIndex: number, char: number): number;
/**
 * Decodes an HTML string.
 * @param htmlString The string to decode.
 * @param mode The decoding mode.
 * @returns The decoded string.
 */
export declare function decodeHTML(htmlString: string, mode?: DecodingMode): string;
/**
 * Decodes an HTML string in an attribute.
 * @param htmlAttribute The string to decode.
 * @returns The decoded string.
 */
export declare function decodeHTMLAttribute(htmlAttribute: string): string;
/**
 * Decodes an HTML string, requiring all entities to be terminated by a semicolon.
 * @param htmlString The string to decode.
 * @returns The decoded string.
 */
export declare function decodeHTMLStrict(htmlString: string): string;
/**
 * Decodes an XML string, requiring all entities to be terminated by a semicolon.
 *
 * Uses a hand-coded fast path for the 5 XML named entities (amp, lt, gt,
 * quot, apos) plus numeric entities, bypassing the trie entirely.
 * @param xmlString The string to decode.
 * @returns The decoded string.
 */
export declare function decodeXML(xmlString: string): string;
export { replaceCodePoint, replaceCodePointXML, } from "./decode-codepoint.js";
export { htmlDecodeTree } from "./generated/decode-data-html.js";
export { xmlDecodeTree } from "./generated/decode-data-xml.js";
//# sourceMappingURL=decode.d.ts.map