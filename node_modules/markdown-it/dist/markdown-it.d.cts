declare namespace MarkdownIt {
  type Delimiter = import('./markdown-it.mjs').Delimiter
  type Env = import('./markdown-it.mjs').Env
  type MarkdownIt = import('./markdown-it.mjs').MarkdownIt
  type MarkdownItOptions = import('./markdown-it.mjs').MarkdownItOptions
  type MarkdownItPreset = import('./markdown-it.mjs').MarkdownItPreset
  type ParserBlock = import('./markdown-it.mjs').ParserBlock
  type ParserCore = import('./markdown-it.mjs').ParserCore
  type ParserInline = import('./markdown-it.mjs').ParserInline
  type Renderer = import('./markdown-it.mjs').Renderer
  type RendererRule = import('./markdown-it.mjs').RendererRule
  type Ruler<Args extends unknown[], Result> = import('./markdown-it.mjs').Ruler<Args, Result>
  type StateBlock = import('./markdown-it.mjs').StateBlock
  type StateCore = import('./markdown-it.mjs').StateCore
  type StateInline = import('./markdown-it.mjs').StateInline
  type Token = import('./markdown-it.mjs').Token
}
declare const MarkdownIt: typeof import('./markdown-it.mjs').default
export = MarkdownIt
