#!/usr/bin/env bash
# Check-in registry for ship-it-and-shutdown: only the last session still working powers off.
#   checkin.sh join "<task>"   sign in; prints the session id
#   checkin.sh beat <id>       refresh the heartbeat
#   checkin.sh leave <id>      mark done; prints exactly SHUTDOWN or WAIT <ids...>
#                              (stale sessions skipped go to stderr as STALE <ids...>)
#   checkin.sh list            show the registry
#   checkin.sh shutdown        run the OS shutdown (only after leave printed SHUTDOWN)
# Env: SHIP_IT_CHECKIN_DIR (default ~/.ship-it-checkin), SHIP_IT_STALE_MIN (default 90),
#      SHIP_IT_DRY_RUN=1 (shutdown only prints the command)
set -eu
DIR="${SHIP_IT_CHECKIN_DIR:-$HOME/.ship-it-checkin}"
STALE=$(( ${SHIP_IT_STALE_MIN:-90} * 60 ))
LOCK="$DIR/.lock"
mkdir -p "$DIR"

now() { date +%s; }
field() { sed -n "s/^$1=//p" "$2" | head -n 1; }

# put <id> <state>: rewrite the entry with a fresh heartbeat (temp file + mv, so readers never see half a file)
put() {
  f="$DIR/$1.session"
  if [ -f "$f" ]; then start=$(field start "$f"); cwd=$(field cwd "$f"); task=$(field task "$f")
  else start=$(now); cwd=$PWD; task=${3:-"(unknown)"}; fi
  printf 'id=%s\nstart=%s\ncwd=%s\ntask=%s\nstate=%s\nbeat=%s\n' \
    "$1" "$start" "$cwd" "$task" "$2" "$(now)" > "$f.tmp.$$"
  mv -f "$f.tmp.$$" "$f"
}

# mkdir is atomic on every OS; a lock older than 2 minutes was left by a crashed run
lock() {
  i=0
  until mkdir "$LOCK" 2>/dev/null; do
    [ -z "$(find "$LOCK" -maxdepth 0 -mmin +2 2>/dev/null)" ] || rmdir "$LOCK" 2>/dev/null || true
    i=$((i + 1)); [ "$i" -lt 300 ] || { echo "checkin: lock busy: $LOCK" >&2; exit 1; }
    sleep 0.1
  done
  trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT
}

case "${1:-}" in
  join)
    id="$(date +%Y%m%d-%H%M%S)-$RANDOM$RANDOM"
    put "$id" working "$(printf '%s' "${2:-}" | tr '\r\n' '  ')"
    echo "$id" ;;
  beat)
    put "${2:?id}" working ;;
  leave)
    me="${2:?id}"
    lock   # mark done AND decide inside the lock, so two sessions finishing together can't both see the other done
    put "$me" done
    t=$(now); wait_ids=""; stale_ids=""
    for f in "$DIR"/*.session; do
      [ -f "$f" ] || continue
      id=$(field id "$f"); [ "$id" != "$me" ] || continue
      [ "$(field state "$f")" = working ] || continue
      b=$(field beat "$f")
      if [ $(( t - ${b:-0} )) -gt "$STALE" ]; then stale_ids="$stale_ids $id"; else wait_ids="$wait_ids $id"; fi
    done
    [ -z "$stale_ids" ] || echo "STALE$stale_ids" >&2
    if [ -n "$wait_ids" ]; then echo "WAIT$wait_ids"
    else mkdir -p "$DIR/archive/$me"; mv -f "$DIR"/*.session "$DIR/archive/$me/"; echo SHUTDOWN; fi ;;
  list)
    t=$(now)
    for f in "$DIR"/*.session; do
      [ -f "$f" ] || continue
      b=$(field beat "$f"); s=$(field state "$f")
      [ "$s" != working ] || [ $(( t - ${b:-0} )) -le "$STALE" ] || s=stale
      printf '%s  %-7s  beat %3sm ago  %s  %s\n' "$(field id "$f")" "$s" $(( (t - ${b:-0}) / 60 )) "$(field cwd "$f")" "$(field task "$f")"
    done ;;
  shutdown)
    case "$(uname -s)" in
      MINGW*|MSYS*|CYGWIN*) cmd="shutdown //s //t 60" ;;
      *) cmd="sudo -n shutdown -h +1 || shutdown -h +1" ;;
    esac
    if [ "${SHIP_IT_DRY_RUN:-0}" = 1 ]; then echo "DRY RUN: $cmd"; else eval "$cmd"; fi ;;
  *)
    echo "usage: checkin.sh join \"<task>\" | beat <id> | leave <id> | list | shutdown" >&2; exit 2 ;;
esac
