# AngelCare B2B Marketplace — Admin Real Sync Upgrade

## Delivery lock
This patch makes the Marketplace Admin Studio operationally wired to the public B2B marketplace layer.

## What is now controlled from Admin Studio

- Theme and branding
- Customer-facing logo URL
- Logo width and height
- Logo display mode
- Customer logo max width logic
- Announcement bar enable/disable
- Announcement text
- Announcement CTA label/link
- Announcement colors
- Header layout
- Horizontal menu style
- Sticky quote cart enable/disable
- Homepage sections: title, subtitle, CTA, order, visibility, layout style, settings JSON
- Gateway cards: title, subtitle, slug, icon, tags, CTA, link, badge, accent, order, status
- Categories / areas: titles, descriptions, tags, promise, use cases, source image, source page, layout template
- Products: reference, title, slug, category, set, short/long descriptions, price, price note, tags, best for, school area, event type, format, lead time, source image, source page, personalization, wholesale, min quantity, related trainings/packs
- Academy modules: reference, category, slug, duration, participants, format, price, objectives, source image/page, certificate, e-learning, related products/packs
- Packs: title, objective, price, best for, variants, status
- Navigation: add/remove/reorder header horizontal menu, mobile/footer menus, badges, primary flag, status
- Quote settings: quote page title/subtitle, sales email, required fields, anonymous quote, logo placeholder
- Templates: page template settings JSON
- Media: product media URLs, alt text, order, type

## Sync model

Public marketplace routes now use async repository reads. If Supabase is configured and rows exist, admin-edited rows override the static P0 catalogue seed by key/reference/slug. If Supabase is not configured or tables are empty, the P0 catalogue-authentic static seed remains visible.

This protects the P0 integrity rule while enabling production Admin Studio edits.

## Important production step

Apply the migration:

```bash
npx supabase db push
```

Then open:

```txt
/admin/b2b-marketplace
```

and edit theme, logo, announcement bar, navigation, homepage sections, products, categories, Academy and packs.

## Build rule preserved

No invented products or trainings were added. This patch controls and syncs the front experience; it does not replace the catalogue-authentic P0 data contract.
