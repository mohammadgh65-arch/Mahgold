# Mahgold — Talasanj provider staging

This branch is isolated from `main`. Nothing in this folder is deployed automatically.

## Read-only credential test

`supabase/functions/mahgold-test-talasanj/index.ts` is a staging-only Edge Function source.

- Reads `TALASANJ_API_KEY` from the Edge Function environment.
- Calls `GET https://talasanj.info/api/v1/prices` using the documented `Authorization: Bearer` scheme.
- Sends the optional `X-Client-Name` and `X-Client-Url` headers for provider identification.
- Validates the 18-karat quote, Toman unit, provider timestamp (maximum age five minutes), and market-open flag.
- Returns sanitized diagnostics only.
- Does not write to `market_quotes`, `store_settings`, orders, or any database table.

## Before any production integration

1. Confirm the test function can authenticate with the stored `TALASANJ_API_KEY`.
2. Add the required visible attribution link `قیمت‌ها از طلاسنج` to every site view that displays provider prices.
3. Review the existing pricing UI and its deployment path. The current repository `index.html` is approximately 6 MB; the GitHub file connector did not return its contents, so no UI edit has been attempted.
4. Implement and verify the production adapter in a separate reviewable change. Keep the existing order pricing and checkout validation unchanged.
5. Only after explicit approval, deploy the provider switch and verify it against the live database.

## Important

Do not deploy this test function or switch the live quote source until the attribution requirement is visibly satisfied and a successful authenticated dry-run has been observed. Never commit the API key to Git.
