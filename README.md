# Oil Rewards

Oil change loyalty tracker powered by Supabase (Postgres + Auth). Every 10th service earns a free oil change.

## Setup

Serve the frontend with any static file server:

```bash
npx serve .
```

Supabase project configuration lives in `src/config/supabase.js`. Table creation SQL and RLS policies are documented in that file's header comment.

## Project Structure

```
oilRewards/
├── index.html                          # App shell
├── src/
│   ├── app.js                          # Entry point – router, auth gate, DB control overlay
│   ├── config/
│   │   ├── supabase.js                 # Supabase client + SQL reference
│   │   └── api.js                      # Data abstraction layer
│   ├── services/
│   │   ├── auth.js                     # Supabase Auth helpers
│   │   ├── loggedServices.js           # logged_services CRUD
│   │   └── loyaltyRedemptions.js       # loyalty_redemptions CRUD
│   ├── features/
│   │   ├── login/
│   │   │   ├── login.js                # Sign-in form
│   │   │   └── login.css
│   │   ├── home/
│   │   │   ├── home.js                 # Customer ID input + navigation
│   │   │   └── home.css
│   │   └── customer/
│   │       ├── customer.js             # Service table, redemption, countdown
│   │       └── customer.css
│   ├── styles/
│   │   └── main.css                    # Global styles + theme
│   └── drip.svg                        # Decorative logo
└── README.md
```
