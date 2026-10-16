# JAMFLEX — local copy

The whole site is in this folder: `C:\Users\kevin\Documents\jamflex-site`

No `npm install`, no dependencies, no build tool. Front-end is plain ES modules, the
service is one HTTP handler that runs on Node here and on Deno when published.

## Run it

Double-click **`run.cmd`**, then open <http://127.0.0.1:4321>.

Or from a terminal:

```
cd C:\Users\kevin\Documents\jamflex-site
run.cmd
```

`run.cmd` uses `node` if it is installed, otherwise the Node that ships inside Qoder.
It runs the build first, so `dist/` can never be stale — edit, save, refresh the browser.

| Want | Do |
| --- | --- |
| Watch from a phone or TV on your wifi | double-click `allow-phone.cmd` once, then `server\make-phone-cert.cmd` once, then `run-tv.cmd` and open the `https://172.x.x.x:4321` address it prints |
| A different port | set `PORT=4330` before starting |
| Check the modules parse without serving | `node build.mjs` |
| A fake media server to test wiring | `node server\fake-jellyfin.mjs`, then add `http://127.0.0.1:4599` with key `testkey` on the Library page |

If `run.cmd` says the port is in use, something else is already on 4321 (a previous window left
open, or the Qoder preview when it was running). Close that window, or start yours with
`set PORT=4330` first.

## Getting it onto your phone

Four things have to line up:

1. **The server must listen on the wifi, not just this PC** — that is `run-tv.cmd`
   (`HOST=0.0.0.0`). `run.cmd` deliberately keeps the site to this machine.
2. **Windows must stop blocking the incoming connection.** It blocks it by default, and only an
   administrator can allow it, so double-click `allow-phone.cmd` and approve the UAC prompt once.
   Without this the phone just spins, however correct the address is.
3. **It has to be https, or the phone gives up.** Safari and Chrome try https before http, so a
   plain-http preview on the wifi shows "this site can't provide a secure connection" /
   `ERR_SSL_PROTOCOL_ERROR` even when everything else is correct. Double-click
   `server\make-phone-cert.cmd` once — it makes a self-signed certificate in `server\certs` and
   `run-tv.cmd` starts using https automatically. Re-run it whenever you join a new wifi or
   hotspot, because it bakes in the addresses of the network you are on. The phone then shows a
   one-time warning since only your computer trusts that certificate: on iPhone "Show All
   Details" → "visit this website", on Android "Advanced" → "Proceed". That warning is expected,
   not a fault.
4. **The address changes with the network.** Read it from the line the window prints (it also
   writes `jamflex-phone-link.txt` in this folder so you can copy it). A home router gives
   `192.168.x.x`, a phone hotspot gives `172.20.10.x`; both are fine. Type the whole line into
   the phone, `https://` at the front and `:4321` at the end.

Your phone has to reach the same network the PC is on. A hotspot the phone itself is running
counts (the phone is the router), but a *Guest* wifi network usually blocks devices talking to
each other — if it won't load on the correct address, that is the most common reason.

## Who else can use it, and when

Right now: **anyone on the same wifi or hotspot as this PC, while this PC is running.**
A friend on their own data, at their own house, or any time the PC is switched off cannot reach
it — there is no internet address for it, and nothing is running.

To get past that, the site has to live on an always-on computer with a real web address instead
of on this PC. Two ways:

- **Publish it.** That is what [`deploy\cloudflare\SETUP.md`](deploy/cloudflare/SETUP.md) is for:
  the pages go on Cloudflare Pages and the small TMDb service goes on a Cloudflare Worker, both
  free, both set up by pasting and dragging in a browser — no Node, no npm, nothing to install on
  this PC. Your key stays inside the Worker, which is exactly why the split exists. (Qoder Sites
  would do the same job in one step, but the current plan is static-files-only, so its function
  cannot be published.)
- **Tailscale** on the phone and this PC builds a private network between them, so a friend can
  be invited without a firewall rule or port forwarding — but this PC still has to be awake.

