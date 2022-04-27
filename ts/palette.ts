import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { FileIO } from "./fileIO";

export class Palette {
    static primary: THREE.Color;
    static secondary: THREE.Color;
    static accent: THREE.Color;
    static blackish: THREE.Color;
    static whitish: THREE.Color;
    static reddish: THREE.Color;
    static yellowish: THREE.Color;
    static greenish: THREE.Color;
    static bluish: THREE.Color;
    static magentaish: THREE.Color;
    static colorIndex: number;

    constructor() { }
    public static init() {
        Palette.primary = new THREE.Color();

        Palette.primary.setHSL(Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2 * .5, Math.random() * 0.8 + 0.2);
        // make a similar color for the secondary
        let hsl = { h: 0, s: 0, l: 0 }
        Palette.primary.getHSL(hsl);
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
        Palette.secondary = new THREE.Color();
        Palette.secondary.setHSL(hsl.h, hsl.s, hsl.l);

        // make a saturated analogus color for the accent.
        Palette.primary.getHSL(hsl);
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

        Palette.accent = new THREE.Color();
        Palette.accent.setHSL(hsl.h, hsl.s, hsl.l);

        // this.primary = new THREE.Color(0xb3d6c6);
        // this.secondary = new THREE.Color(0xdceab2);
        // this.accent = new THREE.Color(0x75b9be);

        let maxR = Math.max(Palette.primary.r, Palette.secondary.r, Palette.accent.r,);
        let maxG = Math.max(Palette.primary.g, Palette.secondary.g, Palette.accent.g,);
        let maxB = Math.max(Palette.primary.b, Palette.secondary.b, Palette.accent.b,);
        let minR = Math.min(Palette.primary.r, Palette.secondary.r, Palette.accent.r,) * 0.6;
        let minG = Math.min(Palette.primary.g, Palette.secondary.g, Palette.accent.g,) * 0.6;
        let minB = Math.min(Palette.primary.b, Palette.secondary.b, Palette.accent.b,) * 0.6;

        Palette.whitish = new THREE.Color(maxR, maxG, maxB);
        Palette.blackish = new THREE.Color(minR, minG, minB);
        Palette.reddish = new THREE.Color(maxR, minG, minB);
        Palette.yellowish = new THREE.Color(maxR, maxG, minB);
        Palette.greenish = new THREE.Color(minR, maxG, minB);
        Palette.bluish = new THREE.Color(minR, minG, maxB);
        Palette.magentaish = new THREE.Color(maxR, minG, maxB);

        Palette.colorIndex = 0;
    }

    static asArray() {
        return [
            Palette.primary,
            Palette.secondary,
            Palette.accent,
            Palette.whitish,
            Palette.blackish,
            Palette.reddish,
            Palette.yellowish,
            Palette.greenish,
            Palette.bluish,
            Palette.magentaish
        ];
    }

    static nextColor() {
        const colors = this.asArray();
        Palette.colorIndex = (Palette.colorIndex + 1) % colors.length;
        return colors[Palette.colorIndex];
    }

    static getCurrentColor() {
        return this.asArray()[Palette.colorIndex];
    }
}

export class PaletteTest {
    testPalette: Palette
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    constructor() {
        Palette.init();

        let colors = Palette.asArray();

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
        directionalLight.position.set(0, 0, 30);
        this.scene.add(directionalLight);

        for (let i = 0; i < colors.length; i++) {
            let size = 1;
            if (i < 2) {
                size = 3 - i;
            }

            let cubeMat = new THREE.MeshPhysicalMaterial({
                roughness: 0.5,
                metalness: 0.5,
                clearcoat: 1,
                clearcoatRoughness: 0.2,
                color: colors[1]
            });

            const primaryCube = (new THREE.Mesh(
                //new THREE.BoxGeometry(size, size, size),
                new THREE.BoxGeometry(size, size, size),
                cubeMat
            ));
            primaryCube.position.set((i % 5) * 2 - 3, Math.floor(i / 5) * 2, -10);
            primaryCube.onBeforeRender = () => {
                primaryCube.rotateX(0.01);
                primaryCube.rotateY(0.02);
                primaryCube.rotateZ(0.03);
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
