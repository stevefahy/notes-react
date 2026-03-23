/**
 * Minimal DTOs for MongoDB-style JSON responses from the API.
 * Keeps the browser bundle free of the `mongodb` driver package.
 */

export type ApiObjectId = string;

export interface ApiInsertOneResult {
  acknowledged?: boolean;
  insertedId?: ApiObjectId | { toString(): string };
}

export interface ApiUpdateResult {
  acknowledged?: boolean;
  modifiedCount?: number;
  matchedCount?: number;
  upsertedCount?: number;
  upsertedId?: unknown;
}

export interface ApiDeleteResult {
  acknowledged?: boolean;
  deletedCount?: number;
}

export interface ApiBulkWriteResult {
  acknowledged?: boolean;
  insertedCount?: number;
  matchedCount?: number;
  modifiedCount?: number;
  deletedCount?: number;
  upsertedCount?: number;
}
