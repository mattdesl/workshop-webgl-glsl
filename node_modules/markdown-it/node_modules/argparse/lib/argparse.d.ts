export type Nargs = number | '?' | '*' | '+' | 'A...' | '...' | '==SUPPRESS=='

export type ArgumentType =
  | string
  | ((value: string) => unknown)
  | (new (value: string) => unknown)

export interface ArgumentOptions {
  action?: string | ActionClass
  option_strings?: string[]
  dest?: string
  nargs?: Nargs
  const?: unknown
  default?: unknown
  type?: ArgumentType
  choices?: string | readonly unknown[] | object
  required?: boolean
  help?: string
  metavar?: string | string[]
  version?: string
  deprecated?: boolean
}

export interface ActionConstructorOptions extends ArgumentOptions {
  option_strings: string[]
  dest: string
}

export interface Action {
  option_strings: string[]
  dest: string
  nargs?: Nargs
  const?: unknown
  default?: unknown
  type?: ArgumentType
  choices?: string | readonly unknown[] | object
  required: boolean
  help?: string
  metavar?: string | string[]
  deprecated: boolean

  (parser: ArgumentParser, namespace: Namespace, values: unknown, option_string?: string): void
  call(parser: ArgumentParser, namespace: Namespace, values: unknown, option_string?: string): void
  format_usage(): string
}

export interface ActionClass {
  new (options: ActionConstructorOptions): Action
  readonly prototype: Action
}

export interface ActionConstructor extends ActionClass {
  (options: ActionConstructorOptions): Action
}

export const Action: ActionConstructor

export interface BooleanOptionalAction extends Action {}

export interface BooleanOptionalActionConstructor {
  new (options: ActionConstructorOptions): BooleanOptionalAction
  (options: ActionConstructorOptions): BooleanOptionalAction
  readonly prototype: BooleanOptionalAction
}

export const BooleanOptionalAction: BooleanOptionalActionConstructor

export interface ArgumentError extends Error {
  str(): string
}

export interface ArgumentErrorConstructor {
  new (argument: Action | undefined, message: string): ArgumentError
  (argument: Action | undefined, message: string): ArgumentError
  readonly prototype: ArgumentError
}

export const ArgumentError: ArgumentErrorConstructor

export interface ArgumentTypeError extends Error {}

export interface ArgumentTypeErrorConstructor {
  new (message: string): ArgumentTypeError
  (message: string): ArgumentTypeError
  readonly prototype: ArgumentTypeError
}

export const ArgumentTypeError: ArgumentTypeErrorConstructor

export interface HelpFormatterOptions {
  prog: string
  indent_increment?: number
  max_help_position?: number
  width?: number
  color?: boolean
}

export interface HelpFormatter {}

export interface HelpFormatterClass {
  new (options: HelpFormatterOptions): HelpFormatter
  readonly prototype: HelpFormatter
}

export interface HelpFormatterConstructor extends HelpFormatterClass {
  (options: HelpFormatterOptions): HelpFormatter
}

export type HelpFormatterFactory =
  | HelpFormatterClass
  | ((options: HelpFormatterOptions) => HelpFormatter)

export const HelpFormatter: HelpFormatterConstructor

export interface RawDescriptionHelpFormatter extends HelpFormatter {}
export const RawDescriptionHelpFormatter: HelpFormatterConstructor

export interface RawTextHelpFormatter extends RawDescriptionHelpFormatter {}
export const RawTextHelpFormatter: HelpFormatterConstructor

export interface ArgumentDefaultsHelpFormatter extends HelpFormatter {}
export const ArgumentDefaultsHelpFormatter: HelpFormatterConstructor

export interface MetavarTypeHelpFormatter extends HelpFormatter {}
export const MetavarTypeHelpFormatter: HelpFormatterConstructor

export interface FileTypeOptions {
  flags?: string
  encoding?: string
  mode?: number
  autoClose?: boolean
  emitClose?: boolean
  start?: number
  end?: number
  highWaterMark?: number
  fs?: object
}

export interface FileTypeResult {
  path?: string
  close?: () => void
  [key: string]: unknown
}

export interface FileType {
  (value: string): FileTypeResult
  call(value: string): FileTypeResult
}

