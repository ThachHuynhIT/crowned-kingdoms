#!/bin/bash
# Run every image job Codex can do on its own, one Codex call at a time, then cut the results (no Claude needed).
#
#   bash tools/codex-handoff/run-art.sh            # all stages
#   bash tools/codex-handoff/run-art.sh anim env   # only some stages: anim | env | decals
#
# Stops by itself when the Codex weekly quota reaches 99% or Codex answers with a rate-limit error
# (touch .superpowers/handoff-STOP to stop it by hand). Every prompt is built by the repo's own tools from
# docs/ART_STYLE.md and tells Codex to read it. Nothing is wired into the game here: run
# `python tools/codex-handoff/integrate.py` afterwards, then the gate (see README.md).
set -u
cd "$(git rev-parse --show-toplevel)"
LOG=.superpowers/handoff.log
STOP=.superpowers/handoff-STOP
mkdir -p .superpowers
rm -f "$STOP"

usage() {
  local f u
  for f in $(ls -t $(find ~/.codex/sessions -name "rollout-*.jsonl" -mmin -1440 2>/dev/null) 2>/dev/null | head -6); do
    u=$(grep -o '"primary":{"used_percent":[0-9.]*' "$f" | tail -1 | grep -o '[0-9.]*$')
    if [ -n "$u" ]; then echo "$u"; return; fi
  done
  echo 0
}

# call <tag> <expected output file> <prompt file> <attachment>...
call() {
  local tag=$1 out=$2 prompt=$3; shift 3
  [ -f "$STOP" ] && { echo "$tag skipped (stop)" >> "$LOG"; return 1; }
  local u; u=$(usage)
  if [ "${u%.*}" -ge 99 ]; then echo "$tag QUOTA $u" >> "$LOG"; touch "$STOP"; return 1; fi
  local args=() a
  for a in "$@"; do args+=(-i "$a"); done
  echo "$tag start usage=$u $(date +%F_%H:%M)" >> "$LOG"
  codex exec --sandbox workspace-write -C "$PWD" --json "${args[@]}" - < "$prompt" > ".superpowers/handoff-$tag.out" 2>&1
  if [ ! -s "$out" ]; then
    if grep -qiE 'rate.?limit|usage limit|quota' ".superpowers/handoff-$tag.out"; then
      echo "$tag RATE-LIMIT" >> "$LOG"; touch "$STOP"
    else
      echo "$tag MISSING (see .superpowers/handoff-$tag.out)" >> "$LOG"
    fi
    return 1
  fi
  echo "$tag ok usage=$(usage)" >> "$LOG"
}

stage_anim() {
  # 12 cards never drawn, then the 9 whose motion was too small (REDRAW notes in make_anim.py), then the clipped colossus
  local A=docs/art-review/building-anim
  local cards="stone_miners stone_quarry stone_wall tide_harbor tide_hookmen tide_pirates tide_treasure wheat_field
    wheat_granary wheat_militia wheat_peasant_horde wheat_reapers arcane_frost_mages forge_swordsmen grove_bear_cave
    grove_sapling grove_spirit_stags grove_wolf_den moon_altar moon_crypt moon_reaper_shrine clock_colossus"
  for c in $cards; do
    [ -f "$STOP" ] && return
    [ -f "$A/$c/handoff-done" ] && continue
    python "$A/make_anim.py" prompt "$c" > /dev/null 2>&1 || { echo "anim-$c prompt FAIL" >> "$LOG"; continue; }
    [ -f "$A/$c/anim-source.png" ] && mv "$A/$c/anim-source.png" "$A/$c/anim-source-prev.png"
    local att=(); while read -r a; do [ -n "$a" ] && att+=("$a"); done < "$A/$c/attachments.txt"
    call "anim-$c" "$A/$c/anim-source.png" "$A/$c/prompt.md" "${att[@]}" || continue
    for d in 2 4 8; do python "$A/make_anim.py" cut "$c" --density $d >> "$LOG" 2>&1 || echo "anim-$c cut$d FAIL" >> "$LOG"; done
    touch "$A/$c/handoff-done"
  done
}

stage_env() {
  local E=docs/art-review/env
  local batches="wheat_fields stone_quarry_land arcane_glade grove_wildwood tide_coast forge_ashland clock_scrapyard
    moon_graveyard nomad_steppe autumn_set pond_side village_life"
  python "$E/make_objects.py" ref > /dev/null 2>&1
  for b in $batches; do
    [ -f "$STOP" ] && break
    [ -s "$E/batches/$b/source.png" ] && continue
    python "$E/make_objects.py" prompts "$b" > /dev/null 2>&1 || { echo "env-$b prompt FAIL" >> "$LOG"; continue; }
    call "env-$b" "$E/batches/$b/source.png" "$E/batches/$b/prompt.md" \
      docs/art-review/style-references/harvester-house-front-approved.png \
      docs/art-review/style-references/iso-building-approved.png "$E/approved-wilds-ref.png" || continue
    python "$E/make_objects.py" cut "$b" >> "$LOG" 2>&1 || echo "env-$b cut FAIL" >> "$LOG"
  done
  python "$E/make_objects.py" catalog >> "$LOG" 2>&1
}

stage_decals() {
  # more flat ground patches: re-run the decal sheets that exist as prompts but have no source yet
  local G=docs/art-review/env/ground
  python "$G/../make_ground.py" prompts > /dev/null 2>&1
  for p in "$G"/_sheets/*/prompt.md; do
    [ -f "$STOP" ] && break
    local s; s=$(dirname "$p")
    [ -s "$s/source.png" ] && continue
    call "decal-$(basename "$s")" "$s/source.png" "$p" \
      docs/art-review/style-references/harvester-house-front-approved.png \
      docs/art-review/style-references/iso-building-approved.png || continue
  done
  python "$G/../make_ground.py" cut >> "$LOG" 2>&1
}

stages=${*:-anim env}
echo "=== handoff run $(date +%F_%H:%M) stages: $stages usage=$(usage)" >> "$LOG"
for s in $stages; do "stage_$s"; done
echo "=== handoff end $(date +%F_%H:%M) usage=$(usage)" >> "$LOG"
tail -40 "$LOG"
