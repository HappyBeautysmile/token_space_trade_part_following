export class S {
  private static cache = new Map<string, number>();
  private static default = new Map<string, number>();
  private static description = new Map<string, string>();

  static setDefault(key: string, value: number, description: string) {
    S.default.set(key, value);
    S.description.set(key, description)
  }

  static appendHelpText(container: HTMLElement) {
    const helpText = document.createElement('div');
    for (const k of S.default.keys()) {
      const d = document.createElement('div');
      const desc = S.description.get(k);
      const val = S.float(k);
      d.innerText = (`${k} = ${val}: ${desc}`);
      helpText.appendChild(d);
    }
    container.appendChild(helpText);
  }

  static {
    S.setDefault('sh', 1, 'Start location 1 = block build, 2 = VLU');
    S.setDefault('sr', 1e9, 'Starfield radius');
    S.setDefault('ar', 3e4, 'Asteroid radius');
    S.setDefault('ns', 1e4, 'Number of stars in the VLU');
    S.setDefault('na', 700, 'Number of asteroids in a belt.');
    S.setDefault('sa', 9.8 * 2, 'Starship Acceleration');

    S.setDefault('pbf', 1e7, 'Point brightness factor');
  }

  public static float(name: string): number {
    if (S.cache.has(name)) {

      return S.cache.get(name);
    }
    const url = new URL(document.URL);
    const stringVal = url.searchParams.get(name);
    if (!stringVal) {
      S.cache.set(name, S.default.get(name));
    } else {
      const val = parseFloat(stringVal);
      S.cache.set(name, val);
    }
    return S.cache.get(name);
  }
}