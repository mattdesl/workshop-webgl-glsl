/**
 * Bit flags & masks for the binary trie encoding used for entity decoding.
 *
 * The trie is a flat `Uint16Array`. Every node starts with one header word:
 *
 *   15..14 VALUE_LENGTH   Number of words the value occupies, +1.
 *                         0 = no value; 1 = value inline in bits 12..0;
 *                         2/3 = value in the 1/2 words after the header.
 *   13     FLAG13         If VALUE_LENGTH > 0: semicolon required ("strict"
 *                         entity; `;` is never stored as a branch).
 *                         If VALUE_LENGTH == 0: this node is a compact run.
 *   12..7  BRANCH_LENGTH  Number of branches (or run length for runs).
 *   6..0   JUMP_TABLE     Jump-table offset / single-branch char / first
 *                         run char (see below).
 *
 * Branch data follows the header and any value words. Its shape is selected
 * by (JUMP_TABLE, BRANCH_LENGTH) in the header:
 *
 *   Single branch  JUMP_TABLE = the only child's char, BRANCH_LENGTH = 0.
 *                  No branch words; the child node follows immediately.
 *   Jump table     JUMP_TABLE = first covered char (> 0), BRANCH_LENGTH =
 *                  table length. One word per covered char: 0 = no branch,
 *                  otherwise the child's offset from the END of the table,
 *                  +1 (so 0 stays the no-branch sentinel).
 *   Dictionary     JUMP_TABLE = 0, BRANCH_LENGTH = number of branches.
 *                  ceil(n/2) words of sorted keys packed two per word
 *                  (low byte first), then n pointer words storing the
 *                  child's offset from the END of the branch data.
 *   Compact run    VALUE_LENGTH = 0, FLAG13 set. BRANCH_LENGTH = run
 *                  length (3..63), JUMP_TABLE = first char; remaining run
 *                  chars packed two per word after the header. The target
 *                  node follows the packed words immediately.
 *
 * Pointers are end-relative (rather than relative to the pointer's own
 * position) because that makes the common "child encoded right after the
 * branch data" case a small constant, which compresses far better. Offsets
 * to already-encoded (shared) nodes wrap via uint16 modulo arithmetic; the
 * decoder masks navigation results with `& 0xff_ff` to match.
 */
export const enum BinTrieFlags {
    VALUE_LENGTH = 0b1100_0000_0000_0000,
    FLAG13 = 0b0010_0000_0000_0000,
    BRANCH_LENGTH = 0b0001_1111_1000_0000,
    JUMP_TABLE = 0b0000_0000_0111_1111,
    /** Bits 12..0: the inline value of a VALUE_LENGTH = 1 header word. */
    VALUE_MASK = 0b0001_1111_1111_1111,
}
