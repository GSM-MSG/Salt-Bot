import { getFirestore } from "firebase/firestore";
import { config } from "./utils/config";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectID,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderID,
  appId: config.appID
};

const firebaseApp = initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseApp);
