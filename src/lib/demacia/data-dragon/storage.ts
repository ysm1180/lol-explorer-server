export class CacheStorage<T> {
  private cacheData: { [key: string]: { [subKey: string]: T } } = {};

  constructor() {}

  public get(key: string, subKey?: string): T | null {
    if (this.cacheData[key] !== undefined) {
      if (subKey) {
        if (this.cacheData[key][subKey] !== undefined) {
          return this.cacheData[key][subKey];
        }
      } else {
        return this.cacheData[key]['0'];
      }
    }

    return null;
  }

  public set(key: string, value: T, subKey?: string): void {
    if (subKey) {
      if (this.cacheData[key] !== undefined) {
        this.cacheData[key][subKey] = value;
      } else {
        this.cacheData[key] = {};
        this.cacheData[key][subKey] = value;
      }
    } else {
      if (this.cacheData[key] === undefined) {
        this.cacheData[key] = {};
      }
      this.cacheData[key]['0'] = value;
    }
  }
}
