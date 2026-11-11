#!/bin/sh
# Deploy the viewer (static files only) to https://sweethome.phanindra.dev
# Host alias `contabo` comes from ~/.ssh/config; Caddy serves /var/www/sweethome.phanindra.dev (block in /etc/caddy/Caddyfile).
# Skips everything in .gitignore (licence-restricted models, originals, tour video) plus dev-only files and docs.
# Comments cannot be saved on the live site (no tools/serve.py there) — use the local server for comments.
set -e
cd "$(dirname "$0")/.."
DEST=/var/www/sweethome.phanindra.dev
rsync -az --delete --exclude-from=.gitignore \
  --exclude='.git/' --exclude='.claude/' --exclude='.gitignore' --exclude='tools/' --exclude='grid.npy' \
  --exclude='comments/' --exclude='comments.json' --exclude='CLAUDE.md' --exclude='DESIGN_BRIEF.md' --exclude='README.md' \
  ./ contabo:$DEST/
ssh contabo "chown -R deploy:deploy $DEST"
curl -s -o /dev/null -w "live: %{http_code}\n" https://sweethome.phanindra.dev/
