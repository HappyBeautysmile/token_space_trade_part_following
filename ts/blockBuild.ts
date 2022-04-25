import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Tick, Ticker } from "./tick";
import { Hand } from "./hand";
import { Place } from "./place";
import { Debug } from "./debug";

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

export class BlockBuild {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private allModels: THREE.Object3D[] = [];
  private playerGroup = new THREE.Group();
  private universeGroup = new THREE.Group();
  private place: Place;
  private keysDown = new Set<string>();

  constructor() {
    this.initialize();
    document.body.addEventListener('keydown', (ev: KeyboardEvent) => {
      this.keysDown.add(ev.code);
    });
    document.body.addEventListener('keyup', (ev: KeyboardEvent) => {
      this.keysDown.delete(ev.code);
    });
  }

  private async initialize() {
    this.setScene();
    await this.loadAllModels();
    Debug.log("all models loaded.");
    this.getGrips();
  }

  private async loadAllModels() {
    const models = ['cube', 'wedge', 'chopped corner', 'corner', 'cube-basic', 'cube-gem',
      'cube-glob', 'cube-smooth', 'cube-tweek',
      'wedge 2', 'wonk']
    for (const modelName of models) {
      console.log(`Loading ${modelName}`);
      const m = await ModelLoader.loadModel(`Model/${modelName}.glb`);
      if (!m) {
        continue;
      }
      m.scale.set(1, 1, 1);
      this.allModels.push(m);
      //this.scene.add(m);
      this.universeGroup.add(m);
      m.position.set((this.allModels.length - models.length / 2) * 1.4, 0, -15);
      console.log(`Added ${modelName}`);
    }
    // const m = await ModelLoader.loadModel(`Model/ship.glb`);
    // this.playerGroup.add(m);
  }

  private tickEverything(o: THREE.Object3D, tick: Tick) {
    if (o['tick']) {
      (o as any as Ticker).tick(tick);
    }
    for (const child of o.children) {
      this.tickEverything(child, tick);
    }
  }

  private v = new THREE.Vector3();
  private tick(t: Tick) {
    this.v.set(0, 0, 0);
    if (this.keysDown.has('KeyA')) {
      this.v.x -= t.deltaS * 5;
    }
    if (this.keysDown.has('KeyD')) {
      this.v.x += t.deltaS * 5;
    }
    if (this.keysDown.has('KeyS')) {
      this.v.z += t.deltaS * 5;
    }
    if (this.keysDown.has('KeyW')) {
      this.v.z -= t.deltaS * 5;
    }
    if (this.keysDown.has('ArrowLeft')) {
      this.camera.rotation.y += t.deltaS * 2;
    }
    if (this.keysDown.has('ArrowRight')) {
      this.camera.rotation.y -= t.deltaS * 2;
    }
    if (this.v.length() > 0) {
      this.place.movePlayerRelativeToCamera(this.v);
    }
  }

  private setScene() {
    document.body.innerHTML = "";
    this.scene.add(this.playerGroup);
    this.scene.add(this.universeGroup);

    //this.scene.background = new THREE.Color(0x552200);

    var skyGeo = new THREE.SphereGeometry(1999, 25, 25);
    var loader = new THREE.TextureLoader()
    var texture = loader.load("Model/sky.jpg");
    var material = new THREE.MeshPhongMaterial({
      map: texture,
    });
    var sky = new THREE.Mesh(skyGeo, material);
    sky.material.side = THREE.BackSide;
    this.playerGroup.add(sky);

    this.camera = new THREE.PerspectiveCamera(75,
      1.0, 0.1, 2000);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);
    this.playerGroup.add(this.camera);
    this.place = new Place(this.universeGroup, this.playerGroup, this.camera);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(512, 512);
    document.body.appendChild(this.renderer.domElement);
    this.renderer.xr.enabled = true;

    const light = new THREE.AmbientLight(0x404040); // soft white light
    this.scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 40, 10);
    this.scene.add(directionalLight);

    const debugPanel = new Debug();
    debugPanel.position.set(0, 0, -3);
    this.universeGroup.add(debugPanel);
    Debug.log("added squeeze to delete");

    // const controls = new OrbitControls(this.camera, this.renderer.domElement);
    // controls.target.set(0, 0, -5);
    // controls.update();

    const clock = new THREE.Clock();
    let elapsedS = 0.0;

    this.renderer.setAnimationLoop(() => {
      const deltaS = Math.min(clock.getDelta(), 0.1);
      elapsedS += deltaS;
      const tick = new Tick(elapsedS, deltaS);
      this.tick(tick);
      this.tickEverything(this.scene, tick);
      this.renderer.render(this.scene, this.camera);
    });
    document.body.appendChild(VRButton.createButton(this.renderer));
  }

  getGrips() {
    //const debugMaterial = new THREE.MeshStandardMaterial({ color: '#0f0' });
    //const debug = new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.2),
    //  debugMaterial);
    //debug.position.set(0, 0.5, -2);
    //this.scene.add(debug);

    for (const i of [0, 1]) {
      const grip = this.renderer.xr.getControllerGrip(i);
      this.playerGroup.add(grip);
      if (grip.userData['inputSource']) {
        //debugMaterial.color = new THREE.Color('#0ff');
      }
      // Note: adding the model to the Hand will remove it from the Scene
      // It's still in memory.
      this.allModels[i].position.set(0, 0, 0);
      new Hand(grip, this.allModels[i], i, this.renderer.xr,
        this.place, i == 0);
    }
  }
}