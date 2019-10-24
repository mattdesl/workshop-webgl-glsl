const CanvasText = require('./CanvasText');
const CameraProjector = require('./CameraProjector');

module.exports = (camera) => {
  const projector = CameraProjector(camera);
  const text = CanvasText();
  const texture = new THREE.Texture(text.canvas);
  texture.needsUpdate = true;
  texture.flipY = true;
  texture.generateMipmaps = false;
  texture.premultiplyAlpha = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      uniform float aspect;
      varying vec2 vUv;
      void main () {
        vec2 scale = vec2(
          length(modelViewMatrix[0]) / aspect,
          length(modelViewMatrix[1])
        );
      
        // vec4 billboard = (modelViewMatrix * vec4(vec3(0.0), 1.0));
        // vec4 newPosition = projectionMatrix
        //   * billboard
        //   + vec4(scale * position.xy, 0.0, 0.0);
        
        // vec3 worldPos = (modelMatrix * vec4(vec3(0.0), 1.0)).xyz;
        // gl_Position = projectionMatrix * 
        //       (modelViewMatrix * vec4(worldPos, 1) +
        //        vec4(position.xy * scale, 0, 0));

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
        vUv = uv;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform sampler2D map;
      varying vec2 vUv;

      void main () {
        gl_FragColor = texture2D(map, vUv) * vec4(color, opacity);
        // gl_FragColor.rgba = vec4(vec3(0.0), 1.0);
      }
    `,
    uniforms: {
      aspect: { value: 1 },
      opacity: { value: 1 },
      color: { value: new THREE.Color('white') },
      map: { value: texture, type: 't' }
    },
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(
    geometry,
    material
  );
  const box = new THREE.Box3();
  return {
    geometry,
    material,
    mesh,
    texture,
    canvas: text.canvas,
    update (props = {}) {
      const {
        object,
        fontSize = 1,
        scale = 1
      } = props;
      projector.update(props);
      object.updateMatrixWorld();
      box.setFromObject(object);
      const min2D = projector.project(box.min.toArray());
      const max2D = projector.project(box.max.toArray());

      let canvasWidth = Math.abs(max2D[0] - min2D[0]);
      let canvasHeight = Math.abs(max2D[1] - min2D[1]);
      canvasWidth *= scale;
      canvasHeight *= scale;

      text.update({
        ...props,
        fontSize: canvasHeight * fontSize,
        width: canvasWidth,
        height: canvasHeight
      });

      mesh.matrixAutoUpdate = false;
      mesh.matrix.identity();
      mesh.applyMatrix(object.matrix);
      mesh.quaternion.copy(camera.quaternion);
      mesh.matrixAutoUpdate = true;
      mesh.scale.multiplyScalar(scale);

      mesh.material.uniforms.aspect.value = props.width / props.height;
      mesh.material.uniforms.color.value.set(props.color);
      mesh.material.uniforms.opacity.value = props.opacity;

      texture.needsUpdate = true;
    }
  };
}
