import mongo from '../../db/mongo';
import { GAME_QUEUE_ID } from '../../lib/demacia/constants';

// mongo db
const truncateCollections = [
  'statistics_champion_bans',
  'statistics_champion_positions',
  'statistics_champion_final_items',
  'statistics_champion_final_item_builds',
  'statistics_champion_main_items',
  'statistics_champion_item_builds',
  'statistics_champion_rival_item_builds',
  'statistics_champion_rival_main_item_builds',
  'statistics_champion_rival_main_items',
  'statistics_champion_rival_final_items',
  'statistics_champion_rival_rune_builds',
  'statistics_champion_rival_shoes',
  'statistics_champion_rival_spell_builds',
  'statistics_champion_rival_start_items',
  'statistics_champion_rival_stats',
  'statistics_champion_rival_skill_sets',
  'statistics_champion_runes',
  'statistics_champion_shoes',
  'statistics_champion_skill_sets',
  'statistics_champion_spells',
  'statistics_champion_start_items',
  'statistics_champion_time_wins',
  'statistics_champions',
];
mongo.on('error', (_, ...args) => console.error(...args));
mongo.on('open', (db) => {
  const promises: Promise<any>[] = [];
  truncateCollections.forEach((collection) => {
    console.log(`Truncating ${collection}...`);
    promises.push(db.collection(collection).deleteMany({}));
  });

  promises.push(
    db.collection('statistics_games').deleteMany({
      $and: [
        {
          queueId: {
            $ne: GAME_QUEUE_ID.RIFT_SOLO_RANK,
          },
        },
        {
          queueId: {
            $ne: GAME_QUEUE_ID.RIFT_FLEX_RANK,
          },
        },
      ],
    })
  );
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.2' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.3' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.4' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.5' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.6' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.7' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.8' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.9' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.10' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.11' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.12' }));
  promises.push(db.collection('statistics_games').deleteMany({ gameVersion: '9.13' }));
  promises.push(db.collection('statistics_games').updateMany({}, { $set: { isReady: false } }));
  promises.push(db.collection('statistics_summoners').updateMany({}, { $set: { isReady: false } }));

  promises.push(
    db
      .collection('statistics_games')
      .find({}, { projection: { gameId: 1 } })
      .toArray()
      .then((docs) => {
        db.collection('game_timelines').deleteMany({
          gameId: { $nin: docs.map((doc) => doc.gameId) },
        });
      })
  );

  Promise.all(promises).then(() => {
    console.log('Init DB Finish.');
    db.close();
  });
});
mongo.connect();
