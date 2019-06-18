import { Document, model, Schema } from 'mongoose';

export interface IStaticItemModel extends Document {
  key: number;
}

var staticItemSchema = new Schema({
  key: Number,
});

export default model<IStaticItemModel>('static_item', staticItemSchema);
