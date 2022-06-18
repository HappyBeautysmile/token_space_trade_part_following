import * as THREE from "three";

import { Debug } from "./debug";
import { Palette } from "./palette";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FileIO } from "./fileIO";

export class ModelLoader {
  static async loadModel(filename: string): Promise<THREE.Object3D> {
    const loader = new GLTFLoader();
    return new Promise<THREE.Object3D>((resolve, reject) => {
      loader.load(filename, (gltf) => {
        ModelLoader.setSingleSide(gltf.scene);
        resolve(gltf.scene);
      });
    });
  }
  static setSingleSide(o: THREE.Object3D) {
    if (o instanceof THREE.Mesh) {
      if (o.material instanceof THREE.MeshStandardMaterial) {
        o.material.side = THREE.FrontSide;
      }
    }
    for (const child of o.children) {
      ModelLoader.setSingleSide(child);
    }
  }
}

// Items are unique - there is only one of each name.
// This allows us to use them as keys in maps and use == for comparison.
// For now, items are also immutable.  We may allow things to be mutable
// and that would change the property for all references to that item.
export class Item {
  public paintable = false;
  private constructor(
    readonly name: string, readonly description: string,
    readonly baseValue: number, readonly modelName: string) { }

  private static allItems = new Map<string, Item>();

  public static make(name: string, description: string,
    baseValue: number, modelName: string): Item {
    if (this.allItems.has(name)) {
      throw new Error(`Item already exists: ${name}`);
    }
    return new Item(name, description, baseValue, modelName);
  }
}

export class Assets extends THREE.Object3D {
  // static blocks: THREE.Object3D[] = [];
  static itemIndex = 0;
  static materials: THREE.Material[] = [];
  static materialIndex = 0;
  static meshes = new Map<string, THREE.Mesh>();
  static items: Item[] = [];
  static itemsByName = new Map<string, Item>();

  static async init() {
    Palette.init();
    Assets.materialIndex = 0;
    let flatPrimary = new THREE.MeshPhongMaterial({ color: 0x998877 });
    flatPrimary.userData["materialName"] = "flatPrimary";
    Assets.materials.push(flatPrimary);
    let glossPrimary = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      metalness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      color: 0x998877
    });
    glossPrimary.userData["materialName"] = "glossPrimary";
    Assets.materials.push(glossPrimary);

    let flatSecondary = new THREE.MeshPhongMaterial({ color: 0x665544 });
    flatSecondary.userData["materialName"] = "flatSecondary";
    Assets.materials.push(flatSecondary);
    let glossSecondary = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      metalness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      color: 0x665544
    });
    glossSecondary.userData["materialName"] = "glossSecondary";
    Assets.materials.push(glossSecondary);

    let flatBlack = new THREE.MeshPhongMaterial({ color: 0x111111 });
    flatBlack.userData["materialName"] = "flatBlack";
    Assets.materials.push(flatBlack);
    let glossBlack = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      metalness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      color: 0x111111
    });
    glossBlack.userData["materialName"] = "glossBlack";
    Assets.materials.push(glossBlack);
    await Assets.LoadAllModels();
    this.initItems();
  }

  // sets the color of the passed object to the next color in the palette.
  static nextColor(source: THREE.Object3D) {
    const newMat = new THREE.MeshPhongMaterial({ color: Palette.nextColor() });
    this.replaceMaterial(source, newMat);
  }

  static replaceMaterial(source: THREE.Object3D, mat: THREE.Material) {
    Debug.log(`${source.name} (${source.type}) ${typeof (source)} ${typeof (THREE.Mesh)}`);
    if (source.type == "Mesh") {
      let mesh = source as THREE.Mesh;
      mesh.material = mat;
      Debug.log(`material of ${source.name} changed to ${mat.userData['materialName']}`);
    }
    for (const child of source.children) {
      this.replaceMaterial(child, mat);
    }
  }

  static getFirstMaterial(source: THREE.Object3D): THREE.Material {
    if (source.type == "Mesh") {
      let mesh = source as THREE.Mesh;
      return mesh.material as THREE.Material;
    }
    for (const child of source.children) {
      this.getFirstMaterial(child);
    }
  }

  static nextItem(): Item {
    Assets.itemIndex = (Assets.itemIndex + 1) % Assets.items.length;
    return Assets.items[Assets.itemIndex];
  }

  static nextMaterial() {
    Assets.materialIndex = (Assets.materialIndex + 1) % Assets.materials.length;
    Debug.log('materialIndex=' + Assets.materialIndex.toString());
    Debug.log('materials.length=' + Assets.materials.length.toString())
    return Assets.materials[Assets.materialIndex];
  }

  static findFirstMesh(o: THREE.Object3D): THREE.Mesh {
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

  static async LoadAllModels() {
    const modelNames = [
      'accordion', 'arm', 'clay', 'cluster-jet', 'corner', 'cube', 'guide', 'ice', 'light-blue',
      'metal-common', 'metal-rare', 'port', 'salt-common', 'salt-rare', 'scaffold', 'silicate-rock',
      'silicon-crystalized', 'tank', 'thruster', 'wedge']
    for (const modelName of modelNames) {
      // console.log(`Loading ${modelName}`);
      const model = await ModelLoader.loadModel(`Model/${modelName}.glb`);
      const m = Assets.findFirstMesh(model);
      if (!m) {
        continue;
      }
      m.name = modelName;
      m.userData = { "modelName": modelName };
      m.position.set((this.meshes.size - modelNames.length / 2) * 1.4, 0, -15);
      Assets.meshes.set(modelName, m);
      // console.log(`Added ${modelName}`);
    }
  }

  static initItems() {
    const paintableItems = [
      'cube', 'wedge', 'arm', 'cluster-jet', 'scaffold',
      'thruster', 'tank', 'light-blue',
      'corner']
    Assets.items = [];
    for (const [key, value] of Assets.meshes.entries()) {
      const i = Item.make(key, "A wonderful item.", 0, key);
      if (paintableItems.includes(key)) {
        i.paintable = true;
      }
      else {
        i.paintable = false;
      }
      Assets.items.push(i);
      this.itemsByName.set(key, i);

      if (key === 'clay') {
        const producerKey = `${key}Producer`;
        const smaller = new THREE.Group();
        smaller.scale.set(0.5, 0.5, 0.5);
        smaller.add(value);
        const producer = new THREE.Mesh();
        producer.add(smaller);
        const i = Item.make(
          producerKey, `Producer of ${key}`, 0, producerKey);
      }
    };
  }
}