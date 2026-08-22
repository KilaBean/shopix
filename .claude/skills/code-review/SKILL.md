# Code Review Skill

Before considering a feature complete, review:

### Correctness
- Does it work for the happy path?
- Are edge cases handled?
- Are loading/error/empty states present?

### Security
- Can the client manipulate price, ownership, or payment status?
- Is authorization enforced server-side?
- Are secrets protected?
- Are webhooks authenticated?

### Data integrity
- Are database constraints appropriate?
- Are operations idempotent?
- Could duplicate requests create duplicate orders/payments?

### Maintainability
- Is business logic duplicated?
- Are types clear?
- Is the implementation simpler than necessary?

### Portfolio quality
- Does the feature demonstrate a real engineering decision?
- Is the README/documentation clear?
- Are tests present for important behavior?
