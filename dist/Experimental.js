import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(50, 50, 50);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(40, 2, 10).normalize();
scene.add(directionalLight);

scene.add(light);
// scene.add(new THREE.Mesh(new THREE.MeshStandardMaterial({ color: '#555555' }), new THREE.SphereGeometry(100000, 25, 25)));

var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 40;
camera.position.y = 2;
camera.position.x = 10;

let text = "";
for (let x = -20; x < 20; x++) {
  for (let y = -20; y < 20; y++) {
    for (let z = -20; z < 20; z++) {
      var distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
      if (distance + Math.random() < 5) {
        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
        const loader = new GLTFLoader();
        loader.load('Model/cube.glb', function (gltf) {
          cube = gltf.scene;
          cube.position.set(x, y, z);
          scene.add(cube);
        }, undefined, function (error) {
          console.error(error);
        });
      }
    }
  }
}
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
render();