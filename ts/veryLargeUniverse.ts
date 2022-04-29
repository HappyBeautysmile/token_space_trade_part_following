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
  private leftStart: THREE.Vector3;
  private rightStart: THREE.Vector3;
  private startMatrix = new THREE.Matrix4();
  private oldZoom: THREE.Matrix4 = null;
  private material: THREE.ShaderMaterial;

  constructor(private grips: THREE.Object3D[],
    private camera: THREE.Camera,
    private xr: THREE.WebXRManager,
    private keysDown: Set<string>) {
    super();
    this.addStars();

    //   this.grips[0].addEventListener('selectstart', () => {
    //     this.leftStart = new THREE.Vector3();
    //     this.leftStart.copy(this.grips[0].position);
    //     this.startMatrix.copy(this.matrix);
    //     this.startMatrix.invert();
    //     this.leftStart.applyMatrix4(this.startMatrix);;
    //     if (this.rightStart) {
    //       this.rightStart.copy(this.grips[1].position);
    //       this.rightStart.applyMatrix4(this.startMatrix);
    //     }
    //   });
    //   this.grips[1].addEventListener('selectstart', () => {
    //     this.rightStart = new THREE.Vector3();
    //     this.rightStart.copy(this.grips[1].position);
    //     this.startMatrix.invert();
    //     this.rightStart.applyMatrix4(this.startMatrix);;
    //     if (this.leftStart) {
    //       this.leftStart.copy(this.grips[0].position);
    //       this.leftStart.applyMatrix4(this.startMatrix);
    //     }
    //   });

    //   this.grips[0].addEventListener('selectend', () => {
    //     if (this.leftStart && this.rightStart) {
    //       this.zoomEnd();
    //     }
    //     this.leftStart = null;
    //   });
    //   this.grips[1].addEventListener('selectend', () => {
    //     if (this.leftStart && this.rightStart) {
    //       this.zoomEnd();
    //     }
    //     this.rightStart = null;
    //   });

    this.position.set(0, 0, -1e6);
  }

  private leftCurrent = new THREE.Vector3();
  private rightCurrent = new THREE.Vector3();

  private zoom() {
    if (!this.oldZoom) {
      this.oldZoom = new THREE.Matrix4();
      this.oldZoom.copy(this.matrix);
    }
    this.leftCurrent.copy(this.grips[0].position);
    this.leftCurrent.applyMatrix4(this.startMatrix);
    this.rightCurrent.copy(this.grips[1].position);
    this.rightCurrent.applyMatrix4(this.startMatrix);
    const m = Zoom.makeZoomMatrix(this.leftStart, this.rightStart,
      this.leftCurrent, this.rightCurrent);
    this.matrix.copy(this.oldZoom);
    this.matrix.multiply(m);
    this.matrix.decompose(this.position, this.quaternion, this.scale);
    if (this.material) {
      const scale = this.scale.length() / Math.sqrt(3);
      this.material.uniforms['sizeScale'].value = scale;
      this.material.uniformsNeedUpdate = true;
    }
  }

  private zoomEnd() {
    this.oldZoom = null;
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
  // private findClosestStar(): THREE.Vector3 {
  //   this.camera.getWorldPosition(this.p1);
  //   this.worldToLocal(this.p1);
  //   return this.starPositions.getClosest(this.p1);
  // }

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
    // this.p1.set(0, 0, 0);
    //    this.worldToLocal(this.p1);
    // this.m1.makeTranslation(-this.p1.x, -this.p1.y, -this.p1.z);
    // this.m2.makeScale(zoomFactor, zoomFactor, zoomFactor);
    // this.m3.makeTranslation(
    //   this.p1.x * zoomFactor,
    //   this.p1.y * zoomFactor,
    //   this.p1.z * zoomFactor);
    // this.matrix.multiply(this.m3);
    // this.matrix.multiply(this.m2);
    // this.matrix.multiply(this.m1);
    // this.matrix.decompose(this.position, this.quaternion, this.scale);
  }

  tick(t: Tick) {
    if (this.rightStart && this.leftStart) {
      this.zoom();
    }

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

    // const closest = this.findClosestStar();
    // if (closest.x != this.currentStarPosition.x ||
    //   closest.y != this.currentStarPosition.y ||
    //   closest.z != this.currentStarPosition.z) {
    //   this.currentStarPosition.copy(closest);
    //   if (this.currentStar) {
    //     this.remove(this.currentStar);
    //   }
    //   this.currentStar = new StarSystem();
    //   this.add(this.currentStar);
    //   this.currentStar.position.copy(this.currentStarPosition);
    // }
  }
}