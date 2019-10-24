import { Rotation } from './InteractiveComponents';

export const metadata = {
  demo: Rotation,
  title: 'Rotation'
};

Objects also have a `rotation`, which is a [THREE.Euler](https://threejs.org/docs/#api/en/math/Euler) that you can use to rotate an object.

The class is very similar to `THREE.Vector3`, but values are in radians.
