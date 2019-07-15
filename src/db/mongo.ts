import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

interface IMongoDBOptions {
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
}

export class MongoDB {
  private url: string;
  private db = mongoose.connection;
  private session: mongoose.ClientSession | null = null;

  constructor(options: IMongoDBOptions) {
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

  public async startSession() {
    this.session = await this.db.startSession();
    return this.session;
  }

  public startTransaction() {
    if (this.session) {
      this.session.startTransaction();
    }
  }

  public async commitTransaction() {
    if (this.session) {
      await this.session.commitTransaction();
    }
  }

  public async abortTransaction() {
    if (this.session) {
      await this.session.abortTransaction();
    }
  }
}

const databaseInfo: IMongoDBOptions = {
  user: process.env.MONGO_USER,
  password: process.env.MONGO_PASSWORD,
  host: process.env.MONGO_HOST,
  port: Number(process.env.MONGO_PORT),
  database: process.env.MONGO_DATABASE,
};

export default new MongoDB(databaseInfo);
