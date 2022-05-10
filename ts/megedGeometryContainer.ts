import { assert } from "console";
import * as THREE from "three";
import { BufferAttribute } from "three";

export class MergedGeometryContainer extends THREE.Object3D {
  private geometry = new THREE.BufferGeometry();
  private keyIndex = new Map<string, number>();
  // The first attribute index of the coresponding object. This is always
  // one longer than the number of keys. The difference between adjacent
  // entries is the number of verticies for that entry.
  private attributeIndex: number[] = [0];

  static supportedAttributes = ['position', 'normal'];

  constructor() {
    super();
    const mesh = new THREE.Mesh(
      this.geometry, new THREE.MeshBasicMaterial({ color: '#0f0' }));
    this.add(mesh);
  }

  // Removes `count` values from `att` starting at `start`
  private spliceAttribute(attributeName: string, start: number, count: number) {
    const oldAtt = this.geometry.getAttribute(attributeName);
    const values = new Float32Array((oldAtt.count - count) * oldAtt.itemSize);
    for (let i = 0; i < start * oldAtt.itemSize; ++i) {
      values[i] = oldAtt.array[i];
    }
    for (let i = start * oldAtt.itemSize;
      i < start * (oldAtt.count - count); ++i) {
      values[i] = oldAtt.array[i + count * oldAtt.itemSize];
    }
    this.geometry.setAttribute(
      attributeName, new THREE.BufferAttribute(values, oldAtt.itemSize));
  }

  private values(att: THREE.BufferAttribute, index: THREE.BufferAttribute)
    : Float32Array {
    if (!index) {
      return new Float32Array(att.array);
    } else {
      console.log(`Indexed!`);
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
    console.log(`Append ${attributeName}`);

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
  private getTransform(o: THREE.Object3D, p: THREE.Object3D): THREE.Matrix4 {
    const m = new THREE.Matrix4();
    m.identity();
    while (o != p && o) {
      this.tmpM.compose(o.position, o.quaternion, o.scale);
      m.premultiply(this.tmpM);
      o = o.parent;
    }
    return m;
  }

  // Adds the geometry of `o` to this, and associates it with `key`.  This
  // `key` can be used later to remove this chunk of geometry.
  mergeIn(key: string, o: THREE.Object3D) {
    let totalVertexCount = 0;
    if (this.keyIndex.has(key)) {
      throw new Error(`Key already in use: ${key}`);
    }
    // TODO: transform positions and normals by parent matricies.
    let vertexCount = -1;
    for (const mesh of this.allMeshes(o)) {
      const transform = new THREE.Matrix4();
      for (const attributeName of MergedGeometryContainer.supportedAttributes) {
        switch (attributeName) {
          case 'position':
            transform.copy(this.getTransform(mesh, o.parent));
            break;
          case 'normal':
            transform.copy(this.getTransform(mesh, o.parent));
            const m3 = new THREE.Matrix3();
            m3.getNormalMatrix(transform);
            transform.setFromMatrix3(m3);
            break;
          default:
            transform.identity();
        }
        const att = mesh.geometry.getAttribute(attributeName) as
          THREE.BufferAttribute;
        console.assert(!!att);
        console.assert(vertexCount < 0 || vertexCount === att.count);
        vertexCount = att.count;
        if (mesh.geometry.index) {
          console.log(`Indexed: ${key}`);
        }
        this.append(attributeName, att, mesh.geometry.index, transform);
      }
      console.assert(vertexCount > 0);
      totalVertexCount += vertexCount;
    }
    const objectIndex = this.keyIndex.size;
    this.keyIndex.set(key, objectIndex);
    this.attributeIndex.push(
      this.attributeIndex[objectIndex] + totalVertexCount);
  }

  // Removes the geometry associated with `key` from this.
  removeKey(key: string) {
    throw new Error("Not implemented.");
  }

}