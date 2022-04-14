import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
//import Stats from 'three/examples/jsm/libs/stats.module'

const loader = new GLTFLoader();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(40, 2, 10).normalize();
scene.add(directionalLight);


// scene.add(new THREE.Mesh(new THREE.MeshStandardMaterial({ color: '#555555' }), new THREE.SphereGeometry(100000, 25, 25)));

var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 100;
camera.position.y = 2;
camera.position.x = 15;
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();


async function loadModel(filename) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(filename, function (gltf) {
      resolve(gltf.scene);
    }, undefined, function (error) {
      reject(error);
    });
  });
}

async function buildStrays(from, to) {
  const tweak = await loadModel('Model/cube-tweek.glb');

  const xstart = Math.min(from.x, to.x);
  const xend = Math.max(from.x, to.x);
  const ystart = Math.min(from.y, to.y);
  const yend = Math.max(from.y, to.y);
  const zstart = Math.min(from.z, to.z);
  const zend = Math.max(from.z, to.z);

  for (let i = 0; i < 1000; i++) {
    var x = Math.random() * (xend - xstart) + xstart;
    var y = Math.random() * (yend - ystart) + ystart;
    var z = Math.random() * (zend - zstart) + zstart;
    let cube;
    cube = tweak.clone();
    cube.position.set(x, y, z);
    cube.rotation.x = randomAngle();
    cube.rotation.y = randomAngle();
    cube.rotation.z = randomAngle();
    scene.add(cube);
  }
}


async function buildAsteroid(center = new THREE.Vector3(0, 0, 0), radius = 10) {
  let text = "";

  const tweak = await loadModel('Model/cube-tweek.glb');
  const gem = await loadModel('Model/cube-gem.glb');
  const glob = await loadModel('Model/cube-glob.glb');


  for (let x = -radius; x < radius; x++) {
    for (let y = -radius; y < radius; y++) {
      for (let z = -radius; z < radius; z++) {
        var distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        if (distance + Math.random() * 1 < radius - 1) {
          const rand = Math.random();
          let cube;
          if (rand < 0.90) {
            cube = tweak.clone();
          }
          else if (rand < 0.92) {
            cube = gem.clone();
          }
          else {
            cube = glob.clone();
          }
          const cubeLocation = new THREE.Vector3(x, y, z)
          const absolutePos = cubeLocation.add(center);
          cube.position.set(absolutePos.x, absolutePos.y, absolutePos.z);
          cube.rotation.x = randomAngle();
          cube.rotation.y = randomAngle();
          cube.rotation.z = randomAngle();

          scene.add(cube);
        }
      }
    }
  }
}
for (let i = 0; i < 20; i++) {
  var asteroidLocation = new THREE.Vector3((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
  buildAsteroid(asteroidLocation, Math.random() * 8);
}

let from = new THREE.Vector3(-300, -300, -300);
let to = new THREE.Vector3(300, 300, 300);
buildStrays(from, to)

function randomAngle() {
  return Math.floor(Math.random() * 4) * Math.PI / 2;
}
//var stats = new Stats();
//document.body.appendChild(stats.dom);
let framecount = 0;
let framerates = [];
let lastFrame = Date.now();
let velocity = -1;
function render() {
  requestAnimationFrame(render);
  camera.position.z = camera.position.z + velocity
  camera.lookAt(0, 0, 0)
  renderer.render(scene, camera);

  framecount++;
  if (framecount > 300) {
    velocity = -velocity;
    framecount = 0;
  }
  let framerate = 1000 / (Date.now() - lastFrame);
  framerates.push(framerate);
  if (framerates.length > 10) {
    framerates.shift();
  }
  if (framecount % 10 == 0) {
    var sum = 0;
    for (var i = 0; i < framerates.length; i++) {
      sum += parseInt(framerates[i], 10); //don't forget to add the base
    }
    var avg = sum / framerates.length;
    document.getElementById('info').innerHTML = "avg:" + avg.toString() + " min:" + Math.min(...framerates).toString();
  }
  lastFrame = Date.now();
}

render();