import {
    codePointToString,
    replaceCodePoint,
    replaceCodePointXML,
} from "./decode-codepoint.js";
import { htmlDecodeTree } from "./generated/decode-data-html.js";
import { xmlDecodeTree } from "./generated/decode-data-xml.js";
import { BinTrieFlags } from "./internal/bin-trie-flags.js";

const enum CharCodes {
    AMP = 38, // "&"
    NUM = 35, // "#"
    SEMI = 59, // ";"
    EQUALS = 61, // "="
    ZERO = 48, // "0"
    NINE = 57, // "9"
    LOWER_A = 97, // "a"
    LOWER_X = 120, // "x"
}

/** Bit that needs to be set to convert an upper case ASCII character to lower case */
const TO_LOWER_BIT = 0b10_0000;

/*
 * `parseNumericEntity` packs its two results into one 32-bit integer:
 * `(consumed << CONSUMED_SHIFT) | codePoint`. The 21-bit code point field
 * fits any valid Unicode value (max 0x10FFFF, clamped before packing); the
 * consumed count excludes `&` and gets the remaining 11 bits. Extract it
 * with `>>>` so the topmost bit isn't treated as a sign.
 *
 * Plain consts rather than a `const enum`: with `isolatedModules`, enum
 * member reads compile to runtime property loads.
 */
const CONSUMED_SHIFT = 21;
const CODE_POINT_MASK = 0x1f_ff_ff;
/**
 * Reserved consumed field for counts of at least 2047 characters after `&`.
 * The true count is in `longNumericConsumed`.
 */
const CONSUMED_OVERFLOW = 0x7_ff;

/**
 * Side channel for numeric entities of at least 2048 characters including
 * `&`. Set by `parseNumericEntity` when its consumed count reaches the
 * reserved value `CONSUMED_OVERFLOW`; callers read the true count from here.
 * A module-level slot avoids a tuple allocation on the hot path.
 */
let longNumericConsumed = 0;

/**
 * Extract the consumed count from a `parseNumericEntity` packed result,
 * recovering the true length from `longNumericConsumed` when the packed
 * field contains the sentinel. Read it before the next `parseNumericEntity`
 * call, which may overwrite the side channel. This helper owns that protocol.
 * @param packed Packed result of `parseNumericEntity`.
 */
function unpackConsumed(packed: number): number {
    const consumed = packed >>> CONSUMED_SHIFT;
    return consumed === CONSUMED_OVERFLOW ? longNumericConsumed : consumed;
}

/**
 * Unsigned subtraction trick: (code - lo) >>> 0 wraps negatives to large
 * values, so a single `<=` covers the entire [lo..hi] range check.
 * @param code Code point to check.
 */
function isNumber(code: number): boolean {
    return (code - CharCodes.ZERO) >>> 0 <= 9;
}

function isHexadecimalCharacter(code: number): boolean {
    return ((code | TO_LOWER_BIT) - CharCodes.LOWER_A) >>> 0 <= 5; // F - a
}

function isAlpha(code: number): boolean {
    return ((code | TO_LOWER_BIT) - CharCodes.LOWER_A) >>> 0 <= 25; // Z - a
}

/**
 * Checks if the given character is a valid end character for an entity in an attribute.
 *
 * Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
 * See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
 * @param code Code point to check.
 */
function isEntityInAttributeInvalidEnd(code: number): boolean {
    return code === CharCodes.EQUALS || isAlpha(code) || isNumber(code);
}

const enum EntityDecoderState {
    EntityStart,
    NumericStart,
    NumericDecimal,
    NumericHex,
    NamedEntity,
}

/**
 * Decoding mode for named entities.
 */
export enum DecodingMode {
    /** Entities in text nodes that can end with any character. */
    Legacy = 0,
    /** Only allow entities terminated with a semicolon. */
    Strict = 1,
    /** Entities in attributes have limitations on ending characters. */
    Attribute = 2,
}

/**
 * Producers for character reference errors as defined in the HTML spec.
 */
export interface EntityErrorProducer {
    missingSemicolonAfterCharacterReference(): void;
    absenceOfDigitsInNumericCharacterReference(
        consumedCharacters: number,
    ): void;
    /**
     * Validate the accumulated numeric value, before Unicode replacement.
     * Values beyond the JavaScript number range are positive infinity.
     */
    validateNumericCharacterReference(code: number): void;
}

/**
 * Token decoder with support of writing partial entities.
 */
export class EntityDecoder {
    /** The current state of the decoder. */
    private state: number = EntityDecoderState.EntityStart;
    /** Characters that were consumed while parsing an entity. */
    private consumed = 1;
    /**
     * The result of the entity.
     *
     * For named entities: the trie index of the best legacy match so far
     * (0 = none). For numeric entities: the accumulated code point.
     */
    private result = 0;

    /** The current index in the decode tree. */
    private treeIndex = 0;
    /**
     * Characters consumed since the last recorded legacy match, plus one.
     * Invariant at the top of the `stateNamedEntity` loop: `excess` equals
     * the number of unrecorded consumed characters + 1.
     */
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: False positive (read via destructuring)
    private excess = 1;
    /** The mode in which the decoder is operating. */
    private decodeMode = DecodingMode.Strict;
    /** The number of characters that have been consumed in the current run. */
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: False positive
    private runConsumed = 0;

