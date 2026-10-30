/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let mdurl = require("mdurl");
mdurl = __toESM(mdurl, 1);
let uc_micro = require("uc.micro");
uc_micro = __toESM(uc_micro, 1);
let linkify_it = require("linkify-it");
let punycode_js = require("punycode.js");
punycode_js = __toESM(punycode_js, 1);
//#region node_modules/entities/dist/decode-codepoint.js
/**
* C1 Unicode control character reference replacements (code points 128–159).
* Index i gives the replacement for code point 128+i; 0 means "no replacement".
*/
var c1 = [
	8364,
	0,
	8218,
	402,
	8222,
	8230,
	8224,
	8225,
	710,
	8240,
	352,
	8249,
	338,
	0,
	381,
	0,
	0,
	8216,
	8217,
	8220,
	8221,
	8226,
	8211,
	8212,
	732,
	8482,
	353,
	8250,
	339,
	0,
	382,
	376
];
/**
* True for NUL, UTF-16 surrogates, and values past U+10FFFF.
* @param codePoint Unicode code point to check.
*/
function isInvalidCodePoint(codePoint) {
	return codePoint === 0 || codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111;
}
/**
* Replace the given code point with U+FFFD if it is NUL (0), a surrogate, or
* outside the valid Unicode range. Code points in the C1 controls range
* (128–159) are remapped to their Windows-1252 equivalents, following the
* HTML spec. All other code points are returned unchanged.
* @param codePoint Unicode code point to convert.
*/
function replaceCodePoint(codePoint) {
	if (isInvalidCodePoint(codePoint)) return 65533;
	if (codePoint >= 128 && codePoint <= 159) return c1[codePoint - 128] || codePoint;
	return codePoint;
}
/**
* Convert the code point of a decoded numeric entity to a string, replacing
* invalid values.
*
* Fast path for plain BMP code points: [1..0x7F] and [0xA0..0xD7FF] pass
* `replaceCodePoint` unchanged (no NUL, C1 remap, surrogate, or out-of-range
* handling) and fit a single charCode. 0xd760 = 0xD800 (the first surrogate)
* - 0xA0.
* @param codePoint Unicode code point to convert.
*/
function codePointToString(codePoint) {
	return codePoint - 1 >>> 0 < 127 || codePoint - 160 >>> 0 < 55136 ? String.fromCharCode(codePoint) : String.fromCodePoint(replaceCodePoint(codePoint));
}
//#endregion
//#region node_modules/entities/dist/internal/decode-shared.js
var BASE91_INVERSE = /* #__PURE__ */ (() => {
	const table = /* @__PURE__ */ new Uint8Array(127);
	let code = 0;
	for (let char = 33; char <= 126; char++) if (char !== 34 && char !== 36 && char !== 92) table[char] = code++;
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
function decodeTrieDict(input, resultLength, atomCount, dict1AtomCount, ngramCount, dictSize) {
	const base = 91;
	const inputLength = input.length;
	const twoCharBias = dictSize * 90;
	let pos = 0;
	/** Read one slot code at `pos` and return its slot index, advancing pos. */
	const readSlotCode = () => {
		const c1 = BASE91_INVERSE[input.charCodeAt(pos++)];
		return c1 < dictSize ? c1 : c1 * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
	};
	const dict2AtomCount = atomCount - dict1AtomCount;
	const slotCount = atomCount + ngramCount;
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
	function decodeDelta(count, off) {
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
				previous += 89 + (next < 90 ? next * base + BASE91_INVERSE[input.charCodeAt(pos++)] : BASE91_INVERSE[input.charCodeAt(pos++)] * 8281 + BASE91_INVERSE[input.charCodeAt(pos++)] * base + BASE91_INVERSE[input.charCodeAt(pos++)]);
				single[slot++] = previous;
			}
		}
	}
	decodeDelta(dict1AtomCount, 0);
	decodeDelta(dict2AtomCount, dictSize);
	const references = new Int32Array(ngramCount * 2);
	let poolSize = 0;
	let ngramIndex = 0;
	/**
	* Read `count` ngram entries (each = 2 slot-code references) for the slots
	* starting at `startSlot`, recording references and assigning pool ranges.
	* @param count
	* @param startSlot
	*/
	function readNgramReferences(count, startSlot) {
		for (let index = 0; index < count; index++) {
			const slot = startSlot + index;
			const a = readSlotCode();
			const b = readSlotCode();
			references[ngramIndex * 2] = a;
			references[ngramIndex * 2 + 1] = b;
			ngramIndex += 1;
			start[slot] = poolSize;
			const entryLength = (single[a] < 0 ? length[a] : 1) + (single[b] < 0 ? length[b] : 1);
			length[slot] = entryLength;
			poolSize += entryLength;
		}
	}
	readNgramReferences(ngramCount - dictSize + dict1AtomCount, dictSize + dict2AtomCount);
	readNgramReferences(dictSize - dict1AtomCount, dict1AtomCount);
	const pool = new Uint16Array(poolSize);
	let write = 0;
	for (let index = 0; index < ngramIndex; index++) for (let half = 0; half < 2; half++) {
		const source = references[index * 2 + half];
		const value = single[source];
		if (value < 0) {
			let read = start[source];
			const readEnd = read + length[source];
			while (read < readEnd) pool[write++] = pool[read++];
		} else pool[write++] = value;
	}
	const out = new Uint16Array(resultLength);
	let outIndex = 0;
	while (pos < inputLength) {
		let slot = BASE91_INVERSE[input.charCodeAt(pos++)];
		if (slot >= dictSize) slot = slot * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
		const value = single[slot];
		if (value < 0) {
			let read = start[slot];
			const readEnd = read + length[slot];
			while (read < readEnd) out[outIndex++] = pool[read++];
		} else out[outIndex++] = value;
	}
	return out;
}
//#endregion
//#region node_modules/entities/dist/generated/decode-data-html.js
/** Packed HTML decode trie data. */
var htmlDecodeTree = /* #__PURE__ */ decodeTrieDict("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61);
//#endregion
//#region node_modules/entities/dist/internal/bin-trie-flags.js
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
var BinTrieFlags;
(function(BinTrieFlags) {
	BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
	BinTrieFlags[BinTrieFlags["FLAG13"] = 8192] = "FLAG13";
	BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
	BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
	/** Bits 12..0: the inline value of a VALUE_LENGTH = 1 header word. */
	BinTrieFlags[BinTrieFlags["VALUE_MASK"] = 8191] = "VALUE_MASK";
})(BinTrieFlags || (BinTrieFlags = {}));
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
//#region node_modules/entities/dist/decode.js
var CharCodes;
(function(CharCodes) {
	CharCodes[CharCodes["AMP"] = 38] = "AMP";
	CharCodes[CharCodes["NUM"] = 35] = "NUM";
	CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
	CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
	CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
	CharCodes[CharCodes["NINE"] = 57] = "NINE";
	CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
	CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
})(CharCodes || (CharCodes = {}));
/** Bit that needs to be set to convert an upper case ASCII character to lower case */
var TO_LOWER_BIT = 32;
var CONSUMED_SHIFT = 21;
var CODE_POINT_MASK = 2097151;
/**
* Reserved consumed field for counts of at least 2047 characters after `&`.
* The true count is in `longNumericConsumed`.
*/
var CONSUMED_OVERFLOW = 2047;
/**
* Side channel for numeric entities of at least 2048 characters including
* `&`. Set by `parseNumericEntity` when its consumed count reaches the
* reserved value `CONSUMED_OVERFLOW`; callers read the true count from here.
* A module-level slot avoids a tuple allocation on the hot path.
*/
var longNumericConsumed = 0;
/**
* Extract the consumed count from a `parseNumericEntity` packed result,
* recovering the true length from `longNumericConsumed` when the packed
* field contains the sentinel. Read it before the next `parseNumericEntity`
* call, which may overwrite the side channel. This helper owns that protocol.
* @param packed Packed result of `parseNumericEntity`.
*/
function unpackConsumed(packed) {
	const consumed = packed >>> CONSUMED_SHIFT;
	return consumed === CONSUMED_OVERFLOW ? longNumericConsumed : consumed;
}
/**
* Unsigned subtraction trick: (code - lo) >>> 0 wraps negatives to large
* values, so a single `<=` covers the entire [lo..hi] range check.
* @param code Code point to check.
*/
function isNumber(code) {
	return code - CharCodes.ZERO >>> 0 <= 9;
}
function isHexadecimalCharacter(code) {
	return (code | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 5;
}
function isAlpha(code) {
	return (code | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 25;
}
/**
* Checks if the given character is a valid end character for an entity in an attribute.
*
* Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
* See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
* @param code Code point to check.
*/
function isEntityInAttributeInvalidEnd(code) {
	return code === CharCodes.EQUALS || isAlpha(code) || isNumber(code);
}
var EntityDecoderState;
(function(EntityDecoderState) {
	EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
	EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
	EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
	EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
	EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
/**
* Decoding mode for named entities.
*/
var DecodingMode;
(function(DecodingMode) {
	/** Entities in text nodes that can end with any character. */
	DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
	/** Only allow entities terminated with a semicolon. */
	DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
	/** Entities in attributes have limitations on ending characters. */
	DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
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
function determineBranch(decodeTree, current, nodeIndex, char) {
	const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
	const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
	if (jumpOffset) {
		if (branchCount === 0) return char === jumpOffset ? nodeIndex : -1;
		const slot = char - jumpOffset;
		if (slot >>> 0 >= branchCount) return -1;
		const stored = decodeTree[nodeIndex + slot];
		return stored === 0 ? -1 : nodeIndex + branchCount + stored - 1 & 65535;
	}
	if (branchCount === 0) return -1;
	const packedKeySlots = branchCount + 1 >> 1;
	const branchEnd = nodeIndex + packedKeySlots + branchCount;
	for (let index = 0; index < branchCount; index++) {
		const key = decodeTree[nodeIndex + (index >> 1)] >> ((index & 1) << 3) & 255;
		if (key === char) return branchEnd + decodeTree[nodeIndex + packedKeySlots + index] & 65535;
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
function readTrieValue(decodeTree, nodeIndex, valueLength) {
	if (valueLength === 1) return String.fromCharCode(decodeTree[nodeIndex] & BinTrieFlags.VALUE_MASK);
	if (valueLength === 2) return String.fromCharCode(decodeTree[nodeIndex + 1]);
	return String.fromCharCode(decodeTree[nodeIndex + 1], decodeTree[nodeIndex + 2]);
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
function parseNumericEntity(input, numberStart, inputLength) {
	let offset = numberStart + 1;
	let cp = 0;
	let digitStart = offset;
	if (offset < inputLength && (input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
		offset += 1;
		digitStart = offset;
		while (offset < inputLength) {
			const char = input.charCodeAt(offset);
			if (isNumber(char)) cp = cp * 16 + (char - CharCodes.ZERO);
			else if (isHexadecimalCharacter(char)) cp = cp * 16 + ((char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10);
			else break;
			offset += 1;
		}
	} else while (offset < inputLength) {
		const digit = input.charCodeAt(offset) - CharCodes.ZERO;
		if (digit >>> 0 > 9) break;
		cp = cp * 10 + digit;
		offset += 1;
	}
	if (offset === digitStart) return 0;
	if (offset < inputLength && input.charCodeAt(offset) === CharCodes.SEMI) offset += 1;
	if (cp > 1114111) cp = 1114112;
	let consumed = offset - numberStart;
	if (consumed >= CONSUMED_OVERFLOW) {
		longNumericConsumed = consumed;
		consumed = CONSUMED_OVERFLOW;
	}
	return consumed << CONSUMED_SHIFT | cp;
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
function decodeWithTrie(input, isStrict, isAttribute) {
	const decodeTree = htmlDecodeTree;
	let offset = input.indexOf("&");
	if (offset < 0) return input;
	const inputLength = input.length;
	let chunkStart = 0;
	let result = "";
	const root = decodeTree[0];
	const rootJumpOffset = root & BinTrieFlags.JUMP_TABLE;
	const rootBranchCount = (root & BinTrieFlags.BRANCH_LENGTH) >> 7;
	do {
		const entityStart = offset + 1;
		const firstChar = input.charCodeAt(entityStart);
		let consumed;
		let value;
		if (firstChar === CharCodes.NUM) {
			const packed = parseNumericEntity(input, entityStart, inputLength);
			consumed = unpackConsumed(packed);
			if (isStrict && consumed > 0 && input.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI) consumed = 0;
			value = consumed === 0 ? "" : codePointToString(packed & CODE_POINT_MASK);
		} else if (isAlpha(firstChar)) {
			consumed = 0;
			value = "";
			const rootSlotIndex = firstChar - rootJumpOffset;
			let nodeIndex;
			if (rootSlotIndex >>> 0 < rootBranchCount) {
				const stored = decodeTree[1 + rootSlotIndex];
				nodeIndex = stored === 0 ? -1 : rootBranchCount + stored & 65535;
			} else nodeIndex = -1;
			let bestNodeIndex = 0;
			let bestValueLength = 0;
			let current = nodeIndex < 0 ? 0 : decodeTree[nodeIndex];
			let index = entityStart + 1;
			trie: while (index < inputLength) {
				while ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === 0 && (current & BinTrieFlags.JUMP_TABLE) !== 0) {
					const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
					const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
					if (branchCount === 0) {
						if (input.charCodeAt(index) !== jumpOffset) break trie;
						nodeIndex += 1;
					} else {
						const slot = input.charCodeAt(index) - jumpOffset;
						if (slot >>> 0 >= branchCount) break trie;
						const stored = decodeTree[nodeIndex + 1 + slot];
						if (stored === 0) break trie;
						nodeIndex = nodeIndex + branchCount + stored & 65535;
					}
					current = decodeTree[nodeIndex];
					index += 1;
					if (index >= inputLength) break trie;
				}
				if ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === BinTrieFlags.FLAG13) {
					const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
					if (input.charCodeAt(index) !== (current & BinTrieFlags.JUMP_TABLE)) break;
					index += 1;
					const remaining = runLength - 1;
					let wordIndex = nodeIndex + 1;
					let charIndexInPacked = 0;
					for (; charIndexInPacked + 1 < remaining; charIndexInPacked += 2) {
						const packed = decodeTree[wordIndex];
						if (input.charCodeAt(index) !== (packed & 255)) break trie;
						index += 1;
						if (input.charCodeAt(index) !== (packed >> 8 & 255)) break trie;
						index += 1;
						wordIndex += 1;
					}
					if (charIndexInPacked < remaining) {
						if (input.charCodeAt(index) !== (decodeTree[wordIndex] & 255)) break;
						index += 1;
					}
					nodeIndex += 1 + (runLength >> 1);
					current = decodeTree[nodeIndex];
					continue;
				}
				const valueLength = current >>> 14;
				const char = input.charCodeAt(index);
				if (valueLength !== 0) {
					if (char === CharCodes.SEMI) {
						consumed = index - entityStart + 1;
						value = valueLength === 1 ? String.fromCharCode(current & BinTrieFlags.VALUE_MASK) : readTrieValue(decodeTree, nodeIndex, valueLength);
						break;
					}
					if (!isStrict && (current & BinTrieFlags.FLAG13) === 0) {
						consumed = index - entityStart;
						bestNodeIndex = nodeIndex;
						bestValueLength = valueLength;
					}
					if (valueLength === 1) break;
				}
				const next = determineBranch(decodeTree, current, nodeIndex + (valueLength || 1), char);
				if (next < 0) break;
				nodeIndex = next;
				current = decodeTree[nodeIndex];
				index += 1;
			}
			if (value === "") {
				const finalVL = current >>> 14;
				if (finalVL !== 0 && !isStrict && (current & BinTrieFlags.FLAG13) === 0) {
					consumed = index - entityStart;
					bestNodeIndex = nodeIndex;
					bestValueLength = finalVL;
				}
				if (consumed > 0) value = readTrieValue(decodeTree, bestNodeIndex, bestValueLength);
			}
		} else {
			consumed = 0;
			value = "";
		}
		if (consumed === 0 || isAttribute && firstChar !== CharCodes.NUM && input.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI && entityStart + consumed < inputLength && isEntityInAttributeInvalidEnd(input.charCodeAt(entityStart + consumed))) offset = entityStart;
		else {
			if (chunkStart < offset) result += input.slice(chunkStart, offset);
			result += value;
			offset = chunkStart = entityStart + consumed;
		}
		if (input.charCodeAt(offset) !== CharCodes.AMP) offset = input.indexOf("&", offset);
	} while (offset >= 0);
	return result + input.slice(chunkStart);
}
/**
* Decodes an HTML string, requiring all entities to be terminated by a semicolon.
* @param htmlString The string to decode.
* @returns The decoded string.
*/
function decodeHTMLStrict(htmlString) {
	return decodeWithTrie(htmlString, true, false);
}
//#endregion
//#region src/common/utils.ts
/**
* Common utility functions exposed through `md.utils` for use by plugins.
*
* @module md.utils
*/
var utils_exports = /* @__PURE__ */ __exportAll({
	arrayReplaceAt: () => arrayReplaceAt,
	asciiTrim: () => asciiTrim,
	callable: () => callable,
	escapeHtml: () => escapeHtml,
	escapeRE: () => escapeRE,
	fromCodePoint: () => fromCodePoint,
	isMdAsciiPunct: () => isMdAsciiPunct,
	isPunctChar: () => isPunctChar,
	isPunctCharCode: () => isPunctCharCode,
	isSpace: () => isSpace,
	isValidEntityCode: () => isValidEntityCode,
	isWhiteSpace: () => isWhiteSpace,
	lib: () => lib,
	normalizeReference: () => normalizeReference,
	unescapeAll: () => unescapeAll,
	unescapeMd: () => unescapeMd
});
function callable(cls) {
	const wrapper = function(...args) {
		return Reflect.construct(cls, args, new.target && new.target !== wrapper ? new.target : cls);
	};
	Object.defineProperty(wrapper, "name", { value: cls.name });
	Object.setPrototypeOf(wrapper, cls);
	wrapper.prototype = cls.prototype;
	return wrapper;
}
/**
* Returns a copy of a token array with the token at `pos` replaced by
* `newElements`. Used to transform token streams without modifying the
* original array.
*/
function arrayReplaceAt(src, pos, newElements) {
	return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
}
/** Checks whether a code point can be decoded from a numeric HTML entity. */
function isValidEntityCode(c) {
	if (c >= 55296 && c <= 57343) return false;
	if (c >= 64976 && c <= 65007) return false;
	if ((c & 65535) === 65535 || (c & 65535) === 65534) return false;
	if (c >= 0 && c <= 8) return false;
	if (c === 11) return false;
	if (c >= 14 && c <= 31) return false;
	if (c >= 127 && c <= 159) return false;
	if (c > 1114111) return false;
	return true;
}
/**
* Converts a Unicode code point to a string, like `String.fromCodePoint()`,
* but does not throw for invalid input.
*/
function fromCodePoint(c) {
	if (c > 65535) {
		c -= 65536;
		const surrogate1 = 55296 + (c >> 10);
		const surrogate2 = 56320 + (c & 1023);
		return String.fromCharCode(surrogate1, surrogate2);
	}
	return String.fromCharCode(c);
}
var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
var UNESCAPE_ALL_RE = new RegExp(`${UNESCAPE_MD_RE.source}|${/&([a-z#][a-z0-9]{1,31});/gi.source}`, "gi");
var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function replaceEntityPattern(match, name) {
	if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
		const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
		if (isValidEntityCode(code)) return fromCodePoint(code);
		return match;
	}
	const decoded = decodeHTMLStrict(match);
	if (decoded !== match) return decoded;
	return match;
}
/** Decodes Markdown backslash escapes. */
function unescapeMd(str) {
	if (str.indexOf("\\") < 0) return str;
	return str.replace(UNESCAPE_MD_RE, "$1");
}
/**
* Decodes Markdown backslash escapes and HTML character references in link
* destinations, link titles, and fenced code info strings.
*/
function unescapeAll(str) {
	if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) return str;
	return str.replace(UNESCAPE_ALL_RE, function(match, escaped, entity) {
		if (escaped) return escaped;
		return replaceEntityPattern(match, entity);
	});
}
var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;"
};
function replaceUnsafeChar(ch) {
	return HTML_REPLACEMENTS[ch];
}
/** Escapes HTML special characters in a string. */
function escapeHtml(str) {
	if (HTML_ESCAPE_TEST_RE.test(str)) return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
	return str;
}
var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;
/** Escapes regular expression metacharacters in a string. */
function escapeRE(str) {
	return str.replace(REGEXP_ESCAPE_RE, "\\$&");
}
/** Checks whether a character code is an ASCII space or tab. */
function isSpace(code) {
	switch (code) {
		case 9:
		case 32: return true;
	}
	return false;
}
/**
* Checks whether a character code is whitespace recognized by Markdown.
*
* Matches the Unicode `Zs` category or `\t`, `\f`, `\v`, `\r`, `\n`.
*/
function isWhiteSpace(code) {
	if (code >= 8192 && code <= 8202) return true;
	switch (code) {
		case 9:
		case 10:
		case 11:
		case 12:
		case 13:
		case 32:
		case 160:
		case 5760:
		case 8239:
		case 8287:
		case 12288: return true;
	}
	return false;
}
/**
* Checks whether a character is Unicode punctuation or a symbol.
*
* Does not support astral characters.
*/
function isPunctChar(ch) {
	return uc_micro.P.test(ch) || uc_micro.S.test(ch);
}
/** Checks whether a Unicode code point is punctuation or a symbol. */
function isPunctCharCode(code) {
	return isPunctChar(fromCodePoint(code));
}
/**
* Markdown ASCII punctuation characters.
*
*     !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @,
*     [, \, ], ^, _, `, {, |, }, or ~
*
* http://spec.commonmark.org/0.15/#ascii-punctuation-character
*
* Don't confuse with Unicode punctuation. It lacks some characters in the
* ASCII range.
*/
function isMdAsciiPunct(ch) {
	switch (ch) {
		case 33:
		case 34:
		case 35:
		case 36:
		case 37:
		case 38:
		case 39:
		case 40:
		case 41:
		case 42:
		case 43:
		case 44:
		case 45:
		case 46:
		case 47:
		case 58:
		case 59:
		case 60:
		case 61:
		case 62:
		case 63:
		case 64:
		case 91:
		case 92:
		case 93:
		case 94:
		case 95:
		case 96:
		case 123:
		case 124:
		case 125:
		case 126: return true;
		default: return false;
	}
}
/** Normalizes `[reference labels]` for case-insensitive lookup. */
function normalizeReference(str) {
	str = str.trim().replace(/\s+/g, " ");
	return str.toLowerCase().toUpperCase();
}
function isAsciiTrimmable(c) {
	return c === 32 || c === 9 || c === 10 || c === 13;
}
/**
* "Light" `.trim()` for blocks (headings, paragraphs), where Unicode spaces
* should be preserved.
*/
function asciiTrim(str) {
	let start = 0;
	for (; start < str.length; start++) if (!isAsciiTrimmable(str.charCodeAt(start))) break;
	let end = str.length - 1;
	for (; end >= start; end--) if (!isAsciiTrimmable(str.charCodeAt(end))) break;
	return str.slice(start, end + 1);
}
/**
* Libraries commonly used by markdown-it and its plugins, re-exported to
* reduce duplicate dependencies in browser bundles.
*/
var lib = {
	mdurl,
	ucmicro: uc_micro
};
//#endregion
//#region src/helpers/parse_link_label.ts
/** Finds the end of a link or image label (`[label]`). */
function parseLinkLabel(state, start, disableNested) {
	let level, found, marker, prevPos;
	const max = state.posMax;
	const oldPos = state.pos;
	state.pos = start + 1;
	level = 1;
	while (state.pos < max) {
		marker = state.src.charCodeAt(state.pos);
		if (marker === 93) {
			level--;
			if (level === 0) {
				found = true;
				break;
			}
		}
		prevPos = state.pos;
		state.md.inline.skipToken(state);
		if (marker === 91) {
			if (prevPos === state.pos - 1) level++;
			else if (disableNested) {
				state.pos = oldPos;
				return -1;
			}
		}
	}
	let labelEnd = -1;
	if (found) labelEnd = state.pos;
	state.pos = oldPos;
	return labelEnd;
}
//#endregion
//#region src/helpers/parse_link_destination.ts
/** Parses the destination in `[label](destination "title")`. */
function parseLinkDestination(str, start, max) {
	let code;
	let pos = start;
	const result = {
		ok: false,
		pos: 0,
		str: ""
	};
	if (str.charCodeAt(pos) === 60) {
		pos++;
		while (pos < max) {
			code = str.charCodeAt(pos);
			if (code === 10) return result;
			if (code === 60) return result;
			if (code === 62) {
				result.pos = pos + 1;
				result.str = unescapeAll(str.slice(start + 1, pos));
				result.ok = true;
				return result;
			}
			if (code === 92 && pos + 1 < max) {
				pos += 2;
				continue;
			}
			pos++;
		}
		return result;
	}
	let level = 0;
	while (pos < max) {
		code = str.charCodeAt(pos);
		if (code === 32) break;
		if (code < 32 || code === 127) break;
		if (code === 92 && pos + 1 < max) {
			if (str.charCodeAt(pos + 1) === 32) {
				pos++;
				continue;
			}
			pos += 2;
			continue;
		}
		if (code === 40) {
			level++;
			if (level > 32) return result;
		}
		if (code === 41) {
			if (level === 0) break;
			level--;
		}
		pos++;
	}
	if (start === pos) return result;
	if (level !== 0) return result;
	result.str = unescapeAll(str.slice(start, pos));
	result.pos = pos;
	result.ok = true;
	return result;
}
//#endregion
//#region src/helpers/parse_link_title.ts
/**
* Parses the optional title in `[label](destination "title")` or
* `[label]: destination "title"`.
*
* `prev_state` continues a reference title on the next source line.
*/
function parseLinkTitle(str, start, max, prev_state) {
	let code;
	let pos = start;
	const state = {
		ok: false,
		can_continue: false,
		pos: 0,
		str: "",
		marker: 0
	};
	if (prev_state) {
		state.str = prev_state.str;
		state.marker = prev_state.marker;
	} else {
		if (pos >= max) return state;
		let marker = str.charCodeAt(pos);
		if (marker !== 34 && marker !== 39 && marker !== 40) return state;
		start++;
		pos++;
		if (marker === 40) marker = 41;
		state.marker = marker;
	}
	while (pos < max) {
		code = str.charCodeAt(pos);
		if (code === state.marker) {
			state.pos = pos + 1;
			state.str += unescapeAll(str.slice(start, pos));
			state.ok = true;
			return state;
		} else if (code === 40 && state.marker === 41) return state;
		else if (code === 92 && pos + 1 < max) pos++;
		pos++;
	}
	state.can_continue = true;
	state.str += unescapeAll(str.slice(start, pos));
	return state;
}
//#endregion
//#region src/helpers/index.ts
/**
* Functions used to parse links and images, split out of parser rules because
* of their size.
*
* @module md.helpers
*/
var helpers_exports = /* @__PURE__ */ __exportAll({
	parseLinkDestination: () => parseLinkDestination,
	parseLinkLabel: () => parseLinkLabel,
	parseLinkTitle: () => parseLinkTitle
});
//#endregion
//#region src/token.ts
/**
* Represents one item in the parsed token stream, storing parsed data and
* providing helpers for managing HTML attributes.
*/
var Token = class {
	constructor(type, tag, nesting) {
		_defineProperty(
			this,
			/**
			* Source map info. Format: `[ line_begin, line_end ]`
			*/
			"map",
			null
		);
		_defineProperty(
			this,
			/**
			* nesting level, the same as `state.level`
			*/
			"level",
			0
		);
		_defineProperty(
			this,
			/**
			* An array of child nodes (inline and img tokens)
			*/
			"children",
			null
		);
		_defineProperty(
			this,
			/**
			* In a case of self-closing tag (code, html, fence, etc.),
			* it has contents of this tag.
			*/
			"content",
			""
		);
		_defineProperty(
			this,
			/**
			* '*' or '_' for emphasis, fence string for fence, etc.
			*/
			"markup",
			""
		);
		_defineProperty(
			this,
			/**
			* Additional information:
			*
			* - Info string for "fence" tokens
			* - The value "auto" for autolink "link_open" and "link_close" tokens
			* - The string value of the item marker for ordered-list "list_item_open" tokens
			*/
			"info",
			""
		);
		_defineProperty(
			this,
			/**
			* True for block-level tokens, false for inline tokens.
			* Used in renderer to calculate line breaks
			*/
			"block",
			false
		);
		_defineProperty(
			this,
			/**
			* If it's true, ignore this element when rendering. Used for tight lists
			* to hide paragraphs.
			*/
			"hidden",
			false
		);
		this.type = type;
		this.tag = tag;
		this.attrs = null;
		this.nesting = nesting;
		this.meta = null;
	}
	/**
	* Search attribute index by name.
	*/
	attrIndex(name) {
		if (!this.attrs) return -1;
		const attrs = this.attrs;
		for (let i = 0, len = attrs.length; i < len; i++) if (attrs[i][0] === name) return i;
		return -1;
	}
	/**
	* Add `[ name, value ]` attribute to list. Init attrs if necessary
	*/
	attrPush(attrData) {
		if (this.attrs) this.attrs.push(attrData);
		else this.attrs = [attrData];
	}
	/**
	* Set `name` attribute to `value`. Override old value if exists.
	*/
	attrSet(name, value) {
		const idx = this.attrIndex(name);
		const attrData = [name, value];
		if (idx < 0) this.attrPush(attrData);
		else this.attrs[idx] = attrData;
	}
	/**
	* Get the value of attribute `name`, or null if it does not exist.
	*/
	attrGet(name) {
		const idx = this.attrIndex(name);
		let value = null;
		if (idx >= 0) value = this.attrs[idx][1];
		return value;
	}
	/**
	* Join value to existing attribute via space. Or create new attribute if not
	* exists. Useful to operate with token classes.
	*/
	attrJoin(name, value) {
		const idx = this.attrIndex(name);
		if (idx < 0) this.attrPush([name, value]);
		else this.attrs[idx][1] = `${this.attrs[idx][1]} ${value}`;
	}
};
//#endregion
//#region src/ruler.ts
/**
* Helper class, used by {@link MarkdownIt.core}, {@link MarkdownIt.block} and
* {@link MarkdownIt.inline} to manage sequences of functions (rules):
*
* - keep rules in defined order
* - assign the name to each rule
* - enable/disable rules
* - add/replace rules
* - allow assign rules to additional named chains (in the same)
* - cacheing lists of active rules
*
* You will not need use this class directly until write plugins. For simple
* rules control use {@link MarkdownIt.disable}, {@link MarkdownIt.enable} and
* {@link MarkdownIt.use}.
*/
var Ruler = class {
	constructor() {
		_defineProperty(
			this,
			/** @internal */
			"__rules__",
			[]
		);
		_defineProperty(
			this,
			/** @internal */
			"__cache__",
			null
		);
	}
	/** @internal */
	__find__(name) {
		for (let i = 0; i < this.__rules__.length; i++) if (this.__rules__[i].name === name) return i;
		return -1;
	}
	/** @internal */
	__compile__() {
		const chains = /* @__PURE__ */ new Set();
		this.__rules__.forEach((rule) => {
			if (!rule.enabled) return;
			rule.alt.forEach((altName) => {
				if (altName) chains.add(altName);
			});
		});
		this.__cache__ = Object.create(null);
		this.__cache__[""] = [];
		this.__rules__.forEach((rule) => {
			if (rule.enabled) this.__cache__[""].push(rule.fn);
		});
		chains.forEach((chain) => {
			this.__cache__[chain] = [];
			this.__rules__.forEach((rule) => {
				if (rule.enabled && rule.alt.indexOf(chain) >= 0) this.__cache__[chain].push(rule.fn);
			});
		});
	}
	/**
	* Replace rule by name with new function & options. Throws error if name not
	* found.
	*
	* @example Replace existing typographer replacement rule with new one
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* md.core.ruler.at('replacements', function replace(state) {
	*   //...
	* });
	* ```
	*/
	at(name, fn, options = {}) {
		const index = this.__find__(name);
		if (index === -1) throw new Error(`Parser rule not found: ${name}`);
		this.__rules__[index].fn = fn;
		this.__rules__[index].alt = options.alt || [];
		this.__cache__ = null;
	}
	/**
	* Add new rule to chain before one with given name. See also
	* {@link Ruler.after}, {@link Ruler.push}.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
	*   //...
	* });
	* ```
	*/
	before(beforeName, ruleName, fn, options = {}) {
		const index = this.__find__(beforeName);
		if (index === -1) throw new Error(`Parser rule not found: ${beforeName}`);
		this.__rules__.splice(index, 0, {
			name: ruleName,
			enabled: true,
			fn,
			alt: options.alt || []
		});
		this.__cache__ = null;
	}
	/**
	* Add new rule to chain after one with given name. See also
	* {@link Ruler.before}, {@link Ruler.push}.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* md.inline.ruler.after('text', 'my_rule', function replace(state) {
	*   //...
	* });
	* ```
	*/
	after(afterName, ruleName, fn, options = {}) {
		const index = this.__find__(afterName);
		if (index === -1) throw new Error(`Parser rule not found: ${afterName}`);
		this.__rules__.splice(index + 1, 0, {
			name: ruleName,
			enabled: true,
			fn,
			alt: options.alt || []
		});
		this.__cache__ = null;
	}
	/**
	* Push new rule to the end of chain. See also
	* {@link Ruler.before}, {@link Ruler.after}.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* md.core.ruler.push('my_rule', function replace(state) {
	*   //...
	* });
	* ```
	*/
	push(ruleName, fn, options = {}) {
		this.__rules__.push({
			name: ruleName,
			enabled: true,
			fn,
			alt: options.alt || []
		});
		this.__cache__ = null;
	}
	/**
	* Enable rules with given names. If any rule name not found - throw Error.
	* Errors can be disabled by second param.
	*
	* See also {@link Ruler.disable}, {@link Ruler.enableOnly}.
	*
	* Returns list of found rule names (if no exception happened).
	*/
	enable(list, ignoreInvalid = false) {
		if (!Array.isArray(list)) list = [list];
		const result = [];
		list.forEach((name) => {
			const idx = this.__find__(name);
			if (idx < 0) {
				if (ignoreInvalid) return;
				throw new Error(`Rules manager: invalid rule name ${name}`);
			}
			this.__rules__[idx].enabled = true;
			result.push(name);
		});
		this.__cache__ = null;
		return result;
	}
	/**
	* Enable rules with given names, and disable everything else. If any rule name
	* not found - throw Error. Errors can be disabled by second param.
	*
	* See also {@link Ruler.disable}, {@link Ruler.enable}.
	*/
	enableOnly(list, ignoreInvalid = false) {
		if (!Array.isArray(list)) list = [list];
		this.__rules__.forEach((rule) => {
			rule.enabled = false;
		});
		this.enable(list, ignoreInvalid);
	}
	/**
	* Disable rules with given names. If any rule name not found - throw Error.
	* Errors can be disabled by second param.
	*
	* See also {@link Ruler.enable}, {@link Ruler.enableOnly}.
	*
	* Returns list of found rule names (if no exception happened).
	*/
	disable(list, ignoreInvalid = false) {
		if (!Array.isArray(list)) list = [list];
		const result = [];
		list.forEach((name) => {
			const idx = this.__find__(name);
			if (idx < 0) {
				if (ignoreInvalid) return;
				throw new Error(`Rules manager: invalid rule name ${name}`);
			}
			this.__rules__[idx].enabled = false;
			result.push(name);
		});
		this.__cache__ = null;
		return result;
	}
	/**
	* Return array of active functions (rules) for given chain name. It analyzes
	* rules configuration, compiles caches if not exists and returns result.
	*
	* Default chain name is `''` (empty string). It can't be skipped. That's
	* done intentionally, to keep signature monomorphic for high speed.
	*/
	getRules(chainName) {
		if (!this.__cache__) this.__compile__();
		return this.__cache__[chainName] || [];
	}
};
//#endregion
//#region src/renderer.ts
var default_rules = {};
default_rules.code_inline = function(tokens, idx, options, env, slf) {
	const token = tokens[idx];
	return `<code${slf.renderAttrs(token)}>${escapeHtml(token.content)}</code>`;
};
default_rules.code_block = function(tokens, idx, options, env, slf) {
	const token = tokens[idx];
	return `<pre${slf.renderAttrs(token)}><code>${escapeHtml(tokens[idx].content)}</code></pre>\n`;
};
default_rules.fence = function(tokens, idx, options, env, slf) {
	const token = tokens[idx];
	const info = token.info ? unescapeAll(token.info).trim() : "";
	let langName = "";
	let langAttrs = "";
	if (info) {
		const arr = info.split(/(\s+)/g);
		langName = arr[0];
		langAttrs = arr.slice(2).join("");
	}
	let highlighted;
	if (options.highlight) highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
	else highlighted = escapeHtml(token.content);
	if (highlighted.indexOf("<pre") === 0) return highlighted + "\n";
	if (info) {
		const i = token.attrIndex("class");
		const tmpAttrs = token.attrs ? token.attrs.slice() : [];
		if (i < 0) tmpAttrs.push(["class", `${options.langPrefix}${langName}`]);
		else {
			tmpAttrs[i] = [tmpAttrs[i][0], tmpAttrs[i][1]];
			tmpAttrs[i][1] += ` ${options.langPrefix}${langName}`;
		}
		const tmpToken = { attrs: tmpAttrs };
		return `<pre><code${slf.renderAttrs(tmpToken)}>${highlighted}</code></pre>\n`;
	}
	return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>\n`;
};
default_rules.image = function(tokens, idx, options, env, slf) {
	const token = tokens[idx];
	token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
	return slf.renderToken(tokens, idx, options);
};
default_rules.hardbreak = function(tokens, idx, options) {
	return options.xhtmlOut ? "<br />\n" : "<br>\n";
};
default_rules.softbreak = function(tokens, idx, options) {
	return options.breaks ? options.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
};
default_rules.text = function(tokens, idx) {
	return escapeHtml(tokens[idx].content);
};
default_rules.html_block = function(tokens, idx) {
	return tokens[idx].content;
};
default_rules.html_inline = function(tokens, idx) {
	return tokens[idx].content;
};
/**
* Generates HTML from parsed token stream. Each instance has independent
* copy of rules. Those can be rewritten with ease. Also, you can add new
* rules if you create plugin and adds new token types.
*
* Creates new renderer instance and fills {@link Renderer.rules} with defaults.
*/
var Renderer = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* Contains render rules for tokens. Can be updated and extended.
			*
			* See [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts)
			* for more details and examples.
			*
			* @example Custom render rules
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* md.renderer.rules.strong_open  = function () { return '<b>'; };
			* md.renderer.rules.strong_close = function () { return '</b>'; };
			*
			* const result = md.renderInline(...);
			* ```
			*
			* @example Each rule is called as independent static function with fixed signature
			* ```javascript
			* function my_token_render(tokens, idx, options, env, renderer) {
			*   // ...
			*   return renderedHTML;
			* }
			* ```
			*/
			"rules",
			Object.assign({}, default_rules)
		);
	}
	/**
	* Render token attributes to string.
	*/
	renderAttrs(token) {
		let i, l, result;
		if (!token.attrs) return "";
		result = "";
		for (i = 0, l = token.attrs.length; i < l; i++) result += ` ${escapeHtml(token.attrs[i][0])}="${escapeHtml(String(token.attrs[i][1]))}"`;
		return result;
	}
	/**
	* Default token renderer. Can be overriden by custom function
	* in {@link Renderer.rules}.
	*/
	renderToken(tokens, idx, options) {
		const token = tokens[idx];
		let result = "";
		if (token.hidden) return "";
		let prev = idx - 1;
		while (prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === 0) prev--;
		if (token.block && token.nesting !== -1 && prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === -1) result += "\n";
		result += (token.nesting === -1 ? "</" : "<") + token.tag;
		result += this.renderAttrs(token);
		if (token.nesting === 0 && options.xhtmlOut) result += " /";
		let needLf = false;
		if (token.block) {
			needLf = true;
			if (token.nesting === 1) {
				let next = idx + 1;
				while (next < tokens.length && tokens[next].hidden && tokens[next].nesting === 0) next++;
				if (next < tokens.length) {
					const nextToken = tokens[next];
					if (nextToken.type === "inline" || nextToken.hidden) needLf = false;
					else if (nextToken.nesting === -1 && nextToken.tag === token.tag) needLf = false;
				}
			}
		}
		result += needLf ? ">\n" : ">";
		return result;
	}
	/**
	* The same as {@link Renderer.render}, but for single token of `inline` type.
	*/
	renderInline(tokens, options, env) {
		let result = "";
		const rules = this.rules;
		for (let i = 0, len = tokens.length; i < len; i++) {
			const type = tokens[i].type;
			if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
			else result += this.renderToken(tokens, i, options);
		}
		return result;
	}
	/**
	* Special kludge for image `alt` attributes to conform CommonMark spec.
	* Don't try to use it! Spec requires to show `alt` content with stripped markup,
	* instead of simple escaping.
	*/
	renderInlineAsText(tokens, options, env) {
		let result = "";
		for (let i = 0, len = tokens.length; i < len; i++) switch (tokens[i].type) {
			case "text":
			case "code_inline":
				result += tokens[i].content;
				break;
			case "image":
				result += this.renderInlineAsText(tokens[i].children, options, env);
				break;
			case "html_inline":
			case "html_block":
				result += tokens[i].content;
				break;
			case "softbreak":
			case "hardbreak": result += "\n";
		}
		return result;
	}
	/**
	* Takes token stream and generates HTML. Probably, you will never need to call
	* this method directly.
	*/
	render(tokens, options, env) {
		let result = "";
		const rules = this.rules;
		for (let i = 0, len = tokens.length; i < len; i++) {
			const type = tokens[i].type;
			if (type === "inline") result += this.renderInline(tokens[i].children, options, env);
			else if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
			else result += this.renderToken(tokens, i, options);
		}
		return result;
	}
};
//#endregion
//#region src/rules_core/state_core.ts
/** Mutable state passed through the core rules chain. */
var StateCore = class {
	constructor(src, md, env) {
		_defineProperty(this, "tokens", []);
		_defineProperty(this, "inlineMode", false);
		_defineProperty(this, "Token", Token);
		this.src = src;
		this.env = env;
		this.md = md;
	}
};
//#endregion
//#region src/rules_core/normalize.ts
var UNNORMALIZED_NEWLINE_RE = /\r\n?/g;
var NULL_RE = /\0/g;
function normalize(state) {
	let str;
	str = state.src.replace(UNNORMALIZED_NEWLINE_RE, "\n");
	str = str.replace(NULL_RE, "�");
	state.src = str;
}
//#endregion
//#region src/rules_core/block.ts
function block(state) {
	let token;
	if (state.inlineMode) {
		token = new state.Token("inline", "", 0);
		token.content = state.src;
		token.map = [0, 1];
		token.children = [];
		state.tokens.push(token);
	} else state.md.block.parse(state.src, state.md, state.env, state.tokens);
}
//#endregion
//#region src/rules_core/strip_references.ts
function strip_references(state) {
	const tokens = state.tokens;
	let last = 0;
	for (let curr = 0; curr < tokens.length; curr++) {
		if (tokens[curr].type === "reference_definition") continue;
		if (curr !== last) tokens[last] = tokens[curr];
		last++;
	}
	if (tokens.length !== last) tokens.length = last;
}
//#endregion
//#region src/rules_core/inline.ts
function inline(state) {
	const tokens = state.tokens;
	for (let i = 0, l = tokens.length; i < l; i++) {
		const tok = tokens[i];
		if (tok.type === "inline") state.md.inline.parse(tok.content, state.md, state.env, tok.children);
	}
}
//#endregion
//#region src/rules_core/linkify.ts
function isLinkOpen$1(str) {
	return /^<a[>\s]/i.test(str);
}
function isLinkClose$1(str) {
	return /^<\/a\s*>/i.test(str);
}
function linkify$1(state) {
	const blockTokens = state.tokens;
	if (!state.md.options.linkify) return;
	for (let j = 0, l = blockTokens.length; j < l; j++) {
		if (blockTokens[j].type !== "inline" || !state.md.linkify.test(blockTokens[j].content)) continue;
		const tokens = blockTokens[j].children;
		const replacements = [];
		let htmlLinkLevel = 0;
		for (let i = tokens.length - 1; i >= 0; i--) {
			const currentToken = tokens[i];
			if (currentToken.type === "link_close") {
				i--;
				while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") i--;
				continue;
			}
			if (currentToken.type === "html_inline") {
				if (isLinkOpen$1(currentToken.content) && htmlLinkLevel > 0) htmlLinkLevel--;
				if (isLinkClose$1(currentToken.content)) htmlLinkLevel++;
			}
			if (htmlLinkLevel > 0) continue;
			if (currentToken.type === "text" && state.md.linkify.test(currentToken.content)) {
				const text = currentToken.content;
				let links = state.md.linkify.match(text);
				const nodes = [];
				let level = currentToken.level;
				let lastPos = 0;
				if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") links = links.slice(1);
				for (let ln = 0; ln < links.length; ln++) {
					const url = links[ln].url;
					const fullUrl = state.md.normalizeLink(url);
					if (!state.md.validateLink(fullUrl)) continue;
					let urlText = links[ln].text;
					if (!links[ln].schema) urlText = state.md.normalizeLinkText(`http://${urlText}`).replace(/^http:\/\//, "");
					else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) urlText = state.md.normalizeLinkText(`mailto:${urlText}`).replace(/^mailto:/, "");
					else urlText = state.md.normalizeLinkText(urlText);
					const pos = links[ln].index;
					if (pos > lastPos) {
						const token = new state.Token("text", "", 0);
						token.content = text.slice(lastPos, pos);
						token.level = level;
						nodes.push(token);
					}
					const token_o = new state.Token("link_open", "a", 1);
					token_o.attrs = [["href", fullUrl]];
					token_o.level = level++;
					token_o.markup = "linkify";
					token_o.info = "auto";
					nodes.push(token_o);
					const token_t = new state.Token("text", "", 0);
					token_t.content = urlText;
					token_t.level = level;
					nodes.push(token_t);
					const token_c = new state.Token("link_close", "a", -1);
					token_c.level = --level;
					token_c.markup = "linkify";
					token_c.info = "auto";
					nodes.push(token_c);
					lastPos = links[ln].lastIndex;
				}
				if (lastPos < text.length) {
					const token = new state.Token("text", "", 0);
					token.content = text.slice(lastPos);
					token.level = level;
					nodes.push(token);
				}
				replacements.push({
					index: i,
					nodes
				});
			}
		}
		if (replacements.length > 0) {
			let newTokensLength = tokens.length;
			for (const replacement of replacements) newTokensLength += replacement.nodes.length - 1;
			const newTokens = new Array(newTokensLength);
			let replacementIndex = 0;
			let newTokenIndex = 0;
			replacements.reverse();
			for (let i = 0; i < tokens.length; i++) {
				const replacement = replacements[replacementIndex];
				if ((replacement === null || replacement === void 0 ? void 0 : replacement.index) === i) {
					for (const node of replacement.nodes) newTokens[newTokenIndex++] = node;
					replacementIndex++;
				} else newTokens[newTokenIndex++] = tokens[i];
			}
			blockTokens[j].children = newTokens;
		}
	}
}
//#endregion
//#region src/rules_core/replacements.ts
var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;
var SCOPED_ABBR_RE = /\((c|tm|r)\)/gi;
var SCOPED_ABBR = {
	c: "©",
	r: "®",
	tm: "™"
};
function replaceFn(match, name) {
	return SCOPED_ABBR[name.toLowerCase()];
}
function replace_scoped(inlineTokens) {
	let inside_autolink = 0;
	for (let i = inlineTokens.length - 1; i >= 0; i--) {
		const token = inlineTokens[i];
		if (token.type === "text" && !inside_autolink) token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
		if (token.type === "link_open" && token.info === "auto") inside_autolink--;
		if (token.type === "link_close" && token.info === "auto") inside_autolink++;
	}
}
function replace_rare(inlineTokens) {
	let inside_autolink = 0;
	for (let i = inlineTokens.length - 1; i >= 0; i--) {
		const token = inlineTokens[i];
		if (token.type === "text" && !inside_autolink) {
			if (RARE_RE.test(token.content)) token.content = token.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–");
		}
		if (token.type === "link_open" && token.info === "auto") inside_autolink--;
		if (token.type === "link_close" && token.info === "auto") inside_autolink++;
	}
}
function replace(state) {
	let blkIdx;
	if (!state.md.options.typographer) return;
	for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
		if (state.tokens[blkIdx].type !== "inline") continue;
		if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) replace_scoped(state.tokens[blkIdx].children);
		if (RARE_RE.test(state.tokens[blkIdx].content)) replace_rare(state.tokens[blkIdx].children);
	}
}
//#endregion
//#region src/rules_core/smartquotes.ts
var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var APOSTROPHE = "’";
var MAX_OPENERS = 1e3;
function truncateStack(stack, heads, length) {
	while (stack.length > length) {
		const item = stack.pop();
		if (item.isSingleQuote) heads.single = item.prevSameQuoteIdx;
		else heads.double = item.prevSameQuoteIdx;
	}
}
function addReplacement(replacements, tokenIdx, pos, ch) {
	if (!replacements[tokenIdx]) replacements[tokenIdx] = [];
	replacements[tokenIdx].push({
		pos,
		ch
	});
}
function applyReplacements(str, replacements) {
	let result = "";
	let lastPos = 0;
	replacements.sort((a, b) => a.pos - b.pos);
	for (let i = 0; i < replacements.length; i++) {
		const replacement = replacements[i];
		result += str.slice(lastPos, replacement.pos) + replacement.ch;
		lastPos = replacement.pos + 1;
	}
	return result + str.slice(lastPos);
}
function process_inlines(tokens, state) {
	let j;
	const stack = [];
	const heads = {
		single: -1,
		double: -1
	};
	const replacements = {};
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		const thisLevel = tokens[i].level;
		for (j = stack.length - 1; j >= 0; j--) if (stack[j].level <= thisLevel) break;
		truncateStack(stack, heads, j + 1);
		if (token.type !== "text") continue;
		const text = token.content;
		let pos = 0;
		const max = text.length;
		OUTER: while (pos < max) {
			QUOTE_RE.lastIndex = pos;
			const t = QUOTE_RE.exec(text);
			if (!t) break;
			let canOpen = true;
			let canClose = true;
			pos = t.index + 1;
			const isSingle = t[0] === "'";
			let lastChar = 32;
			if (t.index - 1 >= 0) lastChar = text.charCodeAt(t.index - 1);
			else for (j = i - 1; j >= 0; j--) {
				if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
				if (!tokens[j].content) continue;
				lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
				break;
			}
			let nextChar = 32;
			if (pos < max) nextChar = text.charCodeAt(pos);
			else for (j = i + 1; j < tokens.length; j++) {
				if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
				if (!tokens[j].content) continue;
				nextChar = tokens[j].content.charCodeAt(0);
				break;
			}
			const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
			const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
			const isLastWhiteSpace = isWhiteSpace(lastChar);
			const isNextWhiteSpace = isWhiteSpace(nextChar);
			if (isNextWhiteSpace) canOpen = false;
			else if (isNextPunctChar) {
				if (!(isLastWhiteSpace || isLastPunctChar)) canOpen = false;
			}
			if (isLastWhiteSpace) canClose = false;
			else if (isLastPunctChar) {
				if (!(isNextWhiteSpace || isNextPunctChar)) canClose = false;
			}
			if (nextChar === 34 && t[0] === "\"") {
				if (lastChar >= 48 && lastChar <= 57) canClose = canOpen = false;
			}
			if (canOpen && canClose) {
				canOpen = isLastPunctChar;
				canClose = isNextPunctChar;
			}
			if (!canOpen && !canClose) {
				if (isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
				continue;
			}
			if (canClose) {
				j = isSingle ? heads.single : heads.double;
				if (j >= 0 && stack[j].level === thisLevel) {
					const item = stack[j];
					let openQuote;
					let closeQuote;
					if (isSingle) {
						openQuote = state.md.options.quotes[2];
						closeQuote = state.md.options.quotes[3];
					} else {
						openQuote = state.md.options.quotes[0];
						closeQuote = state.md.options.quotes[1];
					}
					addReplacement(replacements, i, t.index, closeQuote);
					addReplacement(replacements, item.tokenIdx, item.contentPos, openQuote);
					truncateStack(stack, heads, j);
					continue OUTER;
				}
			}
			if (canOpen) {
				if (stack.length >= MAX_OPENERS) return;
				stack.push({
					tokenIdx: i,
					contentPos: t.index,
					isSingleQuote: isSingle,
					level: thisLevel,
					prevSameQuoteIdx: isSingle ? heads.single : heads.double
				});
				if (isSingle) heads.single = stack.length - 1;
				else heads.double = stack.length - 1;
			} else if (canClose && isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
		}
	}
	Object.keys(replacements).forEach(function(tokenIdx) {
		const idx = Number(tokenIdx);
		tokens[idx].content = applyReplacements(tokens[idx].content, replacements[tokenIdx]);
	});
}
function smartquotes(state) {
	if (!state.md.options.typographer) return;
	for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
		if (state.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) continue;
		process_inlines(state.tokens[blkIdx].children, state);
	}
}
//#endregion
//#region src/rules_core/text_join.ts
function join_alt(tokens) {
	let curr, last;
	const max = tokens.length;
	for (curr = 0; curr < max; curr++) if (tokens[curr].type === "text_special") tokens[curr].type = "text";
	for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
	else {
		if (curr !== last) tokens[last] = tokens[curr];
		last++;
	}
	if (curr !== last) tokens.length = last;
}
function text_join(state) {
	let curr, last;
	const blockTokens = state.tokens;
	const l = blockTokens.length;
	for (let j = 0; j < l; j++) {
		if (blockTokens[j].type !== "inline") continue;
		const tokens = blockTokens[j].children;
		const max = tokens.length;
		for (curr = 0; curr < max; curr++) {
			if (tokens[curr].type === "text_special") tokens[curr].type = "text";
			if (tokens[curr].children) join_alt(tokens[curr].children);
		}
		for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
		else {
			if (curr !== last) tokens[last] = tokens[curr];
			last++;
		}
		if (curr !== last) tokens.length = last;
	}
}
//#endregion
//#region src/parser_core.ts
var _rules$2 = [
	["normalize", normalize],
	["block", block],
	["strip_references", strip_references],
	["inline", inline],
	["linkify", linkify$1],
	["replacements", replace],
	["smartquotes", smartquotes],
	["text_join", text_join]
];
/**
* Top-level rules executor. Glues block/inline parsers and does intermediate
* transformations.
*/
var ParserCore = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* {@link Ruler} instance. Keep configuration of core rules.
			*/
			"ruler",
			new Ruler()
		);
		_defineProperty(this, "State", StateCore);
		for (let i = 0; i < _rules$2.length; i++) this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
	}
	/**
	* Executes core chain rules.
	*/
	process(state) {
		const rules = this.ruler.getRules("");
		for (let i = 0, l = rules.length; i < l; i++) rules[i](state);
	}
};
//#endregion
//#region src/rules_block/state_block.ts
/** Mutable state passed to block rules while tokenizing a source document. */
var StateBlock = class {
	constructor(src, md, env, tokens) {
		_defineProperty(this, "bMarks", []);
		_defineProperty(this, "eMarks", []);
		_defineProperty(this, "tShift", []);
		_defineProperty(this, "sCount", []);
		_defineProperty(this, "bsCount", []);
		_defineProperty(this, "blkIndent", 0);
		_defineProperty(this, "line", 0);
		_defineProperty(this, "lineMax", 0);
		_defineProperty(this, "tight", false);
		_defineProperty(this, "listIndent", -1);
		_defineProperty(this, "parentType", "root");
		_defineProperty(this, "level", 0);
		_defineProperty(this, "Token", Token);
		this.src = src;
		this.md = md;
		this.env = env;
		this.tokens = tokens;
		const s = this.src;
		for (let start = 0, pos = 0, indent = 0, offset = 0, len = s.length, indent_found = false; pos < len; pos++) {
			const ch = s.charCodeAt(pos);
			if (!indent_found) {
				if (isSpace(ch)) {
					indent++;
					if (ch === 9) offset += 4 - offset % 4;
					else offset++;
					continue;
				} else indent_found = true;
			}
			if (ch === 10 || pos === len - 1) {
				if (ch !== 10) pos++;
				this.bMarks.push(start);
				this.eMarks.push(pos);
				this.tShift.push(indent);
				this.sCount.push(offset);
				this.bsCount.push(0);
				indent_found = false;
				indent = 0;
				offset = 0;
				start = pos + 1;
			}
		}
		this.bMarks.push(s.length);
		this.eMarks.push(s.length);
		this.tShift.push(0);
		this.sCount.push(0);
		this.bsCount.push(0);
		this.lineMax = this.bMarks.length - 1;
	}
	push(type, tag, nesting) {
		const token = new Token(type, tag, nesting);
		token.block = true;
		if (nesting < 0) this.level--;
		token.level = this.level;
		if (nesting > 0) this.level++;
		this.tokens.push(token);
		return token;
	}
	isEmpty(line) {
		return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
	}
	skipEmptyLines(from) {
		for (let max = this.lineMax; from < max; from++) if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) break;
		return from;
	}
	skipSpaces(pos) {
		for (let max = this.src.length; pos < max; pos++) if (!isSpace(this.src.charCodeAt(pos))) break;
		return pos;
	}
	skipSpacesBack(pos, min) {
		if (pos <= min) return pos;
		while (pos > min) if (!isSpace(this.src.charCodeAt(--pos))) return pos + 1;
		return pos;
	}
	skipChars(pos, code) {
		for (let max = this.src.length; pos < max; pos++) if (this.src.charCodeAt(pos) !== code) break;
		return pos;
	}
	skipCharsBack(pos, code, min) {
		if (pos <= min) return pos;
		while (pos > min) if (code !== this.src.charCodeAt(--pos)) return pos + 1;
		return pos;
	}
	getLines(begin, end, indent, keepLastLF) {
		if (begin >= end) return "";
		const queue = new Array(end - begin);
		for (let i = 0, line = begin; line < end; line++, i++) {
			let lineIndent = 0;
			const lineStart = this.bMarks[line];
			let first = lineStart;
			let last;
			if (line + 1 < end || keepLastLF) last = this.eMarks[line] + 1;
			else last = this.eMarks[line];
			while (first < last && lineIndent < indent) {
				const ch = this.src.charCodeAt(first);
				if (isSpace(ch)) {
					if (ch === 9) lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
					else lineIndent++;
				} else if (first - lineStart < this.tShift[line]) lineIndent++;
				else break;
				first++;
			}
			if (lineIndent > indent) queue[i] = new Array(lineIndent - indent + 1).join(" ") + this.src.slice(first, last);
			else queue[i] = this.src.slice(first, last);
		}
		return queue.join("");
	}
};
//#endregion
//#region src/rules_block/table.ts
var MAX_AUTOCOMPLETED_CELLS = 65536;
function getLine(state, line) {
	const pos = state.bMarks[line] + state.tShift[line];
	const max = state.eMarks[line];
	return state.src.slice(pos, max);
}
function escapedSplit(str) {
	const result = [];
	const max = str.length;
	let pos = 0;
	let ch = str.charCodeAt(pos);
	let isEscaped = false;
	let lastPos = 0;
	let current = "";
	while (pos < max) {
		if (ch === 124) {
			if (!isEscaped) {
				result.push(current + str.substring(lastPos, pos));
				current = "";
				lastPos = pos + 1;
			} else {
				current += str.substring(lastPos, pos - 1);
				lastPos = pos;
			}
		}
		isEscaped = ch === 92;
		pos++;
		ch = str.charCodeAt(pos);
	}
	result.push(current + str.substring(lastPos));
	return result;
}
function table(state, startLine, endLine, silent) {
	if (startLine + 2 > endLine) return false;
	let nextLine = startLine + 1;
	if (state.sCount[nextLine] < state.blkIndent) return false;
	if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
	let pos = state.bMarks[nextLine] + state.tShift[nextLine];
	if (pos >= state.eMarks[nextLine]) return false;
	const firstCh = state.src.charCodeAt(pos++);
	if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) return false;
	if (pos >= state.eMarks[nextLine]) return false;
	const secondCh = state.src.charCodeAt(pos++);
	if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) return false;
	if (firstCh === 45 && isSpace(secondCh)) return false;
	while (pos < state.eMarks[nextLine]) {
		const ch = state.src.charCodeAt(pos);
		if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) return false;
		pos++;
	}
	let lineText = getLine(state, startLine + 1);
	let columns = lineText.split("|");
	const aligns = [];
	for (let i = 0; i < columns.length; i++) {
		const t = columns[i].trim();
		if (!t) {
			if (i === 0 || i === columns.length - 1) continue;
			else return false;
		}
		if (!/^:?-+:?$/.test(t)) return false;
		if (t.charCodeAt(t.length - 1) === 58) aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
		else if (t.charCodeAt(0) === 58) aligns.push("left");
		else aligns.push("");
	}
	lineText = getLine(state, startLine).trim();
	if (lineText.indexOf("|") === -1) return false;
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	columns = escapedSplit(lineText);
	if (columns.length && columns[0] === "") columns.shift();
	if (columns.length && columns[columns.length - 1] === "") columns.pop();
	const columnCount = columns.length;
	if (columnCount === 0 || columnCount !== aligns.length) return false;
	if (silent) return true;
	const oldParentType = state.parentType;
	state.parentType = "table";
	const terminatorRules = state.md.block.ruler.getRules("blockquote");
	const token_to = state.push("table_open", "table", 1);
	const tableLines = [startLine, 0];
	token_to.map = tableLines;
	const token_tho = state.push("thead_open", "thead", 1);
	token_tho.map = [startLine, startLine + 1];
	const token_htro = state.push("tr_open", "tr", 1);
	token_htro.map = [startLine, startLine + 1];
	for (let i = 0; i < columns.length; i++) {
		const token_ho = state.push("th_open", "th", 1);
		if (aligns[i]) token_ho.attrs = [["style", `text-align:${aligns[i]}`]];
		const token_il = state.push("inline", "", 0);
		token_il.content = columns[i].trim();
		token_il.children = [];
		state.push("th_close", "th", -1);
	}
	state.push("tr_close", "tr", -1);
	state.push("thead_close", "thead", -1);
	let tbodyLines;
	let autocompletedCells = 0;
	for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
		if (state.sCount[nextLine] < state.blkIndent) break;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) break;
		lineText = getLine(state, nextLine).trim();
		if (!lineText) break;
		if (state.sCount[nextLine] - state.blkIndent >= 4) break;
		columns = escapedSplit(lineText);
		if (columns.length && columns[0] === "") columns.shift();
		if (columns.length && columns[columns.length - 1] === "") columns.pop();
		autocompletedCells += columnCount - columns.length;
		if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) break;
		if (nextLine === startLine + 2) {
			const token_tbo = state.push("tbody_open", "tbody", 1);
			token_tbo.map = tbodyLines = [startLine + 2, 0];
		}
		const token_tro = state.push("tr_open", "tr", 1);
		token_tro.map = [nextLine, nextLine + 1];
		for (let i = 0; i < columnCount; i++) {
			const token_tdo = state.push("td_open", "td", 1);
			if (aligns[i]) token_tdo.attrs = [["style", `text-align:${aligns[i]}`]];
			const token_il = state.push("inline", "", 0);
			token_il.content = columns[i] ? columns[i].trim() : "";
			token_il.children = [];
			state.push("td_close", "td", -1);
		}
		state.push("tr_close", "tr", -1);
	}
	if (tbodyLines) {
		state.push("tbody_close", "tbody", -1);
		tbodyLines[1] = nextLine;
	}
	state.push("table_close", "table", -1);
	tableLines[1] = nextLine;
	state.parentType = oldParentType;
	state.line = nextLine;
	return true;
}
//#endregion
//#region src/rules_block/code.ts
function code(state, startLine, endLine) {
	if (state.sCount[startLine] - state.blkIndent < 4) return false;
	let nextLine = startLine + 1;
	let last = nextLine;
	while (nextLine < endLine) {
		if (state.isEmpty(nextLine)) {
			nextLine++;
			continue;
		}
		if (state.sCount[nextLine] - state.blkIndent >= 4) {
			nextLine++;
			last = nextLine;
			continue;
		}
		break;
	}
	state.line = last;
	const token = state.push("code_block", "code", 0);
	token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + "\n";
	token.map = [startLine, state.line];
	return true;
}
//#endregion
//#region src/rules_block/fence.ts
function fence(state, startLine, endLine, silent) {
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let max = state.eMarks[startLine];
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	if (pos + 3 > max) return false;
	const marker = state.src.charCodeAt(pos);
	if (marker !== 126 && marker !== 96) return false;
	let mem = pos;
	pos = state.skipChars(pos, marker);
	let len = pos - mem;
	if (len < 3) return false;
	const markup = state.src.slice(mem, pos);
	const params = state.src.slice(pos, max);
	if (marker === 96) {
		if (params.indexOf(String.fromCharCode(marker)) >= 0) return false;
	}
	if (silent) return true;
	let nextLine = startLine;
	let haveEndMarker = false;
	for (;;) {
		nextLine++;
		if (nextLine >= endLine) break;
		pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
		max = state.eMarks[nextLine];
		if (pos < max && state.sCount[nextLine] < state.blkIndent) break;
		if (state.src.charCodeAt(pos) !== marker) continue;
		if (state.sCount[nextLine] - state.blkIndent >= 4) continue;
		pos = state.skipChars(pos, marker);
		if (pos - mem < len) continue;
		pos = state.skipSpaces(pos);
		if (pos < max) continue;
		haveEndMarker = true;
		break;
	}
	len = state.sCount[startLine];
	state.line = nextLine + (haveEndMarker ? 1 : 0);
	const token = state.push("fence", "code", 0);
	token.info = params;
	token.content = state.getLines(startLine + 1, nextLine, len, true);
	token.markup = markup;
	token.map = [startLine, state.line];
	return true;
}
//#endregion
//#region src/rules_block/blockquote.ts
function blockquote(state, startLine, endLine, silent) {
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let max = state.eMarks[startLine];
	const oldLineMax = state.lineMax;
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	if (state.src.charCodeAt(pos) !== 62) return false;
	if (silent) return true;
	const oldBMarks = [];
	const oldBSCount = [];
	const oldSCount = [];
	const oldTShift = [];
	const terminatorRules = state.md.block.ruler.getRules("blockquote");
	const oldParentType = state.parentType;
	state.parentType = "blockquote";
	let lastLineEmpty = false;
	let nextLine;
	for (nextLine = startLine; nextLine < endLine; nextLine++) {
		const isOutdented = state.sCount[nextLine] < state.blkIndent;
		pos = state.bMarks[nextLine] + state.tShift[nextLine];
		max = state.eMarks[nextLine];
		if (pos >= max) break;
		if (state.src.charCodeAt(pos++) === 62 && !isOutdented) {
			let initial = state.sCount[nextLine] + 1;
			let spaceAfterMarker;
			let adjustTab;
			if (state.src.charCodeAt(pos) === 32) {
				pos++;
				initial++;
				adjustTab = false;
				spaceAfterMarker = true;
			} else if (state.src.charCodeAt(pos) === 9) {
				spaceAfterMarker = true;
				if ((state.bsCount[nextLine] + initial) % 4 === 3) {
					pos++;
					initial++;
					adjustTab = false;
				} else adjustTab = true;
			} else spaceAfterMarker = false;
			let offset = initial;
			oldBMarks.push(state.bMarks[nextLine]);
			state.bMarks[nextLine] = pos;
			while (pos < max) {
				const ch = state.src.charCodeAt(pos);
				if (isSpace(ch)) {
					if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
					else offset++;
				} else break;
				pos++;
			}
			lastLineEmpty = pos >= max;
			oldBSCount.push(state.bsCount[nextLine]);
			state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
			oldSCount.push(state.sCount[nextLine]);
			state.sCount[nextLine] = offset - initial;
			oldTShift.push(state.tShift[nextLine]);
			state.tShift[nextLine] = pos - state.bMarks[nextLine];
			continue;
		}
		if (lastLineEmpty) break;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) {
			state.lineMax = nextLine;
			if (state.blkIndent !== 0) {
				oldBMarks.push(state.bMarks[nextLine]);
				oldBSCount.push(state.bsCount[nextLine]);
				oldTShift.push(state.tShift[nextLine]);
				oldSCount.push(state.sCount[nextLine]);
				state.sCount[nextLine] -= state.blkIndent;
			}
			break;
		}
		oldBMarks.push(state.bMarks[nextLine]);
		oldBSCount.push(state.bsCount[nextLine]);
		oldTShift.push(state.tShift[nextLine]);
		oldSCount.push(state.sCount[nextLine]);
		state.sCount[nextLine] = -1;
	}
	const oldIndent = state.blkIndent;
	state.blkIndent = 0;
	const token_o = state.push("blockquote_open", "blockquote", 1);
	token_o.markup = ">";
	const lines = [startLine, 0];
	token_o.map = lines;
	state.md.block.tokenize(state, startLine, nextLine);
	const token_c = state.push("blockquote_close", "blockquote", -1);
	token_c.markup = ">";
	state.lineMax = oldLineMax;
	state.parentType = oldParentType;
	lines[1] = state.line;
	for (let i = 0; i < oldTShift.length; i++) {
		state.bMarks[i + startLine] = oldBMarks[i];
		state.tShift[i + startLine] = oldTShift[i];
		state.sCount[i + startLine] = oldSCount[i];
		state.bsCount[i + startLine] = oldBSCount[i];
	}
	state.blkIndent = oldIndent;
	return true;
}
//#endregion
//#region src/rules_block/hr.ts
function hr(state, startLine, endLine, silent) {
	const max = state.eMarks[startLine];
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	const marker = state.src.charCodeAt(pos++);
	if (marker !== 42 && marker !== 45 && marker !== 95) return false;
	let cnt = 1;
	while (pos < max) {
		const ch = state.src.charCodeAt(pos++);
		if (ch !== marker && !isSpace(ch)) return false;
		if (ch === marker) cnt++;
	}
	if (cnt < 3) return false;
	if (silent) return true;
	state.line = startLine + 1;
	const token = state.push("hr", "hr", 0);
	token.map = [startLine, state.line];
	token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
	return true;
}
//#endregion
//#region src/rules_block/list.ts
function skipBulletListMarker(state, startLine) {
	const max = state.eMarks[startLine];
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	const marker = state.src.charCodeAt(pos++);
	if (marker !== 42 && marker !== 45 && marker !== 43) return -1;
	if (pos < max) {
		if (!isSpace(state.src.charCodeAt(pos))) return -1;
	}
	return pos;
}
function skipOrderedListMarker(state, startLine) {
	const start = state.bMarks[startLine] + state.tShift[startLine];
	const max = state.eMarks[startLine];
	let pos = start;
	if (pos + 1 >= max) return -1;
	let ch = state.src.charCodeAt(pos++);
	if (ch < 48 || ch > 57) return -1;
	for (;;) {
		if (pos >= max) return -1;
		ch = state.src.charCodeAt(pos++);
		if (ch >= 48 && ch <= 57) {
			if (pos - start >= 10) return -1;
			continue;
		}
		if (ch === 41 || ch === 46) break;
		return -1;
	}
	if (pos < max) {
		ch = state.src.charCodeAt(pos);
		if (!isSpace(ch)) return -1;
	}
	return pos;
}
function markTightParagraphs(state, idx) {
	const level = state.level + 2;
	for (let i = idx + 2, l = state.tokens.length - 2; i < l; i++) if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
		state.tokens[i + 2].hidden = true;
		state.tokens[i].hidden = true;
		i += 2;
	}
}
function list(state, startLine, endLine, silent) {
	let max, pos, start, token;
	let nextLine = startLine;
	let tight = true;
	if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
	if (state.listIndent >= 0 && state.sCount[nextLine] - state.listIndent >= 4 && state.sCount[nextLine] < state.blkIndent) return false;
	let isTerminatingParagraph = false;
	if (silent && state.parentType === "paragraph") {
		if (state.sCount[nextLine] >= state.blkIndent) isTerminatingParagraph = true;
	}
	let isOrdered;
	let markerValue;
	let posAfterMarker;
	if ((posAfterMarker = skipOrderedListMarker(state, nextLine)) >= 0) {
		isOrdered = true;
		start = state.bMarks[nextLine] + state.tShift[nextLine];
		markerValue = Number(state.src.slice(start, posAfterMarker - 1));
		if (isTerminatingParagraph && markerValue !== 1) return false;
	} else if ((posAfterMarker = skipBulletListMarker(state, nextLine)) >= 0) isOrdered = false;
	else return false;
	if (isTerminatingParagraph) {
		if (state.skipSpaces(posAfterMarker) >= state.eMarks[nextLine]) return false;
	}
	if (silent) return true;
	const markerCharCode = state.src.charCodeAt(posAfterMarker - 1);
	const listTokIdx = state.tokens.length;
	if (isOrdered) {
		token = state.push("ordered_list_open", "ol", 1);
		if (markerValue !== 1) token.attrs = [["start", markerValue]];
	} else token = state.push("bullet_list_open", "ul", 1);
	const listLines = [nextLine, 0];
	token.map = listLines;
	token.markup = String.fromCharCode(markerCharCode);
	let prevEmptyEnd = false;
	const terminatorRules = state.md.block.ruler.getRules("list");
	const oldParentType = state.parentType;
	state.parentType = "list";
	while (nextLine < endLine) {
		pos = posAfterMarker;
		max = state.eMarks[nextLine];
		const initial = state.sCount[nextLine] + posAfterMarker - (state.bMarks[nextLine] + state.tShift[nextLine]);
		let offset = initial;
		while (pos < max) {
			const ch = state.src.charCodeAt(pos);
			if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine]) % 4;
			else if (ch === 32) offset++;
			else break;
			pos++;
		}
		const contentStart = pos;
		let indentAfterMarker;
		if (contentStart >= max) indentAfterMarker = 1;
		else indentAfterMarker = offset - initial;
		if (indentAfterMarker > 4) indentAfterMarker = 1;
		const indent = initial + indentAfterMarker;
		token = state.push("list_item_open", "li", 1);
		token.markup = String.fromCharCode(markerCharCode);
		const itemLines = [nextLine, 0];
		token.map = itemLines;
		if (isOrdered) token.info = state.src.slice(start, posAfterMarker - 1);
		const oldTight = state.tight;
		const oldTShift = state.tShift[nextLine];
		const oldSCount = state.sCount[nextLine];
		const oldListIndent = state.listIndent;
		state.listIndent = state.blkIndent;
		state.blkIndent = indent;
		state.tight = true;
		state.tShift[nextLine] = contentStart - state.bMarks[nextLine];
		state.sCount[nextLine] = offset;
		if (contentStart >= max && state.isEmpty(nextLine + 1)) state.line = Math.min(state.line + 2, endLine);
		else state.md.block.tokenize(state, nextLine, endLine);
		if (!state.tight || prevEmptyEnd) tight = false;
		prevEmptyEnd = state.line - nextLine > 1 && state.isEmpty(state.line - 1);
		state.blkIndent = state.listIndent;
		state.listIndent = oldListIndent;
		state.tShift[nextLine] = oldTShift;
		state.sCount[nextLine] = oldSCount;
		state.tight = oldTight;
		token = state.push("list_item_close", "li", -1);
		token.markup = String.fromCharCode(markerCharCode);
		nextLine = state.line;
		itemLines[1] = nextLine;
		if (nextLine >= endLine) break;
		if (state.sCount[nextLine] < state.blkIndent) break;
		if (state.sCount[nextLine] - state.blkIndent >= 4) break;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) break;
		if (isOrdered) {
			posAfterMarker = skipOrderedListMarker(state, nextLine);
			if (posAfterMarker < 0) break;
			start = state.bMarks[nextLine] + state.tShift[nextLine];
		} else {
			posAfterMarker = skipBulletListMarker(state, nextLine);
			if (posAfterMarker < 0) break;
		}
		if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) break;
	}
	if (isOrdered) token = state.push("ordered_list_close", "ol", -1);
	else token = state.push("bullet_list_close", "ul", -1);
	token.markup = String.fromCharCode(markerCharCode);
	listLines[1] = nextLine;
	state.line = nextLine;
	state.parentType = oldParentType;
	if (tight) markTightParagraphs(state, listTokIdx);
	return true;
}
//#endregion
//#region src/rules_block/reference.ts
var MAX_LABEL_LENGTH = 999;
function countCodePoints(str) {
	let length = str.length;
	for (let i = 0; i < str.length - 1; i++) {
		const high = str.charCodeAt(i);
		if (high < 55296 || high > 56319) continue;
		const low = str.charCodeAt(i + 1);
		if (low >= 56320 && low <= 57343) {
			length--;
			i++;
		}
	}
	return length;
}
function lineEnd(state, line) {
	return Math.min(state.eMarks[line] + 1, state.src.length);
}
function getNextLinePos(state, nextLine) {
	const endLine = state.lineMax;
	if (nextLine >= endLine || state.isEmpty(nextLine)) return -1;
	let isContinuation = false;
	if (state.sCount[nextLine] - state.blkIndent > 3) isContinuation = true;
	if (state.sCount[nextLine] < 0) isContinuation = true;
	if (!isContinuation) {
		const terminatorRules = state.md.block.ruler.getRules("reference");
		const oldParentType = state.parentType;
		state.parentType = "reference";
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		state.parentType = oldParentType;
		if (terminate) return -1;
	}
	return state.bMarks[nextLine] + state.tShift[nextLine];
}
function reference(state, startLine, _endLine, silent) {
	const src = state.src;
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let nextLine = startLine + 1;
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	if (src.charCodeAt(pos) !== 91) return false;
	let max = lineEnd(state, startLine);
	let rawLabel = "";
	let labelEnd = -1;
	let segmentStart = ++pos;
	while (pos < max) {
		if (rawLabel.length + pos - segmentStart > MAX_LABEL_LENGTH * 2) return false;
		let ch = src.charCodeAt(pos);
		if (ch === 91) return false;
		if (ch === 93) {
			labelEnd = pos;
			break;
		}
		if (ch === 92) ch = src.charCodeAt(++pos);
		if (ch === 10 && pos < max) {
			const nextPos = getNextLinePos(state, nextLine);
			if (nextPos < 0) return false;
			rawLabel += src.slice(segmentStart, max);
			pos = segmentStart = nextPos;
			max = lineEnd(state, nextLine++);
			continue;
		}
		pos++;
	}
	if (labelEnd < 0 || src.charCodeAt(labelEnd + 1) !== 58) return false;
	rawLabel += src.slice(segmentStart, labelEnd);
	if (rawLabel.length > MAX_LABEL_LENGTH && countCodePoints(rawLabel) > MAX_LABEL_LENGTH) return false;
	pos = labelEnd + 2;
	while (pos < max) {
		const ch = src.charCodeAt(pos);
		if (ch === 10) {
			const nextPos = getNextLinePos(state, nextLine);
			if (nextPos < 0) break;
			pos = nextPos;
			max = lineEnd(state, nextLine++);
		} else if (isSpace(ch)) pos++;
		else break;
	}
	const destRes = state.md.helpers.parseLinkDestination(src, pos, max);
	if (!destRes.ok) return false;
	const href = state.md.normalizeLink(destRes.str);
	if (!state.md.validateLink(href)) return false;
	pos = destRes.pos;
	const destEndPos = pos;
	const destEndMax = max;
	const destEndLineNo = nextLine;
	while (pos < max) {
		const ch = src.charCodeAt(pos);
		if (ch === 10) {
			const nextPos = getNextLinePos(state, nextLine);
			if (nextPos < 0) break;
			pos = nextPos;
			max = lineEnd(state, nextLine++);
		} else if (isSpace(ch)) pos++;
		else break;
	}
	const titleStart = pos;
	let titleRes = state.md.helpers.parseLinkTitle(src, pos, max);
	while (titleRes.can_continue) {
		const nextPos = getNextLinePos(state, nextLine);
		if (nextPos < 0) break;
		pos = nextPos;
		max = lineEnd(state, nextLine++);
		titleRes = state.md.helpers.parseLinkTitle(src, pos, max, titleRes);
	}
	let title;
	if (titleStart !== destEndPos && titleRes.ok) {
		title = titleRes.str;
		pos = titleRes.pos;
	} else {
		title = "";
		pos = destEndPos;
		max = destEndMax;
		nextLine = destEndLineNo;
	}
	while (pos < max) {
		if (!isSpace(src.charCodeAt(pos))) break;
		pos++;
	}
	if (pos < max && src.charCodeAt(pos) !== 10) {
		if (title) {
			title = "";
			pos = destEndPos;
			max = destEndMax;
			nextLine = destEndLineNo;
			while (pos < max) {
				if (!isSpace(src.charCodeAt(pos))) break;
				pos++;
			}
		}
	}
	if (pos < max && src.charCodeAt(pos) !== 10) return false;
	const label = normalizeReference(rawLabel);
	if (!label) return false;
	/* istanbul ignore if */
	if (silent) return true;
	if (typeof state.env.references === "undefined") state.env.references = {};
	if (typeof state.env.references[label] === "undefined") state.env.references[label] = {
		title,
		href
	};
	const token = state.push("reference_definition", "", 0);
	token.map = [startLine, nextLine];
	token.hidden = true;
	const meta = Object.create(null);
	meta.label = label;
	token.meta = meta;
	state.line = nextLine;
	return true;
}
//#endregion
//#region src/common/html_blocks.ts
var html_blocks_default = [
	"address",
	"article",
	"aside",
	"base",
	"basefont",
	"blockquote",
	"body",
	"caption",
	"center",
	"col",
	"colgroup",
	"dd",
	"details",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"fieldset",
	"figcaption",
	"figure",
	"footer",
	"form",
	"frame",
	"frameset",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hr",
	"html",
	"iframe",
	"legend",
	"li",
	"link",
	"main",
	"menu",
	"menuitem",
	"nav",
	"noframes",
	"ol",
	"optgroup",
	"option",
	"p",
	"param",
	"search",
	"section",
	"summary",
	"table",
	"tbody",
	"td",
	"tfoot",
	"th",
	"thead",
	"title",
	"tr",
	"track",
	"ul"
];
//#endregion
//#region src/common/html_re.ts
var open_tag = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`;
var close_tag = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
new RegExp(`^(?:${open_tag}|${close_tag}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`);
var HTML_OPEN_CLOSE_TAG_RE = new RegExp(`^(?:${open_tag}|${close_tag})`);
//#endregion
//#region src/rules_block/html_block.ts
var HTML_SEQUENCES = [
	[
		/^<(script|pre|style|textarea)(?=(\s|>|$))/i,
		/<\/(script|pre|style|textarea)>/i,
		true
	],
	[
		/^<!--/,
		/-->/,
		true
	],
	[
		/^<\?/,
		/\?>/,
		true
	],
	[
		/^<![A-Za-z]/,
		/>/,
		true
	],
	[
		/^<!\[CDATA\[/,
		/\]\]>/,
		true
	],
	[
		new RegExp(`^</?(${html_blocks_default.join("|")})(?=(\\s|/?>|$))`, "i"),
		/^$/,
		true
	],
	[
		new RegExp(`${HTML_OPEN_CLOSE_TAG_RE.source}\\s*$`),
		/^$/,
		false
	]
];
function html_block(state, startLine, endLine, silent) {
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let max = state.eMarks[startLine];
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	if (!state.md.options.html) return false;
	if (state.src.charCodeAt(pos) !== 60) return false;
	let lineText = state.src.slice(pos, max);
	let i = 0;
	for (; i < HTML_SEQUENCES.length; i++) if (HTML_SEQUENCES[i][0].test(lineText)) break;
	if (i === HTML_SEQUENCES.length) return false;
	if (silent) return HTML_SEQUENCES[i][2];
	let nextLine = startLine + 1;
	const endsOnBlankLine = HTML_SEQUENCES[i][1].test("");
	if (!HTML_SEQUENCES[i][1].test(lineText)) for (; nextLine < endLine; nextLine++) {
		if (state.sCount[nextLine] < state.blkIndent) {
			if (endsOnBlankLine || !state.isEmpty(nextLine)) break;
		}
		pos = state.bMarks[nextLine] + state.tShift[nextLine];
		max = state.eMarks[nextLine];
		lineText = state.src.slice(pos, max);
		if (HTML_SEQUENCES[i][1].test(lineText)) {
			if (lineText.length !== 0) nextLine++;
			break;
		}
	}
	state.line = nextLine;
	const token = state.push("html_block", "", 0);
	token.map = [startLine, nextLine];
	token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
	return true;
}
//#endregion
//#region src/rules_block/heading.ts
function heading(state, startLine, endLine, silent) {
	let pos = state.bMarks[startLine] + state.tShift[startLine];
	let max = state.eMarks[startLine];
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	let ch = state.src.charCodeAt(pos);
	if (ch !== 35 || pos >= max) return false;
	let level = 1;
	ch = state.src.charCodeAt(++pos);
	while (ch === 35 && pos < max && level <= 6) {
		level++;
		ch = state.src.charCodeAt(++pos);
	}
	if (level > 6 || pos < max && !isSpace(ch)) return false;
	if (silent) return true;
	max = state.skipSpacesBack(max, pos);
	const tmp = state.skipCharsBack(max, 35, pos);
	if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) max = tmp;
	state.line = startLine + 1;
	const token_o = state.push("heading_open", `h${level}`, 1);
	token_o.markup = "########".slice(0, level);
	token_o.map = [startLine, state.line];
	const token_i = state.push("inline", "", 0);
	token_i.content = asciiTrim(state.src.slice(pos, max));
	token_i.map = [startLine, state.line];
	token_i.children = [];
	const token_c = state.push("heading_close", `h${level}`, -1);
	token_c.markup = "########".slice(0, level);
	return true;
}
//#endregion
//#region src/rules_block/lheading.ts
function lheading(state, startLine, endLine) {
	const terminatorRules = state.md.block.ruler.getRules("paragraph");
	if (state.sCount[startLine] - state.blkIndent >= 4) return false;
	const oldParentType = state.parentType;
	state.parentType = "paragraph";
	let level = 0;
	let marker;
	let nextLine = startLine + 1;
	for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
		if (state.sCount[nextLine] - state.blkIndent > 3) continue;
		if (state.sCount[nextLine] >= state.blkIndent) {
			let pos = state.bMarks[nextLine] + state.tShift[nextLine];
			const max = state.eMarks[nextLine];
			if (pos < max) {
				marker = state.src.charCodeAt(pos);
				if (marker === 45 || marker === 61) {
					pos = state.skipChars(pos, marker);
					pos = state.skipSpaces(pos);
					if (pos >= max) {
						level = marker === 61 ? 1 : 2;
						break;
					}
				}
			}
		}
		if (state.sCount[nextLine] < 0) continue;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) break;
	}
	if (!level) {
		state.parentType = oldParentType;
		return false;
	}
	const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
	state.line = nextLine + 1;
	const token_o = state.push("heading_open", `h${level}`, 1);
	token_o.markup = String.fromCharCode(marker);
	token_o.map = [startLine, state.line];
	const token_i = state.push("inline", "", 0);
	token_i.content = content;
	token_i.map = [startLine, state.line - 1];
	token_i.children = [];
	const token_c = state.push("heading_close", `h${level}`, -1);
	token_c.markup = String.fromCharCode(marker);
	state.parentType = oldParentType;
	return true;
}
//#endregion
//#region src/rules_block/paragraph.ts
function paragraph(state, startLine, endLine) {
	const terminatorRules = state.md.block.ruler.getRules("paragraph");
	const oldParentType = state.parentType;
	let nextLine = startLine + 1;
	state.parentType = "paragraph";
	for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
		if (state.sCount[nextLine] - state.blkIndent > 3) continue;
		if (state.sCount[nextLine] < 0) continue;
		let terminate = false;
		for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
			terminate = true;
			break;
		}
		if (terminate) break;
	}
	const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
	state.line = nextLine;
	const token_o = state.push("paragraph_open", "p", 1);
	token_o.map = [startLine, state.line];
	const token_i = state.push("inline", "", 0);
	token_i.content = content;
	token_i.map = [startLine, state.line];
	token_i.children = [];
	state.push("paragraph_close", "p", -1);
	state.parentType = oldParentType;
	return true;
}
//#endregion
//#region src/parser_block.ts
var _rules$1 = [
	[
		"table",
		table,
		["paragraph", "reference"]
	],
	["code", code],
	[
		"fence",
		fence,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"blockquote",
		blockquote,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"hr",
		hr,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"list",
		list,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	["reference", reference],
	[
		"html_block",
		html_block,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	[
		"heading",
		heading,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	["lheading", lheading],
	["paragraph", paragraph]
];
/**
* Block-level tokenizer.
*/
var ParserBlock = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* {@link Ruler} instance. Keep configuration of block rules.
			*/
			"ruler",
			new Ruler()
		);
		_defineProperty(this, "State", StateBlock);
		for (let i = 0; i < _rules$1.length; i++) this.ruler.push(_rules$1[i][0], _rules$1[i][1], { alt: (_rules$1[i][2] || []).slice() });
	}
	tokenize(state, startLine, endLine) {
		const rules = this.ruler.getRules("");
		const len = rules.length;
		const maxNesting = state.md.options.maxNesting;
		let line = startLine;
		let hasEmptyLines = false;
		while (line < endLine) {
			state.line = line = state.skipEmptyLines(line);
			if (line >= endLine) break;
			if (state.sCount[line] < state.blkIndent) break;
			if (state.level >= maxNesting) {
				state.line = endLine;
				break;
			}
			const prevLine = state.line;
			let ok = false;
			for (let i = 0; i < len; i++) {
				ok = rules[i](state, line, endLine, false);
				if (ok) {
					if (prevLine >= state.line) throw new Error("block rule didn't increment state.line");
					break;
				}
			}
			if (!ok) throw new Error("none of the block rules matched");
			state.tight = !hasEmptyLines;
			if (state.isEmpty(state.line - 1)) hasEmptyLines = true;
			line = state.line;
			if (line < endLine && state.isEmpty(line)) {
				hasEmptyLines = true;
				line++;
				state.line = line;
			}
		}
	}
	/**
	* Process input string and push block tokens into `outTokens`
	*/
	parse(src, md, env, outTokens) {
		if (!src) return;
		const state = new this.State(src, md, env, outTokens);
		this.tokenize(state, state.line, state.lineMax);
	}
};
//#endregion
//#region src/rules_inline/state_inline.ts
/** Mutable state passed to inline rules while tokenizing inline content. */
var StateInline = class {
	constructor(src, md, env, outTokens) {
		_defineProperty(this, "pos", 0);
		_defineProperty(this, "level", 0);
		_defineProperty(this, "pending", "");
		_defineProperty(this, "pendingLevel", 0);
		_defineProperty(this, "cache", {});
		_defineProperty(this, "backticks", {});
		_defineProperty(this, "backticksScanned", false);
		_defineProperty(this, "skipHtmlSpecial", false);
		_defineProperty(this, "linkLevel", 0);
		_defineProperty(this, "delimiters", []);
		_defineProperty(this, "_prev_delimiters", []);
		_defineProperty(this, "Token", Token);
		this.src = src;
		this.env = env;
		this.md = md;
		this.tokens = outTokens;
		this.tokens_meta = Array(outTokens.length);
		this.posMax = this.src.length;
	}
	pushPending() {
		const token = new Token("text", "", 0);
		token.content = this.pending;
		token.level = this.pendingLevel;
		this.tokens.push(token);
		this.pending = "";
		return token;
	}
	push(type, tag, nesting) {
		if (this.pending) this.pushPending();
		const token = new Token(type, tag, nesting);
		let token_meta = void 0;
		if (nesting < 0) {
			this.level--;
			this.delimiters = this._prev_delimiters.pop();
		}
		token.level = this.level;
		if (nesting > 0) {
			this.level++;
			this._prev_delimiters.push(this.delimiters);
			this.delimiters = [];
			token_meta = { delimiters: this.delimiters };
		}
		this.pendingLevel = this.level;
		this.tokens.push(token);
		this.tokens_meta.push(token_meta);
		return token;
	}
	scanDelims(start, canSplitWord) {
		const max = this.posMax;
		const marker = this.src.charCodeAt(start);
		let lastChar;
		if (start === 0) lastChar = 32;
		else if (start === 1) {
			lastChar = this.src.charCodeAt(0);
			if ((lastChar & 63488) === 55296) lastChar = 65533;
		} else {
			lastChar = this.src.charCodeAt(start - 1);
			if ((lastChar & 64512) === 56320) {
				const highSurr = this.src.charCodeAt(start - 2);
				lastChar = (highSurr & 64512) === 55296 ? 65536 + (highSurr - 55296 << 10) + (lastChar - 56320) : 65533;
			} else if ((lastChar & 64512) === 55296) lastChar = 65533;
		}
		let pos = start;
		while (pos < max && this.src.charCodeAt(pos) === marker) pos++;
		const count = pos - start;
		let nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
		if ((nextChar & 64512) === 55296) {
			const lowSurr = this.src.charCodeAt(pos + 1);
			nextChar = (lowSurr & 64512) === 56320 ? 65536 + (nextChar - 55296 << 10) + (lowSurr - 56320) : 65533;
		} else if ((nextChar & 64512) === 56320) nextChar = 65533;
		const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
		const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
		const isLastWhiteSpace = isWhiteSpace(lastChar);
		const isNextWhiteSpace = isWhiteSpace(nextChar);
		const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
		const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
		return {
			can_open: left_flanking && (canSplitWord || !right_flanking || isLastPunctChar),
			can_close: right_flanking && (canSplitWord || !left_flanking || isNextPunctChar),
			length: count
		};
	}
};
//#endregion
//#region src/rules_inline/text.ts
function isTerminatorChar(ch) {
	switch (ch) {
		case 10:
		case 33:
		case 35:
		case 36:
		case 37:
		case 38:
		case 42:
		case 43:
		case 45:
		case 58:
		case 60:
		case 61:
		case 62:
		case 64:
		case 91:
		case 92:
		case 93:
		case 94:
		case 95:
		case 96:
		case 123:
		case 125:
		case 126: return true;
		default: return false;
	}
}
function text(state, silent) {
	let pos = state.pos;
	while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) pos++;
	if (pos === state.pos) return false;
	if (!silent) state.pending += state.src.slice(state.pos, pos);
	state.pos = pos;
	return true;
}
//#endregion
//#region src/rules_inline/linkify.ts
function isAsciiAlpha(code) {
	return code >= 65 && code <= 90 || code >= 97 && code <= 122;
}
function isSchemeChar(code) {
	return code >= 65 && code <= 90 || code >= 97 && code <= 122 || code >= 48 && code <= 57 || code === 43 || code === 45 || code === 46;
}
function linkify(state, silent) {
	if (!state.md.options.linkify) return false;
	if (state.linkLevel > 0) return false;
	const pos = state.pos;
	const max = state.posMax;
	if (pos + 3 > max) return false;
	if (state.src.charCodeAt(pos) !== 58) return false;
	if (state.src.charCodeAt(pos + 1) !== 47) return false;
	if (state.src.charCodeAt(pos + 2) !== 47) return false;
	const protoMin = pos - Math.min(10, state.pending.length, pos);
	let protoStart = pos;
	while (protoStart > protoMin && isSchemeChar(state.src.charCodeAt(protoStart - 1))) protoStart--;
	if (protoStart === pos || !isAsciiAlpha(state.src.charCodeAt(protoStart))) return false;
	const protoLength = pos - protoStart;
	const link = state.md.linkify.matchAtStart(state.src.slice(protoStart));
	if (!link) return false;
	let url = link.url;
	if (url.length <= protoLength) return false;
	let urlEnd = url.length;
	while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) urlEnd--;
	if (urlEnd !== url.length) url = url.slice(0, urlEnd);
	const fullUrl = state.md.normalizeLink(url);
	if (!state.md.validateLink(fullUrl)) return false;
	if (!silent) {
		state.pending = state.pending.slice(0, -protoLength);
		const token_o = state.push("link_open", "a", 1);
		token_o.attrs = [["href", fullUrl]];
		token_o.markup = "linkify";
		token_o.info = "auto";
		const token_t = state.push("text", "", 0);
		token_t.content = state.md.normalizeLinkText(url);
		const token_c = state.push("link_close", "a", -1);
		token_c.markup = "linkify";
		token_c.info = "auto";
	}
	state.pos += url.length - protoLength;
	return true;
}
//#endregion
//#region src/rules_inline/newline.ts
function newline(state, silent) {
	let pos = state.pos;
	if (state.src.charCodeAt(pos) !== 10) return false;
	const pmax = state.pending.length - 1;
	const max = state.posMax;
	if (!silent) {
		if (pmax >= 0 && state.pending.charCodeAt(pmax) === 32) {
			if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 32) {
				let ws = pmax - 1;
				while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 32) ws--;
				state.pending = state.pending.slice(0, ws);
				state.push("hardbreak", "br", 0);
			} else {
				state.pending = state.pending.slice(0, -1);
				state.push("softbreak", "br", 0);
			}
		} else state.push("softbreak", "br", 0);
	}
	pos++;
	while (pos < max && isSpace(state.src.charCodeAt(pos))) pos++;
	state.pos = pos;
	return true;
}
//#endregion
//#region src/rules_inline/escape.ts
var ESCAPED = [];
for (let i = 0; i < 256; i++) ESCAPED.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(ch) {
	ESCAPED[ch.charCodeAt(0)] = 1;
});
function escape(state, silent) {
	let pos = state.pos;
	const max = state.posMax;
	if (state.src.charCodeAt(pos) !== 92) return false;
	pos++;
	if (pos >= max) return false;
	let ch1 = state.src.charCodeAt(pos);
	if (ch1 === 10) {
		if (!silent) state.push("hardbreak", "br", 0);
		pos++;
		while (pos < max) {
			ch1 = state.src.charCodeAt(pos);
			if (!isSpace(ch1)) break;
			pos++;
		}
		state.pos = pos;
		return true;
	}
	if (ch1 === 32) {
		if (!silent) {
			const token = state.push("text_special", "", 0);
			token.content = "\\";
			token.markup = "\\";
			token.info = "escape";
		}
		state.pos = pos;
		return true;
	}
	let escapedStr = state.src[pos];
	if (ch1 >= 55296 && ch1 <= 56319 && pos + 1 < max) {
		const ch2 = state.src.charCodeAt(pos + 1);
		if (ch2 >= 56320 && ch2 <= 57343) {
			escapedStr += state.src[pos + 1];
			pos++;
		}
	}
	const origStr = "\\" + escapedStr;
	if (!silent) {
		const token = state.push("text_special", "", 0);
		if (ch1 < 256 && ESCAPED[ch1] !== 0) token.content = escapedStr;
		else token.content = origStr;
		token.markup = origStr;
		token.info = "escape";
	}
	state.pos = pos + 1;
	return true;
}
//#endregion
//#region src/rules_inline/backticks.ts
function buildLastRuns(src) {
	const lastRuns = {};
	let pos = 0;
	while ((pos = src.indexOf("`", pos)) !== -1) {
		const start = pos;
		while (src.charCodeAt(++pos) === 96);
		lastRuns[pos - start] = start;
	}
	return lastRuns;
}
function backtick(state, silent) {
	var _state$backticks$open;
	const start = state.pos;
	if (state.src.charCodeAt(start) !== 96) return false;
	const max = state.posMax;
	let pos = start + 1;
	while (pos < max && state.src.charCodeAt(pos) === 96) pos++;
	const marker = state.src.slice(start, pos);
	const openerLength = marker.length;
	if (!state.backticksScanned) {
		state.backticks = buildLastRuns(state.src);
		state.backticksScanned = true;
	}
	if (((_state$backticks$open = state.backticks[openerLength]) !== null && _state$backticks$open !== void 0 ? _state$backticks$open : -1) >= pos) {
		let matchEnd = pos;
		let matchStart;
		while ((matchStart = state.src.indexOf("`", matchEnd)) !== -1 && matchStart < max) {
			matchEnd = matchStart + 1;
			while (state.src.charCodeAt(matchEnd) === 96) matchEnd++;
			if (matchEnd > max) break;
			if (matchEnd - matchStart === openerLength) {
				if (!silent) {
					const token = state.push("code_inline", "code", 0);
					token.markup = marker;
					let content = state.src.slice(pos, matchStart).replace(/\n/g, " ");
					if (content.startsWith(" ") && content.endsWith(" ") && /[^ ]/.test(content)) content = content.slice(1, -1);
					token.content = content;
				}
				state.pos = matchEnd;
				return true;
			}
		}
	}
	if (!silent) state.pending += marker;
	state.pos = pos;
	return true;
}
//#endregion
//#region src/rules_inline/strikethrough.ts
function strikethrough_tokenize(state, silent) {
	const start = state.pos;
	const marker = state.src.charCodeAt(start);
	if (silent) return false;
	if (marker !== 126) return false;
	const scanned = state.scanDelims(state.pos, true);
	let len = scanned.length;
	const ch = String.fromCharCode(marker);
	if (len < 2) return false;
	let token;
	if (len % 2) {
		token = state.push("text", "", 0);
		token.content = ch;
		len--;
	}
	for (let i = 0; i < len; i += 2) {
		token = state.push("text", "", 0);
		token.content = ch + ch;
		state.delimiters.push({
			marker,
			length: 0,
			token: state.tokens.length - 1,
			end: -1,
			open: scanned.can_open,
			close: scanned.can_close
		});
	}
	state.pos += scanned.length;
	return true;
}
function postProcess$1(state, delimiters) {
	let token;
	const loneMarkers = [];
	const max = delimiters.length;
	for (let i = 0; i < max; i++) {
		const startDelim = delimiters[i];
		if (startDelim.marker !== 126) continue;
		if (startDelim.end === -1) continue;
		const endDelim = delimiters[startDelim.end];
		token = state.tokens[startDelim.token];
		token.type = "s_open";
		token.tag = "s";
		token.nesting = 1;
		token.markup = "~~";
		token.content = "";
		token = state.tokens[endDelim.token];
		token.type = "s_close";
		token.tag = "s";
		token.nesting = -1;
		token.markup = "~~";
		token.content = "";
		if (state.tokens[endDelim.token - 1].type === "text" && state.tokens[endDelim.token - 1].content === "~") loneMarkers.push(endDelim.token - 1);
	}
	while (loneMarkers.length) {
		const i = loneMarkers.pop();
		let j = i + 1;
		while (j < state.tokens.length && state.tokens[j].type === "s_close") j++;
		j--;
		if (i !== j) {
			token = state.tokens[j];
			state.tokens[j] = state.tokens[i];
			state.tokens[i] = token;
		}
	}
}
function strikethrough_postProcess(state) {
	const tokens_meta = state.tokens_meta;
	const max = state.tokens_meta.length;
	postProcess$1(state, state.delimiters);
	for (let curr = 0; curr < max; curr++) {
		var _tokens_meta$curr;
		const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
		if (delimiters) postProcess$1(state, delimiters);
	}
}
var strikethrough_default = {
	tokenize: strikethrough_tokenize,
	postProcess: strikethrough_postProcess
};
//#endregion
//#region src/rules_inline/emphasis.ts
function emphasis_tokenize(state, silent) {
	const start = state.pos;
	const marker = state.src.charCodeAt(start);
	if (silent) return false;
	if (marker !== 95 && marker !== 42) return false;
	const scanned = state.scanDelims(state.pos, marker === 42);
	for (let i = 0; i < scanned.length; i++) {
		const token = state.push("text", "", 0);
		token.content = String.fromCharCode(marker);
		state.delimiters.push({
			marker,
			length: scanned.length,
			token: state.tokens.length - 1,
			end: -1,
			open: scanned.can_open,
			close: scanned.can_close
		});
	}
	state.pos += scanned.length;
	return true;
}
function postProcess(state, delimiters) {
	const max = delimiters.length;
	for (let i = max - 1; i >= 0; i--) {
		const startDelim = delimiters[i];
		if (startDelim.marker !== 95 && startDelim.marker !== 42) continue;
		if (startDelim.end === -1) continue;
		const endDelim = delimiters[startDelim.end];
		const isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && delimiters[startDelim.end + 1].token === endDelim.token + 1;
		const ch = String.fromCharCode(startDelim.marker);
		const token_o = state.tokens[startDelim.token];
		token_o.type = isStrong ? "strong_open" : "em_open";
		token_o.tag = isStrong ? "strong" : "em";
		token_o.nesting = 1;
		token_o.markup = isStrong ? ch + ch : ch;
		token_o.content = "";
		const token_c = state.tokens[endDelim.token];
		token_c.type = isStrong ? "strong_close" : "em_close";
		token_c.tag = isStrong ? "strong" : "em";
		token_c.nesting = -1;
		token_c.markup = isStrong ? ch + ch : ch;
		token_c.content = "";
		if (isStrong) {
			state.tokens[delimiters[i - 1].token].content = "";
			state.tokens[delimiters[startDelim.end + 1].token].content = "";
			i--;
		}
	}
}
function emphasis_post_process(state) {
	const tokens_meta = state.tokens_meta;
	const max = state.tokens_meta.length;
	postProcess(state, state.delimiters);
	for (let curr = 0; curr < max; curr++) {
		var _tokens_meta$curr;
		const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
		if (delimiters) postProcess(state, delimiters);
	}
}
var emphasis_default = {
	tokenize: emphasis_tokenize,
	postProcess: emphasis_post_process
};
//#endregion
//#region src/rules_inline/link.ts
function link(state, silent) {
	let code, label, res, ref;
	let href = "";
	let title = "";
	let start = state.pos;
	let parseReference = true;
	if (state.src.charCodeAt(state.pos) !== 91) return false;
	const oldPos = state.pos;
	const max = state.posMax;
	const labelStart = state.pos + 1;
	const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);
	if (labelEnd < 0) return false;
	let pos = labelEnd + 1;
	if (pos < max && state.src.charCodeAt(pos) === 40) {
		parseReference = false;
		pos++;
		for (; pos < max; pos++) {
			code = state.src.charCodeAt(pos);
			if (!isSpace(code) && code !== 10) break;
		}
		if (pos >= max) return false;
		start = pos;
		res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
		if (res.ok) {
			href = state.md.normalizeLink(res.str);
			if (state.md.validateLink(href)) pos = res.pos;
			else href = "";
			start = pos;
			for (; pos < max; pos++) {
				code = state.src.charCodeAt(pos);
				if (!isSpace(code) && code !== 10) break;
			}
			res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
			if (pos < max && start !== pos && res.ok) {
				title = res.str;
				pos = res.pos;
				for (; pos < max; pos++) {
					code = state.src.charCodeAt(pos);
					if (!isSpace(code) && code !== 10) break;
				}
			}
		}
		if (pos >= max || state.src.charCodeAt(pos) !== 41) parseReference = true;
		pos++;
	}
	if (parseReference) {
		if (typeof state.env.references === "undefined") return false;
		if (pos < max && state.src.charCodeAt(pos) === 91) {
			start = pos + 1;
			pos = state.md.helpers.parseLinkLabel(state, pos);
			if (pos >= 0) label = state.src.slice(start, pos++);
			else pos = labelEnd + 1;
		} else pos = labelEnd + 1;
		if (!label) label = state.src.slice(labelStart, labelEnd);
		label = normalizeReference(label);
		ref = state.env.references[label];
		if (!ref) {
			state.pos = oldPos;
			return false;
		}
		href = ref.href;
		title = ref.title;
	}
	if (!silent) {
		state.pos = labelStart;
		state.posMax = labelEnd;
		const token_o = state.push("link_open", "a", 1);
		const attrs = [["href", href]];
		token_o.attrs = attrs;
		if (title) attrs.push(["title", title]);
		if (label) {
			const meta = Object.create(null);
			meta.label = label;
			token_o.meta = meta;
		}
		state.linkLevel++;
		state.md.inline.tokenize(state);
		state.linkLevel--;
		state.push("link_close", "a", -1);
	}
	state.pos = pos;
	state.posMax = max;
	return true;
}
//#endregion
//#region src/rules_inline/image.ts
function image(state, silent) {
	let code, content, label, pos, ref, res, title, start;
	let href = "";
	const oldPos = state.pos;
	const max = state.posMax;
	if (state.src.charCodeAt(state.pos) !== 33) return false;
	if (state.src.charCodeAt(state.pos + 1) !== 91) return false;
	const labelStart = state.pos + 2;
	const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
	if (labelEnd < 0) return false;
	pos = labelEnd + 1;
	if (pos < max && state.src.charCodeAt(pos) === 40) {
		pos++;
		for (; pos < max; pos++) {
			code = state.src.charCodeAt(pos);
			if (!isSpace(code) && code !== 10) break;
		}
		if (pos >= max) return false;
		start = pos;
		res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
		if (res.ok) {
			href = state.md.normalizeLink(res.str);
			if (state.md.validateLink(href)) pos = res.pos;
			else href = "";
		}
		start = pos;
		for (; pos < max; pos++) {
			code = state.src.charCodeAt(pos);
			if (!isSpace(code) && code !== 10) break;
		}
		res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
		if (pos < max && start !== pos && res.ok) {
			title = res.str;
			pos = res.pos;
			for (; pos < max; pos++) {
				code = state.src.charCodeAt(pos);
				if (!isSpace(code) && code !== 10) break;
			}
		} else title = "";
		if (pos >= max || state.src.charCodeAt(pos) !== 41) {
			state.pos = oldPos;
			return false;
		}
		pos++;
	} else {
		if (typeof state.env.references === "undefined") return false;
		if (pos < max && state.src.charCodeAt(pos) === 91) {
			start = pos + 1;
			pos = state.md.helpers.parseLinkLabel(state, pos);
			if (pos >= 0) label = state.src.slice(start, pos++);
			else pos = labelEnd + 1;
		} else pos = labelEnd + 1;
		if (!label) label = state.src.slice(labelStart, labelEnd);
		label = normalizeReference(label);
		ref = state.env.references[label];
		if (!ref) {
			state.pos = oldPos;
			return false;
		}
		href = ref.href;
		title = ref.title;
	}
	if (!silent) {
		content = state.src.slice(labelStart, labelEnd);
		const tokens = [];
		state.md.inline.parse(content, state.md, state.env, tokens);
		const token = state.push("image", "img", 0);
		const attrs = [["src", href], ["alt", ""]];
		token.attrs = attrs;
		token.children = tokens;
		token.content = content;
		if (title) attrs.push(["title", title]);
		if (label) {
			const meta = Object.create(null);
			meta.label = label;
			token.meta = meta;
		}
	}
	state.pos = pos;
	state.posMax = max;
	return true;
}
//#endregion
//#region src/rules_inline/autolink.ts
var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function autolink(state, silent) {
	let pos = state.pos;
	if (state.src.charCodeAt(pos) !== 60) return false;
	const start = state.pos;
	const max = state.posMax;
	for (;;) {
		if (++pos >= max) return false;
		const ch = state.src.charCodeAt(pos);
		if (ch === 60) return false;
		if (ch === 62) break;
	}
	const url = state.src.slice(start + 1, pos);
	if (AUTOLINK_RE.test(url)) {
		const fullUrl = state.md.normalizeLink(url);
		if (!state.md.validateLink(fullUrl)) return false;
		if (!silent) {
			const token_o = state.push("link_open", "a", 1);
			token_o.attrs = [["href", fullUrl]];
			token_o.markup = "autolink";
			token_o.info = "auto";
			const token_t = state.push("text", "", 0);
			token_t.content = state.md.normalizeLinkText(url);
			const token_c = state.push("link_close", "a", -1);
			token_c.markup = "autolink";
			token_c.info = "auto";
		}
		state.pos += url.length + 2;
		return true;
	}
	if (EMAIL_RE.test(url)) {
		const fullUrl = state.md.normalizeLink(`mailto:${url}`);
		if (!state.md.validateLink(fullUrl)) return false;
		if (!silent) {
			const token_o = state.push("link_open", "a", 1);
			token_o.attrs = [["href", fullUrl]];
			token_o.markup = "autolink";
			token_o.info = "auto";
			const token_t = state.push("text", "", 0);
			token_t.content = state.md.normalizeLinkText(url);
			const token_c = state.push("link_close", "a", -1);
			token_c.markup = "autolink";
			token_c.info = "auto";
		}
		state.pos += url.length + 2;
		return true;
	}
	return false;
}
//#endregion
//#region src/rules_inline/html_inline.ts
function isLinkOpen(str) {
	return /^<a[>\s]/i.test(str);
}
function isLinkClose(str) {
	return /^<\/a\s*>/i.test(str);
}
function isLetter(ch) {
	const lc = ch | 32;
	return lc >= 97 && lc <= 122;
}
function scanSpecial(state, pos) {
	const src = state.src;
	let start;
	let terminator;
	if (src.startsWith("<!--", pos)) {
		if (src.startsWith(">", pos + 4)) return pos + 5;
		if (src.startsWith("->", pos + 4)) return pos + 6;
		start = pos + 4;
		terminator = "-->";
	} else if (src.startsWith("<![CDATA[", pos)) {
		start = pos + 9;
		terminator = "]]>";
	} else if (src.charCodeAt(pos + 1) === 63) {
		start = pos + 2;
		terminator = "?>";
	} else if (isLetter(src.charCodeAt(pos + 2))) {
		start = pos + 3;
		terminator = ">";
	} else return -1;
	if (state.skipHtmlSpecial) return -1;
	const end = src.indexOf(terminator, start);
	if (end < 0) {
		state.skipHtmlSpecial = true;
		return -1;
	}
	return end + terminator.length;
}
function html_inline(state, silent) {
	if (!state.md.options.html) return false;
	const max = state.posMax;
	const pos = state.pos;
	if (state.src.charCodeAt(pos) !== 60 || pos + 2 >= max) return false;
	let end;
	const ch = state.src.charCodeAt(pos + 1);
	if (ch === 33 || ch === 63) end = scanSpecial(state, pos);
	else if (ch === 47 || isLetter(ch)) {
		const match = state.src.slice(pos).match(HTML_OPEN_CLOSE_TAG_RE);
		end = match ? pos + match[0].length : -1;
	} else return false;
	if (end < 0) return false;
	if (!silent) {
		const token = state.push("html_inline", "", 0);
		token.content = state.src.slice(pos, end);
		if (isLinkOpen(token.content)) state.linkLevel++;
		if (isLinkClose(token.content)) state.linkLevel--;
	}
	state.pos = end;
	return true;
}
//#endregion
//#region src/rules_inline/entity.ts
var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;
function entity(state, silent) {
	const pos = state.pos;
	const max = state.posMax;
	if (state.src.charCodeAt(pos) !== 38) return false;
	if (pos + 1 >= max) return false;
	if (state.src.charCodeAt(pos + 1) === 35) {
		const match = state.src.slice(pos).match(DIGITAL_RE);
		if (match) {
			if (!silent) {
				const code = match[1][0].toLowerCase() === "x" ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
				const token = state.push("text_special", "", 0);
				token.content = isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(65533);
				token.markup = match[0];
				token.info = "entity";
			}
			state.pos += match[0].length;
			return true;
		}
	} else {
		const match = state.src.slice(pos).match(NAMED_RE);
		if (match) {
			const decoded = decodeHTMLStrict(match[0]);
			if (decoded !== match[0]) {
				if (!silent) {
					const token = state.push("text_special", "", 0);
					token.content = decoded;
					token.markup = match[0];
					token.info = "entity";
				}
				state.pos += match[0].length;
				return true;
			}
		}
	}
	return false;
}
//#endregion
//#region src/rules_inline/balance_pairs.ts
function processDelimiters(delimiters) {
	const openersBottom = {};
	const max = delimiters.length;
	if (!max) return;
	let headerIdx = 0;
	let lastTokenIdx = -2;
	const jumps = [];
	for (let closerIdx = 0; closerIdx < max; closerIdx++) {
		const closer = delimiters[closerIdx];
		jumps.push(0);
		if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) headerIdx = closerIdx;
		lastTokenIdx = closer.token;
		closer.length = closer.length || 0;
		if (!closer.close) continue;
		if (!openersBottom.hasOwnProperty(closer.marker)) openersBottom[closer.marker] = [
			-1,
			-1,
			-1,
			-1,
			-1,
			-1
		];
		const minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
		let openerIdx = headerIdx - jumps[headerIdx] - 1;
		let newMinOpenerIdx = openerIdx;
		for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
			const opener = delimiters[openerIdx];
			if (opener.marker !== closer.marker) continue;
			if (opener.open && opener.end < 0) {
				let isOddMatch = false;
				if (opener.close || closer.open) {
					if ((opener.length + closer.length) % 3 === 0) {
						if (opener.length % 3 !== 0 || closer.length % 3 !== 0) isOddMatch = true;
					}
				}
				if (!isOddMatch) {
					const lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
					jumps[closerIdx] = closerIdx - openerIdx + lastJump;
					jumps[openerIdx] = lastJump;
					closer.open = false;
					opener.end = closerIdx;
					opener.close = false;
					newMinOpenerIdx = -1;
					lastTokenIdx = -2;
					break;
				}
			}
		}
		if (newMinOpenerIdx !== -1) openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
	}
}
function link_pairs(state) {
	const tokens_meta = state.tokens_meta;
	const max = state.tokens_meta.length;
	processDelimiters(state.delimiters);
	for (let curr = 0; curr < max; curr++) {
		var _tokens_meta$curr;
		const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
		if (delimiters) processDelimiters(delimiters);
	}
}
//#endregion
//#region src/rules_inline/fragments_join.ts
function fragments_join(state) {
	let curr, last;
	let level = 0;
	const tokens = state.tokens;
	const max = state.tokens.length;
	for (curr = last = 0; curr < max; curr++) {
		if (tokens[curr].nesting < 0) level--;
		tokens[curr].level = level;
		if (tokens[curr].nesting > 0) level++;
		if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
		else {
			if (curr !== last) tokens[last] = tokens[curr];
			last++;
		}
	}
	if (curr !== last) tokens.length = last;
}
//#endregion
//#region src/parser_inline.ts
var _rules = [
	["text", text],
	["linkify", linkify],
	["newline", newline],
	["escape", escape],
	["backticks", backtick],
	["strikethrough", strikethrough_default.tokenize],
	["emphasis", emphasis_default.tokenize],
	["link", link],
	["image", image],
	["autolink", autolink],
	["html_inline", html_inline],
	["entity", entity]
];
var _rules2 = [
	["balance_pairs", link_pairs],
	["strikethrough", strikethrough_default.postProcess],
	["emphasis", emphasis_default.postProcess],
	["fragments_join", fragments_join]
];
/**
* Tokenizes paragraph content.
*/
var ParserInline = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* {@link Ruler} instance. Keep configuration of inline rules.
			*/
			"ruler",
			new Ruler()
		);
		_defineProperty(
			this,
			/**
			* {@link Ruler} instance. Second ruler used for post-processing
			* (e.g. in emphasis-like rules).
			*/
			"ruler2",
			new Ruler()
		);
		_defineProperty(this, "State", StateInline);
		for (let i = 0; i < _rules.length; i++) this.ruler.push(_rules[i][0], _rules[i][1]);
		for (let i = 0; i < _rules2.length; i++) this.ruler2.push(_rules2[i][0], _rules2[i][1]);
	}
	skipToken(state) {
		const pos = state.pos;
		const rules = this.ruler.getRules("");
		const len = rules.length;
		const maxNesting = state.md.options.maxNesting;
		const cache = state.cache;
		if (typeof cache[pos] !== "undefined") {
			state.pos = cache[pos];
			return;
		}
		let ok = false;
		if (state.level < maxNesting) for (let i = 0; i < len; i++) {
			state.level++;
			ok = rules[i](state, true);
			state.level--;
			if (ok) {
				if (pos >= state.pos) throw new Error("inline rule didn't increment state.pos");
				break;
			}
		}
		else state.pos = state.posMax;
		if (!ok) state.pos++;
		cache[pos] = state.pos;
	}
	tokenize(state) {
		const rules = this.ruler.getRules("");
		const len = rules.length;
		const end = state.posMax;
		const maxNesting = state.md.options.maxNesting;
		while (state.pos < end) {
			const prevPos = state.pos;
			let ok = false;
			if (state.level < maxNesting) for (let i = 0; i < len; i++) {
				ok = rules[i](state, false);
				if (ok) {
					if (prevPos >= state.pos) throw new Error("inline rule didn't increment state.pos");
					break;
				}
			}
			if (ok) {
				if (state.pos >= end) break;
				continue;
			}
			state.pending += state.src[state.pos++];
		}
		if (state.pending) state.pushPending();
	}
	/**
	* Process input string and push inline tokens into `outTokens`
	*/
	parse(str, md, env, outTokens) {
		const state = new this.State(str, md, env, outTokens);
		this.tokenize(state);
		const rules = this.ruler2.getRules("");
		const len = rules.length;
		for (let i = 0; i < len; i++) rules[i](state);
	}
};
var default_default = {
	options: {
		html: false,
		xhtmlOut: false,
		breaks: false,
		langPrefix: "language-",
		linkify: false,
		typographer: false,
		quotes: "“”‘’",
		highlight: null,
		maxNesting: 100
	},
	components: {
		core: {},
		block: {},
		inline: {}
	}
};
var zero_default = {
	options: {
		html: false,
		xhtmlOut: false,
		breaks: false,
		langPrefix: "language-",
		linkify: false,
		typographer: false,
		quotes: "“”‘’",
		highlight: null,
		maxNesting: 20
	},
	components: {
		core: { rules: [
			"normalize",
			"block",
			"strip_references",
			"inline",
			"text_join"
		] },
		block: { rules: ["paragraph"] },
		inline: {
			rules: ["text"],
			rules2: ["balance_pairs", "fragments_join"]
		}
	}
};
var commonmark_default = {
	options: {
		html: true,
		xhtmlOut: true,
		breaks: false,
		langPrefix: "language-",
		linkify: false,
		typographer: false,
		quotes: "“”‘’",
		highlight: null,
		maxNesting: 20
	},
	components: {
		core: { rules: [
			"normalize",
			"block",
			"strip_references",
			"inline",
			"text_join"
		] },
		block: { rules: [
			"blockquote",
			"code",
			"fence",
			"heading",
			"hr",
			"html_block",
			"lheading",
			"list",
			"reference",
			"paragraph"
		] },
		inline: {
			rules: [
				"autolink",
				"backticks",
				"emphasis",
				"entity",
				"escape",
				"html_inline",
				"image",
				"link",
				"newline",
				"text"
			],
			rules2: [
				"balance_pairs",
				"emphasis",
				"fragments_join"
			]
		}
	}
};
//#endregion
//#region \0@oxc-project+runtime@0.154.0/helpers/esm/objectSpread2.js
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread2(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
//#endregion
//#region src/markdownit.ts
var config = {
	default: default_default,
	zero: zero_default,
	commonmark: commonmark_default
};
var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
var RECODE_HOSTNAME_FOR = [
	"http:",
	"https:",
	"mailto:"
];
/**
* Parses Markdown into tokens and renders them to HTML.
*
* @category Main
*/
var MarkdownIt = class {
	/**
	* Link validation function. CommonMark allows too much in links. By default
	* we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
	* except some embedded image types.
	*
	* You can change this behaviour:
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* const md = new MarkdownIt()
	*
	* // enable everything
	* md.validateLink = function () { return true; }
	* ```
	*/
	validateLink(url) {
		const str = url.trim().toLowerCase();
		return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
	}
	/**
	* Function used to encode link url to a machine-readable format,
	* which includes url-encoding, punycode, etc.
	*/
	normalizeLink(url) {
		const parsed = mdurl.parse(url, true);
		if (parsed.hostname) {
			if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
				parsed.hostname = punycode_js.default.toASCII(parsed.hostname);
			} catch (er) {}
		}
		if (parsed.auth) parsed.auth = mdurl.encode(parsed.auth);
		if (parsed.hostname) parsed.hostname = mdurl.encode(parsed.hostname);
		if (parsed.pathname) parsed.pathname = mdurl.encode(parsed.pathname);
		if (parsed.search) parsed.search = mdurl.encode(parsed.search);
		if (parsed.hash) parsed.hash = mdurl.encode(parsed.hash);
		return mdurl.format(parsed);
	}
	/**
	* Function used to decode link url to a human-readable format`
	*/
	normalizeLinkText(url) {
		const parsed = mdurl.parse(url, true);
		if (parsed.hostname) {
			if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
				parsed.hostname = punycode_js.default.toUnicode(parsed.hostname);
			} catch (er) {}
		}
		return mdurl.decode(mdurl.format(parsed), mdurl.decode.defaultChars + "%");
	}
	constructor(...args) {
		_defineProperty(
			this,
			/**
			* Instance of {@link ParserInline}. You may need it to add new rules when
			* writing plugins. For simple rules control use {@link MarkdownIt.disable}
			* and {@link MarkdownIt.enable}.
			*/
			"inline",
			new ParserInline()
		);
		_defineProperty(
			this,
			/**
			* Instance of {@link ParserBlock}. You may need it to add new rules when
			* writing plugins. For simple rules control use {@link MarkdownIt.disable}
			* and {@link MarkdownIt.enable}.
			*/
			"block",
			new ParserBlock()
		);
		_defineProperty(
			this,
			/**
			* Instance of {@link ParserCore} chain executor. You may need it to add new
			* rules when writing plugins. For simple rules control use
			* {@link MarkdownIt.disable} and {@link MarkdownIt.enable}.
			*/
			"core",
			new ParserCore()
		);
		_defineProperty(
			this,
			/**
			* Instance of {@link Renderer}. Use it to modify output look. Or to add rendering
			* rules for new token types, generated by plugins.
			*
			* See {@link Renderer} docs and
			* [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts).
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* function myToken(tokens, idx, options, env, self) {
			*   //...
			*   return result;
			* };
			*
			* md.renderer.rules['my_token'] = myToken
			* ```
			*/
			"renderer",
			new Renderer()
		);
		_defineProperty(
			this,
			/**
			* [linkify-it](https://github.com/markdown-it/linkify-it) instance.
			* Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/src/rules_core/linkify.ts)
			* rule.
			*/
			"linkify",
			new linkify_it.LinkifyIt()
		);
		_defineProperty(
			this,
			/**
			* Assorted utility functions, useful to write plugins. See details
			* [here](https://github.com/markdown-it/markdown-it/blob/master/src/common/utils.ts).
			*/
			"utils",
			utils_exports
		);
		_defineProperty(
			this,
			/**
			* Link components parser functions, useful to write plugins. See details
			* [here](https://github.com/markdown-it/markdown-it/blob/master/src/helpers).
			*/
			"helpers",
			Object.assign({}, helpers_exports)
		);
		const [presetNameOrOptions, options] = args;
		if (typeof presetNameOrOptions === "string") {
			this.configure(presetNameOrOptions);
			if (options) this.set(options);
		} else {
			this.configure("default");
			this.set(presetNameOrOptions || {});
		}
	}
	/**
	* Set parser options (in the same format as in constructor). Probably, you
	* will never need it, but you can change options after constructor call.
	*
	* __Note:__ To achieve the best possible performance, don't modify a
	* `markdown-it` instance options on the fly. If you need multiple configurations
	* it's best to create multiple instances and initialize each with separate
	* config.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	*
	* const md = new MarkdownIt()
	*   .set({ html: true, breaks: true })
	*   .set({ typographer: true })
	* ```
	*/
	set(options) {
		Object.assign(this.options, options);
		return this;
	}
	/**
	* Batch load of all options and compenent settings. This is internal method,
	* and you probably will not need it. But if you will - see available presets
	* and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/src/presets)
	*
	* We strongly recommend to use presets instead of direct config loads. That
	* will give better compatibility with next versions.
	*/
	configure(presets) {
		let p;
		if (typeof presets === "string") {
			const presetName = presets;
			p = config[presetName];
			if (!p) throw new Error(`Wrong 'markdown-it' preset "${presetName}", check name`);
		} else p = presets;
		if (!p) throw new Error("Wrong `markdown-it` preset, can't be empty");
		if (p.options) this.options = _objectSpread2({}, p.options);
		const components = p.components;
		if (components) {
			var _components$inline;
			[
				"core",
				"block",
				"inline"
			].forEach((name) => {
				var _components$name;
				const rules = (_components$name = components[name]) === null || _components$name === void 0 ? void 0 : _components$name.rules;
				if (rules) this[name].ruler.enableOnly(rules);
			});
			const rules2 = (_components$inline = components.inline) === null || _components$inline === void 0 ? void 0 : _components$inline.rules2;
			if (rules2) this.inline.ruler2.enableOnly(rules2);
		}
		return this;
	}
	/**
	* Enable list or rules. It will automatically find appropriate components,
	* containing rules with given names. If rule not found, and `ignoreInvalid`
	* not set - throws exception.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	*
	* const md = new MarkdownIt()
	*   .enable(['sub', 'sup'])
	*   .disable('smartquotes')
	* ```
	*/
	enable(list, ignoreInvalid = false) {
		let result = [];
		if (!Array.isArray(list)) list = [list];
		[
			"core",
			"block",
			"inline"
		].forEach((chain) => {
			result = result.concat(this[chain].ruler.enable(list, true));
		});
		result = result.concat(this.inline.ruler2.enable(list, true));
		const missed = list.filter((name) => result.indexOf(name) < 0);
		if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to enable unknown rule(s): ${missed}`);
		return this;
	}
	/**
	* The same as {@link MarkdownIt.enable}, but turn specified rules off.
	*/
	disable(list, ignoreInvalid = false) {
		let result = [];
		if (!Array.isArray(list)) list = [list];
		[
			"core",
			"block",
			"inline"
		].forEach((chain) => {
			result = result.concat(this[chain].ruler.disable(list, true));
		});
		result = result.concat(this.inline.ruler2.disable(list, true));
		const missed = list.filter((name) => result.indexOf(name) < 0);
		if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to disable unknown rule(s): ${missed}`);
		return this;
	}
	/**
	* Load specified plugin with given params into current parser instance.
	* It's just a sugar to call `plugin(md, params)` with curring.
	*
	* @example
	* ```javascript
	* import MarkdownIt from 'markdown-it'
	* import iterator from 'markdown-it-for-inline'
	*
	* const md = new MarkdownIt()
	*   .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
	*     tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar')
	*   })
	* ```
	*/
	use(plugin, ...params) {
		plugin.apply(plugin, [this, ...params]);
		return this;
	}
	/**
	* Parse input string and return list of block tokens (special token type
	* "inline" will contain list of inline tokens). You should not call this
	* method directly, until you write custom renderer (for example, to produce
	* AST).
	*
	* `env` is used to pass data between "distributed" rules and return additional
	* metadata like reference info, needed for the renderer. It also can be used to
	* inject data in specific cases. Usually, you will be ok to pass `{}`,
	* and then pass updated object to renderer.
	*/
	parse(src, env) {
		if (typeof src !== "string") throw new Error("Input data should be a String");
		const state = new this.core.State(src, this, env);
		this.core.process(state);
		return state.tokens;
	}
	/**
	* Render markdown string into html. It does all magic for you :).
	*
	* `env` can be used to inject additional metadata (`{}` by default).
	* But you will not need it with high probability. See also comment
	* in {@link MarkdownIt.parse}.
	*/
	render(src, env = {}) {
		return this.renderer.render(this.parse(src, env), this.options, env);
	}
	/**
	* The same as {@link MarkdownIt.parse} but skip all block rules. It returns
	* the block tokens list with the single `inline` element, containing parsed
	* inline tokens in `children` property. Also updates `env` object.
	*/
	parseInline(src, env) {
		const state = new this.core.State(src, this, env);
		state.inlineMode = true;
		this.core.process(state);
		return state.tokens;
	}
	/**
	* Similar to {@link MarkdownIt.render} but for single paragraph content.
	* Result will NOT be wrapped into `<p>` tags.
	*/
	renderInline(src, env = {}) {
		return this.renderer.render(this.parseInline(src, env), this.options, env);
	}
};
_defineProperty(MarkdownIt, "Token", Token);
_defineProperty(MarkdownIt, "Ruler", Ruler);
_defineProperty(MarkdownIt, "Renderer", Renderer);
_defineProperty(MarkdownIt, "ParserCore", ParserCore);
_defineProperty(MarkdownIt, "StateCore", StateCore);
_defineProperty(MarkdownIt, "ParserBlock", ParserBlock);
_defineProperty(MarkdownIt, "StateBlock", StateBlock);
_defineProperty(MarkdownIt, "ParserInline", ParserInline);
_defineProperty(MarkdownIt, "StateInline", StateInline);
//#endregion
//#region src/index.ts
/**
* Default package export.
*
* For backward compatibility, the {@link MarkdownIt} class is wrapped so
* legacy code can call it without `new`. New code should instantiate it as a
* regular class with `new`. The compatibility wrapper may be removed in a
* future release.
*
* @category Main
*/
var MarkdownItCallable = callable(MarkdownIt);
//#endregion
module.exports = MarkdownItCallable;

//# sourceMappingURL=markdown-it.cjs.js.map