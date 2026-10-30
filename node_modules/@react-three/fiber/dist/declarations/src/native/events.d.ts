import { RootStore } from "../core/store.js";
import { EventManager } from "../core/events.js";
/** Default R3F event manager for react-native */
export declare function createTouchEvents(store: RootStore): EventManager<HTMLElement>;
