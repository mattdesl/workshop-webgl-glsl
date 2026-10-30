/// <reference types="webxr" />
import type { RootState } from "./store.js";
export type GlobalRenderCallback = (timestamp: number) => void;
/**
 * Adds a global render callback which is called each frame.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#addEffect
 */
export declare const addEffect: (callback: GlobalRenderCallback) => () => void;
/**
 * Adds a global after-render callback which is called each frame.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#addAfterEffect
 */
export declare const addAfterEffect: (callback: GlobalRenderCallback) => () => void;
/**
 * Adds a global callback which is called when rendering stops.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#addTail
 */
export declare const addTail: (callback: GlobalRenderCallback) => () => void;
export type GlobalEffectType = 'before' | 'after' | 'tail';
export declare function flushGlobalEffects(type: GlobalEffectType, timestamp: number): void;
export declare function loop(timestamp: number): void;
/**
 * Invalidates the view, requesting a frame to be rendered. Will globally invalidate unless passed a root's state.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#invalidate
 */
export declare function invalidate(state?: RootState, frames?: number): void;
/**
 * Advances the frameloop and runs render effects, useful for when manually rendering via `frameloop="never"`.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#advance
 */
export declare function advance(timestamp: number, runGlobalEffects?: boolean, state?: RootState, frame?: XRFrame): void;
