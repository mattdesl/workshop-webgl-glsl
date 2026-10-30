export default function ansiRegex({onlyFirst = false} = {}) {
	// Valid string terminator sequences are BEL, ESC\, and 0x9c
	const ST = String.raw`(?:\u0007|\u001B\u005C|\u009C)`;

	// OSC sequences only: ESC ] ... ST (or the C1 introducer 0x9d ... ST)
	// The payload stops at the first terminator character rather than scanning ahead for one, so an unterminated `ESC ]` cannot rescan the rest of the input. Terminals likewise abort a control string on an unexpected ESC. The payload also stops at 0x9d so an unterminated C1 OSC cannot swallow the next one.
	const osc = String.raw`(?:(?:\u001B\]|\u009D)[^\u0007\u001B\u009C\u009D]*${ST})`;

	// CSI and related: ESC/C1, optional intermediates, optional params (supports ; and :) then final byte
	// The final byte class is deliberately narrow, so that ESC followed by an arbitrary character is not read as a sequence. It must
	// not include the parameter digits though: when the real final byte is outside the class the engine backtracks and takes the last
	// parameter digit as the final byte instead, leaving the real one behind as visible text. `ESC [ 5 d` stripped to a bare `d`.
	const csi = String.raw`[\u001B\u009B][[\]()#;?]*(?:\d{1,4}(?:[;:]\d{0,4})*)?[A-PR-TZcf-nq-uy=><~]`;

	// `= < >` are final bytes in the two byte VT52 escapes (`ESC >`) but parameter bytes in a CSI
	// (`ESC [ > 0 ; 276 ; 0 c`, the device attributes reply). Matching them as a final byte always
	// wins and leaves the rest of the reply behind as visible text, so the private parameter form is
	// matched first, where the `[` makes the two unambiguous.
	const csiPrivate = String.raw`(?:\u001B\[|\u009B)[<=>][0-9;:]*[A-PR-TZcf-nq-uy~]`;

	const pattern = `${osc}|${csiPrivate}|${csi}`;

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
}
