#!/usr/bin/env bash
set -euo pipefail

IMAGE_REF="${1:?Usage: verify-marketplace-image-runtime.sh IMAGE_REF}"

BODY="$(mktemp)"
ROOT_HEADERS="$(mktemp)"
CONTAINER_LOG="$(mktemp)"
CID=""

cleanup() {
  if [ -n "${CID:-}" ]; then
    docker rm -f "$CID" >/dev/null 2>&1 || true
  fi

  rm -f "$BODY" "$ROOT_HEADERS" "$CONTAINER_LOG"
}
trap cleanup EXIT

echo "========================================================================"
echo "MARKETPLACE CANDIDATE IMAGE — RUNTIME IDENTITY GATE"
echo "========================================================================"
echo "IMAGE_REF=$IMAGE_REF"

# ----------------------------------------------------------------------
# Boot candidate image.
# No production secrets are required for this identity test.
# Marketplace's locale-root fallback must remain Marketplace even when
# optional dynamic homepage infrastructure is unavailable.
# ----------------------------------------------------------------------
CID="$(
  docker run \
    -d \
    -p 127.0.0.1::3000 \
    "$IMAGE_REF"
)"

echo "CID=$CID"

HOST_PORT=""

for N in $(seq 1 120); do

  HOST_PORT="$(
    docker port "$CID" 3000/tcp 2>/dev/null \
      | head -1 \
      | awk -F: '{print $NF}' \
      | tr -d '[:space:]'
  )"

  if [ -n "$HOST_PORT" ]; then
    CODE="$(
      curl \
        -sS \
        -o "$BODY" \
        -w '%{http_code}' \
        "http://127.0.0.1:${HOST_PORT}/angelcare-marketplace/fr" \
        2>/dev/null || true
    )"

    if [ "$CODE" = "200" ]; then
      break
    fi
  fi

  if ! docker inspect -f '{{.State.Running}}' "$CID" 2>/dev/null \
      | grep -qx true; then

    echo "FAIL: candidate container exited before becoming ready."

    docker logs "$CID" > "$CONTAINER_LOG" 2>&1 || true

    tail -n 160 "$CONTAINER_LOG"

    exit 1
  fi

  sleep 1
done

[ -n "$HOST_PORT" ] || {
  echo "FAIL: candidate container exposed no HTTP port."
  docker logs "$CID" || true
  exit 1
}

echo "HOST_PORT=$HOST_PORT"

HTTP="$(
  curl \
    -sS \
    -o "$BODY" \
    -w '%{http_code}' \
    "http://127.0.0.1:${HOST_PORT}/angelcare-marketplace/fr"
)"

echo "MARKETPLACE_HTTP=$HTTP"

[ "$HTTP" = "200" ] || {
  echo "FAIL: Marketplace locale root did not return HTTP 200."
  docker logs "$CID" || true
  exit 1
}

# ----------------------------------------------------------------------
# The candidate MUST NOT be the SANILA renderer.
# data-page="accueil" is emitted by SanilaPublicUniverse itself.
# ----------------------------------------------------------------------
if grep -Eiq \
  'data-page=["'"'"']accueil["'"'"']|SANILA Operating System' \
  "$BODY"; then

  echo
  echo "FAIL: /angelcare-marketplace/fr is rendering SANILA."
  echo

  grep -Eio \
    'data-page=["'"'"'][^"'"'"']+["'"'"']|SANILA Operating System|Tout votre établissement' \
    "$BODY" \
    | head -30 || true

  exit 1
fi

echo "SANILA_AT_MARKETPLACE_ROOT=NO"

# ----------------------------------------------------------------------
# Marketplace may render either:
#
# A. fully resolved Global Marketplace experience
# B. safe static Marketplace continuity fallback when optional services
#    are absent inside CI.
#
# Both are legitimate Marketplace identities.
# ----------------------------------------------------------------------
MARKETPLACE_IDENTITY=NO

if grep -Fqi 'GLOBAL MARKETPLACE' "$BODY"; then
  MARKETPLACE_IDENTITY=YES
  echo "MARKETPLACE_IDENTITY=GLOBAL_MARKETPLACE"
fi

if grep -Fqi 'Bienvenue dans votre univers AngelCare' "$BODY"; then
  MARKETPLACE_IDENTITY=YES
  echo "MARKETPLACE_IDENTITY=STATIC_CONTINUITY"
fi

if [ "$MARKETPLACE_IDENTITY" != "YES" ]; then
  echo
  echo "FAIL: Marketplace identity is absent from candidate runtime HTML."
  echo
  echo "HTML EXCERPT:"
  sed -n '1,80p' "$BODY"
  exit 1
fi

# ----------------------------------------------------------------------
# Verify / root points to Marketplace.
# ----------------------------------------------------------------------
curl \
  -sSI \
  "http://127.0.0.1:${HOST_PORT}/" \
  > "$ROOT_HEADERS"

echo
echo "ROOT RESPONSE:"
sed -n '1,15p' "$ROOT_HEADERS"

ROOT_LOCATION="$(
  awk '
    BEGIN { IGNORECASE=1 }
    /^location:/ {
      sub(/\r$/, "", $0)
      sub(/^[Ll]ocation:[[:space:]]*/, "", $0)
      print
      exit
    }
  ' "$ROOT_HEADERS"
)"

case "$ROOT_LOCATION" in
  /angelcare-marketplace/fr|http://*/angelcare-marketplace/fr|https://*/angelcare-marketplace/fr)
    echo "ROOT_TO_MARKETPLACE=PASS"
    ;;

  *)
    echo "FAIL: root does not redirect to Marketplace FR."
    echo "ROOT_LOCATION=$ROOT_LOCATION"
    exit 1
    ;;
esac

echo
echo "========================================================================"
echo "MARKETPLACE_CANDIDATE_RUNTIME=PASS"
echo "SANILA_AT_MARKETPLACE_ROOT=NO"
echo "ROOT_TO_MARKETPLACE=PASS"
echo "IMAGE_REF=$IMAGE_REF"
echo "========================================================================"
