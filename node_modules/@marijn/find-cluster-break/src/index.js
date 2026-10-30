// These are filled with ranges (rangeFrom[i] up to but not including
// rangeTo[i]) of code points that count as extending characters.
let rangeFrom = [], rangeTo = []

;(() => {
  // Compressed representation of the Grapheme_Cluster_Break=Extend
  // information from
  // http://www.unicode.org/Public/17.0.0/ucd/auxiliary/GraphemeBreakProperty.txt.
  // Each pair of elements represents a range, as an offet from the
  // previous range and a length. Numbers are in base-36, with the empty
  // string being a shorthand for 1. See bin/build-extenders.js.
  let numbers = "lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,1n,9,16,o,,x,1i,3,,i,,7,a,2,t,3,1k,,,7,2,2,2,3,9,,a,2,q,,2,3,1k,,,5,4,2,2,3,3,,u,2,3,,b,3,1k,,,8,,3,,3,k,2,m,6,,3,1k,,,7,2,2,2,3,7,3,a,2,u,,1n,5,3,3,,4,9,,14,5,1j,,,7,,3,,4,7,2,b,2,t,3,1k,,,7,,3,,4,7,2,b,2,f,,c,4,1j,2,,7,,3,,4,9,,a,2,t,3,1y,,4,6,,,,8,i,2,1p,,,8,c,8,2q,,,a,b,7,21,2,r,,,,,,4,2,1d,k,,2,5,b,,10,9,,2u,b,,6,n,4,4,3,g,4,d,,,3,6,,f,,jj,3,qa,4,s,3,t,2,u,2,1s,w,9,,19,3,,,39,2,y,,3a,c,4,c,63,5,1l,a,,,,,2,o,2,,1c,1a,2,c,k,5,1b,h,12,9,c,3,u,d,1k,e,1c,k,48,3,,l,4,,6,,2,3,5i,1s,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,n,5,4,,2b,2,1e,i,q,i,d,,12,8,p,d,18,4,1b,e,10,,1v,e,c,,8,2,1a,,1f,,,3,2,2,5,2,,,15,5,5,2,6k,8,,2,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,1t,5,8t,2,25,6,1y,b,1d,4,3e,3,1h,f,15,,2,2,a,4,19,b,7,,1p,3,10,e,g,2,18,,c,3,1c,e,8,4,,2,2k,c,6,,2,,4d,c,l,4,1j,2,,7,2,2,2,3,9,,a,2,2,7,3,5,1v,9,,,2,,,4,,5,,,e,2,2a,i,n,,29,k,6j,7,2,9,r,2,2a,h,2y,d,2t,3,2,a,74,f,6t,6,,2,2,4,,,,2,3x,7,2,7,3,,s,a,14,7,,4,8,,9,b,1a,g,5i,8,5j,8,,8,2a,m,,e,3e,6,3,,,2,,7,,,1u,5,,2,,5,9n,4,9,2,,,1c,7,3,5,n,,44l,,6,f,8ug,i,1xc,5,1n,7,t4,,,1j,7,4,29,,b,2,f57,2,3mp,1a,2,n,f2,5,3,6,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,2s,,4g,7,af,,1p,4,e4,4,72,2,6r,,2,,7,2,5,,d6,7,31,7,240,5".split(",").map(s => s ? parseInt(s, 36) : 1)
  for (let i = 0, n = 0; i < numbers.length; i++)
    (i % 2 ? rangeTo : rangeFrom).push(n = n + numbers[i])
})()

export function isExtendingChar(code) {
  if (code < 768) return false
  for (let from = 0, to = rangeFrom.length;;) {
    let mid = (from + to) >> 1
    if (code < rangeFrom[mid]) to = mid
    else if (code >= rangeTo[mid]) from = mid + 1
    else return true
    if (from == to) return false
  }
}

function isRegionalIndicator(code) {
  return code >= 0x1F1E6 && code <= 0x1F1FF
}

function check(code) {
  for (let i = 0; i < rangeFrom.length; i++) {
    if (rangeTo[i] > code) return rangeFrom[i] <= code
  }
  return false
}

const ZWJ = 0x200d

export function findClusterBreak(str, pos, forward = true, includeExtending = true) {
  return (forward ? nextClusterBreak : prevClusterBreak)(str, pos, includeExtending)
}

function nextClusterBreak(str, pos, includeExtending) {
  if (pos == str.length) return pos
  // If pos is in the middle of a surrogate pair, move to its start
  if (pos && surrogateLow(str.charCodeAt(pos)) && surrogateHigh(str.charCodeAt(pos - 1))) pos--
  let prev = codePointAt(str, pos)
  pos += codePointSize(prev)
  while (pos < str.length) {
    let next = codePointAt(str, pos)
    if (prev == ZWJ || next == ZWJ || includeExtending && isExtendingChar(next)) {
      pos += codePointSize(next)
      prev = next
    } else if (isRegionalIndicator(next)) {
      let countBefore = 0, i = pos - 2
      while (i >= 0 && isRegionalIndicator(codePointAt(str, i))) { countBefore++; i -= 2 }
      if (countBefore % 2 == 0) break
      else pos += 2
    } else {
      break
    }
  }
  return pos
}

function prevClusterBreak(str, pos, includeExtending) {
  while (pos > 1) {
    let found = nextClusterBreak(str, pos - 2, includeExtending)
    if (found < pos) return found
    pos--
  }
  return 0
}

function codePointAt(str, pos) {
  let code0 = str.charCodeAt(pos)
  if (!surrogateHigh(code0) || pos + 1 == str.length) return code0
  let code1 = str.charCodeAt(pos + 1)
  if (!surrogateLow(code1)) return code0
  return ((code0 - 0xd800) << 10) + (code1 - 0xdc00) + 0x10000
}

function surrogateLow(ch) { return ch >= 0xDC00 && ch < 0xE000 }
function surrogateHigh(ch) { return ch >= 0xD800 && ch < 0xDC00 }
function codePointSize(code) { return code < 0x10000 ? 1 : 2 }
