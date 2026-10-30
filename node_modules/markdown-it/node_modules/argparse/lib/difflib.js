// Minimal port of Python's difflib used by argparse suggestions.

'use strict'

function calculate_ratio (matches, length) {
    return length ? 2 * matches / length : 1
}

class SequenceMatcher {
    constructor () {
        this.a = []
        this.b = []
        this.b2j = new Map()
        this.fullbcount = undefined
        this.matching_blocks = undefined
    }

    set_seq1 (a) {
        this.a = Array.from(a)
        this.matching_blocks = undefined
    }

    set_seq2 (b) {
        this.b = Array.from(b)
        this.matching_blocks = undefined
        this.fullbcount = undefined
        this._chain_b()
    }

    _chain_b () {
        const b2j = new Map()
        for (const [i, element] of this.b.entries()) {
            const indices = b2j.get(element) || []
            indices.push(i)
            b2j.set(element, indices)
        }

        const n = this.b.length
        if (n >= 200) {
            const ntest = Math.floor(n / 100) + 1
            for (const [element, indices] of b2j) {
                if (indices.length > ntest) b2j.delete(element)
            }
        }
        this.b2j = b2j
    }

    find_longest_match (alo, ahi, blo, bhi) {
        const { a, b, b2j } = this
        let besti = alo
        let bestj = blo
        let bestsize = 0
        let j2len = new Map()

        for (let i = alo; i < ahi; i++) {
            const newj2len = new Map()
            for (const j of b2j.get(a[i]) || []) {
                if (j < blo) continue
                if (j >= bhi) break
                const k = (j2len.get(j - 1) || 0) + 1
                newj2len.set(j, k)
                if (k > bestsize) {
                    besti = i - k + 1
                    bestj = j - k + 1
                    bestsize = k
                }
            }
            j2len = newj2len
        }

        while (besti > alo && bestj > blo && a[besti - 1] === b[bestj - 1]) {
            besti--
            bestj--
            bestsize++
        }
        while (besti + bestsize < ahi && bestj + bestsize < bhi &&
               a[besti + bestsize] === b[bestj + bestsize]) {
            bestsize++
        }

        return [besti, bestj, bestsize]
    }

    get_matching_blocks () {
        if (this.matching_blocks !== undefined) return this.matching_blocks

        const la = this.a.length
        const lb = this.b.length
        const queue = [[0, la, 0, lb]]
        const matching_blocks = []
        while (queue.length) {
            const [alo, ahi, blo, bhi] = queue.pop()
            const match = this.find_longest_match(alo, ahi, blo, bhi)
            const [i, j, k] = match
            if (k) {
                matching_blocks.push(match)
                if (alo < i && blo < j) queue.push([alo, i, blo, j])
                if (i + k < ahi && j + k < bhi) {
                    queue.push([i + k, ahi, j + k, bhi])
                }
            }
        }
        matching_blocks.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2])

        let i1 = 0
        let j1 = 0
        let k1 = 0
        const non_adjacent = []
        for (const [i2, j2, k2] of matching_blocks) {
            if (i1 + k1 === i2 && j1 + k1 === j2) {
                k1 += k2
            } else {
                if (k1) non_adjacent.push([i1, j1, k1])
                i1 = i2
                j1 = j2
                k1 = k2
            }
        }
        if (k1) non_adjacent.push([i1, j1, k1])
        non_adjacent.push([la, lb, 0])
        this.matching_blocks = non_adjacent
        return non_adjacent
    }

    ratio () {
        const matches = this.get_matching_blocks()
            .reduce((total, match) => total + match[2], 0)
        return calculate_ratio(matches, this.a.length + this.b.length)
    }

    quick_ratio () {
        if (this.fullbcount === undefined) {
            this.fullbcount = new Map()
            for (const element of this.b) {
                this.fullbcount.set(element, (this.fullbcount.get(element) || 0) + 1)
            }
        }

        const avail = new Map()
        let matches = 0
        for (const element of this.a) {
            const numb = avail.has(element)
                ? avail.get(element)
                : this.fullbcount.get(element) || 0
            avail.set(element, numb - 1)
            if (numb > 0) matches++
        }
        return calculate_ratio(matches, this.a.length + this.b.length)
    }

    real_quick_ratio () {
        return calculate_ratio(
            Math.min(this.a.length, this.b.length),
            this.a.length + this.b.length)
    }
}

function compare_strings (a, b) {
    const ac = Array.from(a)
    const bc = Array.from(b)
    for (let i = 0; i < Math.min(ac.length, bc.length); i++) {
        const difference = ac[i].codePointAt(0) - bc[i].codePointAt(0)
        if (difference) return difference
    }
    return ac.length - bc.length
}

function get_close_matches (word, possibilities, n = 3, cutoff = 0.6) {
    if (!(n > 0)) throw new TypeError(`n must be > 0: ${n}`)
    if (!(cutoff >= 0 && cutoff <= 1)) {
        throw new TypeError(`cutoff must be in [0.0, 1.0]: ${cutoff}`)
    }

    const result = []
    const matcher = new SequenceMatcher()
    matcher.set_seq2(word)
    for (const possibility of possibilities) {
        matcher.set_seq1(possibility)
        if (matcher.real_quick_ratio() >= cutoff &&
            matcher.quick_ratio() >= cutoff &&
            matcher.ratio() >= cutoff) {
            result.push([matcher.ratio(), possibility])
        }
    }

    result.sort((a, b) => b[0] - a[0] || -compare_strings(a[1], b[1]))
    return result.slice(0, n).map(match => match[1])
}

module.exports = { get_close_matches }
