# Admin Access Setup

The application uses a Firebase Authentication custom claim (`admin: true`) rather than a hard-coded administrator email.

## Git Bash on Windows

1. Download a Firebase Admin service-account JSON key from Firebase Console → Project settings → Service accounts.
2. Keep the file outside this repository.
3. In Git Bash:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/c/Users/YOUR_USER/Downloads/your-firebase-adminsdk.json"
```

4. Confirm the path:

```bash
ls "$GOOGLE_APPLICATION_CREDENTIALS"
```

5. Grant administrator access to an existing Firebase Authentication account:

```bash
npm run admin:grant -- admin@example.com
```

6. Log out of the web application and log back in so Firebase issues a fresh ID token.

The account will then see **Admin Panel** and may access `/admin/products`.

Never commit the service-account JSON file.
