import * as THREE from "three";
import { BufferAttribute, MeshNormalMaterial } from "three";
import { Container } from "./construction";
import { Debug } from "./debug";
import { Tick, Ticker } from "./tick";

interface Mergable {
  getIndexCount(): number;
  getPositionCount(): number;
  positions(): Iterable<number>;
  normals(): Iterable<number>;
  colors(): Iterable<number>;
  index(): Iterable<number>;
  getCentroid(centroid: THREE.Vector3): void;
}

class MergableSet implements Mergable {
  private children: Mergable[] = [];
  private size = 0;
  private positionCount = 0;
  private centroid = new THREE.Vector3();
  constructor() { }

  public add(m: Mergable) {
    this.children.push(m);
    this.centroid.multiplyScalar(this.size);
    const mCentroid = new THREE.Vector3();
    m.getCentroid(mCentroid);
    mCentroid.multiplyScalar(m.getIndexCount());
    this.centroid.add(mCentroid);
    this.centroid.multiplyScalar(1 / (this.size + m.getIndexCount()));
    this.size += m.getIndexCount();
    this.positionCount += m.getPositionCount();
  }

  *positions() {
    for (const child of this.children) {
      yield* child.positions();
    }
  }

  *normals() {
    for (const child of this.children) {
      yield* child.normals();
    }
  }

  *colors() {
    for (const child of this.children) {
      yield* child.colors();
    }
  }

  *index() {
    let indexOffset = 0;
    for (const child of this.children) {
      for (const i of child.index()) {
        yield i + indexOffset;
      }
      indexOffset += child.getIndexCount();
    }
  }

  getCentroid(c: THREE.Vector3) {
    c.copy(this.centroid);
  }

  getIndexCount(): number {
    return this.size;
  }

  getPositionCount(): number {
    return this.positionCount;
  }

  public sort() {
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    this.children.sort((a: Mergable, b: Mergable) => {
      // Sort elements furthest from centroid first.  When rendered
      // we make use of the z-buffer to prevent excessive calls to the
      // fragment shader.
      a.getCentroid(v1);
      v1.sub(this.centroid);
      b.getCentroid(v2);
      v2.sub(this.centroid);
      return v2.manhattanLength() - v1.manhattanLength();
    });
  }

}

class MergableGeometry implements Mergable {
  private positionsArray: Float32Array;
  private normalsArray: Float32Array;
  private colorsArray: Float32Array;
  private indexArray: number[] = [];
  private centroid: THREE.Vector3;

  *positions() {
    yield* this.positionsArray;
  }

  *normals() {
    yield* this.normalsArray;
  }

  *colors() {
    yield* this.colorsArray;
  }

  *index() {
    yield* this.indexArray;
  }

  getCentroid(centroid: THREE.Vector3) {
    centroid.copy(this.centroid);
  }

  getIndexCount() {
    return this.indexArray.length;
  }

  getPositionCount() {
    return this.positions.length / 3;
  }

  constructor(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4,
    c: THREE.Color) {
    const positionsAtt = geometry.getAttribute('position');
    if (geometry.index) {
      for (let i = 0; i < geometry.index.count; ++i) {
        this.indexArray.push(geometry.index.getX(i));
      }
    } else {
      for (let i = 0; i < positionsAtt.count; ++i) {
        this.indexArray.push(i);
      }
    }
    this.positionsArray = new Float32Array(this.indexArray.length * 3);
    this.normalsArray = new Float32Array(this.indexArray.length * 3);
    this.colorsArray = new Float32Array(this.indexArray.length * 3);
    this.copyAtt3(positionsAtt, this.positionsArray, matrix);
    const m3 = new THREE.Matrix3();
    m3.getNormalMatrix(matrix);
    matrix.setFromMatrix3(m3);
    this.copyAtt3(geometry.getAttribute('normal'), this.normalsArray, matrix);
    m3.identity();

    for (let i = 0; i < positionsAtt.count; ++i) {
      this.colorsArray[i * 3 + 0] = c.r;
      this.colorsArray[i * 3 + 1] = c.g;
      this.colorsArray[i * 3 + 2] = c.b;
    }

    this.setCentroid();
  }

  private setCentroid() {
    this.centroid = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < this.positionsArray.length; i += 3) {
      this.centroid.x += this.positionsArray[i + 0];
      this.centroid.y += this.positionsArray[i + 1];
      this.centroid.z += this.positionsArray[i + 2];
    }
    this.centroid.multiplyScalar(3 / this.positionsArray.length);
  }

  private v = new THREE.Vector3();
  private copyAtt3(
    att: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
    target: Float32Array, matrix: THREE.Matrix4) {
    for (let i = 0; i < att.count; ++i) {
      this.v.fromBufferAttribute(att, i);
      this.v.applyMatrix4(matrix);
      target[i * 3 + 0] = this.v.x;
      target[i * 3 + 1] = this.v.y;
      target[i * 3 + 2] = this.v.z;
    }
  }
}

export class MergedGeometryContainer extends THREE.Object3D implements Ticker, Container {
  private mergableSet = new MergableSet();
  private dirty = false;
  private geometry = new THREE.BufferGeometry();
  private pieces = new Map<string, Mergable>();

