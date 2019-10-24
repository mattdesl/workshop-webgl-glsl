/** @jsx h */
const { h } = require("preact");
const Intro = require("./pages/Intro.md");
const Coordinates2D = require("./pages/Coordinates2D.md");
const Coordinates2DOther = require("./pages/Coordinates2DOther.md");
const Coordinates3D = require("./pages/Coordinates3D.md");
const Position = require("./pages/Position.md");
const Rotation = require("./pages/Rotation.md");
const Scale = require("./pages/Scale.md");
const ThreeJS = require("./pages/ThreeJS.md");
const ThreeJSVectorAndColor = require("./pages/ThreeJSVectorAndColor");
const ThreeJSGeometry = require("./pages/ThreeJSGeometry");
const ThreeJSMaterial = require("./pages/ThreeJSMaterial");
const ThreeJSMesh = require("./pages/ThreeJSMesh");
const ThreeJSCamera = require("./pages/ThreeJSCamera");
const ThreeJSLight = require("./pages/ThreeJSLight");
const ThreeJSGroup = require("./pages/ThreeJSGroup");
const ThreeJSScene = require("./pages/ThreeJSScene");
const Waves = require("./pages/Waves");
const Noise2D = require("./pages/Noise2D");
const Noise1D = require("./pages/Noise1D");
const Noise3D = require("./pages/Noise3D");
const Noise3DSphere = require("./pages/Noise3DSphere");
const Shaders = require("./pages/Shaders");
const GLSLSyntax = require("./pages/GLSLSyntax");
const VertexShaders = require("./pages/VertexShaders");
const FragmentShaders = require("./pages/FragmentShaders");
const ThreeJSShader = require("./pages/ThreeJSShader");
const ThreeJSVaryings = require("./pages/ThreeJSVaryings");
const ThreeJSRawShader = require("./pages/ThreeJSRawShader");
const Extras = require("./pages/Extras");

const VectorMath = () => (
  <div>
    <button>hello</button> special thing
  </div>
);

// const Intro = ;
module.exports = {
  home: Intro,
  pages: [
    {
      title: "Coordinates",
      children: [Coordinates2D, Coordinates2DOther, Coordinates3D]
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
          children: [Position, Rotation, Scale]
        },
        ThreeJSScene
      ]
    },
    {
      body: Shaders,
      children: [
        GLSLSyntax,
        VertexShaders,
        FragmentShaders,
        ThreeJSShader,
        ThreeJSVaryings
      ]
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
        ThreeJSRawShader
      ]
    }
  ]
};
