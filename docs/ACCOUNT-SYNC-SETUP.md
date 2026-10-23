# OpenSparkcode account sync setup

## Behavior

- Guest mode requires no account. Sessions continue to use this browser's local storage and are not uploaded.
- Signed-in mode syncs session history and non-secret model/provider preferences between devices signed into the same account.
- There is no app-imposed session or device count limit. Actual capacity and request limits still depend on the selected database plan and provider.
- The sync layer never uploads API keys, OAuth tokens, VPS credentials, or custom endpoint URLs.
- Agent execution and remote connections remain separate product features; signing in does not make the current prototype agents real.

## Backend setup

1. Create a dedicated OpenSparkcode Supabase project. Do not reuse the GrowthSpace CRM project.
2. Run the SQL migration at supabase/migrations/202610230001_opensparkcode_account_sync.sql in that project's SQL editor, or through your normal migration workflow.
3. In Authentication settings, enable email/password sign-in. If email confirmation is enabled, configure a real SMTP sender before relying on sign-up confirmations.
4. Optional: enable GitHub as an auth provider. Register an OAuth app with the app's URL and the Supabase callback URL shown in Authentication > Providers, then allow the exact app URL under Auth redirect URLs.
5. Edit app/auth-config.js with the project URL and the project's publishable key (or legacy anon key). Never put a service-role/secret key in this file.
6. Add the exact OpenSparkcode app URL to the Supabase Auth redirect allow list. Deploy the app preview from the app directory.
7. Test in two separate browsers/devices: sign up/sign in, create a session on one device, wait for sync, sign in on the second device, and verify the same session appears. Also verify that signing out stops network sync while guest mode still works.

## Security notes

Both tables have row-level security enabled. Authenticated users can read/write only rows whose user_id equals their Supabase Auth user id; anonymous access is revoked. Never disable these policies as a shortcut. A public browser key is expected in client code; a service-role key is never safe in a browser.

## Limits and product caveats

"Unlimited" here means no arbitrary app-level cap on number of devices or sessions. It is not a promise of infinite storage: database quotas, request sizes, bandwidth, and provider policies still apply. The preview agent and GitHub/VPS interactions remain simulated until their separate integrations are built.
