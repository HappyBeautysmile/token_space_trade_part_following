import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Tick, Ticker } from "./tick";
import { Hand } from "./hand";
import { Place } from "./place";
import { Debug } from "./debug";
import { Assets } from "./assets";
import { FileIO } from "./fileIO";
import { Construction } from "./construction";
import { Codec, Decode } from "./codec";
import { MaterialExplorer } from "./materialExplorer";

export class BlockBuild {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private playerGroup = new THREE.Group();
  private universeGroup = new THREE.Group();
  private place: Place;
  private keysDown = new Set<string>();
  private construction = new Construction();
  //private assets = new Assets();

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
    // NOTE: if you want the JSON to be loaded before execution reaches
    // this point, you will need to put "await" before the previous line.
    // Read the Debug.log statements carefully to check that the order
    // makes sense.
    Debug.log('setScene complete');
    await Assets.LoadAllModels();
    Debug.log("all models loaded.");

    // this.universeGroup.add(Assets.models["ship"]);
    // this.construction.addCube(Assets.blocks[0]);
    // this.construction.save();

    this.buildGeometry();

    this.getGrips();
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
  private isSaving = false;
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

    if (this.keysDown.has('Digit5') && !this.isSaving) {
      this.isSaving = true;
      this.construction.save();
    } else {
      this.isSaving = false;
    }
  }

  private buildCone() {

    for (let x = -20; x < 20; x++) {
      for (let y = -20; y < 20; y++) {
        for (let z = 0; z < 20; z++) {
          if (Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) < z / 2) {
            let o = new THREE.Object3D();
            o = Assets.blocks[0].clone();
            o.translateX(x);
            o.translateY(y);
            o.translateZ(-z * 2 - 10);
            this.place.universeGroup.add(o);
            this.construction.addCube(o);
          }
        }
      }
    }
  }

  private addAt(x, y, z) {
    let o = new THREE.Object3D();
    o = Assets.models['cube-tweek'].clone();
    o.translateX(x);
    o.translateY(y);
    o.translateZ(z);
    o.rotateX(Math.round(Math.random() * 4) * Math.PI / 2);
    o.rotateY(Math.round(Math.random() * 4) * Math.PI / 2);
    o.rotateZ(Math.round(Math.random() * 4) * Math.PI / 2);
    this.place.universeGroup.add(o);
    this.construction.addCube(o);
  }

  private buildGeometry() {

    const xDim = 20;
    const yDim = 10;
    const zDim = 30;
    for (let x = -xDim; x < xDim; x++) {
      for (let y = -yDim; y < 0; y++) {
        for (let z = -zDim; z < zDim; z++) {
          let xProb = (xDim - Math.abs(x)) / xDim;
          let yProb = (yDim - Math.abs(y)) / yDim;
          let zProb = (zDim - Math.abs(z)) / zDim;

          if (xProb * yProb * zProb > (Math.random() / 10) + 0.5) {
            this.addAt(x, y, z);
          }
        }
      }
    }
  }

  private async setScene() {
    Assets.init();
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

    const headLamp = new THREE.PointLight(0xFFFFFF);
    headLamp.position.set(0, 2, 0);
    headLamp.decay = 2.0;
    headLamp.distance = 10;
    this.scene.add(headLamp);

    const debugPanel = new Debug();
    debugPanel.position.set(0, 0, -3);
    this.universeGroup.add(debugPanel);
    Debug.log("build platform");

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

    Debug.log('loading test.json...')
    const loadedObject = await FileIO.httpGetAsync("./test.json");
    console.log(JSON.stringify(loadedObject, null, 2));
    Debug.log('test.json loaded.')
    const loaded = Decode.arrayOfObject3D(loadedObject);
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
      Assets.blocks[i].position.set(0, 0, 0);
      new Hand(grip, Assets.blocks[i], i, this.renderer.xr,
        this.place, this.keysDown, this.construction);
    }
  }
}