  static supportedAttributes = ['position', 'normal'];

  constructor() {
    super();
    const mesh = new THREE.Mesh(
      this.geometry, new THREE.MeshPhongMaterial(
        { color: '#fff', vertexColors: true }));
    mesh.material.vertexColors = true;
    this.add(mesh);
  }

  private values(att: THREE.BufferAttribute, index: THREE.BufferAttribute)
    : Float32Array {
    if (!index) {
      return new Float32Array(att.array);
    } else {
      const result = new Float32Array(index.count * att.itemSize);
      for (let i = 0; i < index.count; ++i) {
        const attributePosition = index.getX(i);
        for (let j = 0; j < att.itemSize; ++j) {
          result[i * att.itemSize + j] =
            att.array[attributePosition * att.itemSize + j];
        }
      }
      return result;
    }
  }

  private oldValues(attributeName: string): ArrayLike<number> {
    const oldAtt = this.geometry.getAttribute(attributeName);
    if (oldAtt) {
      return oldAtt.array;
    } else {
      return [];
    }
  }

  private append(attributeName: string, att: THREE.BufferAttribute,
    index: THREE.BufferAttribute, transform: THREE.Matrix4) {
    const attValues = this.values(att, index);
    if (att.itemSize == 3) {
      const v = new THREE.Vector3();
      for (let i = 0; i < attValues.length; i += 3) {
        v.set(attValues[i + 0], attValues[i + 1], attValues[i + 2]);
        v.applyMatrix4(transform);
        attValues[i + 0] = v.x;
        attValues[i + 1] = v.y;
        attValues[i + 2] = v.z;
      }
    }
    const oldValues = this.oldValues(attributeName);

    const values = new Float32Array(oldValues.length + attValues.length);
    for (let i = 0; i < oldValues.length; ++i) {
      values[i] = oldValues[i];
    }
    for (let i = 0; i < attValues.length; ++i) {
      const targetIndex = i + oldValues.length;
      values[targetIndex] = attValues[i];
    }
    const newAtt = new THREE.BufferAttribute(values, att.itemSize);
    this.geometry.setAttribute(attributeName, newAtt);
    newAtt.needsUpdate = true;
  }

  private *allMeshes(o: THREE.Object3D): Iterable<THREE.Mesh> {
    if (o.type === 'Mesh') {
      yield (o as THREE.Mesh);
    }
    for (const c of o.children) {
      yield* this.allMeshes(c);
    }
  }

  private tmpM = new THREE.Matrix4();
  private getTransform(o: THREE.Object3D, p: THREE.Object3D, out: THREE.Matrix4) {
    out.identity();
    while (o != p && o) {
      this.tmpM.compose(o.position, o.quaternion, o.scale);
      out.premultiply(this.tmpM);
      o = o.parent;
    }
  }

  // Adds the geometry of `o` to this, and associates it with `key`.  This
  // `key` can be used later to remove this chunk of geometry.
  addObject(key: string, o: THREE.Object3D): void {
    if (this.pieces.has(key)) {
      throw new Error(`Key already in use: ${key}`);
    }
    // TODO: transform positions and normals by parent matricies.
    const meshContainer = new MergableSet();
    for (const mesh of this.allMeshes(o)) {
      const transform = new THREE.Matrix4();
      this.getTransform(mesh, o.parent, transform);
      let color = new THREE.Color('#f0f');
      if (!Array.isArray(mesh.material)) {
        // console.log(`color: ${JSON.stringify(mesh.material['color'])}`);
        if (mesh.material['color']) {
          color = mesh.material['color'];
        }
      } else {
        console.log(`Array!`);
      }
      const mergablMesh = new MergableGeometry(mesh.geometry, transform, color);
      meshContainer.add(mergablMesh);
    }
    this.mergableSet.add(meshContainer);
    this.dirty = true;
  }
  // const objectIndex = this.keyIndex.size;
  //   this.keyIndex.set(key, objectIndex);


  // Removes the geometry associated with `key` from this.
  removeObject(key: string) {
    throw new Error("Not implemented.");
  }

  private clean() {
    console.time('clean');
    this.mergableSet.sort();
    const indexArray = new Uint32Array(this.mergableSet.index());
    this.geometry.index = new THREE.Uint32BufferAttribute(indexArray, 1, false);
    this.geometry.index.needsUpdate = true;

    const positionAtt = new BufferAttribute(
      new Float32Array(this.mergableSet.positions()), 3);
    positionAtt.needsUpdate = true;
    this.geometry.setAttribute('position', positionAtt);

    const normalAtt = new BufferAttribute(
      new Float32Array(this.mergableSet.normals()), 3);
    normalAtt.needsUpdate = true;
    this.geometry.setAttribute('normal', normalAtt);

    const colorAtt = new BufferAttribute(
      new Float32Array(this.mergableSet.colors()), 3);
    colorAtt.needsUpdate = true;
    this.geometry.setAttribute('color', colorAtt);

    this.dirty = false;
    console.timeEnd('clean');
  }

  tick(t: Tick) {
    if (this.dirty) {
      this.clean();
    }
  }
}