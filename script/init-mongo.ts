import { connect, connection } from 'mongoose';

// mongo db
const truncateCollections = ['summoners', 'leagues', 'matches', 'games'];

const db = connection;
db.on('error', console.error);
db.on('open', () => {
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

const USER = 'ysm1180';
const PASSWORD = 'jesntaids0811';
const HOST = 'localhost';
const PORT = 27017;
const DATABASE = 'lol-explorer';

connect(
  `mongodb://${USER}:${PASSWORD}@${HOST}:${PORT}/${DATABASE}?retryWrites=true`,
  {
    useNewUrlParser: true,
  }
);
