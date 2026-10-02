# The Domain Goblin

**Old domains. Fresh mischief. Bring your own key.**

A colourful local domain-research console powered by the [Easy Expired Domains (EED) API](https://easyexpireddomains.com). Search live inventory, inspect metrics, compare listings, save a shortlist with notes, and export useful reports from your own computer.

This is the companion project for the **[SEOdev YouTube channel](https://www.youtube.com/@SEOdev)**. It starts with an SEO-focused workflow: expiring domains aged at least five years, Trust Flow of 15 or more, and .com, .co.uk or .net names. You can edit the recipes to suit your own research.

**Watch the walkthrough:** video coming soon. The link will be added here when the SEOdev video is published.
<!-- Replace the previous line with: **Watch the walkthrough:** [Build and use The Domain Goblin](YOUR_VIDEO_URL) -->

## What it does

- Three editable starting searches: **SEO sorcery**, **Backlink buffet** and **Domain dungeon**.
- Live searches using your own EED key, with TF, DA, EED Quality Score, age, listing price and source-event times.
- Loaded-result sorting and clearly labelled local refinements, with manual pagination and usage information.
- A browser-saved shortlist, notes, historical snapshots, and JSON backup/restore.
- CSV, domain-only text and JSON exports, plus printable/PDF and offline HTML shortlist reports.
- A bright goblin-themed interface that works in a normal modern browser on Windows, macOS and Linux.

The app uses plain HTML/CSS/JavaScript, Node's built-in HTTP server and fetch, and **zero third-party runtime dependencies**. No `npm install` or build step is needed. Live searches require internet access and your own eligible EED API access; obtain/check that through [EED API access](https://easyexpireddomains.com/api-access). Each successful search page consumes your API allowance. Your key is entered inside the app and kept in session memory.

## Download and run

On this repository's GitHub page, click **Code → Download ZIP**, then extract the ZIP. Open the extracted folder containing `server.mjs` and `Start Goblin.cmd`.

Install [Node.js LTS](https://nodejs.org/en/download), then on Windows double-click **Start Goblin.cmd**. Alternatively, open a terminal in the extracted folder and run:

```sh
node server.mjs
```

Open **http://127.0.0.1:8787**, enter your key, click **Connect**, choose a recipe, and click **Search / Refresh**. Press **Ctrl+C** in the terminal to stop the server. The detailed Windows instructions follow below.

GitHub holds the source and documentation. Run the app on your computer; its Node server is required for live API searches.

## Start on Windows

1. Install the current **Node.js LTS** from [nodejs.org](https://nodejs.org/en/download). Node 24 LTS or newer is the runtime requirement.
2. Open this app folder in File Explorer. Click the address bar, type `powershell`, and press Enter. This opens a terminal in the correct folder, including when the path contains spaces.
3. Type:

   ```powershell
   node server.mjs
   ```

4. Open **http://127.0.0.1:8787** in a modern browser. Use exactly the printed address, rather than localhost.
5. Enter your own EED API key in the masked input and click **Connect**. Obtain/check your key through [EED API access](https://easyexpireddomains.com/api-access). Internet access is required for live searches. Connect records the key in session memory; only a successful authenticated Search confirms access. No hidden test search runs.
6. Choose a recipe, edit its rules if needed, and click **Search / Refresh**. Click a domain for details and valid returned provider links. Click **Save** to shortlist it, then open its details to write notes.

Keep the terminal open while using the app. Press **Ctrl+C** there to stop the server. Run `node server.mjs` again to restart. Reopening/reloading the browser requires entering the key again; saved work remains.

Optional Windows convenience: double-click `Start Goblin.cmd` after Node is installed. It starts the same server and leaves its terminal visible. Open the printed address yourself.

On macOS/Linux, open Terminal in the folder (or use `cd "/path/to/Console App"`) and run the same `node server.mjs` command. Ctrl+C stops it.

If port 8787 is busy, stop the other copy or choose a new port:

```powershell
$env:PORT = '8788'
node server.mjs
```

On macOS/Linux: `PORT=8788 node server.mjs`. The printed URL changes. Browser storage belongs to that origin, so a different port has separate saved work; use backup/restore to transfer it.

## Your personalised recipes

| Recipe | API keyword | Shared API rules | Ordering |
| --- | --- | --- | --- |
| SEO sorcery | `seo` | Expiring; age ≥5; TF ≥15; com/co.uk/net; API name length ≤25; first page 100 | TF descending |
| Backlink buffet | `backlink` | Same | TF descending |
| Domain dungeon | `domain` | Same | TF descending |

Each preset is a separate query, sent only when you click Search. Keyword matching does not establish niche relevance. The contract does not document an OR expression for these three interests, so they are separate searches. You can edit the keyword to explore terms such as `link` or `rank`; each changed search costs another request if successful.

**Full displayed domain length ≤25** is an additional local refinement, including dots and the TLD. This conservatively enforces your limit in addition to the API's name-length filter. It applies only to loaded rows, not the full inventory. The contract names API length as label length but does not specify Unicode/punycode treatment; the console makes no such assumption.

Minimum QS, when selected, is explicitly a **refinement within loaded results**. There is no minimum-QS API parameter in the checked metadata. For high-QS research choose API quality sorting and search again, then refine locally. An empty refined page can have matches on later pages. Digits-only is a local ASCII check of the downloaded name after removing the returned TLD, including multi-part suffixes.

Save edits, rename, duplicate or delete recipes in the sidebar. Reset restores the built-in recipe to its original defaults; for a custom recipe it reloads its last saved rules. Minimum TF/age and other original rules remain editable, as requested. Additional filters are under Advanced spells. Unset filters are omitted and invalid/contradictory combinations are rejected.

## Results, allowance and accuracy

- Search fetches one page. Load next page fetches exactly one additional page from the original successful query. The adjustable page budget defaults to 3. No bulk loading, automatic polling, keystroke searches or endless pagination occurs. Pages stop at the response's `hasMore`, `nextPage`, result window, or budget. Different queries do not mix.
- Every successful search/page, including an empty one, consumes API allowance. Usage, reset time, request ID and supplied rate headers appear below results. No fixed account quota is promised. Local sorting, refinements, details and exports use downloaded data without calls.
- The public access page and OpenAPI specify Agency eligibility. Metadata also publishes a Pro plan configuration; this conflict is recorded, but that entry does not prove your account has access. Check eligibility with EED; the app shows limits from actual authenticated responses.
- API sort changes apply on your next explicit Search from page one. Loaded-row sorting applies only to the current downloaded subset, and rows for the same domain are grouped. Different inventory listings stay separate; repeated records of the same listing across pages merge. Shortlist identity is the normalised domain name.
- Results retain their original filters and fetch timestamp. Editing rules does not relabel old data; failed refreshes keep old rows visible as stale. Load next page always uses the original fetched query even if the form has been edited.
- TF, DA and QS are research metrics. QS is EED's actual supplied value, not an invented score. No score certifies safety, spam status, purchase suitability or profit. A domain appearing here is not guaranteed registrable or currently purchasable.
- Null/missing metrics show an em dash or Unavailable; zero remains zero. Provider auction traffic, appraisal and revenue of zero can mean unavailable; details explain this. Price means the actual returned listing/bid price and currency, not Semrush traffic-value estimates. Event labels depend on source; expiring inventory normally uses expected drop time. Times are preserved as returned UTC and can be displayed in explicitly labelled computer local time.
- New inventory and approaching-drop selections use rolling 24-hour windows. New means EED's new-inventory selection, not proof of registration/listing/drop within that period. Auction windows use UTC. Provider/registrar links use only returned safe HTTP/HTTPS destinations and preserve attribution parameters. A registrar landing page is not a guarantee of registration.

## Shortlist, reports and moving computers

Presets, shortlist notes and historical listing snapshots/timestamps are saved in this browser's local storage. Search results themselves and the API key are not persisted. A restart keeps your shortlist; a new search must explicitly fetch current data. To update a saved snapshot, search, open the domain's details, and click **Replace saved snapshot with these loaded listings**. Saving a domain captures all its currently loaded listings, not just one inventory ID. Removing it from the shortlist also removes its saved notes.

Use the Results/Shortlist tabs to compare rows. Exports offer visible loaded rows, selected loaded rows, or the entire shortlist. CSV protects spreadsheet formulas; JSON includes rules, fetch time, local sort/refinement scope and a partial flag when later pages may exist. Domain text contains unique domain names and also downloads a separate metadata JSON file (allow multiple downloads when your browser asks). None of these actions calls EED. The API's separate server-side text endpoint is not used; invoking it in a future extension would be another live request and consume allowance.

**Print shortlist / PDF** prints a dedicated shortlist report through your browser's print dialog. **Offline shortlist HTML** downloads a self-contained report with notes, important metrics, timestamps and inline styling. It opens without internet and contains no key or live API controls. Your chosen research workflow does not require presentation slides or recording tools. Exported snapshots remain historical.

Use **JSON backup** to move presets, notes and shortlist to another computer/browser. Restore validates the entire file before replacing saved work; it never loads a key. Restore replaces existing saved work, so download a backup first if needed. There is a 10 MB restore limit, 100 presets and 5,000 shortlist domains. For compact, safe backups the stored/restored snapshots preserve the table metrics and links, rather than arbitrary raw API properties. Extended raw metrics are available in live-loaded details.

**Clear saved work** resets recipes and removes shortlist/notes from this browser. Forget key clears only the in-memory key. Browser site-data clearing also deletes saved work. Files you exported remain on your computer until you delete them yourself. No analytics, remote scripts, fonts, images or other third-party assets load.

## Common errors

- **node is not recognised:** install Node LTS, then close and reopen PowerShell.
- **No key / 401:** enter a valid key inside the app, Connect, then Search. Connect itself does not authenticate. Forget key or reload to discard it.
- **403:** check eligible Agency access and the key's allowed IP addresses; your internet IP may have changed. Also use the printed `127.0.0.1` URL.
- **422:** read the field-specific validation message, adjust that rule, then click Search. Filters are not silently discarded.
- **429:** distinguish a temporary request throttle from exhausted daily allowance using the message and response headers. Retry-After is respected; no automatic retries run. For exhausted allowance wait for the reported daily reset rather than repeatedly retrying.
- **Timeout/network/outage:** check connectivity and retry manually later. A timed-out request may have consumed usage. Previous results stay visible as stale.
- **Capability discovery unavailable:** the public metadata refresh failed; the confirmed bundled contract choices are used and clearly labelled. Metadata is cached for an hour instead of fetched on every interaction. Reload later to retry after the cache period.
- **Printing unavailable:** download Offline shortlist HTML, open it, and press Ctrl+P.
- **Saved work missing:** use the same browser/profile and printed port, or Restore your backup.

## Implementation and extending

`server.mjs` binds only to `127.0.0.1`, checks Host/Origin, accepts only same-origin JSON searches and serves a fixed public-asset allowlist. Adjacent source files and traversal routes are not exposed. Sensitive local responses use no-store. It forwards the supplied key only in an Authorization header to the fixed documented EED JSON endpoint. The key is never logged, stored, put in an EED URL/body, or exported. Searches have a 25-second upstream timeout and cannot overlap within this server. No CORS extension or browser security changes are needed.

`adapter.mjs` handles metadata caching, query validation and official API errors separately from the UI. `public/core.mjs` contains pure query, response, refinement, backup and export helpers. `public/presets.mjs` is the small starting-recipe configuration. Add a preset there with a unique ID, purpose, canonical query rules and local refinement. Existing users can duplicate a preset in the UI, or clear saved work after a configuration change to load revised starting defaults. For a new filter, confirm the official contract, add validation in core and a labelled control in app/index. Never send unsupported parameters. For a column, update adapt, rendering and export allowlists together.

Contract checked **2 October 2026**: [access page](https://easyexpireddomains.com/api-access), [runtime metadata v1](https://easyexpireddomains.com/api/v1/meta.php), [OpenAPI 3.1 contract, API 1.0.0](https://easyexpireddomains.com/api/v1/openapi.php). Public copies are included as `eed-meta.json` and `eed-openapi.yaml` for audit and offline confirmed capabilities. Runtime metadata is fetched only server-side; no authenticated development search was made. Current metadata choices/limits are used when available. Do not assume bundled quotas are account entitlements.

This is a local single-user app. Future public hosting requires HTTPS, separate user sessions, appropriate secret isolation, abuse protection and a security review before other people use it. Public hosting is not configured by this build.

## Verification

Run `node --test` (no installation needed). Offline tests check preset queries and validation, contract-shaped response adaptation, pagination stopping, missing versus zero metrics, multi-part digits-only scope, distinct listing preservation, key exclusion/redaction, safe CSV/HTML exports, backup validation, adapter header authentication and error handling with mocked fetch, and the real local server's asset/Host/Origin controls. Fixtures exist only under `test/` and never appear in the app.

Build verification: all 9 checks passed using `node --test --test-isolation=none test/core.test.mjs`. The default runner's subprocess launch was blocked by this build workspace's sandbox (`spawn EPERM`); the single-process run exercises the same checks. Syntax checks also passed for server, adapter and browser modules. No interactive browser test was available in the build environment; use the checklist below.

Manual browser checklist, requiring your key for live steps:

1. Start the server, open the printed URL, check keyboard focus and a narrow window. Before Connect no results should exist.
2. Enter your key and Connect; it should say key entered, not authenticated. Search SEO sorcery. Verify returned usage and authentication status. Repeat backlink/domain only when you choose to spend another request.
3. Change rules without searching: old results must show their original rules. Change local QS/length sorting: no live request should occur. Load one more page and check usage increments and the page budget.
4. Save a domain, write notes, view Shortlist. Reload/restart: key must be gone and saved notes retained. Reconnect and explicitly search/update a snapshot.
5. Export CSV, text + metadata, JSON, printable PDF and offline HTML. Open HTML offline, verify notes/metrics and UTC timestamps. Try backup and restore in a second browser/profile.
6. With a deliberately invalid key, Search should show an actionable error; after a failed refresh old rows must be marked stale. Never share your key in chat.

Authenticated live connection, your account's filter results and the interactive browser workflow cannot be confirmed until you use your real key. No live search was performed during development.

## Publish your own copy on GitHub

You can publish this source through your browser without installing Git:

1. Sign in to GitHub and open [Create a new repository](https://github.com/new).
2. Use **the-domain-goblin** as the repository name. Suggested description: **A colourful local EED API console for SEO domain research, shortlists and reports. Companion project for the SEOdev YouTube channel.**
3. Choose **Public** so viewers can read the README and download the app. Leave the options to add a README, .gitignore and licence unset for this initial upload; the source already includes its README and .gitignore.
4. Click **Create repository**, then use the **uploading an existing file** link (or **Add file → Upload files**).
5. Drag in the source files and the complete `public` and `test` folders, preserving their folder structure. `README.md`, `server.mjs` and the other top-level source files should appear at the repository root. If using the prepared source ZIP, extract it first and upload its contents, rather than the ZIP itself. Upload `.gitignore` too; do not upload personal backups, reports or any key files.
6. Enter **Initial release of The Domain Goblin** as the commit message and click **Commit changes**.
7. In the repository's **About** area, use [SEOdev](https://www.youtube.com/@SEOdev) as the website link. Suggested topics: `seo`, `domains`, `expired-domains`, `eed`, `nodejs`, `domain-research`.
8. When your video is published, edit the walkthrough line near the top of this README to link to it. Then put the GitHub repository URL in your video description.

See GitHub's official guides to [creating a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) and [uploading files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).
