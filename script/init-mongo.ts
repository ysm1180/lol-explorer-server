import mongo from '../src/db/mongo';

// mongo db
const truncateCollections = ['summoners', 'leagues', 'matches', 'games'];
mongo.on('error', (_, ...args) => console.error(...args));
mongo.on('open', (db) => {
  const promises: Promise<any>[] = [];
  truncateCollections.forEach((collection) => {
    console.log(`Truncating ${collection}...`);
    promises.push(db.collection(collection).deleteMany({}));
  });

  Promise.all(promises).then(() => {
    console.log('Init DB Finish.');
    db.close();
  });
});
mongo.connect();
