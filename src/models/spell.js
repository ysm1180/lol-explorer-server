import { model, Schema } from 'mongoose';

var spellSchema = new Schema({
  id: String,
  key: Number,
});

export default model('spell', spellSchema);
