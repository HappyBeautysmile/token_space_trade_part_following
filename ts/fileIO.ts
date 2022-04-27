export class FileIO {
    static saveObject(content, fileName: string) {
        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(content, null, 2)], { type: 'text/plain' });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }
    static loadObject(filename: string) {

    }
}