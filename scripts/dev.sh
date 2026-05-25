#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! docker info >/dev/null 2>&1; then
  echo "Starting Docker…"
  open -a Docker
  echo "Wait for Docker to finish starting, then run this script again."
  exit 1
fi

cd "$ROOT"
if ! supabase status >/dev/null 2>&1; then
  echo "Starting Supabase…"
  supabase start
fi

if [[ ! -f apps/web/.env.local ]]; then
  echo "Writing apps/web/.env.local from supabase status…"
  {
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000"
    echo "NEXT_PUBLIC_DEV_LOGIN=true"
    supabase status -o env | sed 's/^/NEXT_PUBLIC_/' | grep -E 'SUPABASE_URL|SUPABASE_ANON' || true
  } > apps/web/.env.local.tmp
  # supabase status -o env uses ANON_KEY not SUPABASE format — use known template
  cat > apps/web/.env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_LOGIN=true
EOF
  rm -f apps/web/.env.local.tmp
fi

cd apps/web
npm run dev
