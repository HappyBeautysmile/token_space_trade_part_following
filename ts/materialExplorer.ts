import * as THREE from "three";
import { Object3D } from "three";
import { Tick, Ticker } from "./tick";

export class MaterialExplorer extends THREE.Object3D implements Ticker {
  private paramTA: HTMLTextAreaElement;
  private vertexTA: HTMLTextAreaElement;
  private fragmentTA: HTMLTextAreaElement;
  private material: THREE.ShaderMaterial;
  private cube: THREE.Mesh;
  constructor() {
    super();
    this.paramTA = document.createElement('textarea');
    this.vertexTA = document.createElement('textarea');
    this.fragmentTA = document.createElement('textarea');

    this.vertexTA.value = `
varying vec3 vColor;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vColor = worldPosition.xyz;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}    
    `;

    // https://github.com/KdotJPG/OpenSimplex2/blob/master/glsl/OpenSimplex2.glsl
    this.fragmentTA.value = `
uniform float time;
varying vec3 vColor;
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

void main() {
  vec3 x = vec3(vColor.x, vColor.yz); 
  vec4 c1 = openSimplex2_Conventional(x);
  vec4 c2 = 0.5 * openSimplex2_Conventional(x * 2.0);
  vec4 c3 = 0.1 * openSimplex2_Conventional(x * 3.0);

  vec4 cTotal = c1; // + c2 + c3;
  cTotal = sin(0.1 * cTotal / cTotal.w) * 0.5 + 0.5;

  mat3 m = mat3(
      1.0, 0.5, 0.01, 
      1.0, 0.5, 0.02, 
      1.0, 0.4, 0.03);
  vec3 crgb = m * cTotal.rgb;

  gl_FragColor = vec4(crgb, 1.0);
}
        
        `;

    this.paramTA.value = `
    {
      "blending": ${THREE.NormalBlending},
      "depthTest": true,
      "depthWrite": true,
      "transparent": false,
      "vertexColors": true,
      "uniforms": {
        "time": { "value": 0.0 }
      }
    }`;
    document.body.appendChild(this.paramTA);
    document.body.appendChild(this.vertexTA);
    document.body.appendChild(this.fragmentTA);

    const button = document.createElement('span');
    button.innerText = 'Go';
    button.style.border = '2px outset';
    button.style.borderRadius = '3px';
    button.addEventListener('click', () => {
      this.material = this.makeMaterial();
      this.updateMaterial(this);
    });
    document.body.appendChild(button);

    this.cube = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: '#f0f' })
    );
    this.cube.position.set(0, 2.5, -2);
    this.add(this.cube);

    for (let i = 0; i < 10; ++i) {
      const platform = new THREE.Mesh(
        new THREE.BoxBufferGeometry(1, 0.1, 1),
        new THREE.MeshBasicMaterial({ color: '#f0f' })
      );
      platform.position.set(Math.sin(i * 0.4), i * 0.1, -i * 0.5);
      this.add(platform);
    }

    this.material = this.makeMaterial();
    this.updateMaterial(this);
  }

  private makeMaterial(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial();
    Object.assign(material, JSON.parse(this.paramTA.value));
    material.vertexShader = this.vertexTA.value;
    material.fragmentShader = this.fragmentTA.value;
    return material;
  }

  private updateMaterial(o: Object3D) {
    if (o instanceof THREE.Mesh) {
      o.material = this.material;
    }
    for (const c of o.children) {
      this.updateMaterial(c);
    }
  }

  tick(t: Tick) {
    this.material.uniforms['time'].value = t.elapsedS;
    this.material.uniformsNeedUpdate = true;
    this.cube.rotateX(t.deltaS);
    this.cube.rotateY(t.deltaS / 2.718);
    this.cube.rotateZ(t.deltaS / 3.14);
  }


}