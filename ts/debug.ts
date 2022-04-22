import * as THREE from "three";

export class Debug extends THREE.Object3D {
  static canvas = document.createElement('canvas');
  static messages: string[] = [];
  static texture = new THREE.CanvasTexture(Debug.canvas);
  static material: THREE.MeshBasicMaterial;
  constructor() {
    super();
    Debug.canvas.width = 4096;
    Debug.canvas.height = 1024;
    Debug.material = new THREE.MeshBasicMaterial();
    Debug.material.map = Debug.texture;
    const panel = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(4, 1),
      Debug.material
    );
    this.add(panel);
  }

  static log(message: string) {
    const textHeight = 64;
    console.log(message);
    const ctx = Debug.canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, Debug.canvas.width, Debug.canvas.height);
    Debug.messages.push(message);
    while (Debug.messages.length > Debug.canvas.height / textHeight) {
      Debug.messages.shift();
    }
    let y = textHeight;
    ctx.font = `${textHeight}px monospace`;
    ctx.fillStyle = 'lime';
    ctx.strokeStyle = 'white';
    for (const m of Debug.messages) {
      ctx.strokeText(m, 0, y);
      ctx.fillText(m, 0, y);
      y += textHeight;
    }
    Debug.texture.needsUpdate = true;
    Debug.material.needsUpdate = true;
  }
}