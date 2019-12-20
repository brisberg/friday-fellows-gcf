# Friday Fellows Updater (Google Cloud Functions)

Implementing FridayFellows Updater on Google Cloud Platform with Cloud Functions.

## Functions:

Serverless Backend is implemented by a series of Cloud Function, located in the `functions` directory.

`firebase deploy --only functions` to deploy all functions to Firebase/GCP

To run all backend unit tests: `cd functions && npm test`

## Web App

React App for viewing and interacting with the voting record is hosted on [Github Pages](http://brisberg.github.io/friday-fellows-gcf), located in the `app` directory.

Deploy a new version to gh-pages with: `npm run deploy`

Run a local version of the app with: `npm start`.

Make sure that the Firebase Emulator is running or most UI interactions will fail. (See `functions` directory for instructions on starting the emulator)
