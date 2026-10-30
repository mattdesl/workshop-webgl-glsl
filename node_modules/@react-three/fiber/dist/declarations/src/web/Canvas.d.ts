import * as React from 'react';
import { Options as ResizeOptions } from 'react-use-measure';
import { RenderProps } from "../core/index.js";
export interface CanvasProps extends Omit<RenderProps<HTMLCanvasElement>, 'size'>, React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    ref?: React.Ref<HTMLCanvasElement>;
    /** Canvas fallback content, similar to img's alt prop */
    fallback?: React.ReactNode;
    /**
     * Options to pass to useMeasure.
     * @see https://github.com/pmndrs/react-use-measure#api
     */
    resize?: ResizeOptions;
    /** The target where events are being subscribed to, default: the div that wraps canvas */
    eventSource?: HTMLElement | React.RefObject<HTMLElement | null>;
    /** The event prefix that is cast into canvas pointer x/y events, default: "offset" */
    eventPrefix?: 'offset' | 'client' | 'page' | 'layer' | 'screen';
}
/**
 * A DOM canvas which accepts threejs elements as children.
 * @see https://docs.pmnd.rs/react-three-fiber/api/canvas
 */
export declare function Canvas(props: CanvasProps): React.JSX.Element;