export interface FileTypeConstructor {
  new (options?: FileTypeOptions): FileType
  new (flags?: string, encoding?: string, mode?: number): FileType
  (options?: FileTypeOptions): FileType
  (flags?: string, encoding?: string, mode?: number): FileType
  readonly prototype: FileType
}

export const FileType: FileTypeConstructor

export interface Namespace {
  [key: string]: any
}

export interface NamespaceConstructor {
  new (options?: object): Namespace
  (options?: object): Namespace
  readonly prototype: Namespace
}

export const Namespace: NamespaceConstructor

export interface ArgumentGroupOptions {
  title?: string
  description?: string
  prefix_chars?: string
  argument_default?: unknown
  conflict_handler?: string
}

export interface MutuallyExclusiveGroupOptions {
  required?: boolean
}

export interface ActionsContainer {
  register(registry_name: string, value: unknown, object: unknown): void

  set_defaults(options: object): void
  get_default(dest: string): unknown

  add_argument(name: string, ...names: string[]): Action
  add_argument(name: string, ...namesAndOptions: [...string[], ArgumentOptions]): Action
}

export interface MutuallyExclusiveGroup extends ActionsContainer {}

export interface ArgumentGroup extends ActionsContainer {
  add_mutually_exclusive_group(options?: MutuallyExclusiveGroupOptions): MutuallyExclusiveGroup
}

export interface ArgumentParserOptions {
  prog?: string
  usage?: string
  description?: string
  epilog?: string
  parents?: ArgumentParser[]
  formatter_class?: HelpFormatterFactory
  prefix_chars?: string
  fromfile_prefix_chars?: string
  argument_default?: unknown
  conflict_handler?: string
  add_help?: boolean
  allow_abbrev?: boolean
  exit_on_error?: boolean
  suggest_on_error?: boolean
  color?: boolean
}

export interface SubparserOptions {
  title?: string
  description?: string
  prog?: string
  parser_class?: ArgumentParserClass
  action?: string | ActionClass
  dest?: string
  required?: boolean
  help?: string
  metavar?: string
}

export interface SubArgumentParserOptions extends ArgumentParserOptions {
  aliases?: string[]
  help?: string
  deprecated?: boolean
}

export interface SubparsersAction extends Action {
  add_parser(name: string, options?: SubArgumentParserOptions): ArgumentParser
}

export interface Writable {
  write(message: string): unknown
}

export interface ArgumentParser extends ArgumentGroup {
  prog: string
  usage?: string
  description?: string
  epilog?: string
  formatter_class: HelpFormatterFactory
  fromfile_prefix_chars?: string
  add_help: boolean
  allow_abbrev: boolean
  exit_on_error: boolean
  suggest_on_error: boolean
  color: boolean

  add_argument_group(options?: ArgumentGroupOptions): ArgumentGroup
  add_argument_group(title?: string, description?: string): ArgumentGroup
  add_mutually_exclusive_group(options?: MutuallyExclusiveGroupOptions): MutuallyExclusiveGroup
  add_subparsers(options?: SubparserOptions): SubparsersAction

  parse_args<T extends object = Namespace>(args?: string[], namespace?: T): T
  parse_known_args<T extends object = Namespace>(args?: string[], namespace?: T): [T, string[]]
  parse_intermixed_args<T extends object = Namespace>(args?: string[], namespace?: T): T
  parse_known_intermixed_args<T extends object = Namespace>(args?: string[], namespace?: T): [T, string[]]

  convert_arg_line_to_args(arg_line: string): string[]
  format_usage(): string
  format_help(): string
  print_usage(file?: Writable): void
  print_help(file?: Writable): void
  exit(status?: number, message?: string): void
  error(message: string): void
}

export interface ArgumentParserClass {
  new (options?: ArgumentParserOptions): ArgumentParser
  readonly prototype: ArgumentParser
}

export interface ArgumentParserConstructor extends ArgumentParserClass {
  (options?: ArgumentParserOptions): ArgumentParser
}

export const ArgumentParser: ArgumentParserConstructor

export const SUPPRESS: '==SUPPRESS=='
export const OPTIONAL: '?'
export const ZERO_OR_MORE: '*'
export const ONE_OR_MORE: '+'
export const REMAINDER: '...'
export const PARSER: 'A...'
