# Friday Fellows Updater (Google Cloud Functions)

Implementing FridayFellows Updater on Google Cloud Platform with Cloud Functions.

## Functions:

Serverless Backend is implemented by a series of Cloud Function, located in the `functions` directory.

`firebase deploy --only functions` to depoly all functions to Firebase/GCP

## Web App

React App for viewing and interacting with the voting record is hosted on [Github Pages](http://brisberg.github.io/friday-fellows-gcf), located in the `app` directory.

Deploy a new version to gh-pages with: `npm run deploy`


## Testing during Development

Use the Firebase emulator to test functions locally before deploying to cloud resources.

First export environment variables used by the emulator for configuration:

```
export GOOGLE_APPLICATION_CREDENTIALS=<absolute path>/service-credentials.json
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

Then start the emulator and access its emulated function URLs.

`firebase emulators:start`

### Unit testing Cloud Functions

Cloud function unit tests use the firebase emulator (above) to mock interacts with Firestore. Follow the instructions above to launch the emulator, then from the `functions` directory run the tests with:

`npm run test:jest`

or

To run the emulator and tests in a single step use just:

`npm test`
