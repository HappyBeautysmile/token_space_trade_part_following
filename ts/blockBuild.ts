import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

import { Tick, Ticker } from "./tick";
import { Hand } from "./hand";
import { Place } from "./place";
import { Debug } from "./debug";
import { Assets, Item } from "./assets";
import { Construction, ObjectConstruction } from "./construction";
import { AstroGen } from "./astroGen";
import { S } from "./settings";
import { Inventory, Player } from "./player";
import { GripGrip, GripLike, MouseGrip } from "./gripLike";
import { Computer } from "./computer/computer";
import { ButtonDispatcher } from "./buttonDispatcher";
import { SkyBox } from "./skyBox";
import { PointCloud, PointCloud1 } from "./pointCloud";
import { PointCloud2 } from "./pointCloud2";
import { ModelCloud } from "./modelCloud";
import { StarSystem } from "./starSystem";
import { Universe } from "./universe";
import { System, Body } from "./system";
import { Exchange } from "./exchange";
import { Factory } from "./factory";
import { InWorldItem } from "./inWorldItem";

export class BlockBuild {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  private playerGroup = new THREE.Group();
  private universeGroup = new THREE.Group();
  private universe = new Universe();
  private place: Place;
  private keysDown = new Set<string>();
  private construction: Construction;
  private player: Player;
  private computer: Computer;
  private stars: PointCloud;
  private factories: Factory[] = [];

  constructor() {
    this.playerGroup.name = 'Player Group';
    this.universeGroup.name = 'Universe Group';
    this.initialize();
    document.body.addEventListener('keydown', (ev: KeyboardEvent) => {
      this.keysDown.add(ev.code);
    });
    document.body.addEventListener('keyup', (ev: KeyboardEvent) => {
      this.keysDown.delete(ev.code);
    });
  }

  private async initialize() {
    await this.setScene();

    let exchanges = new Map();
    for (let i of Assets.items) {
      let exchange = new Exchange(i);
      exchanges.set(i, exchange);
    }

    let station = new Body();
    station.name = "station";
    station.bodyType = 'Station';
    station.position = new THREE.Vector3(10, 10, 10);
    station.exchanges = exchanges;

    let system = new System("system name");
    system.addBody(station);

    this.universe.systems.set(system.getName(), system);

    this.construction = new ObjectConstruction(
      this.place.universeGroup, this.renderer);
    let ab = new AstroGen(this.construction);

    ab.buildPlatform(
      Math.round(S.float('ps') * 2 / 3),
      10,
      Math.round(S.float('ps')),
      0, 0, 0);

    const inWorldItem = new InWorldItem(
      Assets.itemsByName.get("clayProducer"),
      new THREE.Vector3(0, 1, -5),
      new THREE.Quaternion());
    this.construction.addCube(inWorldItem);

    const inputSpec = new Map<Item, number>();
    const clay = Assets.itemsByName.get('clay');
    inputSpec.set(clay, 1);
    const factory = new Factory(inputSpec, clay, 1, 1.2, 1.2);
    factory.setHome(this.construction, new THREE.Vector3(0, 1, -5),
      new THREE.Vector3(0, 0, -1));
    this.factories.push(factory);

    // for (let i = 0; i < 10; i++) {
    //   ab.buildPlatform(
    //     Math.round(S.float('ps') / 3),
    //     5,
    //     Math.round(S.float('ps') / 2),
    //     Math.floor(Math.random() * 500) - 250,
    //     Math.floor(Math.random() * 500) - 250,
    //     Math.floor(Math.random() * 500) - 250);
    // }


    ab.buildOriginMarker(S.float('om'));

    //ab.buildRandomItems(10, 100);

    this.construction.loadFromLocal();
    this.construction.saveToLocal();

    this.getGrips();
    this.dumpScene(this.scene, '');
  }

  private dumpScene(o: THREE.Object3D, prefix: string) {
    if (!o.visible) {
      prefix = '#' + prefix;
    }
    console.log(`${prefix}${o.name} (${o.type})`);
    for (const c of o.children) {
      this.dumpScene(c, prefix + ' ');
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

  private v = new THREE.Vector3();
  private isSaving = false;
  private lastFrameRateUpdate = 0;
  private frameCount = 0;
  private tick(t: Tick) {
    ++this.frameCount;
    const fru = S.float('fru');
    if (fru && t.elapsedS >= this.lastFrameRateUpdate + fru) {
      Debug.log(`FPS: ${(this.frameCount / (t.elapsedS - this.lastFrameRateUpdate)).toFixed(1)}`);
      this.lastFrameRateUpdate = t.elapsedS;
      this.frameCount = 0;
    }

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
      this.place.playerGroup.rotateY(t.deltaS * 2);
    }
    if (this.keysDown.has('ArrowRight')) {
      this.place.playerGroup.rotateY(-t.deltaS * 2);
    }
    if (this.keysDown.has('ArrowDown')) {
      this.camera.rotateX(-t.deltaS * 2);
    }
    if (this.keysDown.has('ArrowUp')) {
      this.camera.rotateX(t.deltaS * 2);
    }
    if (this.v.length() > 0) {
      this.place.movePlayerRelativeToCamera(this.v);
    }

    if (this.keysDown.has('Digit5') && !this.isSaving) {
      this.isSaving = true;
      this.construction.save();
      this.isSaving = false;
    }
    if (this.keysDown.has('Digit6')) {
      this.keysDown.delete('Digit6');
      // create an AudioListener and add it to the camera
      const listener = new THREE.AudioListener();
      this.computer.add(listener);

      // create a global audio source
      const sound = new THREE.Audio(listener);

      // load a sound and set it as the Audio object's buffer
      const audioLoader = new THREE.AudioLoader();
      const num = Math.ceil(Math.random() * 5).toFixed(0);
      const soundname = `sounds/mine${num}.ogg`;
      audioLoader.load(soundname, (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.5);
        sound.play();
      });
    }
    for (const f of this.factories) {
      f.tick(t);
    }
  }
  private async setScene() {
    await Assets.init();
    this.player = new Player("FunUserName");  // player needs the assets so that it can build an inventory.
    document.body.innerHTML = "";
    this.scene.add(this.playerGroup);
    this.scene.add(this.universeGroup);

    this.camera = new THREE.PerspectiveCamera(75, 1.0, 0.1, 2000);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);

