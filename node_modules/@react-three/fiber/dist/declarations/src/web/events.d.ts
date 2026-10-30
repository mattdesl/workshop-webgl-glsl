import { RootStore } from "../core/store.js";
import { EventManager } from "../core/events.js";
/** Default R3F event manager for web */
export declare function createPointerEvents(store: RootStore): EventManager<HTMLElement>;
