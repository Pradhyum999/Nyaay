import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA631nC0q7kLNJEE5PvceNppTgvV9Ohm1U",
  authDomain: "nyaay-legal-app.firebaseapp.com",
  projectId: "nyaay-legal-app",
  storageBucket: "nyaay-legal-app.firebasestorage.app",
  messagingSenderId: "135442555454",
  appId: "1:135442555454:web:15a79552d9185f3a27276f",
  measurementId: "G-G92V5Q4283",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collectionsToDelete = [
  'users',
  'verification_requests',
  'threads',
  'notifications',
  'cases',
  'hearings',
  'invoices',
  'documents'
];

async function clearCollections() {
  console.log("Starting Firestore purge for fresh start...");
  for (const colName of collectionsToDelete) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Found ${snap.size} documents in '${colName}'`);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, colName, d.id));
      }
      console.log(`Cleared collection '${colName}'`);
    } catch (err) {
      console.warn(`Error clearing '${colName}':`, err.message);
    }
  }
  console.log("Firestore purge completed successfully!");
  process.exit(0);
}

clearCollections();