    constructor(
        /** The predefined HTML or XML decode tree. */
        private readonly decodeTree: Uint16Array,
        /**
         * The function that is called when a codepoint is decoded.
         *
         * For named entities that decode to multiple code points, this will
         * be called multiple times, with the second codepoint, and the same
         * `consumed` value.
         * @param codepoint The decoded codepoint.
         * @param consumed The number of characters consumed by the decoder.
         */
        private readonly emitCodePoint: (cp: number, consumed: number) => void,
        /** An object that is used to produce errors. */
        private readonly errors?: EntityErrorProducer | undefined,
    ) {}

    /**
     * Resets the instance to make it reusable.
     * @param decodeMode Entity decoding mode to use.
     */
    startEntity(decodeMode: DecodingMode): void {
        this.decodeMode = decodeMode;
        this.state = EntityDecoderState.EntityStart;
        this.result = 0;
        this.treeIndex = 0;
        this.excess = 1;
        this.consumed = 1;
        this.runConsumed = 0;
    }

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
    write(input: string, offset: number): number {
        switch (this.state) {
            case EntityDecoderState.EntityStart: {
                if (input.charCodeAt(offset) === CharCodes.NUM) {
                    this.state = EntityDecoderState.NumericStart;
                    this.consumed += 1;
                    return this.stateNumericStart(input, offset + 1);
                }
                this.state = EntityDecoderState.NamedEntity;
                return this.stateNamedEntity(input, offset);
            }

            case EntityDecoderState.NumericStart: {
                return this.stateNumericStart(input, offset);
            }

            case EntityDecoderState.NumericDecimal: {
                return this.stateNumericDecimal(input, offset);
            }

            case EntityDecoderState.NumericHex: {
                return this.stateNumericHex(input, offset);
            }

            default: {
                // NamedEntity — the only remaining state.
                return this.stateNamedEntity(input, offset);
            }
        }
    }

    /**
     * Switches between the numeric decimal and hexadecimal states.
     *
     * Equivalent to the `Numeric character reference state` in the HTML spec.
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    // eslint-disable-next-line unicorn/consistent-class-member-order
    private stateNumericStart(input: string, offset: number): number {
        if (offset >= input.length) {
            return -1;
        }

        if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
            this.state = EntityDecoderState.NumericHex;
            this.consumed += 1;
            return this.stateNumericHex(input, offset + 1);
        }

        this.state = EntityDecoderState.NumericDecimal;
        return this.stateNumericDecimal(input, offset);
    }

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
    private stateNumericHex(input: string, offset: number): number {
        const inputLength = input.length;
        // Local accumulators; flushed before any exit (see stateNamedEntity).
        let { result } = this;
        let { consumed } = this;
        while (offset < inputLength) {
            const char = input.charCodeAt(offset);
            if (isNumber(char) || isHexadecimalCharacter(char)) {
                // Convert hex digit to value (0-15); 'a'/'A' -> 10.
                const digit =
                    char <= CharCodes.NINE
                        ? char - CharCodes.ZERO
                        : (char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10;
                result = result * 16 + digit;
                consumed += 1;
                offset += 1;
            } else {
                this.result = result;
                this.consumed = consumed;
                return this.emitNumericEntity(char, 3);
            }
        }
        this.result = result;
        this.consumed = consumed;
        return -1; // Incomplete entity
    }

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
    private stateNumericDecimal(input: string, offset: number): number {
        const inputLength = input.length;
        // Local accumulators; flushed before any exit (see stateNamedEntity).
        let { result } = this;
        let { consumed } = this;
        while (offset < inputLength) {
            const digit = input.charCodeAt(offset) - CharCodes.ZERO;
            if (digit >>> 0 > 9) {
                this.result = result;
                this.consumed = consumed;
                return this.emitNumericEntity(digit + CharCodes.ZERO, 2);
            }
            result = result * 10 + digit;
            consumed += 1;
            offset += 1;
        }
        this.result = result;
        this.consumed = consumed;
        return -1; // Incomplete entity
    }

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
    private emitNumericEntity(lastCp: number, expectedLength: number): number {
        // Ensure we consumed at least one digit.
        if (this.consumed <= expectedLength) {
            this.errors?.absenceOfDigitsInNumericCharacterReference(
                this.consumed,
            );
            return 0;
        }

        // Figure out if this is a legit end of the entity
        if (lastCp === CharCodes.SEMI) {
            this.consumed += 1;
        } else if (this.decodeMode === DecodingMode.Strict) {
            return 0;
        }

        this.emitCodePoint(
            (this.decodeTree === xmlDecodeTree
                ? replaceCodePointXML
                : replaceCodePoint)(this.result),
            this.consumed,
        );

        if (this.errors) {
            if (lastCp !== CharCodes.SEMI) {
                this.errors.missingSemicolonAfterCharacterReference();
            }

            this.errors.validateNumericCharacterReference(this.result);
        }

        return this.consumed;
    }

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
    private flushAndEmitLegacyOrReject(
        consumed: number,
        excess: number,
        char: number,
        valueLength: number,
    ): number {
        this.consumed = consumed;
        this.excess = excess;
        return this.result === 0 ||
            (this.decodeMode === DecodingMode.Attribute &&
                (valueLength === 0 ||
                    excess > 1 ||
                    isEntityInAttributeInvalidEnd(char)))
            ? 0
            : this.emitNotTerminatedNamedEntity();
    }

    /**
     * Parses a named entity.
     *
     * Equivalent to the `Named character reference state` in the HTML spec.
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    private stateNamedEntity(input: string, offset: number): number {
        const { decodeTree } = this;
        const inputLength = input.length;
        const isStrict = this.decodeMode === DecodingMode.Strict;

        /*
         * Local copies of the resumable walk state avoid per-character
         * field writes. They are flushed back to the fields
         * on every exit (chunk end, and before any emit helper that reads
         * them). `this.result` is only written at the (rare) record points,
         * so it stays a direct field write.
         *
         * Legacy-match recording happens in two idempotent places: at the
         * loop top when sitting on a value node, and in the chunk-end
         * epilogue (so `end()` sees matches that land exactly on a chunk
         * boundary). Recording applies `consumed += excess - 1; excess = 1`,
         * which is a no-op when repeated — the loop-top invariant is
         * `excess` = unrecorded consumed characters + 1.
         */
        let { treeIndex } = this;
        let { excess } = this;
        let { consumed } = this;
        let current = decodeTree[treeIndex];

