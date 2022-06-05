import * as THREE from "three";
import { Object3D } from "three";
import { Assets } from "./assets";
import { AstroGen } from "./astroGen";
import { ObjectConstruction } from "./construction";
import { MergedGeometryContainer } from "./mergedGeometryContainer";
import { Tick, Ticker } from "./tick";

type CodeType = 'config' | 'vertex' | 'fragment';

class CodeSnippet {
  constructor(readonly codeType: CodeType, readonly code: string) {
  }
}

export class MaterialExplorer extends THREE.Object3D implements Ticker {
  private snippets: CodeSnippet[] = [];
  private material: THREE.ShaderMaterial;
  private cube: THREE.Mesh;
  constructor(private keySet: Set<string>, private camera: THREE.Object3D) {
    super();
    this.load();
    this.arrange();

    const button = document.createElement('span');
    button.innerText = 'Go';
    button.style.border = '2px outset';
    button.style.borderRadius = '3px';
    button.addEventListener('click', () => {
      this.save();
      this.material = this.makeMaterial();
      this.updateMaterial(this);
    });
    document.body.appendChild(button);

    this.buildScene();

    this.material = this.makeMaterial();
    this.updateMaterial(this);
  }

  async buildScene() {
    this.cube = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(1, 0),
      new THREE.MeshBasicMaterial({ color: '#f0f' })
    );
    this.cube.position.set(1, 2.5, -2);
    this.add(this.cube);

