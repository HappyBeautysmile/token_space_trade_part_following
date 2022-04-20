import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

class Palette {
    public primary: THREE.Color;
    public secondary: THREE.Color;
    public accent: THREE.Color;
    public blackish: THREE.Color;
    public whiteish: THREE.Color;
    public redish: THREE.Color;
    public yellowish: THREE.Color;
    public greenish: THREE.Color;
    public blueish: THREE.Color;
    public magentaish: THREE.Color;

    constructor() {
        this.primary = new THREE.Color(0xb3d6c6);
        this.secondary = new THREE.Color(0xdceab2);
        this.accent = new THREE.Color(0x75b9be);

        let maxR = Math.max(this.primary.r, this.secondary.r, this.accent.r,);
        let maxG = Math.max(this.primary.g, this.secondary.g, this.accent.g,);
        let maxB = Math.max(this.primary.b, this.secondary.b, this.accent.b,);
        let minR = Math.min(this.primary.r, this.secondary.r, this.accent.r,);
        let minG = Math.min(this.primary.g, this.secondary.g, this.accent.g,);
        let minB = Math.min(this.primary.b, this.secondary.b, this.accent.b,);

        this.whiteish = new THREE.Color(maxR, maxG, maxB);
        this.blackish = new THREE.Color(minR, minG, minB);
        this.redish = new THREE.Color(maxR, minG, minB);
        this.yellowish = new THREE.Color(maxR, maxG, minB);
        this.greenish = new THREE.Color(minR, maxG, minB);
        this.blueish = new THREE.Color(minR, minG, maxB);
        this.magentaish = new THREE.Color(minR, maxG, maxB);
    }
}

export class PaletteTest {
    testPalette: Palette
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    constructor() {
        this.testPalette = new Palette();

        document.body.innerHTML = "";

        this.scene = new THREE.Scene();

        this.scene.background = new THREE.Color(0x005500);
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

        const tetra = new THREE.Mesh(
            new THREE.TetrahedronBufferGeometry(0.5),
            new THREE.MeshStandardMaterial({ color: 'pink' }));
        tetra.position.set(0, 1.7, -1.5);
        tetra.onBeforeRender = () => {
            tetra.rotateX(0.01);
            tetra.rotateY(0.0231);
            tetra.rotateZ(0.00512);
        };
        this.scene.add(tetra)
    }
}