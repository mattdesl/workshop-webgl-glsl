/** @jsx h */
import { h } from "preact";
import * as THREE from "three";
import defined from "defined";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Random from "canvas-sketch-util/random";
import { linspace, lerp } from "canvas-sketch-util/math";
import InteractiveComponent from "./InteractiveComponent";
import createCartesianGrid from "./createCartesianGrid";
import createWireframe from "../util/createTubeWireframe";
import UI from "../util/UI";

const settings = {
  context: "webgl2",
  animate: true,
  attributes: { antialias: true },
};

const sketch = (props) => {
  const { data = {}, context, canvas } = props;
  const { geometryType, material, materialType } = data.params;

  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor("#fff", 1);
  renderer.sortObjects = false;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  camera.position.set(2, 2, 2);
  camera.lookAt(new THREE.Vector3());

  const getWireframe = (geom) => {
    return material
      ? geom
      : createWireframe(geom, {
          thickness: 0.005,
        });
  };

  const materialTypes = {
    GeometryMaterial: new THREE.MeshBasicMaterial({
      color: "black",
      transparent: true,
      depthTest: false,
      depthWrite: false,
      wireframe: false,
    }),
    MeshNormalMaterial: new THREE.MeshNormalMaterial(),
    MeshBasicMaterial: new THREE.MeshBasicMaterial(),
    MeshPhongMaterial: new THREE.MeshPhongMaterial({
      specular: 0x444444,
      shininess: 30
    }),
    MeshStandardMaterial: new THREE.MeshStandardMaterial({
      metalness: 0.9,
      roughness: 0.5
    }),
    MeshToonMaterial: new THREE.MeshToonMaterial(),
  };

  const geometryTypes = {
    PlaneGeometry: getWireframe(new THREE.PlaneGeometry(1, 1, 1, 1)),
    BoxGeometry: getWireframe(new THREE.BoxGeometry(1, 1, 1)),
    CylinderGeometry: getWireframe(
      new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8, 1),
    ),
    SphereGeometry: getWireframe(new THREE.SphereGeometry(1, 16, 8)),
    IcosahedronGeometry: getWireframe(new THREE.IcosahedronGeometry(1, 1)),
  };

  // Keep a faceted sphere available for the toon material's flat-shaded look.
  const flatSphereGeometry = new THREE.SphereGeometry(1, 16, 8).toNonIndexed();
  flatSphereGeometry.computeVertexNormals();

  const scene = new THREE.Scene();
  const mainMesh = new THREE.Mesh(
    geometryTypes[geometryType],
    materialTypes[materialType],
  );
  scene.add(mainMesh);

  // MeshToonMaterial no longer has the legacy Phong specular highlight.
  const toonHighlightMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    specular: 0xffffff,
    shininess: 90,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const toonHighlightMesh = new THREE.Mesh(
    geometryTypes[geometryType],
    toonHighlightMaterial,
  );
  toonHighlightMesh.visible = false;
  toonHighlightMesh.renderOrder = 1;
  scene.add(toonHighlightMesh);
  const toonHighlightTint = new THREE.Color();
  const highlightWhite = new THREE.Color(0xffffff);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;

  const light = new THREE.PointLight("white", 28, 40);
  light.position.set(2, 2, 2);
  light.decay = 1.9;
  scene.add(light);

  return {
    resize(props) {
      renderer.setSize(props.viewportWidth, props.viewportHeight);
      renderer.setPixelRatio(props.pixelRatio);
      camera.aspect = props.width / props.height;
      camera.updateProjectionMatrix();
    },
    render(props) {
      const { data = {} } = props;
      const { params } = data;
      const { geometryType, materialType, wireframe, flatShading, color } =
        params;

      const useFacetedToonSphere =
        materialType === "MeshToonMaterial" &&
        flatShading &&
        geometryType === "SphereGeometry";
      mainMesh.geometry = useFacetedToonSphere
        ? flatSphereGeometry
        : geometryTypes[geometryType];
      mainMesh.material = materialTypes[materialType];
      toonHighlightMesh.geometry = mainMesh.geometry;
      toonHighlightMesh.visible =
        materialType === "MeshToonMaterial" && !wireframe;
      const oldFlat = mainMesh.material.flatShading;
      const oldWire = mainMesh.material.wireframe;
      mainMesh.material.wireframe = wireframe;
      const supportsFlatShading = "flatShading" in mainMesh.material && materialType !== "MeshToonMaterial";
      const materialFlatShading = flatShading;
      const oldHighlightFlat = toonHighlightMaterial.flatShading;
      toonHighlightMaterial.flatShading = materialFlatShading;
      if (materialFlatShading !== oldHighlightFlat) {
        toonHighlightMaterial.needsUpdate = true;
      }
      if (supportsFlatShading) {
        mainMesh.material.flatShading = materialFlatShading;
      }
      if (
        (supportsFlatShading && materialFlatShading !== oldFlat) ||
        wireframe !== oldWire
      ) {
        mainMesh.material.needsUpdate = true;
      }
      if (mainMesh.material.color) {
        mainMesh.material.color.set(color);
        if (materialType === "MeshPhongMaterial") {
          mainMesh.material.color.multiplyScalar(0.5);
        } else if (materialType === "MeshToonMaterial") {
          mainMesh.material.color.multiplyScalar(0.65);
          toonHighlightTint
            .set(color)
            .lerp(highlightWhite, 0.45)
            .multiplyScalar(0.018);
          toonHighlightMaterial.specular.copy(toonHighlightTint);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    },
    unload(props) {
      controls.dispose();
      renderer.dispose();
      flatSphereGeometry.dispose();
      toonHighlightMaterial.dispose();
    },
  };
};
class ParamsConfig {
  constructor(material) {
    this.material = material;

    // Explicitly binding properties to the instance for standard class execution
    this.geometryType = material ? "SphereGeometry" : "PlaneGeometry";
    this.materialType = material ? "MeshBasicMaterial" : "GeometryMaterial";
    this.color = material ? "tomato" : "black";
    this.wireframe = false;
    this.flatShading = true;
  }

  @UI.Select({
    visible: function () {
      return !this.material;
    },
    label: "Type",
    options: [
      "PlaneGeometry",
      "BoxGeometry",
      "SphereGeometry",
      "IcosahedronGeometry",
      "CylinderGeometry",
    ],
  })
  geometryType;

  @UI.Select({
    visible: function () {
      return this.material;
    },
    label: "Type",
    options: [
      "MeshBasicMaterial",
      "MeshNormalMaterial",
      "MeshPhongMaterial",
      "MeshToonMaterial",
      "MeshStandardMaterial",
    ],
  })
  materialType;

  @UI.Color({
    visible: function () {
      return this.material;
    },
  })
  color;

  @UI.Checkbox({
    visible: function () {
      return this.material;
    },
    hideCheckmark: true,
  })
  wireframe;

  @UI.Checkbox({
    visible: function () {
      return this.material;
    },
    hideCheckmark: true,
  })
  flatShading;
}

export default (props) => {
  const { material = false } = props;
  const params = new ParamsConfig(material);

  return (
    <InteractiveComponent
      sketch={sketch}
      settings={settings}
      params={params}
      showParams
      showCanvas
      size="small"
    />
  );
};
