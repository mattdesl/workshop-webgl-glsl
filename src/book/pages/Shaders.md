import { ShaderFullscreen } from './InteractiveComponents';

export const metadata = {
  demo: ShaderFullscreen,
  title: 'Shaders'
};

Shaders are little programs run on the GPU. In WebGL, they use a language called GLSL, that is a little closer to C or C++ than it is to JavaScript.

The demo below shows a full-screen *fragment* shader. We will also be learning about *vertex* shaders.