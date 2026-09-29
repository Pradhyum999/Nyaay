// scripts/set-admin.mjs  →  node scripts/set-admin.mjs <uid>
import admin from 'firebase-admin';

if (!process.argv[2]) {
  console.error('Usage: node scripts/set-admin.mjs <uid>');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
await admin.auth().setCustomUserClaims(process.argv[2], { admin: true });
console.log(`admin claim set for UID: ${process.argv[2]}; user must re-authenticate (or refresh token) to pick it up`);
