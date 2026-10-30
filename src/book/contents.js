/** @jsx h */
import { h } from "preact";
import * as Intro from "./pages/Intro.md";
import * as Coordinates2D from "./pages/Coordinates2D.md";
import * as Coordinates2DOther from "./pages/Coordinates2DOther.md";
import * as Coordinates3D from "./pages/Coordinates3D.md";
import * as Position from "./pages/Position.md";
import * as Rotation from "./pages/Rotation.md";
import * as Scale from "./pages/Scale.md";
import * as ThreeJS from "./pages/ThreeJS.md";
import * as ThreeJSVectorAndColor from "./pages/ThreeJSVectorAndColor.md";
import * as ThreeJSGeometry from "./pages/ThreeJSGeometry.md";
import * as ThreeJSMaterial from "./pages/ThreeJSMaterial.md";
import * as ThreeJSMesh from "./pages/ThreeJSMesh.md";
import * as ThreeJSScene from "./pages/ThreeJSScene.md";
import * as Waves from "./pages/Waves.md";
import * as Noise2D from "./pages/Noise2D.md";
import * as Noise1D from "./pages/Noise1D.md";
import * as Noise3D from "./pages/Noise3D.md";
import * as Noise3DSphere from "./pages/Noise3DSphere.md";
import * as Shaders from "./pages/Shaders.md";
import * as GLSLSyntax from "./pages/GLSLSyntax.md";
import * as VertexShaders from "./pages/VertexShaders.md";
import * as FragmentShaders from "./pages/FragmentShaders.md";
import * as ThreeJSShader from "./pages/ThreeJSShader.md";
import * as ThreeJSVaryings from "./pages/ThreeJSVaryings.md";
import * as ThreeJSRawShader from "./pages/ThreeJSRawShader.md";
import * as Extras from "./pages/Extras.md";
import * as CanvasSketchWebsite from "./pages/CanvasSketchWebsite.md";
export default {
  home: Intro,
  pages: [
    {
      title: "Coordinates",
      children: [Coordinates2D, Coordinates2DOther, Coordinates3D],
    },
    {
      body: ThreeJS,
      children: [
        ThreeJSVectorAndColor,
        ThreeJSGeometry,
        ThreeJSMaterial,
        ThreeJSMesh,
        {
          title: "3D Transformations",
          children: [Position, Rotation, Scale],
        },
        ThreeJSScene,
      ],
    },
    {
      body: Shaders,
      children: [
        GLSLSyntax,
        VertexShaders,
        FragmentShaders,
        ThreeJSShader,
        ThreeJSVaryings,
      ],
    },
    {
      body: Extras,
      title: "Extras",
      children: [
        Waves,
        Noise1D,
        Noise2D,
        Noise3D,
        Noise3DSphere,
        ThreeJSRawShader,
        CanvasSketchWebsite,
      ],
    },
  ],
};
