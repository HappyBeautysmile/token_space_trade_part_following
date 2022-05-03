import * as THREE from "three";
import { PointMapLinear, PointMapOctoTree } from "./pointMap";
import { S } from "./settings";
import { Tick, Ticker } from "./tick";
import { Zoom } from "./zoom";

class StarSystem extends THREE.Object3D {
  constructor() {
    super();
    this.add(new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(1e3, 2),
      new THREE.MeshBasicMaterial({ color: '#fff' })
    ));
  }
}

// A collection of StarSystems.  We only instantiate the StarSystem object
// when the world origin is close to it.
export class VeryLargeUniverse extends THREE.Object3D implements Ticker {
  private currentStarMap = new Map<THREE.Vector3, StarSystem>();
  private starPositions = new PointMapOctoTree<THREE.Vector3>(
    new THREE.Vector3(), 1e10);
  private material: THREE.ShaderMaterial;

  constructor(private grips: THREE.Object3D[],
    private camera: THREE.Camera,
    private xr: THREE.WebXRManager,
    private keysDown: Set<string>) {
    super();
    this.addStars();
    this.position.set(0, 0, -1e6);
  }

  private gaussian(sd: number): number {
    const n = 6;
    let x = 0;
    for (let i = 0; i < n; ++i) {
      x += Math.random();
      x -= Math.random();
    }
    return sd * (x / Math.sqrt(n));
  }

  private addStars() {
    const positions: number[] = [];
    const radius = S.float('sr');
    for (let i = 0; i < S.float('ns'); ++i) {
      const orbitalRadius = this.gaussian(radius);
      const orbitalHeight = this.gaussian(radius / 10);
      const theta = Math.random() * Math.PI * 2;
      const v = new THREE.Vector3(
        orbitalRadius * Math.cos(theta),
        orbitalHeight,
        orbitalRadius * Math.sin(theta));
      this.starPositions.add(v, v);
      positions.push(v.x, v.y, v.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',
      new THREE.Float32BufferAttribute(positions, 3));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        'sizeScale': {
          value: 1.0
        },
      },
      vertexShader: `
        uniform float sizeScale;
        varying vec3 vColor;
        void main() {
          vColor = vec3(1.0, 1.0, 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float distance = length(mvPosition.xyz);
          if (distance > 1000.0) {
            mvPosition.xyz = mvPosition.xyz * (1000.0 / distance);
          }
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = max(sizeScale * 800.0 / distance, 2.0);
          
        }`,
      fragmentShader: `
      uniform sampler2D diffuseTexture;
      varying vec3 vColor;
      void main() {
        vec2 coords = gl_PointCoord;
        float intensity = 2.0 * (0.5 - length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(vColor.rgb * intensity, 1.0);
      }`,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: false,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, this.material);
    this.add(points);
  }

  private p1 = new THREE.Vector3();

  private getButtonsFromGrip(index: number): number[] {
    let source: THREE.XRInputSource = null;
    const session = this.xr.getSession();
    if (session) {
      if (session.inputSources) {
        source = session.inputSources[index];
      }
      return source.gamepad.buttons.map((b) => b.value);
    } else {
      return [];
    }
  }

  private direction = new THREE.Vector3();
  private m1 = new THREE.Matrix4();
  private m2 = new THREE.Matrix4();
  private m3 = new THREE.Matrix4();
  zoomAroundWorldOrigin(zoomFactor: number) {
    this.position.multiplyScalar(zoomFactor);
    this.scale.multiplyScalar(zoomFactor);
  }

  tick(t: Tick) {
    const leftButtons = this.getButtonsFromGrip(0);
    const rightButtons = this.getButtonsFromGrip(1);

    if (leftButtons[4] === 1 || rightButtons[4] === 1  // A or X
      || this.keysDown.has('Equal')) {
      this.zoomAroundWorldOrigin(Math.pow(2, t.deltaS));
    }
    if (leftButtons[5] === 1 || rightButtons[5] === 1  // B or Y
      || this.keysDown.has('Minus')) {
      this.zoomAroundWorldOrigin(Math.pow(0.5, t.deltaS));
    }

    if ((leftButtons[0] && rightButtons[0]) ||  // Trigger
      this.keysDown.has('ArrowDown')) {
      this.camera.getWorldDirection(this.direction);
      this.direction.multiplyScalar(-t.deltaS * 5.0);
      this.position.sub(this.direction);
      this.updateMatrix();
    }

    if ((leftButtons[1] && rightButtons[1]) ||  // Squeeze
      this.keysDown.has('ArrowUp')) {
      this.camera.getWorldDirection(this.direction);
      this.direction.multiplyScalar(t.deltaS * 5.0);
      this.position.sub(this.direction);
      this.updateMatrix();
    }

    this.camera.getWorldPosition(this.p1);
    this.worldToLocal(this.p1);
    for (const closePoint of this.starPositions.getAllWithinRadius(
      this.p1, 1e5)) {
      if (!this.currentStarMap.has(closePoint)) {
        const starSystem = new StarSystem();
        starSystem.position.copy(closePoint);
        this.currentStarMap.set(closePoint, starSystem);
        this.add(starSystem);
      }
    }
  }
}