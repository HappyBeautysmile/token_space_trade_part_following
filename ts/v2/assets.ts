import * as THREE from "three";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Assets {
  private constructor(private namedMeshes: Map<string, THREE.Mesh>) { }

  public *names() {
    yield* this.namedMeshes.keys();
  }

  public getMesh(name: string) {
    if (!this.namedMeshes.has(name)) {
      throw new Error(`Not found: ${name}`);
    }
    return this.namedMeshes.get(name);
  }

  private static findFirstMesh(o: THREE.Object3D): THREE.Mesh {
    if (o.type === "Mesh") {
      // console.log(`Mesh found: ${o.name}`);
      const matrix = new THREE.Matrix4();
      matrix.compose(o.position, o.quaternion, o.scale);
      o.matrix.copy(matrix);
      return o as THREE.Mesh;
    }
    for (const child of o.children) {
      const mesh = Assets.findFirstMesh(child);
      if (!!mesh) { return mesh; }
    }
    return null;
  }

  private static async loadMeshFromModel(filename: string): Promise<THREE.Mesh> {
    const loader = new GLTFLoader();
    return new Promise<THREE.Mesh>((resolve, reject) => {
      loader.load(filename, (gltf) => {
        resolve(Assets.findFirstMesh(gltf.scene));
      });
    });
  }

  public static async load(): Promise<Assets> {
    const namedMeshes = new Map<string, THREE.Mesh>();
    const modelNames = [
      'accordion', 'arm', 'clay', 'cluster-jet', 'corner', 'cube', 'guide', 'ice', 'light-blue',
      'metal-common', 'metal-rare', 'port', 'salt-common', 'salt-rare', 'scaffold', 'silicate-rock',
      'silicon-crystalized', 'tank', 'thruster', 'wedge', 'producer']
    for (const modelName of modelNames) {
      // console.log(`Loading ${modelName}`);
      const m = await Assets.loadMeshFromModel(`Model/${modelName}.glb`);
      m.name = modelName;
      namedMeshes.set(modelName, m);
    }

    return new Promise<Assets>((accept, reject) => {
      accept(new Assets(namedMeshes));
    });
  }
}