# COE form backend — Mac mini + Cloudflare Tunnel

This runs the contact/newsletter backend on your **Mac mini** and exposes it to the
internet over HTTPS via a **Cloudflare Tunnel**, while the website itself is hosted on
**Hostinger**.

```
Visitor ─▶ https://yourdomain.com        (static site on Hostinger)
                │  fetch()
                ▼
          https://api.yourdomain.com      (Cloudflare Tunnel, HTTPS for free)
                │
                ▼
          Mac mini: node server.js  →  localhost:8787
```

---

## Part A — Backend on the Mac mini

1. **Install Node** (once):
   ```sh
   brew install node          # if you don't have Homebrew: https://brew.sh
   ```
2. **Install deps & configure:**
   ```sh
   cd "server"
   npm install
   cp .env.example .env
   # edit .env — set ALLOWED_ORIGINS to your real domain, and SMTP if you want emails
   ```
3. **Run it:**
   ```sh
   npm start
   # -> COE contact backend listening on http://localhost:8787
   ```
4. **Test locally** (new terminal):
   ```sh
   curl localhost:8787/health        # {"ok":true}
   ```

Every submission is appended to `server/submissions.jsonl` (so nothing is lost even if
email fails). If you fill the SMTP block in `.env`, it also emails `MAIL_TO`.

---

## Part B — Expose it with Cloudflare Tunnel

> Requirement: your domain's DNS must be managed by Cloudflare. It's free — add the
> domain at dash.cloudflare.com and change the nameservers at your registrar. Your
> Hostinger **site keeps working**; only DNS moves to Cloudflare. (Then point an A record
> for `@`/`www` at your Hostinger IP, found in hPanel.)

1. **Install the tunnel agent:**
   ```sh
   brew install cloudflared
   ```
2. **Log in & create the tunnel:**
   ```sh
   cloudflared tunnel login          # opens browser, pick your domain
   cloudflared tunnel create coe-api
   ```
3. **Route a subdomain to it:**
   ```sh
   cloudflared tunnel route dns coe-api api.yourdomain.com
   ```
4. **Create `~/.cloudflared/config.yml`:**
   ```yaml
   tunnel: coe-api
   credentials-file: /Users/YOURNAME/.cloudflared/<TUNNEL-ID>.json
   ingress:
     - hostname: api.yourdomain.com
       service: http://localhost:8787
     - service: http_status:404
   ```
5. **Run the tunnel:**
   ```sh
   cloudflared tunnel run coe-api
   ```
6. **Test from anywhere:** `https://api.yourdomain.com/health` → `{"ok":true}`

---

## Part C — Keep both running 24/7

So they survive reboots and don't need a terminal open:

- **Tunnel as a service:**
  ```sh
  sudo cloudflared service install
  ```
- **Backend as a service** — easiest is `pm2`:
  ```sh
  npm install -g pm2
  pm2 start server.js --name coe-api
  pm2 save
  pm2 startup            # run the command it prints
  ```
- In **System Settings → Energy**, set the Mac mini to **never sleep** and
  **"Start up automatically after a power failure."**

---

## Part D — Point the website at the backend

In `script.js`, set:
```js
const API_BASE = 'https://api.yourdomain.com';
```
and in `.env` set `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`.

If `API_BASE` is unreachable, the form automatically falls back to opening the visitor's
mail client — so it never appears broken during setup.

---

## Part E — Upload the site to Hostinger

The site is plain static files, so:
- **hPanel → File Manager → `public_html`** → upload everything *except* the `server/`
  folder (that runs on the Mac mini, not Hostinger). Or use FTP (FileZilla) / Git deploy.
- Make sure `index.html` sits directly inside `public_html`.
- Hostinger serves it over HTTPS automatically once the domain/SSL is active.
</content>
