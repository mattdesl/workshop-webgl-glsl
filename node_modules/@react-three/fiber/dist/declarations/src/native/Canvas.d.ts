import * as React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { RenderProps } from "../core/index.js";
export interface CanvasProps extends Omit<RenderProps<HTMLCanvasElement>, 'size' | 'dpr'>, Omit<ViewProps, 'children'> {
    children?: React.ReactNode;
    style?: ViewStyle;
    ref?: React.Ref<View>;
}
/**
 * A native canvas which accepts threejs elements as children.
 * @see https://docs.pmnd.rs/react-three-fiber/api/canvas
 */
export declare function Canvas(props: CanvasProps): React.JSX.Element;
