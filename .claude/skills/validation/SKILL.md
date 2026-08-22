# Validation Skill

Use Zod at all important external boundaries.

## Validate
- registration/login inputs
- product create/update forms
- search/filter query parameters
- cart checkout payload
- shipping/contact information
- payment initialization input
- webhook payload shape where practical

## Principle
TypeScript types protect code you control. Zod protects application boundaries you do not control.

Never use client-side validation as the only validation layer.
