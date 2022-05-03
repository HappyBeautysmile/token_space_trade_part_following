import * as THREE from "three";
//import * as fs from "fs";
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

    static blocks: THREE.Object3D[] = [];
    static modelIndex = 0;
    static materials: THREE.Material[] = [];
    static materialIndex = 0;
    static models: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();

    static init() {
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
        Assets.modelIndex = (Assets.modelIndex + 1) % Assets.blocks.length;
        return Assets.blocks[Assets.modelIndex];
    }

    static nextMaterial() {
        Assets.materialIndex = (Assets.materialIndex + 1) % Assets.materials.length;
        Debug.log('materialIndex=' + Assets.materialIndex.toString());
        Debug.log('materials.length=' + Assets.materials.length.toString())
        return Assets.materials[Assets.materialIndex];
    }

    static async LoadAllModels() {
        const models = ['cube', 'wedge', 'accordion', 'arm', 'cluster-jet', 'scaffold', 'thruster', 'tank', 'light-blue', 'port', 'console']
        for (const modelName of models) {
            console.log(`Loading ${modelName}`);
            const m = await ModelLoader.loadModel(`Model/${modelName}.glb`);
            if (!m) {
                continue;
            }
            const newMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) });
            //this.assets.replaceMaterial(m, newMat);
            m.scale.set(1, 1, 1);
            m.userData = { "modelName": modelName };
            this.blocks.push(m);
            //this.scene.add(m);
            //this.universeGroup.add(m);
            m.position.set((this.blocks.length - models.length / 2) * 1.4, 0, -15);
            console.log(`Added ${modelName}`);
        }

        this.models['ship'] = await ModelLoader.loadModel("Model/ship.glb");
        this.models['guide'] = await ModelLoader.loadModel("Model/guide.glb");

        // TODO: load all glb files int the Model directory into this.models

        // const testFolder = 'Model/*.glb';
        // const fs = require('fs');

        // fs.readdir(testFolder, (err, files) => {
        //     files.forEach(file => {
        //         let filename = file as string;
        //         const m = ModelLoader.loadModel(filename);
        //         this.models[filename.split('.')[0]] = m;
        //     });
        // });
    }
}