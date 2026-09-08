/**
 * DA Scholarship Prep Club — signup + reminder backend
 *
 * What this does:
 *  1. doPost()      — receives signups from the website form, adds the
 *                      person to a "Subscribers" sheet, sends a confirmation email.
 *  2. sendReminders — run daily on a time-driven trigger. Emails anyone who
 *                      opted into reminders about deadlines that are exactly
 *                      7 days or 1 day away.
 *
 * Setup steps are in the site's README.md.
 */

const SHEET_NAME = "Subscribers";
const CLUB_NAME = "DA Scholarship Prep Club";
const FROM_NAME = "DA Scholarship Prep Club";

// Keep this in sync with the DEADLINES array in script.js on the website.
const DEADLINES = [
  { name: "QuestBridge National College Match", date: "2026-09-26" },
  { name: "FAFSA opens for 2027–28 aid year", date: "2026-10-01" },
  { name: "Coca-Cola Scholars Program", date: "2026-10-31" },
  { name: "Elks National Foundation \"Most Valuable Student\"", date: "2026-11-01" },
  { name: "Rotary Club Local Scholarship", date: "2026-11-15" },
  { name: "Gates Scholarship", date: "2026-11-15" },
  { name: "Davidson Fellows Scholarship", date: "2027-02-12" },
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Email", "Interests", "Wants Reminders"]);
  }
  return sheet;
}

/** Handles the POST from the website's signup form. */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const email = (data.email || "").trim();

    if (!email || email.indexOf("@") === -1) {
      return jsonResponse_({ result: "error", message: "Invalid email." });
    }

    const sheet = getSheet_();

    // Skip duplicates — update their preferences instead of adding a new row.
    const existingRow = findRowByEmail_(sheet, email);
    const rowValues = [
      new Date(),
      data.name || "",
      email,
      data.interests || "",
      data.wantsDeadlineReminders ? "yes" : "no",
    ];

    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    sendConfirmationEmail_(data.name, email);

    return jsonResponse_({ result: "success" });
  } catch (err) {
    return jsonResponse_({ result: "error", message: err.message });
  }
}

function findRowByEmail_(sheet, email) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][2]).toLowerCase() === email.toLowerCase()) return i + 1;
  }
  return null;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function sendConfirmationEmail_(name, email) {
  const greeting = name ? "Hey " + name.split(" ")[0] + "," : "Hey,";
  const subject = "You're signed up — " + CLUB_NAME;
  const body =
    greeting +
    "\n\n" +
    "You're on the list for " + CLUB_NAME + " updates. You'll get an email when new resources are added, " +
    "plus reminders 7 days and 1 day before any tracked scholarship deadline.\n\n" +
    "Browse everything here: [YOUR SITE URL]/resources.html\n\n" +
    "— " + CLUB_NAME;

  MailApp.sendEmail({ to: email, subject: subject, body: body, name: FROM_NAME });
}

/**
 * Run this daily on a time-driven trigger (see README).
 * Emails everyone who opted into reminders about deadlines that are
 * exactly 7 days or 1 day away.
 */
function sendReminders() {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const subscribers = [];
  for (let i = 1; i < rows.length; i++) {
    const [, name, email, , wantsReminders] = rows[i];
    if (email && String(wantsReminders).toLowerCase() === "yes") {
      subscribers.push({ name: name, email: email });
    }
  }
  if (subscribers.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  DEADLINES.forEach((d) => {
    const target = new Date(d.date + "T00:00:00");
    const daysLeft = Math.round((target - today) / 86400000);

    if (daysLeft === 7 || daysLeft === 1) {
      const when = daysLeft === 1 ? "tomorrow" : "in 7 days";
      subscribers.forEach((sub) => {
        const greeting = sub.name ? "Hey " + String(sub.name).split(" ")[0] + "," : "Hey,";
        const subject = "Reminder: " + d.name + " is due " + when;
        const body =
          greeting +
          "\n\n" +
          '"' + d.name + '" is due ' + when + " (" + d.date + ").\n\n" +
          "— " + CLUB_NAME;
        MailApp.sendEmail({ to: sub.email, subject: subject, body: body, name: FROM_NAME });
      });
    }
  });
}
