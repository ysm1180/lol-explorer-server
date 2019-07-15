import { Document, model, Schema } from 'mongoose';

export interface IDevApiModel extends Document {
  user_id: string;
  key: string;
}

var devApiSchema = new Schema({
  user_id: String,
  key: String,
});

export default model<IDevApiModel>('dev_api', devApiSchema, 'dev_api');
