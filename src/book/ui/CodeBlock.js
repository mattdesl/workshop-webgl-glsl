/** @jsx h */
import { h } from 'preact';
import Highlight, { Prism, defaultProps } from 'prism-react-renderer';
import Indices from '../interactive/Indices';
import Vertices from '../interactive/Vertices';
import NoiseGrid from '../interactive/NoiseGrid';
import CubeVisualizer from '../interactive/CubeVisualizer';
import Waves from '../interactive/Waves';
import Scene from '../interactive/Scene';
import Mesh from '../interactive/Mesh';
import RawShader from '../interactive/RawShader';
import './prism-monokai.css';
import './prism-bash';

Prism.languages.glsl = Prism.languages.extend('clike', {
  'comment': [
    /\/\*[\s\S]*?\*\//,
    /\/\/(?:\\(?:\r\n|[\s\S])|[^\\\r\n])*/
  ],
  'number': /(?:\b0x[\da-f]+|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?)[ulf]*/i,
  'keyword': /\b(?:attribute|const|uniform|varying|buffer|shared|coherent|volatile|restrict|readonly|writeonly|atomic_uint|layout|centroid|flat|smooth|noperspective|patch|sample|break|continue|do|for|while|switch|case|default|if|else|subroutine|in|out|inout|float|double|int|void|bool|true|false|invariant|precise|discard|return|d?mat[234](?:x[234])?|[ibdu]?vec[234]|uint|lowp|mediump|highp|precision|[iu]?sampler[123]D|[iu]?samplerCube|sampler[12]DShadow|samplerCubeShadow|[iu]?sampler[12]DArray|sampler[12]DArrayShadow|[iu]?sampler2DRect|sampler2DRectShadow|[iu]?samplerBuffer|[iu]?sampler2DMS(?:Array)?|[iu]?samplerCubeArray|samplerCubeArrayShadow|[iu]?image[123]D|[iu]?image2DRect|[iu]?imageCube|[iu]?imageBuffer|[iu]?image[12]DArray|[iu]?imageCubeArray|[iu]?image2DMS(?:Array)?|struct|common|partition|active|asm|class|union|enum|typedef|template|this|resource|goto|inline|noinline|public|static|extern|external|interface|long|short|half|fixed|unsigned|superp|input|output|hvec[234]|fvec[234]|sampler3DRect|filter|sizeof|cast|namespace|using)\b/
});

Prism.languages.insertBefore('glsl', 'comment', {
  'preprocessor': {
    pattern: /(^[ \t]*)#(?:(?:define|undef|if|ifdef|ifndef|else|elif|endif|error|pragma|extension|version|line)\b)?/m,
    lookbehind: true,
    alias: 'builtin'
  }
});

const componentMap = {
  Indices,
  CubeVisualizer,
  Waves,
  Scene,
  Mesh,
  Varyings: props => <RawShader {...props} geometryType={'box'} material />,
  ShaderMaterial: props => <RawShader {...props} geometryType={'torus'} material />,
  VertexShader: props => <RawShader {...props} geometryType={'cylinder'} vertex />,
  FragmentShader: props => <RawShader {...props} geometryType={'plane'} vertex={false} />,
  Noise1D: props => (<Waves
    {...props}
    functionName='noise1D'
  />),
  Noise2D: NoiseGrid,
  Noise3DSphere: props => <NoiseGrid {...props} sphere />,
  Noise3D: props => <NoiseGrid {...props} time />,
  CubeVisualizerRotation: props => <CubeVisualizer {...props} extent={Math.PI / 2} defaultScale={0.5} />,
  CubeVisualizerScale: props => <CubeVisualizer {...props} minExtent={0.01} maxExtent={1} defaultScale={1} defaultValue={0.5} />,
  Faces: props => <Indices {...props} fill />,
  Vertices
};

module.exports = ({ children, className }) => {
  const language = className.replace(/language-/, '');
  if (typeof children === 'string') {
    children = children.trim();
  }

  if (language in componentMap && typeof children === 'string') {
    const CodeComponent = componentMap[language];
    return <CodeComponent code={children} />;
  }

  return (
    <Highlight {...defaultProps} code={children} language={language} theme={undefined}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: '20px' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};
