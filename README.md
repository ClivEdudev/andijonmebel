# Robiya mebellari — website

Furniture store website for Robiya mebellari, Andijan (Plus Code 8JGJQ73M+GF).
Zero-dependency static site written in TypeScript, in Uzbek, Russian and English.

## What it does
- Scroll-driven hero: an empty room furnishes itself, then shows the room's total and "add this whole room".
- Category rail (pinned horizontal scroll), catalogue with filters, search, sorting and live colour swatches.
- Cart (saved in the browser), dowry ("kelin sepi") bundles, 3-step checkout with delivery zones, date (dd/mm/yyyy), assembly and payment choice.
- **Room studio** (header button, homepage section, "Try in a room" on every product and dowry set): a real-scale room where customers set the room width, walls, floor, window and day/evening light, drag furniture in, recolour, flip, duplicate, see distances to the walls in centimetres, undo/redo, share the room as a link, save a branded picture, and add everything to the cart in one tap. Code: `src/studio.ts`.
- Light and dark themes (follows the phone/computer setting until the visitor picks one; the hero room turns into an evening scene).
- Navbar links glide to sections with the scroll animations paused, so nothing replays on the way.
- Orders are sent to **Netlify Forms** (form name `order`). Nothing is charged online; the manager calls to confirm.

## Edit content
- Products, prices, colours, delivery fees, store phone: `src/data.ts` (prices are samples — replace with the store's real ones).
- Texts in all three languages: `src/i18n.ts`.
- Illustrations: `src/art.ts` (placeholders until real product photos are available).

## Build and deploy
```
npm run build      # needs the TypeScript compiler (tsc)
```
Netlify publishes the `dist` folder as-is (see `netlify.toml`, which also sets the security headers: CSP, HSTS, no framing). Form detection must be enabled on the Netlify site (it is on for `robiyamebel`).
New orders appear in Netlify → Forms → order; add an email notification there so the store gets each order.
