import { Document, model, Schema } from 'mongoose';

export interface IStaticSpellModel extends Document {
  id: string;
  key: number;
}

var staticSpellSchema = new Schema({
  id: String,
  key: Number,
});

export default model<IStaticSpellModel>('static_spell', staticSpellSchema);
