# DA Scholarship Prep Club — website

A static site: home page, resource library, blog, and a deadlines board, plus a working newsletter/reminder signup backed by a free Google Apps Script (no paid service, no server to maintain).

## What's in here

```
index.html          Home page — hero, live "next deadlines" board, signup
resources.html       Resource library, organized by category
blog.html            Blog index
blog/*.html          Five blog posts
deadlines.html       Full deadline board + signup
styles.css           All styling
script.js            Nav, countdown logic, form handling, resource filter
apps-script/Code.gs  Backend: saves signups, emails confirmations + reminders
```

## 1. Put it online

Any static host works. Two easy free options:

- **GitHub Pages**: create a repo, upload these files, turn on Pages in the repo settings, done.
- **Netlify**: drag the folder onto app.netlify.com/drop.

## 2. Wire up real signups and reminder emails (free, ~10 minutes)

This uses Google Apps Script, which runs on your Google account and can send real email — no third-party email service or credit card needed.

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet. Name it something like "DA Prep Club Subscribers."
2. In the sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code in the editor and paste in the contents of `apps-script/Code.gs` from this folder.
4. Click **Deploy → New deployment**. Click the gear icon next to "Select type" and choose **Web app**.
   - Description: anything.
   - Execute as: **Me**.
   - Who has access: **Anyone**.
5. Click **Deploy**. The first time, Google will ask you to authorize the script — click through the "unverified app" warning (this is expected for your own scripts) and allow it.
6. Copy the **Web app URL** it gives you.
7. Open `script.js` in this folder and paste that URL into this line near the top:
   ```js
   const SIGNUP_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```
8. Re-upload `script.js` to your host (or just push the change to GitHub — Pages updates automatically).

Test it: submit the form on your live site, then check the Google Sheet for a new row and check your inbox for the confirmation email.

## 3. Turn on automatic deadline reminders

Right now, `sendReminders()` in the script exists but won't run on its own — it needs a schedule:

1. Back in the Apps Script editor (Extensions → Apps Script from the sheet), click the clock icon on the left (**Triggers**).
2. Click **+ Add Trigger**.
3. Set: function = `sendReminders`, event source = **Time-driven**, type = **Day timer**, time = whatever hour you want emails to go out (e.g. 8am–9am).
4. Save.

Every day at that time, it checks the deadline list and emails anyone with reminders turned on if a deadline is 7 days or 1 day out. No further action needed.

## 4. Updating deadlines

Deadlines live in two places that need to match:

- `script.js` — the `DEADLINES` array near the top (controls what shows on the site).
- `apps-script/Code.gs` — the `DEADLINES` array near the top (controls reminder emails).

Add, remove, or change dates in both, using `YYYY-MM-DD` format. Re-upload `script.js` to your host and re-paste `Code.gs` into the Apps Script editor (then **Deploy → Manage deployments → Edit → Deploy** to push the update live).

## 5. Updating resources and blog posts

- **Resources**: each category in `resources.html` is a `<details class="resource-category" data-category="...">` block. Copy an existing `<li>` inside it to add a link.
- **Blog posts**: copy any file in `blog/` as a starting template, then add a matching card to `blog.html`.

## Notes

- The confirmation email in `Code.gs` has a placeholder `[YOUR SITE URL]` — replace it with your real site URL once it's live.
- If you'd rather use a different email tool (Mailchimp, Buttondown, etc.) instead of Apps Script, the signup form already posts a clean JSON payload (`name`, `email`, `interests`, `wantsDeadlineReminders`) — you'd just point `SIGNUP_ENDPOINT` at that service's API instead and drop the Apps Script piece.
