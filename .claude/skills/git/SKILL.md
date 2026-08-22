# Git & Delivery Skill

## Branching
For a solo portfolio project:
- `main` = stable
- short-lived feature branches when useful

## Commit style
Prefer clear commits such as:
- `feat: add product catalog`
- `feat: integrate Paystack checkout`
- `fix: make webhook processing idempotent`
- `test: add checkout e2e flow`

## Before pushing
Run:
- typecheck
- lint
- tests
- production build

Never commit:
- `.env.local`
- Paystack secret keys
- Supabase service-role keys
- credentials
- private test data
