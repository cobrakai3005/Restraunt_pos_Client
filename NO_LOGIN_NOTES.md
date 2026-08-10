# No-Login Design Notes

The starter intentionally contains no login or authentication implementation.

## Runtime behaviour

1. `/` redirects to `/playground`.
2. `AppShell` renders immediately.
3. The sidebar and header use static onboarding profile details.
4. No API request is made when the application loads.
5. No tokens, sessions, cookies or local-storage authentication keys are created.

## Integration rule

Do not build a separate login system inside this starter. When a developer is assigned to the actual Vinimay application, use the authentication implementation from the approved production or development repository.
