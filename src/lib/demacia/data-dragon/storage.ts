export class CacheStorage {
  private cacheData: { [key: string]: { [subKey: string]: any } } = {};

  constructor() {}

  public get(key: string, subKey?: string): any {
    if (this.cacheData[key] !== undefined) {
      if (subKey) {
        if (this.cacheData[key][subKey] !== undefined) {
          return this.cacheData[key][subKey];
        }
      } else {
        return this.cacheData[key];
      }
    }

    return null;
  }

  public set(key: string, value: any, subKey?: string): void {
    if (subKey) {
      if (this.cacheData[key] !== undefined) {
        this.cacheData[key][subKey] = value;
      } else {
        this.cacheData[key] = {};
        this.cacheData[key][subKey] = value;
      }
    } else {
      this.cacheData[key] = value;
    }
  }
}
