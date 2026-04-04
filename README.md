# Oil Rewards

A browser-based app using json-server as the backend. Data is stored in a local `db.json` file.

## Setup

### 1. Start the API server

```bash
npx json-server db.json
```

This starts a REST API at `http://localhost:3000`. No config needed — the `db.json` file is the database.

### 2. Serve the frontend

In a second terminal, use any static file server:

```bash
npx serve .
```

Then open the URL it prints (usually `http://localhost:3000` is taken, so it'll be `http://localhost:5000` or similar).

## Project Structure

```
oilRewards/
├── db.json                 # The database (json-server reads/writes this)
├── index.html              # App shell
├── src/
│   ├── app.js              # Entry point – bootstraps features
│   ├── config/
│   │   └── api.js          # Fetch wrapper for json-server
│   ├── features/
│   │   └── entries/
│   │       ├── entries.js   # Form logic + CRUD
│   │       └── entries.css  # Feature styles
│   └── styles/
│       └── main.css         # Global styles
└── README.md
```
