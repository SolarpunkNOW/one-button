# Server

Source of truth for the One Button back end. It deploys from the Canopy functions folder:
copy `onebutton.js` and `ratelimit.js` to `~/canopy-mycelial/functions-default/`, then
`firebase deploy --only functions:default:oneButton --project canopy-website-ef7a8`.
Edit here, copy forward, never the other way round.

## Forks as nodes

A fork of the page alone still talks to Jay's server, so it is a view, not a node. To become a
node that hosts its own spaces and hands the pattern on:

1. Deploy this folder as your own function (any Firebase project): secrets `ONE_BUTTON_KEY`
   (your admin key), `GROQ_KEY`, `OPENROUTER_KEY`, `WEAVE_ADMIN_KEY`.
2. Point your page at it: change `API` in index.html and `API` in space.html to your function's
   address, and `OB_SITE` here to your page's address.
3. `WEAVE_ADMIN_KEY` is the key of the community acting on the Weave trust net. Today the net at
   canopy-website-ef7a8 has one admin key, so a fork needs either its own weave-trust deployment
   or a per-community key on the shared net (not built yet). Until then, spaces on a fork are the
   one thing that still runs through Jay.

Everything else (recording, tasks, projects, shares, members adding to spaces) runs on the
fork's own server with no call back here.
