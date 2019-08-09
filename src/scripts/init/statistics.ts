import mongo from '../../db/mongo';

// mongo db
const truncateCollections = [
  'statistics_champion_bans',
  'statistics_champion_positions',
  'statistics_champion_purchased_items',
  'statistics_champion_rival_item_builds',
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

  promises.push(db.collection('statistics_games').updateMany({}, { $set: { isReady: false } }));
  promises.push(db.collection('statistics_summoners').updateMany({}, { $set: { isReady: false } }));

  Promise.all(promises).then(() => {
    console.log('Init DB Finish.');
    db.close();
  });
});
mongo.connect();
