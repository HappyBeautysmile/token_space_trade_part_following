import { Debug } from "./debug";

export class FileIO {
  static saveObjectAsJson(content: Object, fileName: string) {
    const a = document.createElement("a");
    const serialized = "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(content));
    a.href = serialized;
    Debug.log(`Saved ${a.href.length} encoded bytes.`);
    a.download = fileName;
    a.click();
  }

  static saveImage(domElement, fileName: string) {
    const a = document.createElement("a");
    let imgData = domElement.toDataURL("image/jpeg");
    imgData.replace("image/jpeg", "image/octet-stream");
    a.href = imgData;
    Debug.log(`Saved ${a.href.length} encoded bytes.`);
    a.download = fileName;
    a.click();
  }

  static async httpGetAsync(theUrl: string): Promise<Object[]> {
    return new Promise<Object[]>(async (resolve) => {
      const response = await fetch(theUrl);
      const jso = await response.json();
      resolve(jso);
    });
  }

  static mapToObject(m: Map<string, Object>): Object {
    const result = {};
    for (const [k, v] of m.entries()) {
      result[k] = v;
    }
    return result;
  }
}