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
    S.setDefault('mouse', -1, 'Which grip the mouse controls.');
    S.setDefault('fru', 0, 'If set, log FPS every `fru` seconds.');
    S.setDefault('sh', 1, 'Start location 1 = block build, 2 = VLU');
    S.setDefault('sr', 10e9, 'Universe radius');
    S.setDefault('ar', 1e6, 'Asteroid belt radius');
    S.setDefault('ss', 100e3, 'Radius of a single star')
    S.setDefault('sp', 50e6, 'Star System "Pop" radius');
    S.setDefault('as', 1e2, 'Radius of a single asteroid');
    S.setDefault('ps', 30, 'Platform size.');
    S.setDefault('ns', 10e3, 'Number of stars in the VLU');
    S.setDefault('na', 700, 'Number of asteroids in a belt.');

    S.setDefault('bai', 0, 'If non-zero, starts with one of everything in the world.')
    S.setDefault('sa', 1e3, 'Starship Acceleration');
    S.setDefault('m', 1, 'Use merged geometry in Block Build.');
    S.setDefault('hr', -0.5, 'Distance from eye level to hand resting height.');
    S.setDefault('pbf', 1e7, 'Point brightness factor');
    S.setDefault('cr', 0, 'Creative mode.  Number of each item to start with.');
    S.setDefault('cs', 1.0, 'Scale of the computer model.');
    S.setDefault('ch', 0.7, 'Height of computer from the floor');
    S.setDefault('om', 0, 'Size of origin marker');
    S.setDefault('pv', 2, 'Point cloud version');
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