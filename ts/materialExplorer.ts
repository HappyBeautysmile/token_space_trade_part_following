import * as THREE from "three";
import { Object3D } from "three";
import { Tick, Ticker } from "./tick";

export class MaterialExplorer extends THREE.Object3D implements Ticker {

  private static paintV = `
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
  }`;

  private static paintF = `
 
 
uniform float time;
varying vec3 vColor;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vIncident;

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
}

`;

  private static goldV = `
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
  }`;

  // https://github.com/KdotJPG/OpenSimplex2/blob/master/glsl/OpenSimplex2.glsl
  private static goldF = `
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

  vec4 cTotal = c1 + c2 + c3 * 0.2 + 0.5;

  mat3 m = mat3(
      1.0, 0.5, 0.01, 
      1.0, 0.5, 0.02, 
      1.0, 0.4, 0.03);
  vec3 crgb = m * cTotal.rgb;

  gl_FragColor = vec4(crgb, 1.0);
}
`;

  private static shinyV = `
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
  }`;


  private static shinyF = `
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
  }`;


  private paramTA: HTMLTextAreaElement;
  private vertexTA: HTMLTextAreaElement;
  private fragmentTA: HTMLTextAreaElement;
  private material: THREE.ShaderMaterial;
  private cube: THREE.Mesh;
  constructor(private keySet: Set<string>, private camera: THREE.Object3D) {
    super();
    this.paramTA = document.createElement('textarea');
    this.vertexTA = document.createElement('textarea');
    this.fragmentTA = document.createElement('textarea');

    this.vertexTA.value = MaterialExplorer.paintV;

    this.fragmentTA.value = MaterialExplorer.paintF;

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
    this.cube.position.set(1, 2.5, -2);
    this.add(this.cube);

    const sphere = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(0.9, 4),
      new THREE.MeshBasicMaterial({ color: '#f0f' })
    )
    sphere.position.set(-1, 2.5, -2);
    this.add(sphere);

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
}