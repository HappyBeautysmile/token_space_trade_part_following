import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


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

camera.position.z = 40;
camera.position.y = 2;
camera.position.x = 10;

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

async function buildAsteroid() {
  let text = "";

  const tweak = await loadModel('Model/cube-tweek.glb');
  const gem = await loadModel('Model/cube-gem.glb');
  const glob = await loadModel('Model/cube-glob.glb');

  for (let x = -20; x < 20; x++) {
    for (let y = -20; y < 20; y++) {
      for (let z = -20; z < 20; z++) {
        var distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        if (distance + Math.random() * 1 < 5) {
          const rand = Math.random();
          let cube;
          if (rand < 0.90) {
            cube = tweak.clone();
          }
          // else if (rand < 0.7) {
          //     filename = 'Model/cube-basic.glb';
          // }
          else if (rand < 0.95) {
            cube = gem.clone();
          }
          else {
            cube = glob.clone();
          }
          cube.position.set(x, y, z);
          cube.rotation.x = randomAngle();
          cube.rotation.y = randomAngle();
          cube.rotation.z = randomAngle();

          scene.add(cube);
        }
      }
    }
  }
}

buildAsteroid();

function randomAngle() {
  return Math.floor(Math.random() * 4) * Math.PI / 2;
}
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
render();