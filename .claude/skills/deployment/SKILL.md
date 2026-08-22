# Deployment Skill

## Target
- Next.js application → Vercel
- Supabase → hosted database/auth/storage
- Paystack → test mode during development, live mode only after the integration is verified

## Environment variables
Separate development/test/production configuration.

Example categories:
- Supabase URL
- Supabase publishable key
- Supabase server secret where required
- Paystack secret key
- Paystack public key where required
- application URL

## Deployment checklist
- production build passes
- environment variables configured
- Supabase RLS enabled
- Paystack webhook URL configured
- webhook signature verification enabled
- test transaction completed
- duplicate webhook tested
- error monitoring/logging reviewed
