# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Firebase setup

This project is prepared to be connected to a Google Firebase project. Below are the recommended, minimal steps to get started.

1. Create a Firebase project
	- Go to https://console.firebase.google.com/ and create a new project (or use an existing one).

2. Register a Web App (optional, for client SDK)
	- In your Firebase project, create a Web App and copy the Firebase config values.

3. Store config in environment variables (recommended)
	- Create a file named `.env.local` at the repository root (it's already ignored by `.gitignore`).
	- Add the following variables (replace placeholders with values from the Firebase console):

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Install the Firebase SDK
	- Run: `npm install firebase` (or `yarn add firebase`) in the project root.

5. Use the initializer
	- A small initializer has been added at `src/firebase.ts`. Import `auth` and `db` where you need them:

```ts
import { auth, db, storage } from './firebase';
```

6. Enable Firebase Storage
	- In your Firebase project console, go to **Storage** and click **Get Started**.
	- Choose appropriate security rules (see below for recommended rules).
	- Your storage bucket is listed in your config as `REACT_APP_FIREBASE_STORAGE_BUCKET`.

7. Storage Security Rules (Firestore)
	- For development/testing, you can use permissive rules. Replace the default rules in your Firebase console with:
	
	```javascript
	rules_version = '2';
	service firebase.storage {
	  match /b/{bucket}/o {
	    // Allow authenticated users to upload and manage their own headshots
	    match /headshots/{userId}/{allPaths=**} {
	      allow read: if request.auth != null;
	      allow write: if request.auth != null && request.auth.uid == userId;
	      allow delete: if request.auth != null && request.auth.uid == userId;
	    }
	    // Allow public read access to other files
	    match /{allPaths=**} {
	      allow read: if true;
	      allow write: if false;
	    }
	  }
	}
	```
	- For production, further restrict access based on user roles (check your Firestore user document for admin status).

8. (Optional) Firebase CLI and hosting
	- Install the Firebase CLI (`npm install -g firebase-tools`) and run `firebase login` then `firebase init` to configure hosting and other services. Do not commit any service account JSON files or secrets.

Security notes
 - `.env.local` is listed in `.gitignore` by default. Do not commit secrets or service account JSON files. If you use a server-side service account, keep the JSON file outside the repo and reference it in your CI/CD secrets instead.
 - Firebase Storage files are uploaded to `headshots/{userId}/{filename}` paths. Ensure your security rules restrict upload access to authenticated users only.
 - For production, consider implementing server-side custom claims (e.g., `admin` claim) and checking them in your Storage rules to prevent unauthorized uploads.

