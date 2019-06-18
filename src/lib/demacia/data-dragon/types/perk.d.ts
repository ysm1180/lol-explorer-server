export interface IRuneDataDragon {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}

export interface IRuneSlotDataDragon {
  runes: IRuneDataDragon[];
}
export interface IPerkDataDragon {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: IRuneSlotDataDragon[];
}