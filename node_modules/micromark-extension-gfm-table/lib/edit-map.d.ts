/**
 * @import {Event} from 'micromark-util-types'
 */
/**
 * @typedef {[number, number, Array<Event>]} Change
 * @typedef {[number, number, number]} Jump
 */
/**
 * Tracks a bunch of edits.
 */
export class EditMap {
    /**
     * Record of changes.
     *
     * @type {Array<Change>}
     */
    map: Array<Change>;
    /**
     * Changes by index, so `add` does not scan `map` (quadratic on
     * table-heavy documents).
     *
     * @type {Map<number, Change>}
     */
    index: Map<number, Change>;
    /**
     * Create an edit: a remove and/or add at a certain place.
     *
     * @param {number} index
     *   Index at which to apply the edit.
     * @param {number} remove
     *   Count of items to remove at the index.
     * @param {Array<Event>} add
     *   Items to add at the index.
     * @returns {undefined}
     *   Nothing.
     */
    add(index: number, remove: number, add: Array<Event>): undefined;
    /**
     * Done, change the events.
     *
     * @param {Array<Event>} events
     *   List of events to apply the edits to.
     * @returns {undefined}
     *   Nothing.
     */
    consume(events: Array<Event>): undefined;
}
export type Change = [number, number, Array<Event>];
export type Jump = [number, number, number];
import type { Event } from 'micromark-util-types';
//# sourceMappingURL=edit-map.d.ts.map