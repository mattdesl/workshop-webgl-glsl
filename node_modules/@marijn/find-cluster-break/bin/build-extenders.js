// Helper script to build the compact string format for the extender
// database used in src/index.js

let resp = await fetch("https://www.unicode.org/Public/17.0.0/ucd/auxiliary/GraphemeBreakProperty.txt")
if (!resp.ok) throw new Error("Failed to fetch unicode data")
let body = await resp.text()
let lines = body.split("\n")

// https://www.unicode.org/reports/tr29/#SpacingMark
let excluded = new Set([0x102B, 0x102C, 0x1038, 0x1062, 0x1063, 0x1064,
                        0x1067, 0x1068, 0x1069, 0x106A, 0x106B, 0x106C, 0x106D,
                        0x1083, 0x1087, 0x1088, 0x1089, 0x108A, 0x108B, 0x108C,
                        0x108F, 0x109A, 0x109B, 0x109C, 0x1A61, 0x1A63, 0x1A64,
                        0xAA7B, 0xAA7D, 0x11720, 0x11721])

let max = 0x30000
let set = new Uint16Array(max >> 4)

function get(code) {
  return (set[code >> 4] & (1 << (code & 15))) > 0
}

let m
for (let l of lines) {
  if (m = /^([\da-f]+)(?:\.\.([\da-f]+))?\s+;\s+(Extend|SpacingMark)\s/i.exec(l)) {
    let spacing = m[3] == "SpacingMark"
    let from = parseInt(m[1], 16), to = m[2] ? parseInt(m[2], 16) : from
    for (let code = from; code <= to; code++)
      if (!spacing || !excluded.has(code)) set[code >> 4] |= 1 << (code & 15)
  }
}

let result = ""
for (let code = 0;;) {
  let base = code
  while (code < max && !get(code)) code++
  if (code == max) break
  if (base) result += ","
  let start = code++
  while (code < max && get(code)) code++
  let end = code
  if (start > base + 1) result += (start - base).toString(36)
  result += ","
  if (end > start + 1) result += (end - start).toString(36)
}
console.log(result)
