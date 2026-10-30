/*
 * Inverse of the encoder's SAFE alphabet (0x21..0x7E minus 0x22, 0x24, 0x5C),
 * precomputed once at module load. Entries for excluded chars stay 0 but
 * are never read.
 */
const BASE91_INVERSE = /* #__PURE__ */ (() => {
    const table = new Uint8Array(127);
    let code = 0;
    for (let char = 0x21; char <= 0x7e; char++) {
        if (char !== 0x22 && char !== 0x24 && char !== 0x5c) {
            table[char] = code++;
        }
    }
    return table;
})();

/**
 * Decode a dictionary-encoded trie string back into its Uint16Array.
 *
 * Stream layout (consumed in this order):
 *   1. dict1 atoms — `dict1AtomCount` uint16 values, delta+RLE encoded.
 *   2. dict2 atoms — `atomCount - dict1AtomCount` values, delta+RLE.
 *   3. dict2 ngrams — `ngramCount - (dictSize - dict1AtomCount)` entries,
 *      each a pair of slot codes that resolve to earlier slots.
 *   4. dict1 ngrams — `dictSize - dict1AtomCount` entries, same shape.
 *   5. data — slot codes, each expanding to one or more uint16 values.
 *
 * Codes use a 91-char base (printable ASCII minus `"`, `$`, `\`):
 *   - char1 < dictSize  → 1-char code, slot = char1
 *   - char1 ≥ dictSize  → 2-char code, slot = dictSize + (char1 - dictSize)*91 + char2
 *
 * Slot index → token kind:
 *   [0, A)                  dict1 atoms     (1-char codes)
 *   [A, dictSize)           dict1 ngrams    (1-char codes)
 *   [dictSize, dictSize+D)  dict2 atoms     (2-char codes)
 *   [dictSize+D, end)       dict2 ngrams    (2-char codes)
 *
 * Both atom dicts decode before any ngram, and dict2 ngrams decode before
 * dict1 ngrams. So every ngram entry references slots whose contents are
 * already filled — no forward references to handle.
 *
 * This runs on library import. Flat typed arrays store each slot as either
 * a plain value (`single`, covering every atom) or a range in a shared
 * `pool` (ngrams).
 * @param input Packed trie string.
 * @param resultLength Expected number of uint16 values in the output.
 * @param atomCount Total number of distinct uint16 values in the trie.
 * @param dict1AtomCount Atoms in the 1-char range (`A` above).
 * @param ngramCount Total number of ngram entries (dict1 + dict2).
 * @param dictSize Number of 1-char code slots; the rest of `BASE - dictSize`
 *   first-byte values are 2-char codes.
 */
