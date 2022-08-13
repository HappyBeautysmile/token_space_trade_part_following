import * as THREE from "three";
import { Euler, Matrix3 } from "three";

export class Grid {
  static round(v: THREE.Vector3) {
    v.set(Math.round(v.x), Math.round(v.y), Math.round(v.z));
  }

  private static lerp(a: number, b: number, p: number) {
    return p * b + (1 - p) * a;
  }

  static roundLerp(v: THREE.Vector3, p: number) {
    v.set(
      Grid.lerp(v.x, Math.round(v.x), p),
      Grid.lerp(v.y, Math.round(v.y), p),
      Grid.lerp(v.z, Math.round(v.z), p));
  }

  public static zero = new THREE.Vector3(0, 0, 0);
  public static one = new THREE.Vector3(1, 1, 1);
  public static notRotated = new THREE.Quaternion(0, 0, 0, 1);

  public static U0 = new THREE.Quaternion().copy(Grid.notRotated);
  public static U1 = new THREE.Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0));
  public static U2 = new THREE.Quaternion().setFromEuler(new Euler(0, Math.PI, 0));
  public static U3 = new THREE.Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0));

  public static F0 = new THREE.Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0));
  public static B0 = new THREE.Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));
  public static L0 = new THREE.Quaternion().setFromEuler(new Euler(0, 0, Math.PI / 2));
  public static R0 = new THREE.Quaternion().setFromEuler(new Euler(0, 0, -Math.PI / 2));
  public static D0 = new THREE.Quaternion().setFromEuler(new Euler(0, 0, Math.PI));

  public static F1 = new THREE.Quaternion().copy(Grid.U1).multiply(Grid.F0);
  public static F2 = new THREE.Quaternion().copy(Grid.U2).multiply(Grid.F0);
  public static F3 = new THREE.Quaternion().copy(Grid.U3).multiply(Grid.F0);

  public static B1 = new THREE.Quaternion().copy(Grid.U1).multiply(Grid.B0);
  public static B2 = new THREE.Quaternion().copy(Grid.U2).multiply(Grid.B0);
  public static B3 = new THREE.Quaternion().copy(Grid.U3).multiply(Grid.B0);

  public static L1 = new THREE.Quaternion().copy(Grid.U1).multiply(Grid.L0);
  public static L2 = new THREE.Quaternion().copy(Grid.U2).multiply(Grid.L0);
  public static L3 = new THREE.Quaternion().copy(Grid.U3).multiply(Grid.L0);

  public static R1 = new THREE.Quaternion().copy(Grid.U1).multiply(Grid.R0);
  public static R2 = new THREE.Quaternion().copy(Grid.U2).multiply(Grid.R0);
  public static R3 = new THREE.Quaternion().copy(Grid.U3).multiply(Grid.R0);

  public static D1 = new THREE.Quaternion().copy(Grid.U1).multiply(Grid.D0);
  public static D2 = new THREE.Quaternion().copy(Grid.U2).multiply(Grid.D0);
  public static D3 = new THREE.Quaternion().copy(Grid.U3).multiply(Grid.D0);

  public static allRotations: THREE.Quaternion[] = [
    Grid.U0, Grid.F0, Grid.B0, Grid.L0, Grid.R0, Grid.D0,
    Grid.U1, Grid.F1, Grid.B1, Grid.L1, Grid.R1, Grid.D1,
    Grid.U2, Grid.F2, Grid.B2, Grid.L2, Grid.R2, Grid.D2,
    Grid.U3, Grid.F3, Grid.B3, Grid.L3, Grid.R3, Grid.D3,
  ];

  public static randomRotation(): THREE.Quaternion {
    return Grid.allRotations[
      Math.floor(Math.random() * Grid.allRotations.length)];
  }

  public static makeTranslation(x: number, y: number, z: number)
    : THREE.Matrix4 {
    const m = new THREE.Matrix4();
    m.makeTranslation(x, y, z);
    return m;
  }

  public static zeroMatrix = new THREE.Matrix4().set(
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0);
}