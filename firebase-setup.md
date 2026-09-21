# Firebase setup for Hireflow

The app uses the Firebase web configuration in `lib/firebase.ts` and silently signs users in with Firebase Anonymous Authentication. There is intentionally no login screen in the current prototype.

For Vercel, copy `.env.example` to `.env.local` and set the `NEXT_PUBLIC_FIREBASE_*` values there. The web configuration is safe to use in browser code; Firestore and Storage security rules are what protect the data.

Before using real candidate data:

1. In Firebase Console, enable **Firestore Database**.
2. In **Authentication → Sign-in method**, enable **Anonymous**.
3. In **Storage**, create the default bucket.
4. Apply `firestore.rules` and `storage.rules` from this project.

On the first successful connection, the app creates these collections:

- `jobs` — job positions and job settings
- `candidates` — canonical candidate profiles
- `applications` — the candidate-to-job relationship, including stage, source, review state, and job-specific notes

The initial empty project is seeded with the realistic demo workspace. After that, edits in the app are written to Firestore and uploaded CVs are stored under `cvs/{candidateId}/{fileName}`.

Run the Next.js app locally with `npm install` followed by `npm run dev`.

The current anonymous-auth rules are suitable for prototyping only. Before putting confidential CVs into production, add a real workspace sign-in flow and scope Firestore and Storage rules to authenticated workspace members.
