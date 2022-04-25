import * as THREE from "three";
import { S } from "./settings";
import { Tick, Ticker } from "./tick";
import { Zoom } from "./zoom";

class StarSystem extends THREE.Object3D {
  constructor() {
    super();
    this.add(new THREE.Mesh(
      new THREE.BoxBufferGeometry(1e1, 1e1, 1e1),
      new THREE.MeshBasicMaterial({ color: '#fff' })
    ));
  }
}

// A collection of StarSystems.  We only instantiate the StarSystem object
// when the world origin is close to it.
export class VeryLargeUniverse extends THREE.Object3D implements Ticker {
  private currentStarPosition = new THREE.Vector3();
  private currentStar: StarSystem = null;
  private starPositions: THREE.Vector3[] = [];
  private leftStart: THREE.Vector3;
  private rightStart: THREE.Vector3;
  private startMatrix = new THREE.Matrix4();
  private oldZoom: THREE.Matrix4 = null;
  private material: THREE.ShaderMaterial;

  constructor(private grips: THREE.Object3D[],
    private camera: THREE.Camera,
    private xr: THREE.WebXRManager) {
    super();
    this.addStars();

    this.grips[0].addEventListener('selectstart', () => {
      this.leftStart = new THREE.Vector3();
      this.leftStart.copy(this.grips[0].position);
      this.startMatrix.copy(this.matrix);
      this.startMatrix.invert();
      this.leftStart.applyMatrix4(this.startMatrix);;
      if (this.rightStart) {
        this.rightStart.copy(this.grips[1].position);
        this.rightStart.applyMatrix4(this.startMatrix);
      }
    });
    this.grips[1].addEventListener('selectstart', () => {
      this.rightStart = new THREE.Vector3();
      this.rightStart.copy(this.grips[1].position);
      this.startMatrix.invert();
      this.rightStart.applyMatrix4(this.startMatrix);;
      if (this.leftStart) {
        this.leftStart.copy(this.grips[0].position);
        this.leftStart.applyMatrix4(this.startMatrix);
      }
    });

    this.grips[0].addEventListener('selectend', () => {
      if (this.leftStart && this.rightStart) {
        this.zoomEnd();
      }
      this.leftStart = null;
    });
    this.grips[1].addEventListener('selectend', () => {
      if (this.leftStart && this.rightStart) {
        this.zoomEnd();
      }
      this.rightStart = null;
    });
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

  private addStars() {
    const positions: number[] = [];
    const radius = S.float('sr');
    for (let i = 0; i < 100000; ++i) {
      const v = new THREE.Vector3(
        Math.round((Math.random() - 0.5) * radius),
        Math.round((Math.random() - 0.5) * radius),
        Math.round((Math.random() - 0.5) * radius));
      this.starPositions.push(v);
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
          vColor = vec3(0.5, 1.0, 1.0);
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
  private p2 = new THREE.Vector3();
  private closest = new THREE.Vector3();
  private findClosestStar(): THREE.Vector3 {
    let closestDistance = 1e10;
    this.camera.getWorldPosition(this.p1);
    this.worldToLocal(this.p1);
    for (const starPosition of this.starPositions) {
      this.p2.copy(starPosition);
      this.p2.sub(this.p1);
      if (closestDistance > this.p2.length()) {
        closestDistance = this.p2.length();
        this.closest.copy(starPosition);
      }
    }
    return this.closest;
  }

  private getButtonsFromGrip(index: number): number[] {
    let source: THREE.XRInputSource = null;
    const session = this.xr.getSession();
    if (session) {
      if (session.inputSources) {
        source = session.inputSources[index];
      }
      return source.gamepad.buttons.map((b) => b.value);
    } else {
      return null;
    }
  }

  private direction = new THREE.Vector3();

  tick(t: Tick) {
    if (this.rightStart && this.leftStart) {
      this.zoom();
    }

    const leftButtons = this.getButtonsFromGrip(0);
    const rightButtons = this.getButtonsFromGrip(1);

    if (leftButtons && rightButtons && leftButtons[1] && rightButtons[1]) {
      this.camera.getWorldDirection(this.direction);
      this.direction.multiplyScalar(t.deltaS * 5.0);
      this.position.sub(this.direction);
      this.updateMatrix();
    }

    const closest = this.findClosestStar();
    if (closest.x != this.currentStarPosition.x ||
      closest.y != this.currentStarPosition.y ||
      closest.z != this.currentStarPosition.z) {
      this.currentStarPosition.copy(closest);
      if (this.currentStar) {
        this.remove(this.currentStar);
      }
      this.currentStar = new StarSystem();
      this.add(this.currentStar);
      this.currentStar.position.copy(this.currentStarPosition);
    }
  }
}