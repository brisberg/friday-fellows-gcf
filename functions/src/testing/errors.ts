/**
 * testing/errors package contains mocks and interfaces for errors for
 * third_party services used in tests.
 */

/** Class to mock the structure of a FirebaseError from Firebase */
export class FirebaseError extends Error {
  constructor(readonly status: number, readonly message: string) {
    super(message);
  }
}
