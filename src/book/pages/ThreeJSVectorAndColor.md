import { THREEVectorAndColor } from './InteractiveComponents';

export const metadata = {
  demo: THREEVectorAndColor,
  title: 'THREE.Vector & THREE.Color'
};

ThreeJS uses a data types for "coordinates" called `THREE.Vector`:

- [THREE.Vector2](https://threejs.org/docs/#api/en/math/Vector2) (2D Coordinate)
- [THREE.Vector3](https://threejs.org/docs/#api/en/math/Vector3) (3D Coordinate)
- [THREE.Vector4](https://threejs.org/docs/#api/en/math/Vector4) (4D Coordinate)

It also uses a data type for colors called `THREE.Color`:

- [THREE.Color](https://threejs.org/docs/#api/en/math/Color)

Here's one of our earlier demos but using ThreeJS data types instead of plain JavaScript objects.
