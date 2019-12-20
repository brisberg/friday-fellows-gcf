### Testing

Testing caveat: I am depending on `@google-cloud/firestore` to expose the `Query` class for mocking errors from Firestore.

However, we need to mock the real depdency being used by `firebase-admin`. It is possible for `firebase-admin` to use a different installation from another package during `npm install`. So it may result in errors saying that `@google-cloud/firestore` module doesn't exist.

This can be fixed with a clean npm install some of the time.
