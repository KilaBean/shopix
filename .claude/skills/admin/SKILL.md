# Admin Skill

## MVP admin features
- dashboard summary
- product CRUD
- category management
- stock/availability
- order list
- order detail
- order status management

## Authorization
Admin authorization must be enforced server-side and at the data layer where appropriate.

## Product editing
Validate:
- name
- slug
- description
- price
- stock
- category
- active status
- images

Never let an admin UI alone determine whether a request is authorized.