    if (S.float('pv') === 2) {
      const starCloud = new PointCloud2(
        0, S.float('sr'), S.float('sr') / 10, S.float('ns'),
        new THREE.Color('#fff'), S.float('ss'),
        /*visibleDistance=*/S.float('sr'), /*includeOrigin=*/true,
        /*initialIntensity=*/4.0);
      this.stars = new ModelCloud((pos: THREE.Vector3) => {
        return new StarSystem(this.camera);
      }, starCloud, /*showRadius=*/S.float('sp'), this.camera);
    } else {
      this.stars = new PointCloud1(
        0, S.float('sr'), S.float('sr') / 10, S.float('ns'),
        new THREE.Color('#ddd'), /*pointRadius=*/1e4,
        /*visibleDistance=*/S.float('sr'), /*includeOrigin=*/true);
    }
    this.universeGroup.add(this.stars);

    const sky = new SkyBox();
    this.scene.add(sky);

    this.playerGroup.add(this.camera);
    this.place = new Place(this.universeGroup, this.playerGroup, this.camera,
      this.stars);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    //this.renderer.setSize(512, 512);
    this.renderer.setSize(800, 800);
    document.body.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.renderer.xr.enabled = true;

    const light = new THREE.AmbientLight(0x101020); // dark blue light
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
    this.computer = await Computer.make(this.player, this.universe);
    //this.computer.translateY(S.float('ch'));
    //this.computer.translateZ(-0.3);
    //this.computer.rotateX(Math.PI / 4);
    const computerScale = S.float('cs');
    this.computer.scale.set(computerScale, computerScale, computerScale);

    // ButtonDispatcher.registerButton(this.computer, new THREE.Vector3(0, 0, 0),
    //   0.1, () => {
    //     if (this.computer.scale.x > 2) {
    //       this.computer.scale.set(1, 1, 1);
    //     } else {
    //       this.computer.scale.set(10, 10, 10);
    //     }
    //   });

    //this.playerGroup.add(this.computer);

    // // create an AudioListener and add it to the camera
    // const listener = new THREE.AudioListener();
    // this.computer.add(listener);

    // // create a global audio source
    // const sound = new THREE.Audio(listener);

    // // load a sound and set it as the Audio object's buffer
    // const audioLoader = new THREE.AudioLoader();
    // audioLoader.load('sounds/spaceship-ambience.ogg', function (buffer) {
    //   sound.setBuffer(buffer);
    //   sound.setLoop(true);
    //   sound.setVolume(0.5);
    //   sound.play();
    // });

    Debug.log("Three Version=" + THREE.REVISION);
    Debug.log("Factory Example");

    // const controls = new OrbitControls(this.camera, this.renderer.domElement);
    // controls.target.set(0, 0, -5);
    // controls.update();

    const clock = new THREE.Clock();
    let elapsedS = 0.0;
    let frameCount = 0;

    this.renderer.setAnimationLoop(() => {
      const deltaS = Math.min(clock.getDelta(), 0.1);
      elapsedS += deltaS;
      ++frameCount;
      const tick = new Tick(elapsedS, deltaS, frameCount);
      this.tick(tick);
      this.tickEverything(this.scene, tick);
      this.renderer.render(this.scene, this.camera);
    });
    document.body.appendChild(VRButton.createButton(this.renderer));
    return;  // We need an explicit 'return' because this is async (?)
  }

  getGrips() {
    //const debugMaterial = new THREE.MeshStandardMaterial({ color: '#0f0' });
    //const debug = new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.2),
    //  debugMaterial);
    //debug.position.set(0, 0.5, -2);
    //this.scene.add(debug);

    for (const i of [0, 1]) {
      let grip: GripLike = null;
      // let source: THREE.XRInputSource = undefined;
      if (S.float('mouse') == i) {
        console.assert(!!this.canvas);
        grip = new MouseGrip(this.canvas, this.camera, this.keysDown);
        this.computer.translateY(1.7);
        this.computer.translateZ(-0.4);
        this.computer.rotateX(Math.PI / 2);
        this.playerGroup.add(this.computer);
      } else {
        grip = new GripGrip(i, this.renderer.xr);
        // source = (grip as GripGrip).getSource();
      }
      this.playerGroup.add(grip);

      // TODO: set this.computer above.
      // if (handedness === 'left') {
      //   grip.add(this.computer);
      // }

      // Note: adding the model to the Hand will remove it from the Scene
      // It's still in memory.
      // Assets.blocks[i].position.set(0, 0, 0);
      new Hand(grip, Assets.itemsByName.get('guide'), i, this.renderer.xr,
        this.place, this.keysDown, this.construction, this.player.inventory, this.computer);
    }
  }
}