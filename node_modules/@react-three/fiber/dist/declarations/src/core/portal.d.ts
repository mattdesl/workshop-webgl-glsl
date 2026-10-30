import * as React from 'react';
import * as THREE from 'three';
import type { ComputeFunction } from "./events.js";
import { type RootState } from "./store.js";
export type InjectState = Partial<Omit<RootState, 'events'> & {
    events?: {
        enabled?: boolean;
        priority?: number;
        compute?: ComputeFunction;
        connected?: any;
    };
}>;
export declare function createPortal(children: React.ReactNode, container: THREE.Object3D, state?: InjectState): React.JSX.Element;
