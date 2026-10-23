# OpenSparkcode account UI prototype

This is a frontend-only simulation. No account backend is required.

## Demo interactions

- Guest mode requires no login and continues using local browser storage.
- "Sign in (demo)" accepts an example email and a throwaway demo value. The password is only used to enable the UI transition, then it is cleared; it is never saved or submitted.
- "Continue with GitHub (demo)" skips real GitHub OAuth and changes the UI to a simulated GitHub account.
- "Demo sync" shows the syncing and completion states. No network request occurs and no remote copy is made.
- Desktop and Phone controls share the same page state and same browser storage within this preview, so the signed-in demo state can follow the device-view toggle. A separate real device or separate browser will not receive sessions.

## Safety/accuracy

The demo is not real authentication, cloud storage, device pairing, or agent execution. Do not enter a real password. The code does not depend on Supabase or any other backend. For a future live product, build and security-review authentication and sync as a separate phase; that is not needed to review the prototype UX.
