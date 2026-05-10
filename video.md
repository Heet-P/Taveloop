# Traveloop — 5-Minute Feature Demo Script

> **Pace:** High energy. Speak at ~150 wpm. Estimated runtime: 4:45 – 5:00.
> **Tone:** Founder demoing to investors / product launch. Confident, punchy, no filler.

---

## [HOOK — 0:00 – 0:25]

*(Open on the landing screen. Cursor moves deliberately.)*

"Every trip you've ever planned started the same way — twenty browser tabs, a shared Google doc nobody updates, a notes app full of half-finished ideas, and a group chat that spirals into chaos.

We built **Traveloop** to kill all of that.

One app. Every phase of your trip — planned, tracked, and shared. Let me show you exactly what that looks like."

---

## [SIGN-IN & HOME — 0:25 – 0:55]

*(Log in with Clerk. Land on the Home dashboard.)*

"First thing you see after signing in — your personal dashboard. Recent trips up top, and below that, a live grid of the world's top destinations, ranked by popularity score, pulled straight from our database.

Hit **Plan New Trip** — give it a name, set your dates, drag in a cover photo. Done in ten seconds.

Or — pick one of our quick-start combos. *Tokyo → Kyoto → Osaka. Paris → Lisbon → Barcelona.* One click fills the trip name. You're already moving."

---

## [ITINERARY BUILDER — 0:55 – 2:05]

*(Navigate into a trip → Itinerary tab.)*

"This is where it gets serious — the **Itinerary Builder**.

Hit *Add Stop*. Type any city in the world. Not just our 30 seeded cities — if you type Mumbai, Lagos, or Medellín and we don't have it, we hit **Nominatim** in real time, pull the city data, and seed it into our database on the fly. Live. No dead ends.

Select your city, set arrival and departure dates — dates automatically constrain to your trip window — and it's added.

Now watch this. You've got multiple stops? Just **drag and drop** to reorder them. The order saves instantly. That's DnD Kit talking directly to a MySQL transaction.

Click into a stop and hit **Browse & Add Activities**. This is where the AI kicks in.

We're hitting **OpenTripMap's** radius API — 10 kilometre sweep of the city, filtered for significant places only, rate-two and above. Real museums. Real landmarks. Real restaurants. Wikipedia excerpts. Phone numbers. Opening hours. All of it pulled live and cached so the next user gets it instantly.

Every result shows estimated cost and duration. Hit **Add** and it's on your itinerary. Or flip to the *Custom* tab and add anything you want — a beach day, a private tour, a midnight street food run. Name it, categorise it, price it."

---

## [BUDGET TRACKER — 2:05 – 2:45]

*(Switch to the Budget tab.)*

"Tab two — **Budget Tracker**.

Every activity you added is already contributing to your total. Add manual line items on top — flights, hotels, visa fees — assign a category, quantity, and unit cost. The grand total updates live.

On the right: a **pie chart** breaking costs by category. Below it: a **bar chart** showing daily spend across your trip window. You can see at a glance which days are burning money and which ones are light.

This isn't a spreadsheet. It's a live financial map of your trip."

---

## [CHECKLIST & NOTES — 2:45 – 3:15]

*(Switch to Checklist, then Notes.)*

"Tab three — **Packing Checklist**.

Items grouped by category: documents, clothing, electronics, toiletries, other. Progress bar at the top tells you exactly how packed you are. Toggle items, add custom ones, and when you're back home — one button resets everything for your next trip.

Tab four — **Notes**.

Write anything. Trip-level thoughts, stop-specific reminders, ideas that hit you at 2am. Edit inline, search across all your notes, delete what you don't need. Clean, fast, always there."

---

## [INVOICE GENERATOR — 3:15 – 3:45]

*(Open the Invoice tab — or navigate to it.)*

"Now here's something you won't find in any other travel app — a built-in **Invoice and Receipt Generator**.

Add your travellers. Drop in expenses. Apply a discount, add 5% tax, and it calculates the split automatically — who owes what, down to the cent.

Hit **Print** and it exports a professional, formatted receipt. Perfect for group trips, corporate travel, or anyone who needs to expense their adventure.

That's a feature most SaaS tools charge separately for. It's built in."

---

## [COMMUNITY & SHARING — 3:45 – 4:20]

*(Go to Community feed.)*

"Every trip you build can be **published to the Community**.

The community feed is a live grid of public trips from users around the world — sortable by newest, most liked, or most copied. Search for a destination, find a trip someone else built, and with one click — **Use this trip** — you get a full copy in your account. Every stop, every activity, ready to customise.

Like trips that inspire you. Build on what other travellers have done.

And for private sharing — every published trip gets a **unique shareable link**. Send it to anyone. They see a clean read-only view of your full itinerary, and can copy it to their own account with one tap."

---

## [ADMIN PANEL — 4:20 – 4:45]

*(Log in as admin. Open the Admin dashboard.)*

"Finally — the **Admin Panel**.

Real-time platform stats: total users, total trips, who's been active this week, what city is the most visited right now.

A full **user directory** — searchable, sortable, showing trip counts per user.

A **trips-per-day line chart** for the last 30 days. A **top destinations bar chart**. Activity category distribution. Everything an ops or growth team needs to understand how the platform is performing — without touching the database.

Role-based. Admins only. Secured at the middleware level."

---

## [CLOSE — 4:45 – 5:00]

*(Back on the Home screen. Calm but punchy.)*

"Traveloop is a full-stack travel planning platform — Next.js frontend, Express backend, MySQL database, Clerk authentication, AI activity discovery, community sharing, budget tracking, packing checklists, invoice generation, and a live admin panel.

Built from scratch. Fully functional. End to end.

**That's Traveloop.**"

---

*[END CARD — Logo + tagline: "Plan smarter. Travel better."]*
