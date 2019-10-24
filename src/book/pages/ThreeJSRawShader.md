import { RawShaderMaterial } from './InteractiveComponents';

export const metadata = {
  demo: RawShaderMaterial,
  title: 'THREE.RawShaderMaterial'
};

You can also write raw GLSL without any ThreeJS builtins using `RawShaderMaterial`.

This is useful if you are bringing shaders from other graphics engines and don't want to conflict with the predefined ThreeJS variables.