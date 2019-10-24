import ThreeGeomMat from '../interactive/ThreeGeomMat';

export const metadata = {
  demo: () => <ThreeGeomMat material={false} />,
  title: 'THREE.Geometry'
};

ThreeJS uses a [THREE.Geometry](https://threejs.org/docs/#api/en/core/Geometry) class to hold `vertices` (vertex positions) and `faces` (i.e. indices).

Some of the built-in geometries are shown below, such as:

- [THREE.PlaneGeometry](https://threejs.org/docs/#api/en/geometries/PlaneGeometry)
- [THREE.BoxGeometry](https://threejs.org/docs/#api/en/geometries/BoxGeometry)
- [THREE.SphereGeometry](https://threejs.org/docs/#api/en/geometries/SphereGeometry)