export function decodeTrieDict(
    input: string,
    resultLength: number,
    atomCount: number,
    dict1AtomCount: number,
    ngramCount: number,
    dictSize: number,
): Uint16Array {
    const base = 91;
    const inputLength = input.length;
    // For 2-char codes, slot = char1 * base - twoCharBias + char2.
    const twoCharBias = dictSize * (base - 1);

    let pos = 0;

    /** Read one slot code at `pos` and return its slot index, advancing pos. */
    const readSlotCode = (): number => {
        const c1 = BASE91_INVERSE[input.charCodeAt(pos++)];
        return c1 < dictSize
            ? c1
            : c1 * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
    };

    const dict2AtomCount = atomCount - dict1AtomCount;
    const slotCount = atomCount + ngramCount;

    /*
     * Per-slot contents: atoms (always a single value) live directly in
     * `single`; ngram slots hold -1 there and expand to
     * `pool[start[slot] .. start[slot] + length[slot])`.
     */
    const single = new Int32Array(slotCount);
    single.fill(-1, dict1AtomCount, dictSize);
    single.fill(-1, dictSize + dict2AtomCount, slotCount);
    const start = new Int32Array(slotCount);
    const length = new Int32Array(slotCount);

    /**
     * Decode `count` ascending uint16 values from a delta+RLE stream into
     * `single[off..off+count)`.
     *
     *   code < 89   → delta = code
     *   code == 89  → run-length: next char encodes runLength-2; emit `runLength` consecutive +1 values
     *   code == 90, next < 90  → escape: delta = 89 + next * BASE + after-next
     *   code == 90, next == 90 → double-escape: extra char for very large deltas
     * @param count
     * @param off
     */
    function decodeDelta(count: number, off: number): void {
        let previous = 0;
        let slot = off;
        const end = off + count;
        while (slot < end) {
            const code = BASE91_INVERSE[input.charCodeAt(pos++)];
            if (code < 89) {
                previous += code;
                single[slot++] = previous;
            } else if (code === 89) {
                let runLength = BASE91_INVERSE[input.charCodeAt(pos++)] + 2;
                while (runLength--) single[slot++] = ++previous;
            } else {
                const next = BASE91_INVERSE[input.charCodeAt(pos++)];
                previous +=
                    89 +
                    // eslint-disable-next-line unicorn/prefer-minimal-ternary -- branches read a different number of side-effecting input bytes
                    (next < 90
                        ? next * base + BASE91_INVERSE[input.charCodeAt(pos++)]
                        : BASE91_INVERSE[input.charCodeAt(pos++)] * 8281 +
                          BASE91_INVERSE[input.charCodeAt(pos++)] * base +
                          BASE91_INVERSE[input.charCodeAt(pos++)]);
                single[slot++] = previous;
            }
        }
    }

    // Streams 1 & 2: atoms decoded into their slot ranges.
    decodeDelta(dict1AtomCount, 0);
    decodeDelta(dict2AtomCount, dictSize);

    /*
     * Streams 3 & 4 are read in two passes: first collect every ngram's two
     * references and derive its expanded length (each ref resolves to an earlier
     * slot, so lengths are already known), which sizes the shared pool.
     * Pool ranges are handed out in decode order, so the second pass fills
     * the pool contiguously with a single write cursor.
     */
    const references = new Int32Array(ngramCount * 2);
    let poolSize = 0;
    let ngramIndex = 0;

    /**
     * Read `count` ngram entries (each = 2 slot-code references) for the slots
     * starting at `startSlot`, recording references and assigning pool ranges.
     * @param count
     * @param startSlot
     */
    function readNgramReferences(count: number, startSlot: number): void {
        for (let index = 0; index < count; index++) {
            const slot = startSlot + index;
            const a = readSlotCode();
            const b = readSlotCode();
            references[ngramIndex * 2] = a;
            references[ngramIndex * 2 + 1] = b;
            ngramIndex += 1;
            start[slot] = poolSize;
            const entryLength =
                (single[a] < 0 ? length[a] : 1) +
                (single[b] < 0 ? length[b] : 1);
            length[slot] = entryLength;
            poolSize += entryLength;
        }
    }
    readNgramReferences(
        ngramCount - dictSize + dict1AtomCount,
        dictSize + dict2AtomCount,
    );
    readNgramReferences(dictSize - dict1AtomCount, dict1AtomCount);

    // Second pass: concatenate each ngram's two halves into the pool.
    const pool = new Uint16Array(poolSize);
    let write = 0;
    for (let index = 0; index < ngramIndex; index++) {
        for (let half = 0; half < 2; half++) {
            const source = references[index * 2 + half];
            const value = single[source];
            if (value < 0) {
                let read = start[source];
                const readEnd = read + length[source];
                while (read < readEnd) pool[write++] = pool[read++];
            } else {
                pool[write++] = value;
            }
        }
    }

    // Stream 5: data. Each code expands to its slot's stored values.
    const out = new Uint16Array(resultLength);
    let outIndex = 0;
    while (pos < inputLength) {
        let slot = BASE91_INVERSE[input.charCodeAt(pos++)];
        if (slot >= dictSize) {
            slot =
                slot * base -
                twoCharBias +
                BASE91_INVERSE[input.charCodeAt(pos++)];
        }
        const value = single[slot];
        if (value < 0) {
            let read = start[slot];
            const readEnd = read + length[slot];
            while (read < readEnd) out[outIndex++] = pool[read++];
        } else {
            out[outIndex++] = value;
        }
    }
    return out;
}
