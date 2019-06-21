import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

interface MongoDBOptions {
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
}

const databaseInfo: MongoDBOptions = {
  user: process.env.MONGO_USER,
  password: process.env.MONGO_PASSWORD,
  host: process.env.MONGO_HOST,
  port: Number(process.env.MONGO_PORT),
  database: process.env.MONGO_DATABASE,
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
