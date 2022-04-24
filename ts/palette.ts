import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

export class Palette {
    public primary: THREE.Color;
    public secondary: THREE.Color;
    public accent: THREE.Color;
    public blackish: THREE.Color;
    public whitish: THREE.Color;
    public reddish: THREE.Color;
    public yellowish: THREE.Color;
    public greenish: THREE.Color;
    public bluish: THREE.Color;
    public magentaish: THREE.Color;
    private colorIndex: number;

    constructor() {
        this.primary = new THREE.Color();

        this.primary.setHSL(Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2 * .5, Math.random() * 0.8 + 0.2);
        // make a similar color for the secondary
        let hsl = { h: 0, s: 0, l: 0 }
        this.primary.getHSL(hsl);
        hsl.h += Math.random() * .2 - 0.1;
        if (hsl.h > 1) {
            hsl.h -= 1;
        }
        if (hsl.h < 0) {
            hsl.h += 1;
        }
        hsl.s += Math.random() * .3 - 0.15;
        hsl.s = Math.max(0, hsl.s);
        hsl.s = Math.min(1, hsl.s);
        hsl.l += Math.random() * .3 - 0.15;
        hsl.l = Math.max(0, hsl.l);
        hsl.l = Math.min(1, hsl.l);
        this.secondary = new THREE.Color();
        this.secondary.setHSL(hsl.h, hsl.s, hsl.l);

        // make a saturated analogus color for the accent.
        this.primary.getHSL(hsl);
        if (Math.random() > 0.5) {
            hsl.h += Math.random() * .1 - 0.333;
        }
        else {
            hsl.h += Math.random() * .1 + 0.333;
        }

        if (hsl.h > 1) {
            hsl.h -= 1;
        }
        if (hsl.h < 0) {
            hsl.h += 1;
        }
        //hsl.s = Math.random() * .2 + 0.8;
        //hsl.l = Math.random() * .2 + 0.8;
        hsl.s = 1.0;
        hsl.l = 0.5;

        this.accent = new THREE.Color();
        this.accent.setHSL(hsl.h, hsl.s, hsl.l);

        // this.primary = new THREE.Color(0xb3d6c6);
        // this.secondary = new THREE.Color(0xdceab2);
        // this.accent = new THREE.Color(0x75b9be);

        let maxR = Math.max(this.primary.r, this.secondary.r, this.accent.r,);
        let maxG = Math.max(this.primary.g, this.secondary.g, this.accent.g,);
        let maxB = Math.max(this.primary.b, this.secondary.b, this.accent.b,);
        let minR = Math.min(this.primary.r, this.secondary.r, this.accent.r,) * 0.6;
        let minG = Math.min(this.primary.g, this.secondary.g, this.accent.g,) * 0.6;
        let minB = Math.min(this.primary.b, this.secondary.b, this.accent.b,) * 0.6;

        this.whitish = new THREE.Color(maxR, maxG, maxB);
        this.blackish = new THREE.Color(minR, minG, minB);
        this.reddish = new THREE.Color(maxR, minG, minB);
        this.yellowish = new THREE.Color(maxR, maxG, minB);
        this.greenish = new THREE.Color(minR, maxG, minB);
        this.bluish = new THREE.Color(minR, minG, maxB);
        this.magentaish = new THREE.Color(maxR, minG, maxB);

        this.colorIndex = 0;
    }

    public asArray() {
        return [
            this.primary,
            this.secondary,
            this.accent,
            this.whitish,
            this.blackish,
            this.reddish,
            this.yellowish,
            this.greenish,
            this.bluish,
            this.magentaish
        ];
    }

    public nextColor() {
        const colors = this.asArray();
        this.colorIndex = (this.colorIndex + 1) % colors.length;
        return colors[this.colorIndex];
    }

    public getCurrentColor() {
        return this.asArray()[this.colorIndex];
    }
}

export class PaletteTest {
    testPalette: Palette
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    constructor() {
        this.testPalette = new Palette();

        let colors = this.testPalette.asArray();

        document.body.innerHTML = "";

        this.scene = new THREE.Scene();

        this.scene.background = new THREE.Color(0, 0, 0);
        this.camera = new THREE.PerspectiveCamera(75,
            1.0, 0.1, 1000);
        this.camera.position.set(0, 1.7, 0);
        this.camera.lookAt(0, 1.7, -1.5);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(512, 512);
        document.body.appendChild(this.renderer.domElement);
        this.renderer.xr.enabled = true;

        const light = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 40, 10);
        this.scene.add(directionalLight);

        for (let i = 0; i < colors.length; i++) {
            let size = 1;
            if (i < 2) {
                size = 3 - i;
            }

            let cubeMat = new THREE.MeshPhysicalMaterial({
                clearcoat: 1.0,
                sheen: 0.5,
                metalness: 0.9,
                roughness: 0.5,
                color: colors[i]
            });

            const primaryCube = (new THREE.Mesh(
                //new THREE.BoxGeometry(size, size, size),
                new THREE.SphereGeometry(size, 3, 3),
                cubeMat
            ));
            primaryCube.position.set((i % 5) * 2 - 3, Math.floor(i / 5) * 2, -10);
            primaryCube.onBeforeRender = () => {
                primaryCube.rotateX(0.01);
                primaryCube.rotateY(0.0231);
                primaryCube.rotateZ(0.00512);
            };
            this.scene.add(primaryCube);
        }

        // const tetra = new THREE.Mesh(
        //     new THREE.TetrahedronBufferGeometry(0.5),
        //     new THREE.MeshStandardMaterial({ color: this.testPalette.secondary }));
        // tetra.position.set(0, 1.7, -1.5);
        // tetra.onBeforeRender = () => {
        //     tetra.rotateX(0.01);
        //     tetra.rotateY(0.0231);
        //     tetra.rotateZ(0.00512);
        // };
        // this.scene.add(tetra)
        document.body.appendChild(VRButton.createButton(this.renderer));

        this.renderer.setAnimationLoop(() => {
            this.renderer.render(this.scene, this.camera);
        });
    }
}
