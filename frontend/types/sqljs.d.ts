declare module "sql.js" {
  export type SqlValue = string | number | null | Uint8Array;

  export class Statement {
    bind(values?: SqlValue[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, SqlValue>;
    free(): boolean;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer);
    run(sql: string, params?: SqlValue[]): Database;
    prepare(sql: string): Statement;
    export(): Uint8Array;
  }

  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export default function initSqlJs(config?: Record<string, unknown>): Promise<SqlJsStatic>;
}
