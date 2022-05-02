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

  static httpGetAsync(theUrl: string, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
  }

  static mapToObject(m: Map<string, Object>): Object {
    const result = {};
    for (const [k, v] of m.entries()) {
      result[k] = v;
    }
    return result;
  }
}