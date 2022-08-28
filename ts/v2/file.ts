// import { Storage } from "@google-cloud/storage";

export interface Codeable {
  serialize(): Object;
  deserialize(serialized: Object): this;
  fallback(p: THREE.Vector3): this;
}

export class File {
  static save(value: Codeable, target: string) {
    const o = value.serialize();
    window.localStorage.setItem(target, JSON.stringify(o));

    // File.saveToCloud(value, target);
  }

  static load(target: Codeable, source: string, p: THREE.Vector3) {
    const saved = window.localStorage.getItem(source);
    if (saved) {
      console.log(`Loading saved file: ${source}`);
      const o = JSON.parse(saved);
      return target.deserialize(o);
    } else {
      console.log('Regenerating data.');
      const result = target.fallback(p);
      File.save(result, source);
      return result;
    }
  }

  // static async saveToCloud(value: Codeable, target: string) {
  //   const storage = new Storage();
  //   const bucket = storage.bucket('space-trade-dev');
  //   const o = value.serialize();
  //   bucket.file(target).save(JSON.stringify(o));
  //   return;
  // }
}