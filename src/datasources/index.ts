/* eslint-disable @typescript-eslint/naming-convention */

import { category, service } from 'db/schema';
import { SQL, getTableColumns, sql, eq } from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import _ from 'lodash';

export type servicesAndCategories = {
  description: String | null;
  disabled: Boolean;
  created_at: Date;
  updated_at: Date;
  id: String;
  name: String | null;
  category_name: String | null;
};

export class GoogleSheetDataSource {
  private db: DrizzleD1Database;
  constructor({ db }: { db: DrizzleD1Database }) {
    this.db = db;
  }

  // Insert data into the category db
  async postCategories(rows: (String | Number |  Boolean | Date | null)[][]) {
    try {
      // Note: No of columns in the category table is 5. So, chunks of 100/5
      const result = await Promise.all(
        _.chunk(rows, Math.floor(100 / 5)).map(async (chunk) => {
          // Insert the category into the database
          const db_result = await this.db
            .insert(category)
            .values(
              chunk.map((r) => ({
                id: r[0] as string,
                name: r[1] as string,
                description: r[2] as string | null,
              }))
            )
            .onConflictDoUpdate({
              target: category.id,
              set: this.buildConflictUpdateColumns(category, ['description']),
            });
          return db_result;
        })
      );

      return result.flat();
    } catch (error) {
      console.log(error);
      throw new Error('Failed to insert services');
    }
  }

  // Insert data into the service db
  async postServices(rows: (String | Number |  Boolean | Date | null)[][]) {
    try {
      // Note: No of columns in the service table is 7. So, chunks of 100/7
      const result = await Promise.all(
        _.chunk(rows, Math.floor(100 / 7)).map(async (chunk) => {
          // Insert the service into the database
          const db_result = await this.db
            .insert(service)
            .values(
              chunk.map((s) => ({
                id: s[0] as string,
                category_id: s[1] as string,
                name: s[2] as string,
                description: s[3] as string | null,
                disabled: s[4] as boolean,
              }))
            )
            .onConflictDoUpdate({
              target: service.id,
              set: this.buildConflictUpdateColumns(service, ['category_id', 'name', 'description', 'disabled']),
            });
          return db_result;
        })
      );

      return result.flat();
    } catch (err) {
      console.log(err);
      throw new Error('Failed to insert services');
    }
  }

  async servicesAndCategories(): Promise<servicesAndCategories[]> {
    try {
      const { category_id, id, name, ...defaultServiceColumns } = getTableColumns(service);
      const { name: category_name } = getTableColumns(category);

      return this.db
        .select({ id, name, category_name: category_name, ...defaultServiceColumns })
        .from(service)
        .leftJoin(category, eq(service.category_id, category.id))
        .execute();
    } catch (err) {
      console.log(err);
      throw new Error('Failed to fetch services and categories');
    }
  }

  // Builds a conflict update columns object for a given SQLite table and an array of column names
  private buildConflictUpdateColumns<T extends SQLiteTable, Q extends keyof T['_']['columns']>(table: T, columns: Q[]) {
    const cls = getTableColumns(table);
    return columns.reduce((acc, column) => {
      const colName = cls[column].name;
      acc[column] = sql.raw(`excluded.${colName}`);
      return acc;
    }, {} as Record<Q, SQL>);
  }
}
