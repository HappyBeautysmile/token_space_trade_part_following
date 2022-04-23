import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { Place } from "./place";
import { Tick, Ticker } from "./tick";

export class InHandObject extends THREE.Object3D implements Ticker {

  private geometries: THREE.BufferGeometry[] = [];
  private geometry: THREE.BufferGeometry;

  private handMaterial: THREE.ShaderMaterial;
  private snapMaterial: THREE.ShaderMaterial;

  private handMesh: THREE.Object3D;
  private snapMesh: THREE.Object3D;

  constructor(o: THREE.Object3D, private place: Place) {
    super();
    this.buildGeometry(o);
    this.geometry = BufferGeometryUtils.mergeBufferGeometries(
      this.geometries, false);

    console.log(`Points: ${this.geometry.getAttribute('position').count}`);

    this.handMaterial = this.makeRasterMaterial(0);
    // this.handMesh = new THREE.LineSegments(this.geometry, this.handMaterial);
    this.handMesh = o.clone();
    this.setAdditiveBlending(this.handMesh);

    this.add(this.handMesh);

    this.snapMaterial = this.makeRasterMaterial(Math.PI);
    this.snapMesh = new THREE.LineSegments(this.geometry, this.snapMaterial);
    this.place.universeGroup.add(this.snapMesh);
  }

  private setAdditiveBlending(o: THREE.Object3D) {
    if (o instanceof THREE.Mesh) {
      if (o.material instanceof THREE.MeshStandardMaterial) {
        o.material.blending = THREE.AdditiveBlending;
      }
    }
    for (const child of o.children) {
      this.setAdditiveBlending(child);
    }
  }

  private makeRasterMaterial(phase: number) {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
      `,
      fragmentShader: `
  uniform float time;
  varying vec3 vColor;
  void main() {
    float twist = 0.1 * sin(time / 5.0);
    float d = cos(twist) * gl_FragCoord.y + sin(twist) * gl_FragCoord.x;
    float intensity = 0.9 + 0.1 * sin(
      ${phase.toFixed(5)} + time * 5.0 + 0.5 * d / gl_FragCoord.z);
    gl_FragColor = vec4(vColor.rgb * intensity, 1.0);
  }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: false,
      vertexColors: true,
      uniforms: {
        time: { value: 0.0 }
      }
    });
    return material;
  }


  private buildGeometry(source: THREE.Object3D) {
    if (source instanceof THREE.Mesh) {
      this.addMesh(source);
    } else {
      for (const child of source.children) {
        this.buildGeometry(child);
      }
    }
  }

  private addMesh(mesh: THREE.Mesh) {
    console.log(`Mesh: ${mesh.name}`);
    const material = mesh.material;
    const color = new THREE.Color('lime');
    if (material instanceof THREE.MeshStandardMaterial) {
      color.copy(material.color);
    }
    const matrix = new THREE.Matrix4();
    mesh.updateMatrix();
    matrix.copy(mesh.matrix);
    let o = mesh.parent;
    while (o) {
      console.log(o.name);
      o.updateMatrix();
      matrix.premultiply(o.matrix);
      o = o.parent;
    }
    const geometry = mesh.geometry.clone();
    const colors = new Float32Array(geometry.getAttribute('position').count * 3);
    for (let i = 0; i < geometry.getAttribute('position').count; ++i) {
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.applyMatrix4(matrix);
    this.geometries.push(geometry);
  }

  public tick(t: Tick) {
    this.handMaterial.uniforms['time'].value = t.elapsedS;
    this.handMaterial.uniformsNeedUpdate;
    this.snapMaterial.uniforms['time'].value = t.elapsedS;
    this.snapMaterial.uniformsNeedUpdate;
    this.snapMesh.rotation.copy(this.handMesh.rotation);

    this.handMesh.getWorldPosition(this.snapMesh.position);
    this.place.worldToUniverse(this.snapMesh.position);
    this.place.quantizePosition(this.snapMesh.position);
    this.place.quantizeRotation(this.snapMesh.rotation);
  }

}