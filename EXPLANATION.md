# LivePulse, in plain words

## What it is

A web app for live polls. Someone creates a poll ("Best framework for a
new web app?"), everyone opens the same page, and every vote shows up on
every screen the moment it is cast: the result bars animate to their new
percentages without anyone refreshing.

The header shows how many polls are open, how many votes have been cast
in total, and how many people are on the page right now. After you vote,
your choice is marked and the buttons turn into result bars. Creating a
poll takes a question, a category, and two to six options.

## The technology

- The backend is Node.js with Express for the REST API and the ws
  library for WebSockets. When a vote lands, the server broadcasts the
  updated poll to every connected browser; it also tracks how many
  viewers are connected and broadcasts that too.
- The frontend is React with TypeScript, built with Vite. One WebSocket
  hook keeps the whole page in sync, with a REST fallback so the page
  never renders empty. Votes are remembered per browser in localStorage.
- Data lives in memory for now; the API is shaped so a real database
  (Postgres, for example) can slot in behind it without the frontend
  changing.

## Tests

Eleven automated tests: five on the backend (listing polls, creating and
validating polls, voting, and proving a vote reaches WebSocket clients
live) and six on the frontend (rendering a poll card, voting, percentage
display, and the create-poll form).
