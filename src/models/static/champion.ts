import { Document, model, Schema } from 'mongoose';

export interface IStaticChampionModel extends Document {
  id: string;
  key: number;
}

var staticChampionSchema = new Schema({
  id: String,
  key: Number,
});

export default model<IStaticChampionModel>('static_champion', staticChampionSchema);
