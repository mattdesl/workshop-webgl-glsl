'use strict'

const ANSIColors = {
    RESET: '\x1b[0m',
    BOLD_BLUE: '\x1b[1;34m',
    BOLD_CYAN: '\x1b[1;36m',
    BOLD_GREEN: '\x1b[1;32m',
    BOLD_MAGENTA: '\x1b[1;35m',
    BOLD_YELLOW: '\x1b[1;33m',
    CYAN: '\x1b[36m',
    GREEN: '\x1b[32m',
    MAGENTA: '\x1b[35m',
    YELLOW: '\x1b[33m'
}

const argparse = {
    usage: ANSIColors.BOLD_BLUE,
    prog: ANSIColors.BOLD_MAGENTA,
    prog_extra: ANSIColors.MAGENTA,
    heading: ANSIColors.BOLD_BLUE,
    summary_long_option: ANSIColors.CYAN,
    summary_short_option: ANSIColors.GREEN,
    summary_label: ANSIColors.YELLOW,
    summary_action: ANSIColors.GREEN,
    long_option: ANSIColors.BOLD_CYAN,
    short_option: ANSIColors.BOLD_GREEN,
    label: ANSIColors.BOLD_YELLOW,
    action: ANSIColors.BOLD_GREEN,
    reset: ANSIColors.RESET
}

const default_theme = { argparse }
const argparse_no_color = {}
for (const name of Object.keys(argparse)) argparse_no_color[name] = ''
const theme_no_color = { argparse: argparse_no_color }

function decolor (text) {
    for (const code of Object.values(ANSIColors)) {
        text = text.split(code).join('')
    }
    return text
}

function can_colorize (file = undefined) {
    const getenv = name => {
        try {
            return process.env[name]
        } catch (err) {
            return undefined
        }
    }

    if (getenv('PYTHON_COLORS') === '0') return false
    if (getenv('PYTHON_COLORS') === '1') return true
    if (getenv('NO_COLOR')) return false
    if (getenv('FORCE_COLOR')) return true
    if (getenv('TERM') === 'dumb') return false

    if (file === undefined) file = process.stdout
    if (!file) return false
    if (typeof file.hasColors === 'function') return file.hasColors()
    return file.isTTY === true
}

function get_theme ({ tty_file, force_color = false, force_no_color = false } = {}) {
    if (force_color || (!force_no_color && can_colorize(tty_file))) {
        return default_theme
    }
    return theme_no_color
}

module.exports = { can_colorize, decolor, get_theme }
