import * as mongoose from 'mongoose';

interface MongoDBOptions {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

const databaseInfo: MongoDBOptions = {
  user: 'ysm1180',
  password: 'jesntaids0811',
  host: 'localhost',
  port: 27017,
  database: 'lol-explorer',
};

export class MongoDB {
  private url: string;
  private db = mongoose.connection;

  constructor(options: MongoDBOptions) {
    const { user, password, host, port, database } = options;
    this.url = `mongodb://${user}:${password}@${host}:${port}/${database}?retryWrites=true`;
  }

  public on(event: string, listener: (db: mongoose.Connection, ...args: any[]) => void) {
    this.db.on(event, (...args: any[]) => {
      listener(this.db, ...args);
    });
  }

  public once(event: string, listener: (db: mongoose.Connection, ...args: any[]) => void) {
    this.db.once(event, (...args: any[]) => {
      listener(this.db, ...args);
    });
  }

  public connect() {
    mongoose.connect(this.url, {
      useNewUrlParser: true,
    });
  }
}

export default new MongoDB(databaseInfo);