One thing publishing does *not* fix: a hosted site can't see media servers inside your house,
and nothing on the internet can play files you have not put on a server yourself. On a hosted
site the play buttons go to the free legal streams, and your Library only works while you are on
the same network as this PC.


## Edit it

| Folder | What lives there |
| --- | --- |
| `app/index.html`, `app/styles.css` | page shell and every style rule |
| `app/js/main.js`, `app/js/router.js` | startup and the routes (`/`, `/discover`, `/free`, `/library`, `/title/…`) |
| `app/js/views/` | one file per page |
| `app/js/ui/` | cards, rows, header/footer, trailer modal, stream modal |
| `app/js/lib/` | `api.js` (calls to the service), `library.js` (your servers, in localStorage), `store.js` (region + My List), `dom.js` (the `h()` helper and icons) |
| `functions/handler.ts` | every server action, routed by `?a=` |
| `functions/tmdb.ts` | TMDb client, cache, throttling |
| `functions/library.ts` | Jellyfin / Emby / Plex adapters and the play-ticket proxy |
| `server/dev.mjs` | this preview server |

To add a page: create `app/js/views/thing.js` exporting a function that returns a node,
then `route("/thing", ThingView)` in `app/js/main.js` and a link in `app/js/ui/shell.js`.
To add data: put an action in `functions/handler.ts` and call it with `call("myAction", { … })`.

## The React files you dropped in

`stream-modal.tsx` and `title.tsx` sit at the root of this folder as reference only — they are
not imported and the build ignores them (the copies that had been placed inside `app/` were
removed, because `app/` is copied verbatim into `dist/`).

What they do has been converted to plain JavaScript and merged:

- The Season/Episode chevron stepper + its grouped box is now `episodePicker()` in
  `app/js/views/title.js`, styled by `.title-picker` in `app/styles.css`.
- The modal header, close button and 16:9 stage already existed in `app/js/ui/stream-modal.js`,
  including the "Playing Season 2 · Episode 3" line, so nothing was added there.

One thing was deliberately **not** ported: `stream-modal.tsx` builds its player from a
`vidsrc.sh` iframe. That is an unlicensed embed host, it is against this project's own rules,
and it would break on every modern browser's third-party-cookie and CSP checks. The stepper
therefore plays through your connected Jellyfin/Emby/Plex server instead — same clicks, your
files. If you want a "just press play and it works" experience without your own server, say so
and I'll wire the button to the licensed free services the where-to-watch panel already finds.

## Your TMDb key

`.env.local` holds `TMDB_API_KEY`, read at start-up by `server/dev.mjs`. It is gitignored —
the key never reaches the browser, and every catalogue call goes through the function.
Without it the site still runs and says the catalogue service isn't configured.

## Playback from your own server

The Library page stores your Jellyfin/Emby/Plex address and key **in this browser only**
(localStorage). Each library call sends them to the function for that one request; nothing
is stored on the site. Resume positions are device-local too. Delete the browser data and
the connection is gone.

Streaming is through the function because those servers don't answer cross-origin requests.
`?a=stream&t=…` serves only a ticket the function issued itself, only for an address on a
server you named, for 30 minutes.

Loopback (`run.cmd`) and LAN (`run-tv.cmd`) both reach your home servers fine. A **published**
site runs outside your house and cannot see `192.168.x.x` — publishing needs the server behind
a public HTTPS address (Tailscale Funnel, Cloudflare Tunnel), and an HTTPS page needs the
media server on HTTPS too.

## Keeping this copy and the published copy in step

This folder is yours to edit. When you want the changes published, say so — the publish path
runs from the Qoder session copy, so your edits get synced there first, then built and
prepared as a Site. Publishing is still deliberately not done.

## Git

This folder has no repository yet. To start one:

```
cd C:\Users\kevin\Documents\jamflex-site
git init
git add -A
git commit -m "JAMFLEX local copy"
```

`.gitignore` already keeps `dist/`, `node_modules/` and `.env.local` out.

Data sources: titles, art and availability come from TMDB and JustWatch. This product uses
the TMDB API but is not endorsed or certified by TMDB. Full-length video comes only from a
media server you connect; JAMFLEX hosts none.
