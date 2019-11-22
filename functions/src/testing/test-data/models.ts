/**
 * Model definitions for Firestore data store in test data files for
 * FridayFellows
 */

/** Interface for a Firestore Collection data object */
export interface FirestoreCollection {
  // id: string|number;
  docs: {[id: string]: FirestoreDocument}
}

/** Interface for a Firestore Document data object */
export interface FirestoreDocument {
  // id: string|number;
  fields: {[key: string]: string|number|boolean|{}|[]|null};
  collections?: {[name: string]: FirestoreCollection};
}
