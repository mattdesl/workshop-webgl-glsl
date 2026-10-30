/**
 * Creates new ignore manager.
 */
declare function ignore(options?: ignore.Options): ignore.Ignore
declare namespace ignore {
  /**
   * A path relative to the directory the rules belong to, as
   *   `path.relative()` returns it.
   */
  type Pathname = string

  interface PatternParams {
    pattern: string
    /**
     * Carried through to `IgnoreRule.mark`, for packages that build upon
     *   `ignore`.
     */
    mark?: string
  }

  interface IgnoreRule {
    /**
     * The original pattern.
     */
    pattern: string
    /**
     * Carried through from `PatternParams.mark`.
     */
    mark?: string
    /**
     * Whether the pattern is a negative one, such as `!foo`.
     */
    negative: boolean
  }

  interface TestResult {
    /**
     * Whether the pathname is ignored, by a rule or because a parent
     *   directory of it is.
     */
    ignored: boolean
    /**
     * True if a negative pattern matched the pathname itself, and no parent
     *   directory of it is ignored.
     *
     * Only `ignored` passes down from a parent directory, so a pathname that
     *   is not ignored only because a parent directory was unignored keeps
     *   this false, as does one no rule applies to at all. To tell those two
     *   apart, test the parent directories, each with a trailing slash.
     */
    unignored: boolean
    /**
     * The rule that ignores the pathname, or the parent directory it is
     *   ignored with: the last rule to match, which is the rule
     *   `git check-ignore -v` reports. Present exactly when `ignored` is true.
     */
    rule?: IgnoreRule
  }

  interface Ignore {
    /**
     * Adds one or several rules to the current manager.
     * @param  {string[]} patterns
     * @returns IgnoreBase
     */
    add(
      patterns: string | Ignore | readonly (string | Ignore)[] | PatternParams
    ): this

    /**
     * Filters the given array of pathnames, and returns the filtered array.
     * NOTICE that each path here should be a relative path to the root of your repository.
     * @param paths the array of paths to be filtered.
     * @returns The filtered array of paths
     */
    filter(pathnames: readonly Pathname[]): Pathname[]

    /**
     * Creates a filter function which could filter
     * an array of paths with Array.prototype.filter.
     */
    createFilter(): (pathname: Pathname) => boolean

    /**
     * Returns Boolean whether pathname should be ignored.
     * @param  {string} pathname a path to check
     * @returns boolean
     */
    ignores(pathname: Pathname): boolean

    /**
     * Tests the pathname against the rules. `ignored` and `unignored` can
     *   both be false: see `TestResult.unignored` for the two cases.
     * @param  {string} pathname a path to check
     * @returns TestResult
     */
    test(pathname: Pathname): TestResult

    /**
     * Debugs ignore rules and returns the checking result, which is
     *   equivalent to `git check-ignore -v`.
     * @returns TestResult
     */
    checkIgnore(pathname: Pathname): TestResult
  }

  interface Options {
    ignorecase?: boolean
    // For compatibility
    ignoreCase?: boolean
    allowRelativePaths?: boolean
  }

  function isPathValid(pathname: string): boolean
}

export = ignore
