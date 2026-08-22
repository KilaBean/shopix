# Security Skill

## Required controls
- RLS on Supabase user-owned data
- server-side authorization
- secret keys only on the server
- Zod validation
- Paystack webhook signature validation
- idempotent payment fulfillment
- safe error messages
- secure cookie/session handling through Supabase's recommended SSR setup
- no sensitive data in logs
- no secrets committed to Git

## Threats to consider
- price tampering
- unauthorized order access
- fake payment callbacks
- forged webhooks
- replayed webhooks
- duplicate fulfillment
- IDOR vulnerabilities
- XSS through product/admin content
- insecure admin endpoints

## Review rule
For every mutation ask:
1. Who is allowed to perform it?
2. What input can be manipulated?
3. What data must be reloaded server-side?
4. Can the operation be replayed?
5. What happens if it partially fails?
