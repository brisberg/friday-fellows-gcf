# Firebase Cloud Functions


## Testing during Development

Use the Firebase emulator to test functions locally before deploying to cloud resources.

### Unit testing Cloud Functions

Cloud function unit tests use the firebase emulator (below) to mock interactions with Firestore. Follow the instructions below to launch the emulator, then from the `functions` directory run the tests with:

```
npm run test:jest
```

or

To run the emulator and tests in a single step use just:

```
npm test
```

#### Testing with Real Google Sheets (online mode)
If you need to access real GoogleSheets (to run a sync test), you must first export environment variables used by the emulator for configuration:

```
export GOOGLE_APPLICATION_CREDENTIALS=<absolute path>/service-credentials.json
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

Then start the emulator and access its emulated function URLs:
```
firebase emulators:start
```

#### Testing with no Network (offline mode)
Otherwise, it is prefered to test without a network dependency by populating the test data manually.

Start the emulator without credentials:
```
firebase emulators:start
```

Once it is initialized load the stored Firestore dump manually with:
```
npm run test:load_data
```
Now you can run unit tests or manually access the emulated function URLs to interact with the system. Note that any data changes will be lost when the emulator shuts down.

#### Test Database Snapshots

There is a JSON format snapshot of the contents of Firestore stored in: `/functions/src/testing/test-data/firestore.json`

This data is used in unit tests and manual testing to provide a Prod-like experience. However, it will periodically need to be updated, especially to new Firestore schema changes.

To save a new snapshot, start the firebase emulators in Online mode above, and run the `/syncFromVotingSheet` cloud function.

Then save a new snapshot of the test database with:
```
npm run test:dump_data
```

#### Testing caveat
I am depending on `@google-cloud/firestore` to expose the `Query` class for mocking errors from Firestore.

However, we need to mock the real depdency being used by `firebase-admin`. It is possible for `firebase-admin` to use a different installation from another package during `npm install`. So it may result in errors saying that `@google-cloud/firestore` module doesn't exist.

This can be fixed with a clean `npm install` some of the time.
