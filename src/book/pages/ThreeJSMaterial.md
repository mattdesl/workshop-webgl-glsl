import ThreeGeomMat from '../interactive/ThreeGeomMat';

export const metadata = {
  demo: () => <ThreeGeomMat material />,
  title: 'THREE.Material'
};

ThreeJS uses a [THREE.Material](https://threejs.org/docs/#api/en/materials/Material) class to hold surface properties such as color, metalness, etc.

Some of the built-in materials are shown below, such as:

- [THREE.MeshBasicMaterial](https://threejs.org/docs/#api/en/materials/MeshBasicMaterial)
- [THREE.MeshNormalMaterial](https://threejs.org/docs/#api/en/materials/MeshNormalMaterial)
- [THREE.MeshPhongMaterial](https://threejs.org/docs/#api/en/materials/MeshPhongMaterial)