/* ==========================================================================
   DA Scholarship Prep Club — shared behavior
   ========================================================================== */

// >>> SET THIS after you deploy the Google Apps Script web app (see README).
const SIGNUP_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

// ---------- Nav toggle (mobile) ----------
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }
});

// ---------- Deadline board ----------
// Each deadline lives here once. Every page that shows deadlines (home board,
// the full /deadlines page) reads from this same list, so there's one place
// to update dates.
const DEADLINES = [
  {
    name: "QuestBridge National College Match",
    note: "Full applications due — no extensions",
    date: "2026-09-26",
  },
  {
    name: "FAFSA opens for 2027–28 aid year",
    note: "File early — many state and school aid deadlines are first-come",
    date: "2026-10-01",
  },
  {
    name: "Coca-Cola Scholars Program",
    note: "Online application, two short essays",
    date: "2026-10-31",
  },
  {
    name: "Elks National Foundation \"Most Valuable Student\"",
    note: "Apply through your local Elks lodge",
    date: "2026-11-01",
  },
  {
    name: "Rotary Club Local Scholarship",
    note: "Nominate through your school counselor first",
    date: "2026-11-15",
  },
  {
    name: "Gates Scholarship",
    note: "Nomination + application, nine short-answer prompts",
    date: "2026-11-15",
  },
  {
    name: "Davidson Fellows Scholarship",
    note: "Requires a completed significant project",
    date: "2027-02-12",
  },
];

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target - today) / 86400000);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function countdownLabel(days) {
  if (days < 0) return { text: "closed", cls: "past" };
  if (days === 0) return { text: "due today", cls: "soon" };
  if (days === 1) return { text: "1 day left", cls: "soon" };
  if (days <= 14) return { text: days + " days left", cls: "soon" };
  return { text: days + " days left", cls: "ok" };
}

function renderBoard(el, { limit = null, hidePast = true } = {}) {
  if (!el) return;
  let list = [...DEADLINES].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (hidePast) list = list.filter((d) => daysUntil(d.date) >= 0);
  if (limit) list = list.slice(0, limit);

  el.innerHTML = list
    .map((d) => {
      const days = daysUntil(d.date);
      const cd = countdownLabel(days);
      return `
        <div class="board-row">
          <div class="board-name">${d.name}<small>${d.note}</small></div>
          <div class="board-date">${formatDate(d.date)}</div>
          <div class="board-countdown ${cd.cls}">${cd.text}</div>
        </div>`;
    })
    .join("");

  if (list.length === 0) {
    el.innerHTML = `<div class="board-row"><div class="board-name">No open deadlines right now — check back soon.</div></div>`;
  }
}

// ---------- Resource category filter (resources.html) ----------
function initResourceFilter() {
  const tabs = document.querySelectorAll(".tab-index button");
  const categories = document.querySelectorAll(".resource-category");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.category;

      categories.forEach((cat) => {
        if (target === "all" || cat.dataset.category === target) {
          cat.style.display = "";
          if (target !== "all") cat.open = true;
        } else {
          cat.style.display = "none";
        }
      });
    });
  });
}

// ---------- Newsletter / reminder signup form ----------
function initSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  const status = form.querySelector(".form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (SIGNUP_ENDPOINT.includes("PASTE_YOUR")) {
      status.textContent = "Signup isn't connected yet — see README to finish setup.";
      status.className = "form-status err";
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    status.textContent = "";
    status.className = "form-status";

    const formData = new FormData(form);
    const interests = formData.getAll("interest").join(", ");
    const payload = {
      name: formData.get("name") || "",
      email: formData.get("email"),
      interests,
      wantsDeadlineReminders: formData.get("reminders") === "on",
    };

    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight to Apps Script
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.result === "success") {
        status.textContent = "You're on the list — check your inbox for a confirmation email.";
        status.className = "form-status ok";
        form.reset();
      } else {
        throw new Error(data.message || "Something went wrong.");
      }
    } catch (err) {
      status.textContent = "Couldn't reach the signup service. Try again in a moment.";
      status.className = "form-status err";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-board]").forEach((el) => {
    const limit = el.dataset.limit ? parseInt(el.dataset.limit, 10) : null;
    renderBoard(el, { limit });
  });
  initResourceFilter();
  initSignupForm();
});
