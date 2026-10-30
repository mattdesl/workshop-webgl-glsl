type Child = string | Node | null | undefined | readonly Child[]

type EltType<N extends string> = N extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[N] : HTMLElement

export default function crelt<N extends string>(elt: N, attrs: {[attr: string]: any}, ...children: Child[]): EltType<N>
export default function crelt<N extends string>(elt: N, ...children: Child[]): EltType<N>
export default function crelt(elt: HTMLElement, attrs: {[attr: string]: any}, ...children: Child[]): HTMLElement
export default function crelt(elt: HTMLElement, ...children: Child[]): HTMLElement
