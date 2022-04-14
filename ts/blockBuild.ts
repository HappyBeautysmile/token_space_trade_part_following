import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Object3D } from "three";

class ModelLoader {
  static async loadModel(filename: string): Promise<THREE.Object3D> {
    const loader = new GLTFLoader();
    return new Promise<THREE.Object3D>((resolve, reject) => {
      loader.load(filename, (gltf) => {
        resolve(gltf.scene);
      },
        (error) => {
          reject(error);
        });
    });
  }

}

let AllObjects = new Map()

export class Hand extends THREE.Object3D {
  private cube: THREE.Object3D;
  constructor(private grip: THREE.Object3D) {
    super();
    grip.add(this);

    // const cube = new THREE.Mesh(
    //   new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
    //   new THREE.MeshStandardMaterial({ color: '#987' }));
    // //cube.position.z = -0.2;
    //this.add(cube);

    const lineMaterial = new THREE.LineBasicMaterial({ color: '#def' });
    const lineGeometry = new THREE.BufferGeometry()
      .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -0.5, 0)]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.add(line);

    this.onBeforeRender = (renderer: THREE.WebGLRenderer,
      scene: THREE.Scene, camera: THREE.Camera,
      geometry: THREE.BufferGeometry, material: THREE.Material,
      group: THREE.Group) => {
    }
    this.initialize();
  }

  public setCube(o: THREE.Object3D) {
    this.grip.remove(this.cube);
    this.cube = o;
    this.grip.add(this.cube);
  }

  private async initialize() {
    this.cube = await ModelLoader.loadModel('dist/Model/cube-basic.glb');
    this.grip.add(this.cube);
    this.grip.addEventListener('squeeze', () => {
      //this.grip.addEventListener('selectstart', () => {
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
      this.grip.parent.add(o);
      const key = p.x.toString() + ',' + p.y.toString() + ',' + p.z.toString();
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

  private cubes = new Map<string, THREE.Object3D>();

  constructor() {
    this.setScene();
    this.getGrips();
  }


  setScene() {
    document.body.innerHTML = "";

    this.scene = new THREE.Scene();
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

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.target.set(0, 0, -5);
    controls.update();

    // const tetra = new THREE.Mesh(
    //   new THREE.TetrahedronBufferGeometry(0.5),
    //   new THREE.MeshStandardMaterial({ color: 'cyan' }));
    // tetra.position.set(0, 1.7, -1.5);
    // tetra.onBeforeRender = () => {
    //   tetra.rotateX(0.01);
    //   tetra.rotateY(0.0231);
    //   tetra.rotateZ(0.00512);
    // };
    // this.scene.add(tetra)

    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });
  }

  getGrips() {
    for (const i of [0, 1]) {
      const grip = this.renderer.xr.getControllerGrip(i);
      this.scene.add(grip);
      new Hand(grip);
    }
  }
}