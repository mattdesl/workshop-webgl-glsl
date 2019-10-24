import { Mesh } from './InteractiveComponents';

export const metadata = {
  demo: Mesh,
  title: 'THREE.Mesh'
};

You can crete a [THREE.Mesh](https://threejs.org/docs/#api/en/objects/Mesh) by combining a `THREE.Geometry` and `THREE.Material`.

> *Hint:* For performance, it's better to create one instance of `THREE.Geometry` and re-use it for many meshes.