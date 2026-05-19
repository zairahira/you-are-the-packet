# You Are the Packet

An educational browser game teaching networking fundamentals through interactive gameplay. Navigate as a network packet through 22 levels covering routing, firewalls, DNS, TCP, TLS, and more.

Built with vanilla JS + Vite. No framework.

## Getting started

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # build to dist/
npm run preview  # serve dist/ locally
```

## Testing

```bash
node --test src/systems/__tests__/routing-engine.test.js
```

## Dev tips

### Unlock all levels

Paste in the browser console to bypass level locks:

```js
const p = {}; for (let i = 1; i <= 22; i++) p[i] = true; localStorage.setItem('yatp_progress', JSON.stringify(p)); location.reload();
```

To reset progress back to locked:

```js
localStorage.removeItem('yatp_progress'); location.reload();
```

Progress is stored in `localStorage` under the key `yatp_progress`.

### View the landing page again

The landing page is skipped once it has been seen or any progress exists. To force it to show again:

```js
localStorage.removeItem('yatp_seen_intro'); location.reload();
```
