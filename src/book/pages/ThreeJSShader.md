import { ShaderMaterial } from './InteractiveComponents';

export const metadata = {
  demo: ShaderMaterial,
  title: 'THREE.ShaderMaterial'
};

ThreeJS shaders include some built-in uniforms (e.g. `projectionMatrix`) and attributes (e.g. `position`, `uv`), so you don't need to redefine them. You also don't need to write a `precision` specifier.