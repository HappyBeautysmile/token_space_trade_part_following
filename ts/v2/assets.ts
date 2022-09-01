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
    const tmpMatrix = new THREE.Matrix4();
    if (o.type === "Mesh") {
      // console.log(`Mesh found: ${o.name}`);
      const matrix = new THREE.Matrix4();
      matrix.identity();
      let cursor = o;
      while (cursor != null) {
        tmpMatrix.compose(cursor.position, cursor.quaternion, cursor.scale);
        matrix.premultiply(tmpMatrix);
        cursor = cursor.parent;
      }
      o.matrix.copy(matrix);
      o.matrix.decompose(o.position, o.quaternion, o.scale);
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
      'borosilicate', 'carbon-chondrite', 'carbon-fiber', 'carbon-fiber-cube',
      'carbon-fiber-wedge', 'chrome-corner', 'chrome-cube', 'chrome-wedge',
      'chromium', 'chromium-ore', 'clay', 'cluster-jet', 'computer',
      'conveyer', 'cube', 'doped-silicon', 'doping', 'factory', 'food',
      'fuel', 'fuel-tank', 'glass-cone', 'glass-rod', 'habitat',
      'ht-steel-cylinder', 'ice', 'iron', 'iron-chondrite', 'lithium',
      'lithium-silicate', 'organics', 'refined-silicon', 'silicon',
      'solar-panel', 'steel-corner', 'steel-cylinder', 'steel-wedge',
      'thruster-jet', 'wedge'];
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