# Cart Skill

## State
Use Zustand for client-only cart state.

## Cart item
At minimum:
- productId
- quantity

Do not treat client-stored price as authoritative.

## Rules
- Persist cart locally for convenience.
- Rehydrate safely on the client.
- Validate product availability and current price on the server before checkout.
- Prevent invalid quantities.
- Handle unavailable/deleted products gracefully.
- Calculate display totals in the UI for UX, but recalculate authoritative totals on the server.
