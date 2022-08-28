export class Log {
  private static container: HTMLDivElement;
  private static initialize() {
    Log.container = document.createElement('div');
    document.body.appendChild(Log.container);
  }

  static info(message: string): void {
    if (!Log.container) { Log.initialize(); }
    const d = document.createElement('div');
    d.innerHTML = message;
    Log.container.appendChild(d);
  }

  static clear(): void {
    if (!Log.container) { Log.initialize(); }
    Log.container.innerHTML = '';
  }
}