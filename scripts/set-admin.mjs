import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({
  credential: applicationDefault(),
});

const email = process.argv[2];

if (!email) {
  console.error("Please provide an email address.");
  console.error("Example: node scripts/set-admin.mjs jah@gmail.com");
  process.exit(1);
}

try {
  const auth = getAuth();

  const user = await auth.getUserByEmail(email);

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    admin: true,
  });

  const updatedUser = await auth.getUser(user.uid);

  console.log(`Admin access granted to ${updatedUser.email}`);
  console.log(`UID: ${updatedUser.uid}`);
  console.log("Claims:", updatedUser.customClaims);
  console.log("Sign out of the website and sign back in.");
} catch (error) {
  console.error("Failed to grant admin access:");
  console.error(error);
  process.exit(1);
}
