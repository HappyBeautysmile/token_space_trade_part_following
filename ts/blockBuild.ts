import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshStandardMaterial, Object3D } from "three";

class ModelLoader {
  static async loadModel(filename: string): Promise<THREE.Object3D> {
    const loader = new GLTFLoader();
    return new Promise<THREE.Object3D>((resolve, reject) => {
      loader.load(filename, (gltf) => {
        resolve(gltf.scene);
      });
    });
  }
}

class Tick {
  constructor(readonly deltaS: number) { }
}

interface Ticker {
  tick(t: Tick): void;
}

let AllObjects = new Map()

export class Hand extends THREE.Object3D {
  private cube: THREE.Object3D;
  private universeGroup: THREE.Group;
  private leftHand: boolean;

  // private debug: THREE.Object3D;
  // private debugMaterial: THREE.MeshStandardMaterial;

  constructor(private grip: THREE.Object3D, initialObject: THREE.Object3D,
    private index: number, private xr: THREE.WebXRManager, universeGroup: THREE.Group, leftHand: boolean) {
    super();

    this.universeGroup = universeGroup;
    this.leftHand = leftHand;
    // this.debugMaterial = new THREE.MeshStandardMaterial({ color: '#f0f' });
    // this.debug = new THREE.Mesh(
    //   new THREE.CylinderBufferGeometry(0.02, 0.02, 0.5), this.debugMaterial);
    // this.debug.position.set(0, 0, -1);
    // this.add(this.debug);

    grip.add(this);
    this.cube = initialObject;
    this.add(this.cube);

    // const cube = new THREE.Mesh(
    //   new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
    //   new THREE.MeshStandardMaterial({ color: '#987' }));
    // //cube.position.z = -0.2;
    // this.add(cube);

    // const lineMaterial = new THREE.LineBasicMaterial({ color: '#d00' });
    // const lineGeometry = new THREE.BufferGeometry()
    //   .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -0.5, 0)]);
    // const line = new THREE.Line(lineGeometry, lineMaterial);
    // this.add(line);
    this.initialize();
  }

  public tick(t: Tick) {
    //this.debug.rotateZ(0.5 * t.deltaS);

    let source: THREE.XRInputSource = null;
    const session = this.xr.getSession();
    if (session) {
      //this.debugMaterial.color = new THREE.Color('red');
      if (session.inputSources) {
        //this.debugMaterial.color = new THREE.Color('brown');
        source = session.inputSources[this.index];
      }
    }

    if (source) {
      //this.debugMaterial.color = new THREE.Color('blue');
      const rate = 3;
      const axes = source.gamepad.axes.slice(0);
      if (axes.length >= 4) {
        //this.debugMaterial.color = new THREE.Color('green');
        if (!axes[2] || !axes[3]) {
          // Sticks are not being touched.
          // this.cube.rotateZ(0.3);
        } else {
          //this.debugMaterial.color = new THREE.Color('orange');
          this
          //this.cube.rotateX(axes[2] * rate * t.deltaS);
          //this.cube.rotateY(axes[3] * rate * t.deltaS);
          if (this.leftHand) {
            this.universeGroup.translateX(-axes[2] * rate * t.deltaS);
            this.universeGroup.translateZ(-axes[3] * rate * t.deltaS);
          }
          else {
            this.universeGroup.translateZ(-axes[2] * rate * t.deltaS);
          }
        }
      }
    }
  }

  public setCube(o: THREE.Object3D) {
    this.remove(this.cube);
    this.cube = o;
    this.add(this.cube);
  }

  private posToKey(p) {
    return p.x.toString() + ',' + p.y.toString() + ',' + p.z.toString();
  }

  private async initialize() {
    this.grip.add(this.cube);
    this.grip.addEventListener('squeeze', () => {
      const p = this.cube.position;
      const key = this.posToKey(p);
      AllObjects[key]
      const scene = this.grip.parent;
      scene.remove(AllObjects[key]);
      AllObjects.delete(key);
    });

    this.grip.addEventListener('selectstart', () => {
      const o = this.cube.clone();
      const p = o.position;
      const r = o.rotation;
      this.grip.getWorldPosition(p);
      p.x = Math.round(p.x * 10) / 10;
      p.y = Math.round(p.y * 10) / 10;
      p.z = Math.round(p.z * 10) / 10;
      const scaleFactor = Math.PI / 2
      r.x = Math.round(r.x / scaleFactor) * scaleFactor;
      r.y = Math.round(r.y / scaleFactor) * scaleFactor;
      r.z = Math.round(r.z / scaleFactor) * scaleFactor;
      const scene = this.grip.parent;
      scene.add(o);
      const key = this.posToKey(p);
      AllObjects.set(key, o);
    });

    this.grip.addEventListener('selectend', () => {

    });
  }
}

export class BlockBuild {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private allModels: THREE.Object3D[] = [];
  private playerGroup: THREE.Group;
  private universeGroup: THREE.Group;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.setScene();
    await this.loadAllModels();
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
      m.scale.set(0.1, 0.1, 0.1);
      this.allModels.push(m);
      //this.scene.add(m);
      this.universeGroup.add(m);
      m.position.set(this.allModels.length * 0.14, 0, -3);
      console.log(`Added ${modelName}`);
    }
  }

  private tickEverything(o: THREE.Object3D, tick: Tick) {
    if (o['tick']) {
      (o as any as Ticker).tick(tick);
    }
    for (const child of o.children) {
      this.tickEverything(child, tick);
    }
  }

  private setScene() {
    document.body.innerHTML = "";

    this.scene = new THREE.Scene();
    this.playerGroup = new THREE.Group();
    this.scene.add(this.playerGroup);
    this.universeGroup = new THREE.Group();
    this.scene.add(this.universeGroup);

    this.scene.background = new THREE.Color(0x008800);
    this.camera = new THREE.PerspectiveCamera(75,
      1.0, 0.1, 1000);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(512, 512);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;

    const light = new THREE.AmbientLight(0x404040); // soft white light
    this.scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 40, 10);
    this.scene.add(directionalLight);

    // const controls = new OrbitControls(this.camera, this.renderer.domElement);
    // controls.target.set(0, 0, -5);
    // controls.update();

    // const tetra = new THREE.Mesh(
    //   new THREE.TetrahedronBufferGeometry(0.5),
    //   new THREE.MeshStandardMaterial({ color: 'pink' }));
    // tetra.position.set(0, 1.7, -1.5);
    // tetra.onBeforeRender = () => {
    //   tetra.rotateX(0.01);
    //   tetra.rotateY(0.0231);
    //   tetra.rotateZ(0.00512);
    // };
    // this.scene.add(tetra)

    const clock = new THREE.Clock();

    this.renderer.setAnimationLoop(() => {
      const tick = new Tick(clock.getDelta());
      this.tickEverything(this.scene, tick);
      this.renderer.render(this.scene, this.camera);
    });
  }

  getGrips() {
    const debugMaterial = new THREE.MeshStandardMaterial({ color: '#0f0' });
    const debug = new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.2),
      debugMaterial);
    debug.position.set(0, 0.5, -2);
    this.scene.add(debug);

    for (const i of [0, 1]) {
      const grip = this.renderer.xr.getControllerGrip(i);
      this.scene.add(grip);
      if (grip.userData['inputSource']) {
        debugMaterial.color = new THREE.Color('#0ff');
      }
      // Note: adding the model to the Hand will remove it from the Scene
      // It's still in memory.
      this.allModels[i].position.set(0, 0, 0);
      new Hand(grip, this.allModels[i], i, this.renderer.xr, this.universeGroup, i == 0);
    }
  }
}