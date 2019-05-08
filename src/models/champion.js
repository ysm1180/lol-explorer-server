import { model, Schema } from 'mongoose';

var championSchema = new Schema({
  id: String,
  key: Number,
});

export default model('champion', championSchema);