        while (offset < inputLength) {
            /*
             * Descend through value-less jump-table nodes (including the
             * single-branch encoding) inline, mirroring `decodeWithTrie`:
             * this avoids a `determineBranch` call per level for the
             * dominant node shape — including the root on the first write.
             */
            while (
                (current &
                    (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) ===
                    0 &&
                (current & BinTrieFlags.JUMP_TABLE) !== 0
            ) {
                const char = input.charCodeAt(offset);
                const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
                const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
                if (branchCount === 0) {
                    // Single branch encoded inline in the jump offset bits.
                    if (char !== jumpOffset) {
                        return this.flushAndEmitLegacyOrReject(
                            consumed,
                            excess,
                            char,
                            0,
                        );
                    }
                    treeIndex += 1;
                } else {
                    const slot = char - jumpOffset;
                    if (slot >>> 0 >= branchCount) {
                        return this.flushAndEmitLegacyOrReject(
                            consumed,
                            excess,
                            char,
                            0,
                        );
                    }
                    const stored = decodeTree[treeIndex + 1 + slot];
                    if (stored === 0) {
                        return this.flushAndEmitLegacyOrReject(
                            consumed,
                            excess,
                            char,
                            0,
                        );
                    }
                    // End-relative: branch data ends at treeIndex+1+branchCount.
                    treeIndex = (treeIndex + branchCount + stored) & 0xff_ff;
                }
                current = decodeTree[treeIndex];
                offset += 1;
                excess += 1;
                /*
                 * `charCodeAt` past the end returns NaN, which would alias
                 * to slot 0 after `>>> 0` — bail out explicitly.
                 */
                // eslint-disable-next-line unicorn/no-break-in-nested-loop
                if (offset >= inputLength) break;
            }
            if (offset >= inputLength) break;

            // Handle compact runs (resumable across chunks).
            if (
                (current &
                    (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) ===
                BinTrieFlags.FLAG13
            ) {
                const runLength =
                    (current & BinTrieFlags.BRANCH_LENGTH) >> 7; /* 3..63 */
                let { runConsumed } = this;

                // If we are starting a run, check the first char.
                if (runConsumed === 0) {
                    const char = input.charCodeAt(offset);
                    if (char !== (current & BinTrieFlags.JUMP_TABLE)) {
                        return this.flushAndEmitLegacyOrReject(
                            consumed,
                            excess,
                            char,
                            0,
                        );
                    }
                    offset += 1;
                    excess += 1;
                    runConsumed = 1;
                }

                // Check remaining characters in the run (packed two per uint16 word).
                while (runConsumed < runLength) {
                    if (offset >= inputLength) {
                        this.treeIndex = treeIndex;
                        this.excess = excess;
                        this.consumed = consumed;
                        this.runConsumed = runConsumed;
                        return -1;
                    }

                    const charIndexInPacked = runConsumed - 1;
                    const packedWord =
                        decodeTree[treeIndex + 1 + (charIndexInPacked >> 1)];
                    const expectedChar =
                        (packedWord >> ((charIndexInPacked & 1) << 3)) & 0xff;

                    const char = input.charCodeAt(offset);
                    if (char !== expectedChar) {
                        this.runConsumed = 0;
                        return this.flushAndEmitLegacyOrReject(
                            consumed,
                            excess,
                            char,
                            0,
                        );
                    }
                    offset += 1;
                    excess += 1;
                    runConsumed += 1;
                }

                this.runConsumed = 0;
                treeIndex += 1 + (runLength >> 1);
                current = decodeTree[treeIndex];
                // Loop top handles the landed-on node (record/emit/branch).
                continue;
            }

            // Header plus out-of-line value words; 0 means no value.
            const valueLength = current >>> 14;
            const char = input.charCodeAt(offset);

            if (valueLength !== 0) {
                // Record a legacy match (FLAG13 clear = semicolon optional).
                if (!isStrict && (current & BinTrieFlags.FLAG13) === 0) {
                    this.result = treeIndex;
                    consumed += excess - 1;
                    excess = 1;
                }

                /*
                 * Implicit semicolon handling: emit immediately. Covers both
                 * strict (FLAG13 set) and legacy entities — neither stores
                 * an explicit `;` branch in the trie.
                 */
                if (char === CharCodes.SEMI) {
                    return this.emitNamedEntityData(
                        treeIndex,
                        valueLength,
                        consumed + excess,
                    );
                }

                /*
                 * `valueLength === 1` packs the codepoint into the header
                 * word's low 13 bits, where branch metadata also lives. Skip
                 * the branch lookup on leaves so those value bits aren't
                 * reinterpreted as branch offsets.
                 */
                if (valueLength === 1) {
                    return this.flushAndEmitLegacyOrReject(
                        consumed,
                        excess,
                        char,
                        valueLength,
                    );
                }
            }

            // Value-bearing or dictionary node: dispatch through determineBranch.
            const next = determineBranch(
                decodeTree,
                current,
                treeIndex + (valueLength || 1),
                char,
            );

            if (next < 0) {
                return this.flushAndEmitLegacyOrReject(
                    consumed,
                    excess,
                    char,
                    valueLength,
                );
            }

            treeIndex = next;
            current = decodeTree[treeIndex];
            offset += 1;
            excess += 1;
        }

        /*
         * Chunk exhausted. Record a legacy match we may be sitting on, so a
         * subsequent `end()` emits it, then persist the walk state.
         */
        if (
            !isStrict &&
            current >>> 14 !== 0 &&
            (current & BinTrieFlags.FLAG13) === 0
        ) {
            this.result = treeIndex;
            consumed += excess - 1;
            excess = 1;
        }
        this.treeIndex = treeIndex;
        this.excess = excess;
        this.consumed = consumed;
        return -1;
    }

    /**
     * Emit a named entity that was not terminated with a semicolon.
     * @returns The number of characters consumed.
     */
    private emitNotTerminatedNamedEntity(): number {
        const { result, decodeTree } = this;

        const valueLength = decodeTree[result] >>> 14;

        this.emitNamedEntityData(result, valueLength, this.consumed);
        this.errors?.missingSemicolonAfterCharacterReference();

        return this.consumed;
    }

    /**
     * Emit a named entity.
     * @param result The index of the entity in the decode tree.
     * @param valueLength Encoded value length (header plus any value words).
     * @param consumed The number of characters consumed.
     * @returns The number of characters consumed.
     */
    private emitNamedEntityData(
        result: number,
        valueLength: number,
        consumed: number,
    ): number {
        const { decodeTree } = this;

        this.emitCodePoint(
            valueLength === 1
                ? decodeTree[result] & BinTrieFlags.VALUE_MASK
                : decodeTree[result + 1],
            consumed,
        );
        if (valueLength === 3) {
            // Emit the second UTF-16 code unit.
            this.emitCodePoint(decodeTree[result + 2], consumed);
        }

        return consumed;
    }

    /**
     * Signal to the parser that the end of the input was reached.
     *
     * Remaining data will be emitted and relevant errors will be produced.
     * @returns The number of characters consumed.
     */
    end(): number {
        switch (this.state) {
            case EntityDecoderState.NamedEntity: {
                // Emit a named entity if we have one.
                return this.result !== 0 &&
                    (this.decodeMode !== DecodingMode.Attribute ||
                        this.result === this.treeIndex)
                    ? this.emitNotTerminatedNamedEntity()
                    : 0;
            }
            // Otherwise, emit a numeric entity if we have one.
            case EntityDecoderState.NumericDecimal: {
                return this.emitNumericEntity(0, 2);
            }
            case EntityDecoderState.NumericHex: {
                return this.emitNumericEntity(0, 3);
            }
            case EntityDecoderState.NumericStart: {
                this.errors?.absenceOfDigitsInNumericCharacterReference(
                    this.consumed,
                );
                return 0;
            }
            default: {
                // EntityStart or unknown — return 0.
                return 0;
            }
        }
    }
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
export function determineBranch(
    decodeTree: Uint16Array,
    current: number,
    nodeIndex: number,
    char: number,
): number {
    const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
    const jumpOffset = current & BinTrieFlags.JUMP_TABLE;

    // Case 1: Single branch or jump table (jumpOffset encodes the first/only char code).
    if (jumpOffset) {
        if (branchCount === 0) {
            // Single branch encoded inline in the jump offset bits.
            return char === jumpOffset ? nodeIndex : -1;
        }

        /*
         * Jump table: branchCount consecutive slots starting at jumpOffset.
         * Unsigned comparison handles both < 0 and >= branchCount in one check.
         */
        const slot = char - jumpOffset;
        if (slot >>> 0 >= branchCount) return -1;
        const stored = decodeTree[nodeIndex + slot];
        /*
         * 0 = empty slot (no branch); otherwise the child's offset from the
         * end of the branch array, +1 (end-relative pointers compress
         * better). `& 0xff_ff` mirrors the encoder's uint16 wrap for
         * backreferences to already-encoded nodes.
         */
        return stored === 0
            ? -1
            : (nodeIndex + branchCount + stored - 1) & 0xff_ff;
    }

    /*
     * Case 2: Packed dictionary. Linear scan — over 90% of dict nodes have
     * <= 4 branches in the HTML trie, where the constant-factor savings
     * dominate over binary search's asymptotic edge.
     */
    if (branchCount === 0) return -1;
    const packedKeySlots = (branchCount + 1) >> 1;
    const branchEnd = nodeIndex + packedKeySlots + branchCount;
    for (let index = 0; index < branchCount; index++) {
        const packed = decodeTree[nodeIndex + (index >> 1)];
        const key = (packed >> ((index & 1) << 3)) & 0xff;
        if (key === char) {
            const pointerIndex = nodeIndex + packedKeySlots + index;
            // Pointers are relative to the end of the branch data.
            return (branchEnd + decodeTree[pointerIndex]) & 0xff_ff;
        }
        // Keys are sorted; if we've passed `char`, no match is possible.
        if (key > char) return -1;
    }
    return -1;
}

/**
 * Read the decoded value from a trie node.
 * @param decodeTree The trie.
 * @param nodeIndex The index of the node.
 * @param valueLength The length of the value (1, 2, or 3).
 * @returns The decoded string.
 */
function readTrieValue(
    decodeTree: Uint16Array,
    nodeIndex: number,
    valueLength: number,
): string {
    if (valueLength === 1) {
        return String.fromCharCode(
            decodeTree[nodeIndex] & BinTrieFlags.VALUE_MASK,
        );
    }
    if (valueLength === 2) {
        return String.fromCharCode(decodeTree[nodeIndex + 1]);
    }
    return String.fromCharCode(
        decodeTree[nodeIndex + 1],
        decodeTree[nodeIndex + 2],
    );
}

/**
 * Parse a numeric entity (`&#DDD;` or `&#xHHH;`).
 *
 * Encodes the result as `(consumed << CONSUMED_SHIFT) | codepoint` (see
 * the packing comment at the top of the file; overlong entities spill
 * their length into `longNumericConsumed`). Returns 0 when no digits were
 * found.
 *
 * This is the sync counterpart of the streaming
 * `EntityDecoder#stateNumericDecimal` / `#stateNumericHex`. Digit parsing
 * matches those methods; only this packed result needs a value clamp.
 * @param input       The input string.
 * @param numberStart Index of the `#` character.
 * @param inputLength Cached `input.length`.
 */
function parseNumericEntity(
    input: string,
    numberStart: number,
    inputLength: number,
): number {
    let offset = numberStart + 1; // Skip "#"
    let cp = 0;
    let digitStart = offset;

    /*
     * Separate decimal and hexadecimal loops: each multiplies by a constant
     * and runs a single digit test, instead of a per-character base check.
     */
    if (
        offset < inputLength &&
        (input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X
    ) {
        offset += 1;
        digitStart = offset;
        while (offset < inputLength) {
            const char = input.charCodeAt(offset);
            if (isNumber(char)) {
                cp = cp * 16 + (char - CharCodes.ZERO);
            } else if (isHexadecimalCharacter(char)) {
                cp = cp * 16 + ((char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10);
            } else {
                break;
            }
            offset += 1;
        }
    } else {
        while (offset < inputLength) {
            const digit = input.charCodeAt(offset) - CharCodes.ZERO;
            if (digit >>> 0 > 9) break;
            cp = cp * 10 + digit;
            offset += 1;
        }
    }

    if (offset === digitStart) return 0;

    // Include the semicolon in consumed when present.
    if (offset < inputLength && input.charCodeAt(offset) === CharCodes.SEMI) {
        offset += 1;
    }

    /*
     * Clamp out-of-range values to 0x110000 so they fit the 21-bit field
     * and decode to U+FFFD. Lengths at or above CONSUMED_OVERFLOW use the
     * side channel described with the packing constants.
     */
    if (cp > 0x10_ff_ff) cp = 0x11_00_00;
    let consumed = offset - numberStart;
    if (consumed >= CONSUMED_OVERFLOW) {
        // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- deliberate side channel, see `longNumericConsumed`
        longNumericConsumed = consumed;
        consumed = CONSUMED_OVERFLOW;
    }
    return (consumed << CONSUMED_SHIFT) | cp;
}

/**
 * Decode all entities in `input` using the HTML trie.
 *
 * Hard-wired to `htmlDecodeTree`: the inline root navigation below assumes
 * the HTML root's jump-table shape, so this must not be generalized to
 * other tries (the XML trie's dictionary root would silently match no
 * entities — `decodeXML` has its own hand-coded fast path instead).
 * @param input      The string to decode.
 * @param isStrict Only match semicolon-terminated entities.
 * @param isAttribute Whether to apply attribute-specific parsing rules (disallowing certain non-semicolon terminators).
 * @returns The decoded string.
 */
function decodeWithTrie(
    input: string,
    isStrict: boolean,
    isAttribute: boolean,
): string {
    const decodeTree = htmlDecodeTree;
    // Fast path: no entities at all — return input without any allocation.
    let offset = input.indexOf("&");
    if (offset < 0) return input;

    const inputLength = input.length;
    /*
     * `chunkStart` marks the start of the next pending slice. Rejected
     * entities don't advance it, so consecutive rejections are stitched
     * into a single `slice` once a real match (or end of input) is hit.
     */
    let chunkStart = 0;
    let result = "";

    /*
     * Root navigation fields, hoisted out of the per-entity loop. The HTML
     * root is a multi-branch jump-table covering [A-Za-z]; see the inline
     * first-iteration comment below.
     */
    const root = decodeTree[0];
    const rootJumpOffset = root & BinTrieFlags.JUMP_TABLE;
    const rootBranchCount = (root & BinTrieFlags.BRANCH_LENGTH) >> 7;

    do {
        const entityStart = offset + 1;

        // Quick check: entity names must start with [A-Za-z], numeric with #.
        const firstChar = input.charCodeAt(entityStart);
        let consumed: number;
        let value: string;
        if (firstChar === CharCodes.NUM) {
            const packed = parseNumericEntity(input, entityStart, inputLength);
            consumed = unpackConsumed(packed);
            // In strict mode, require semicolon termination.
            if (
                isStrict &&
                consumed > 0 &&
                input.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI
            ) {
                consumed = 0;
            }
            value =
                consumed === 0
                    ? ""
                    : codePointToString(packed & CODE_POINT_MASK);
        } else if (isAlpha(firstChar)) {
            consumed = 0;
            value = "";

            /*
             * The generator guarantees a jump-table root. Consume the first
             * character directly, then walk from its child.
             */
            const rootSlotIndex = firstChar - rootJumpOffset;
            let nodeIndex: number;
            if (rootSlotIndex >>> 0 < rootBranchCount) {
                const stored = decodeTree[1 + rootSlotIndex];
                nodeIndex =
                    stored === 0 ? -1 : (rootBranchCount + stored) & 0xff_ff;
            } else {
                nodeIndex = -1;
            }

            /*
             * Best legacy (no-semicolon) match so far, as trie coordinates.
             * Deferring `readTrieValue` to the end avoids allocating a
             * string for matches that longer matches supersede.
             */
            let bestNodeIndex = 0;
            let bestValueLength = 0;
            let current = nodeIndex < 0 ? 0 : decodeTree[nodeIndex];
            let index = entityStart + 1;

            /*
             * Walk the trie from the root child. The `trie` label lets the
             * inner descent and compact-run loops abandon the entity (and
             * fall through to the legacy/reject handling) directly.
             */
            trie: while (index < inputLength) {
                /*
                 * Inline value-less jump tables and single branches. A miss
                 * falls through to the recorded legacy match or rejection.
                 */
                while (
                    // Value-less, non-run node with a nonzero jump offset.
                    (current &
                        (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) ===
                        0 &&
                    (current & BinTrieFlags.JUMP_TABLE) !== 0
                ) {
                    const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
                    const branchCount =
                        (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
                    if (branchCount === 0) {
                        // Single branch encoded inline in the jump offset bits.
                        if (input.charCodeAt(index) !== jumpOffset) break trie;
                        nodeIndex += 1;
                    } else {
                        const slot = input.charCodeAt(index) - jumpOffset;
                        if (slot >>> 0 >= branchCount) break trie;
                        const stored = decodeTree[nodeIndex + 1 + slot];
                        if (stored === 0) break trie;
                        // End-relative: branch data ends at nodeIndex+1+branchCount.
                        nodeIndex =
                            (nodeIndex + branchCount + stored) & 0xff_ff;
                    }
                    current = decodeTree[nodeIndex];
                    index += 1;
                    /*
                     * `charCodeAt` past the end returns NaN, which would
                     * alias to slot 0 after `>>> 0` — bail out explicitly.
                     */
                    if (index >= inputLength) break trie;
                }

                // FLAG13 without a value marks a compact run.
                if (
                    (current &
                        (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) ===
                    BinTrieFlags.FLAG13
                ) {
                    const runLength =
                        (current & BinTrieFlags.BRANCH_LENGTH) >> 7;

                    // Check first char (stored in JUMP_TABLE bits).
                    if (
                        input.charCodeAt(index) !==
                        (current & BinTrieFlags.JUMP_TABLE)
                    ) {
                        // eslint-disable-next-line unicorn/no-break-in-nested-loop
                        break;
                    }
                    index += 1;

                    // Check remaining characters (packed two per uint16 word).
                    const remaining = runLength - 1;
                    let wordIndex = nodeIndex + 1;
                    let charIndexInPacked = 0;

                    /*
                     * Process pairs: read one packed word, compare low byte then high byte.
                     * No explicit bounds check needed — charCodeAt returns NaN for OOB,
                     * which never equals an integer, so the mismatch break fires naturally.
                     */
                    for (
                        ;
                        charIndexInPacked + 1 < remaining;
                        charIndexInPacked += 2
                    ) {
                        const packed = decodeTree[wordIndex];
                        if (input.charCodeAt(index) !== (packed & 0xff))
                            break trie;
                        index += 1;
                        if (input.charCodeAt(index) !== ((packed >> 8) & 0xff))
                            break trie;
                        index += 1;
                        wordIndex += 1;
                    }
                    // Handle odd trailing char.
                    if (charIndexInPacked < remaining) {
                        if (
                            input.charCodeAt(index) !==
                            (decodeTree[wordIndex] & 0xff)
                        )
                            // eslint-disable-next-line unicorn/no-break-in-nested-loop
                            break;
                        index += 1;
                    }

                    nodeIndex += 1 + (runLength >> 1);
                    current = decodeTree[nodeIndex];
                    // eslint-disable-next-line unicorn/no-break-in-nested-loop
                    continue;
                }

                // Header plus out-of-line value words; 0 means no value.
                const valueLength = current >>> 14;
                const char = input.charCodeAt(index);

                /*
                 * Check current node for a value before navigating.
                 * This handles both: (a) values reached via compact runs on the
                 * previous iteration, and (b) values at regular branch targets.
                 */
                if (valueLength !== 0) {
                    // If char is `;`, emit immediately.
                    if (char === CharCodes.SEMI) {
                        consumed = index - entityStart + 1;
                        // Inline leaves carry the value in the low 13 bits.
                        value =
                            valueLength === 1
                                ? String.fromCharCode(
                                      current & BinTrieFlags.VALUE_MASK,
                                  )
                                : readTrieValue(
                                      decodeTree,
                                      nodeIndex,
                                      valueLength,
                                  );
                        // eslint-disable-next-line unicorn/no-break-in-nested-loop
                        break;
                    }

                    // Record non-terminated (legacy) match (FLAG13 clear = semicolon optional).
                    if (!isStrict && (current & BinTrieFlags.FLAG13) === 0) {
                        consumed = index - entityStart;
                        bestNodeIndex = nodeIndex;
                        bestValueLength = valueLength;
                    }

                    /*
                     * A valueLength of 1 means the value is packed inline in the header
                     * word — these are always leaf nodes with no branches, so we can
                     * stop walking the trie.
                     */
                    // eslint-disable-next-line unicorn/no-break-in-nested-loop
                    if (valueLength === 1) break;
                }

                // Navigate to the next node (valueLength || 1: skip past value words, minimum 1 for header).
                const next = determineBranch(
                    decodeTree,
                    current,
                    nodeIndex + (valueLength || 1),
                    char,
                );
                // eslint-disable-next-line unicorn/no-break-in-nested-loop
                if (next < 0) break;

                nodeIndex = next;
                current = decodeTree[nodeIndex];
                index += 1;
            }

            /*
             * Post-loop: if the semicolon path didn't set value,
             * check for a final legacy match. The last navigation may
             * have landed on a legacy node whose value hasn't been
             * recorded yet (loop exited before the top-of-loop check
             * could run).
             */
            if (value === "") {
                const finalVL = current >>> 14;
                if (
                    finalVL !== 0 &&
                    !isStrict &&
                    (current & BinTrieFlags.FLAG13) === 0
                ) {
                    consumed = index - entityStart;
                    bestNodeIndex = nodeIndex;
                    bestValueLength = finalVL;
                }
                if (consumed > 0) {
                    value = readTrieValue(
                        decodeTree,
                        bestNodeIndex,
                        bestValueLength,
                    );
                }
            }
        } else {
            consumed = 0;
            value = "";
        }

        /*
         * The attribute end-char rule (HTML spec §13.2.5.73) only applies to
         * unterminated *named* references.  Semicolon-terminated entities and
         * numeric entities are always accepted, matching EntityDecoder behavior.
         *
         * When `attribute` is false (the common case), short-circuit skips all
         * the unterminated-named checks entirely.
         */
        if (
            consumed === 0 ||
            (isAttribute &&
                firstChar !== CharCodes.NUM &&
                input.charCodeAt(entityStart + consumed - 1) !==
                    CharCodes.SEMI &&
                entityStart + consumed < inputLength &&
                isEntityInAttributeInvalidEnd(
                    input.charCodeAt(entityStart + consumed),
                ))
        ) {
            // Rejected: leave `&` in the pending chunk, scan past it.
            offset = entityStart;
        } else {
            if (chunkStart < offset) {
                result += input.slice(chunkStart, offset);
            }
            result += value;
            offset = chunkStart = entityStart + consumed;
        }

        /*
         * Adjacent entities (`&x;&y;`) are common in entity-dense input;
         * checking the single character at `offset` first skips the
         * `indexOf` call (and its per-call overhead) for that case.
         */
        if (input.charCodeAt(offset) !== CharCodes.AMP) {
            offset = input.indexOf("&", offset);
        }
    } while (offset >= 0);

    return result + input.slice(chunkStart);
}

/**
 * Decodes an HTML string.
 * @param htmlString The string to decode.
 * @param mode The decoding mode.
 * @returns The decoded string.
 */
export function decodeHTML(
    htmlString: string,
    mode: DecodingMode = DecodingMode.Legacy,
): string {
    return decodeWithTrie(
        htmlString,
        mode === DecodingMode.Strict,
        mode === DecodingMode.Attribute,
    );
}

/**
 * Decodes an HTML string in an attribute.
 * @param htmlAttribute The string to decode.
 * @returns The decoded string.
 */
export function decodeHTMLAttribute(htmlAttribute: string): string {
    return decodeWithTrie(htmlAttribute, false, true);
}

/**
 * Decodes an HTML string, requiring all entities to be terminated by a semicolon.
 * @param htmlString The string to decode.
 * @returns The decoded string.
 */
export function decodeHTMLStrict(htmlString: string): string {
    return decodeWithTrie(htmlString, true, false);
}

/**
 * Decodes an XML string, requiring all entities to be terminated by a semicolon.
 *
 * Uses a hand-coded fast path for the 5 XML named entities (amp, lt, gt,
 * quot, apos) plus numeric entities, bypassing the trie entirely.
 * @param xmlString The string to decode.
 * @returns The decoded string.
 */
export function decodeXML(xmlString: string): string {
    let offset = xmlString.indexOf("&");
    if (offset < 0) return xmlString;

    let lastIndex = 0;
    let result = "";

    do {
        const start = offset + 1;
        let consumed = 0;
        let value = "";

        const c1 = xmlString.charCodeAt(start);

        if (c1 === CharCodes.NUM) {
            const packed = parseNumericEntity(
                xmlString,
                start,
                xmlString.length,
            );
            consumed = unpackConsumed(packed);
            // XML is always strict — require semicolon.
            if (
                consumed === 0 ||
                xmlString.charCodeAt(start + consumed - 1) !== CharCodes.SEMI
            ) {
                consumed = 0;
            } else {
                const codePoint = packed & CODE_POINT_MASK;
                // Nonzero BMP values below the surrogate range need no replacement.
                value =
                    (codePoint - 1) >>> 0 < 0xd7_ff
                        ? String.fromCharCode(codePoint)
                        : String.fromCodePoint(replaceCodePointXML(codePoint));
            }
        } else {
            /* eslint-disable unicorn/no-break-in-nested-loop -- Keep XML name dispatch inline with the decode loop. */
            switch (c1) {
                // &lt; / &gt;
                case 0x6c:
                case 0x67: {
                    if (
                        xmlString.charCodeAt(start + 1) === 0x74 &&
                        xmlString.charCodeAt(start + 2) === CharCodes.SEMI
                    ) {
                        consumed = 3;
                        value = c1 === 0x6c ? "<" : ">";
                    }
                    break;
                }
                // &amp; / &apos;
                case 0x61: {
                    const c2 = xmlString.charCodeAt(start + 1);
                    if (
                        c2 === 0x6d &&
                        xmlString.charCodeAt(start + 2) === 0x70 &&
                        xmlString.charCodeAt(start + 3) === CharCodes.SEMI
                    ) {
                        consumed = 4;
                        value = "&";
                    } else if (
                        c2 === 0x70 &&
                        xmlString.charCodeAt(start + 2) === 0x6f &&
                        xmlString.charCodeAt(start + 3) === 0x73 &&
                        xmlString.charCodeAt(start + 4) === CharCodes.SEMI
                    ) {
                        consumed = 5;
                        value = "'";
                    }
                    break;
                }
                // &quot;
                case 0x71: {
                    if (
                        xmlString.charCodeAt(start + 1) === 0x75 &&
                        xmlString.charCodeAt(start + 2) === 0x6f &&
                        xmlString.charCodeAt(start + 3) === 0x74 &&
                        xmlString.charCodeAt(start + 4) === CharCodes.SEMI
                    ) {
                        consumed = 5;
                        value = '"';
                    }
                    break;
                }
            }
            /* eslint-enable unicorn/no-break-in-nested-loop */
        }

        if (consumed > 0) {
            if (lastIndex < offset)
                result += xmlString.slice(lastIndex, offset);
            result += value;
            offset = lastIndex = start + consumed;
        } else {
            offset = start;
        }
        /*
         * Adjacent entities (`&x;&y;`) are common in entity-dense input;
         * checking the single character at `lastIndex` first skips the
         * `indexOf` call (and its per-call overhead) for that case.
         */
        offset =
            xmlString.charCodeAt(offset) === CharCodes.AMP
                ? offset
                : xmlString.indexOf("&", offset);
    } while (offset >= 0);

    return result + xmlString.slice(lastIndex);
}

export {
    replaceCodePoint,
    replaceCodePointXML,
} from "./decode-codepoint.js";
// Re-export for use by eg. htmlparser2
export { htmlDecodeTree } from "./generated/decode-data-html.js";
export { xmlDecodeTree } from "./generated/decode-data-xml.js";
