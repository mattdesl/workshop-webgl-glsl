/**
 * @import {HtmlExtension} from 'micromark-util-types'
 */

const alignment = {
  none: '',
  left: ' align="left"',
  right: ' align="right"',
  center: ' align="center"'
};

// To do: micromark@5: use `infer` here, when all events are exposed.

/**
 * Create an HTML extension for `micromark` to support GitHub tables when
 * serializing to HTML.
 *
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions` to
 *   support GitHub tables when serializing to HTML.
 */
export function gfmTableHtml() {
  return {
    enter: {
      table(token) {
        const tableAlign = token._align;
        this.lineEndingIfNeeded();
        this.tag('<table>');
        this.setData('tableAlign', tableAlign);
      },
      tableBody() {
        this.tag('<tbody>');
      },
      tableData() {
        const tableAlign = this.getData('tableAlign');
        const tableColumn = this.getData('tableColumn');
        const align = alignment[tableAlign[tableColumn]];
        if (align === undefined) {
          // Capture results to ignore them.
          this.buffer();
        } else {
          this.lineEndingIfNeeded();
          this.tag('<td' + align + '>');
        }
      },
      tableHead() {
        this.lineEndingIfNeeded();
        this.tag('<thead>');
      },
      tableHeader() {
        const tableAlign = this.getData('tableAlign');
        const tableColumn = this.getData('tableColumn');
        const align = alignment[tableAlign[tableColumn]];
        this.lineEndingIfNeeded();
        this.tag('<th' + align + '>');
      },
      tableRow() {
        this.setData('tableColumn', 0);
        this.lineEndingIfNeeded();
        this.tag('<tr>');
      }
    },
    exit: {
      // Overwrite the default code text data handler to unescape escaped pipes when
      // they are in tables.
      codeTextData(token) {
        let value = this.sliceSerialize(token);
        if (this.getData('tableAlign')) {
          value = value.replace(/\\([\\|])/g, replace);
        }
        this.raw(this.encode(value));
      },
      table() {
        this.setData('tableAlign');
        // Note: we don’t set `slurpAllLineEndings` anymore, in delimiter rows,
        // but we do need to reset it to match a funky newline GH generates for
        // list items combined with tables.
        this.setData('slurpAllLineEndings');
        this.lineEndingIfNeeded();
        this.tag('</table>');
      },
      tableBody() {
        this.lineEndingIfNeeded();
        this.tag('</tbody>');
      },
      tableData() {
        const tableAlign = this.getData('tableAlign');
        const tableColumn = this.getData('tableColumn');
        if (tableColumn in tableAlign) {
          this.tag('</td>');
          this.setData('tableColumn', tableColumn + 1);
        } else {
          // Stop capturing.
          this.resume();
        }
      },
      tableHead() {
        this.lineEndingIfNeeded();
        this.tag('</thead>');
      },
      tableHeader() {
        const tableColumn = this.getData('tableColumn');
        this.tag('</th>');
        this.setData('tableColumn', tableColumn + 1);
      },
      tableRow() {
        const tableAlign = this.getData('tableAlign');
        let tableColumn = this.getData('tableColumn');
        while (tableColumn < tableAlign.length) {
          this.lineEndingIfNeeded();
          this.tag('<td' + alignment[tableAlign[tableColumn]] + '></td>');
          tableColumn++;
        }
        this.setData('tableColumn', tableColumn);
        this.lineEndingIfNeeded();
        this.tag('</tr>');
      }
    }
  };
}

/**
 * Replace escaped characters in table cells.
 *
 * @param {string} $0
 *   Whole.
 * @param {string} $1
 *   Escaped character (either a backslash or a pipe).
 * @returns {string}
 *   Replacement for the escaped character.
 */
function replace($0, $1) {
  // Pipes work, backslashes don’t (but can’t escape pipes).
  return $1 === '|' ? $1 : $0;
}