    const construction = new ObjectConstruction(this, null);  // TODO 2nd parameter is the renderer to allow saving of the screen shot
    const gen = new AstroGen(construction);
    gen.buildAsteroid(5, -3, 2, -10);
  }

  arrange() {
    for (const s of this.snippets) {
      const ta = document.createElement('textarea');
      ta.value = s.code;
      ta.cols = 80;
      ta['codeType'] = s.codeType;
      ta.classList.add('code');
      ta.classList.add('collapsed');
      ta.classList.add('disabled');
      ta.spellcheck = false;
      ta.addEventListener('mouseenter', function (ev) {
        this.classList.remove('collapsed');
      });
      ta.addEventListener('mouseover', function (ev) {
        this.classList.remove('collapsed');
      });
      ta.addEventListener('mouseleave', function (ev) {
        this.classList.add('collapsed');
      });
      ta.addEventListener('click', function (ev) {
        if (ev.ctrlKey) {
          this.classList.toggle('enabled');
          this.classList.toggle('disabled');
        }
      })
      document.body.appendChild(ta);
    }
  }

  private hasClass(classList: DOMTokenList, className: string) {
    for (const c of classList) {
      if (c === className) return true;
    }
    return false;
  }

  private makeMaterial(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial();
    let configCode = '';
    let vertexCode = '';
    let fragmentCode = '';

    for (const ta of document.querySelectorAll('textarea')) {
      if (this.hasClass(ta.classList, 'disabled')) continue;
      const codeType = ta['codeType'] as any as CodeType;
      switch (codeType) {
        case 'config': configCode = configCode + ta.value.trim() + '\n';
          break;
        case 'vertex': vertexCode = vertexCode + ta.value.trim() + '\n';
          break;
        case 'fragment': fragmentCode = fragmentCode + ta.value.trim() + '\n';
          break;
      }
    }

    if (configCode === '') {
      return null;
    }
    Object.assign(material, JSON.parse(configCode));
    material.vertexShader = vertexCode;
    material.fragmentShader = fragmentCode;
    return material;
  }

  private updateMaterial(o: Object3D) {
    if (this.material === null) {
      console.log('No material.');
      return;
    }
    if (o instanceof THREE.Mesh) {
      o.material = this.material;
    }
    for (const c of o.children) {
      this.updateMaterial(c);
    }
  }

  tick(t: Tick) {
    if (this.material !== null) {
      this.material.uniforms['time'].value = t.elapsedS;
      this.material.uniformsNeedUpdate = true;
    }
    this.cube.rotateX(t.deltaS);
    this.cube.rotateY(t.deltaS / 2.718);
    this.cube.rotateZ(t.deltaS / 3.14);
    if (this.keySet.has('KeyA')) {
      this.camera.position.x -= 5 * t.deltaS;
    }
    if (this.keySet.has('KeyD')) {
      this.camera.position.x += 5 * t.deltaS;
    }
    if (this.keySet.has('KeyS')) {
      this.camera.position.y -= 5 * t.deltaS;
    }
    if (this.keySet.has('KeyW')) {
      this.camera.position.y += 5 * t.deltaS;
    }
    if (this.keySet.has('KeyQ')) {
      this.camera.position.z -= 5 * t.deltaS;
    }
    if (this.keySet.has('KeyE')) {
      this.camera.position.z += 5 * t.deltaS;
    }
    if (this.keySet.has('ArrowLeft')) {
      this.camera.rotateY(2 * t.deltaS);
    }
    if (this.keySet.has('ArrowRight')) {
      this.camera.rotateY(-2 * t.deltaS);
    }
    if (this.keySet.has('Digit0')) {
      this.camera.position.set(0, 1.7, 0);
      this.camera.lookAt(0, 1.7, -1.5);
    }
  }

  private save() {
    console.log('Saving.');
    this.snippets.length = 0;
    for (const ta of document.querySelectorAll('textarea')) {
      const codeType = ta['codeType'] as any as CodeType;
      const snippet = new CodeSnippet(codeType, ta.value.trim());
      this.snippets.push(snippet);
    }
    localStorage.setItem('glsl', JSON.stringify(this.snippets));
  }

  private load() {
    if (localStorage.getItem('glsl')) {
      console.log('Loading');
      this.snippets = JSON.parse(localStorage.getItem('glsl'));
    } else {
      console.log('Initializing');
      this.snippets.push(new CodeSnippet('config', `
{
  "blending": ${THREE.NormalBlending},
  "depthTest": true,
  "depthWrite": true,
  "transparent": false,
  "vertexColors": true,
  "uniforms": {
    "time": { "value": 0.0 }
  }
}`));

      this.snippets.push(new CodeSnippet('vertex', `
// Paint Vertex Shader
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vIncident;
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vIncident = normalize(worldPosition.xyz - cameraPosition.xyz);
  vWorldPosition = worldPosition.xyz;
  vColor = vec3(1.0, 0.4, 0.8);
  vNormal = normalMatrix * normal;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}      `));
      this.snippets.push(new CodeSnippet('vertex', `
// Lava Vertex Shader
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vIncident;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vIncident = normalize(worldPosition.xyz - cameraPosition.xyz);
  vColor = vec3(0.2, 0.2, 0.2);
  vNormal = normalMatrix * normal;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}`))

      this.snippets.push(new CodeSnippet('fragment', `
// Simplex Fragment Shader Code
// https://github.com/KdotJPG/OpenSimplex2/blob/master/glsl/OpenSimplex2.glsl

vec4 permute(vec4 t) {
  return t * (t * 34.0 + 133.0);
}
vec3 grad(float hash) {
  vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
  vec3 cuboct = cube;
  cuboct[int(hash / 16.0)] = 0.0;
  float type = mod(floor(hash / 8.0), 2.0);
  vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
  vec3 grad = cuboct * 1.22474487139 + rhomb;
  grad *= (1.0 - 0.042942436724648037 * type) * 32.80201376986577;
  return grad;
}

vec4 openSimplex2Base(vec3 X) {
  vec3 v1 = round(X);
  vec3 d1 = X - v1;
  vec3 score1 = abs(d1);
  vec3 dir1 = step(max(score1.yzx, score1.zxy), score1);
  vec3 v2 = v1 + dir1 * sign(d1);
  vec3 d2 = X - v2;
  vec3 X2 = X + 144.5;
  vec3 v3 = round(X2);
  vec3 d3 = X2 - v3;
  vec3 score2 = abs(d3);
  vec3 dir2 = step(max(score2.yzx, score2.zxy), score2);
  vec3 v4 = v3 + dir2 * sign(d3);
  vec3 d4 = X2 - v4;
  
  vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
  hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
  hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);
  
  vec4 a = max(0.5 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
  vec4 aa = a * a; vec4 aaaa = aa * aa;
  vec3 g1 = grad(hashes.x); vec3 g2 = grad(hashes.y);
  vec3 g3 = grad(hashes.z); vec3 g4 = grad(hashes.w);
  vec4 extrapolations = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));
  
  vec3 derivative = -8.0 * mat4x3(d1, d2, d3, d4) * (aa * a * extrapolations)
      + mat4x3(g1, g2, g3, g4) * aaaa;
  
  return vec4(derivative, dot(aaaa, extrapolations));
}

vec4 openSimplex2_Conventional(vec3 X) {
  vec4 result = openSimplex2Base(dot(X, vec3(2.0/3.0)) - X);
  return vec4(dot(result.xyz, vec3(2.0/3.0)) - result.xyz, result.w);
}
`));
      this.snippets.push(new CodeSnippet('fragment', `
// Paint Fragment Shader
uniform float time;
varying vec3 vColor;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vIncident;

void main() {
  vec3 x = vWorldPosition; 
  vec4 r = openSimplex2_Conventional(x * 60.0);
  vec3 normal = vNormal + (0.01 * r.xyz);


  vec3 ve = dot(vIncident, normal) * normal;
  vec3 reflection = vIncident - 2.0 * ve;
   
  float shiny = 8.0;

  float shine = dot(normalize(reflection), normalize(vec3(0.0, 1.0, 0.5)));
  shine = shiny * shine - shiny + 1.0;
  shine = clamp(shine, 0.0, 1.0);
  shine = pow(shine, 2.0);

  float intensity = dot(normal, normalize(vec3(0.1, 1.0, 0.5)));
  gl_FragColor = vec4(vColor * intensity + shine, 1.0);
}`));

      this.snippets.push(new CodeSnippet('fragment', `
// Lava Fragment Shader

uniform float time;
varying vec3 vColor;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vIncident;

vec4 brown(in vec3 x) {
  return (
    openSimplex2_Conventional(x) 
    + openSimplex2_Conventional(x * 2.0)
    + openSimplex2_Conventional(x * 4.0)
    + openSimplex2_Conventional(x * 8.0)
  );
}

void main() {
  vec4 c1 = brown(vWorldPosition * 0.3); 
  c1 = brown(vec3(c1.xy * 0.05, time*0.1)) * 0.05 + 0.5;
  float intensity = dot(-vIncident, vNormal);

  mat3 m = mat3(
      1.0, 0.5, 0.01, 
      1.0, 0.5, 0.02, 
      1.0, 0.4, 0.03);
  vec3 crgb = m * c1.rgb * pow(intensity, 0.3);

  float whiteness = clamp(
    (intensity - 0.5) * 10.0 + length(crgb), 0.0, 1.0);
  vec3 white = vec3(1.0, 1.0, 1.0) * whiteness;


  gl_FragColor = vec4(crgb + white, 1.0) * 0.4;
}`));

      this.snippets.push(new CodeSnippet('fragment', `
// Shiny Fragment Shader
uniform float time;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vIncident;

void main() {  
  vec3 ve = dot(vIncident, vNormal) * vNormal;
  vec3 reflection = vIncident - 2.0 * ve;

  float shiny = 64.0;

  float intensity = dot(normalize(reflection), 
    normalize(vec3(0.0, 1.0, 0.5 * sin(time))));
  intensity = shiny * intensity - shiny + 1.0;
  intensity = clamp(intensity, 0.0, 1.0);
  intensity = pow(intensity, 2.0);

  gl_FragColor = 
    vec4(vec3(1.0,1.0,1.0) * clamp(intensity, 0.0, 1.0), 1.0) +
    vec4(vColor.rgb, 0.0);
}`));
      this.snippets.push(new CodeSnippet('fragment', `
// Sinplex
uniform float time;
varying vec3 vColor;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vIncident;

float mono(in vec3 v) {
  return(sin(v.x + 17.2) * sin(v.y + 72.9) * sin(v.z + 29.1));
}

vec3 noise(in vec3 x) {
  x = mat3(
    1.0, 0.0, 0.0,
    0.5, 0.866, 0.289,
    0.5, 0.0, 0.866) * x;
  return(vec3(mono(x.xxy + x.yzz), mono(x.xyy + x.zzx + 4123.1), mono(x.yyz + x.zxx + 3213.1)));
}

vec3 brown(in vec3 v) {
  return(1.0 * noise(v) + 0.5 * noise(v * 2.0 + 827.2) + 0.33 * noise(v * 3.0 + 3182.7));
}

vec3 orange(in vec3 v) {
  return brown(brown(v * 0.4) * 3.0);
}

vec3 green(in vec3 v) {
  return orange(orange(v * 0.5) * 3.0);
}
      `));

      this.snippets.push(new CodeSnippet('fragment', `
// Sun Texture
void main() {
  vec3 x = vWorldPosition;
  float density = 15.0;
  vec3 c = green(x * density);
  c = c * 0.5 + 0.5;
  gl_FragColor = vec4(c, 1.0);
}`));


      this.snippets.push(new CodeSnippet('vertex', `
#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}
`));

      this.snippets.push(new CodeSnippet('fragment', `
#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>   // Yes
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
  `))


    }
  }
}