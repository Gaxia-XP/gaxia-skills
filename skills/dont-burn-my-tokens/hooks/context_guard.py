#!/usr/bin/env python3
"""Stop hook for dont-burn-my-tokens.

Reads the Stop-hook JSON on stdin, estimates current context tokens from the
session transcript, and -- only while the dbmt active-marker is present and
fresh -- prints a non-blocking warning recommending /compact or handoff.
Always exits 0 (never blocks the turn from ending)."""
import json
import os
import sys
import time
from pathlib import Path

THRESHOLD = int(os.environ.get("DBMT_CONTEXT_THRESHOLD", "200000"))
MARKER_MAX_AGE_H = 12
MARKER_PATH = Path(os.environ.get("DBMT_MARKER_PATH", str(Path.home() / ".claude" / ".dbmt-active")))


def compute_context_tokens(transcript_text):
    """Latest turn's prompt+output token count from a transcript .jsonl string.

    Context size ~= the most recent usage-bearing entry's
    input + cache_read + cache_creation + output tokens."""
    latest = 0
    for line in transcript_text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        usage = (obj.get("message") or {}).get("usage") or obj.get("usage")
        if not isinstance(usage, dict):
            continue
        total = (
            usage.get("input_tokens", 0)
            + usage.get("cache_read_input_tokens", 0)
            + usage.get("cache_creation_input_tokens", 0)
            + usage.get("output_tokens", 0)
        )
        if total:
            latest = total  # keep the last usage-bearing entry
    return latest


def marker_is_active(marker_path, now=None, max_age_h=MARKER_MAX_AGE_H):
    """True iff the dbmt active-marker exists and is fresher than max_age_h."""
    try:
        mtime = marker_path.stat().st_mtime
    except OSError:
        return False
    now = time.time() if now is None else now
    return (now - mtime) <= max_age_h * 3600


def build_warning(tokens, threshold=THRESHOLD):
    """One-line warning if tokens >= threshold, else None."""
    if tokens < threshold:
        return None
    k = round(tokens / 1000)
    return (
        f"Context ~{k}k tokens -- large. Recommend /compact (keep working this "
        f"session) or hand off (pausing/ending). [dont-burn-my-tokens context guard]"
    )
