import { Debug } from "./debug";

export class FileIO {
  static saveObject(content: Object, fileName: string) {
    const a = document.createElement("a");
    const serialized = "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(content));
    a.href = serialized;
    Debug.log(`Saved ${a.href.length} encoded bytes.`);
    a.download = fileName;
    a.click();
  }

  static loadObject(fileName: string) {
  }

  static mapToObject(m: Map<string, Object>): Object {
    const result = {};
    for (const [k, v] of m.entries()) {
      result[k] = v;
    }
    return result;
  }
}