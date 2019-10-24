import { ShaderVaryings } from './InteractiveComponents';

export const metadata = {
  demo: ShaderVaryings,
  title: 'UV Coordinates'
};

You can pass data down from the vertex to the fragment shader using *varyings*. These have to be declared with the same name and type in both vertex and fragment shaders.