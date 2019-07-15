import { Document, model, Schema } from 'mongoose';
import * as models from '../lib/demacia/models';

export interface IGameTimelineModel extends models.IGameTimelineApiData, Document {
  gameId: number;
}

var gameTimelineSchema = new Schema({
  gameId: Number,
  frames: {
    type: ['Mixed'],
  },
  frameInterval: Number,
});

export default model<IGameTimelineModel>('game_timeline', gameTimelineSchema);
