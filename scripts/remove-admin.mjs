import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({
  credential: applicationDefault(),
});

const email = process.argv[2];

if (!email) {
  console.error("Please provide an email address.");
  console.error("Example: npm run admin:remove -- jah@gmail.com");
  process.exit(1);
}

try {
  const auth = getAuth();

  const user = await auth.getUserByEmail(email);

  const currentClaims = user.customClaims ?? {};

  const { admin, ...remainingClaims } = currentClaims;

  await auth.setCustomUserClaims(user.uid, remainingClaims);

  console.log(`Admin access removed from ${user.email}`);
  console.log(`UID: ${user.uid}`);
  console.log("Remaining claims:", remainingClaims);
  console.log("Sign out and sign back in to refresh the Firebase token.");
} catch (error) {
  console.error("Failed to remove admin access:");
  console.error(error);
  process.exit(1);
}
