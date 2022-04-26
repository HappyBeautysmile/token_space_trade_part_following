import * as THREE from "three";
import { Debug } from "./debug";
import { Palette } from "./palette";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Material } from "three";

class ModelLoader {
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


export class Assets extends THREE.Object3D {

    static allModels: THREE.Object3D[] = [];
    static modelIndex = 0;
    static materials: THREE.Material[] = [];
    static materialIndex = 0;

    static init() {
        Palette.init();
        Assets.materialIndex = 0;
        let flatPrimary = new THREE.MeshPhongMaterial({ color: 0x998877 });
        Assets.materials.push(flatPrimary);
        let glossPrimary = new THREE.MeshPhongMaterial({ color: 0x998877, shininess: 1.0 });
        Assets.materials.push(glossPrimary);
        let flatSeconday = new THREE.MeshPhongMaterial({ color: 0x665544 });
        Assets.materials.push(flatSeconday);
        let glossSecondary = new THREE.MeshPhongMaterial({ color: 0x665544, shininess: 1.0 });
        Assets.materials.push(glossSecondary);
        let flatBlack = new THREE.MeshPhongMaterial({ color: 0x111111 });
        Assets.materials.push(flatBlack);
        let glossBlack = new THREE.MeshPhongMaterial({ color: 0x111111 });
        Assets.materials.push(glossBlack);
    }

    // sets the color of the passed object to the next color in the palette.
    static nextColor(source: THREE.Object3D) {
        const newMat = new THREE.MeshPhongMaterial({ color: Palette.nextColor() });
        this.replaceMaterial(source, newMat);
    }

    static replaceMaterial(source: THREE.Object3D, mat: THREE.Material) {
        console.log(`${source.name} (${source.type})`);
        for (let i = 0; i < source.children.length; i++) {
            let mesh = source.children[i] as THREE.Mesh;
            mesh.material = mat;
        }
    }

    static nextModel() {
        Assets.modelIndex = (Assets.modelIndex + 1) % Assets.allModels.length;
        return Assets.allModels[Assets.modelIndex];
    }

    static nextMaterial() {
        Assets.materialIndex = (Assets.materialIndex + 1) % Assets.materials.length;
        Debug.log('materialIndex=' + Assets.materialIndex.toString());
        Debug.log('materials.length=' + Assets.materials.length.toString())
        return Assets.materials[Assets.materialIndex];
    }

    static async loadAllModels() {
        const models = ['cube', 'wedge', 'accordion', 'arm', 'cluster-jet', 'scaffold', 'thruster']
        for (const modelName of models) {
            console.log(`Loading ${modelName}`);
            const m = await ModelLoader.loadModel(`Model/${modelName}.glb`);
            if (!m) {
                continue;
            }
            const newMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) });
            //this.assets.replaceMaterial(m, newMat);
            m.scale.set(1, 1, 1);
            this.allModels.push(m);
            //this.scene.add(m);
            //this.universeGroup.add(m);
            m.position.set((this.allModels.length - models.length / 2) * 1.4, 0, -15);
            console.log(`Added ${modelName}`);
        }
        // const m = await ModelLoader.loadModel(`Model/ship.glb`);
        // this.playerGroup.add(m);
    }
}