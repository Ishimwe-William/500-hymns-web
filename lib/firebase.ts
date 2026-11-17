import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase-app";

export { isFirebaseConfigured } from "@/lib/firebase-app";
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

export function getFirebaseAuth() {
  return firebaseApp ? getAuth(firebaseApp) : null;
}
