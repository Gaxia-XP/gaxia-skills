"""Repo consistency checks for gaxia-skills (stdlib only).

Catches what review keeps finding by hand: a skill missing from a manifest,
a frontmatter name that doesn't match its folder, versions drifting between
manifests, a release without a CHANGELOG entry, a skill missing from the
README table. Exits non-zero and lists every problem.

Usage: python3 scripts/check_repo.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_DESCRIPTION = 1024  # hosts truncate or reject longer skill descriptions


def parse_frontmatter(text):
    """Parse the simple YAML subset SKILL.md files use: `key: value` and
    folded/literal blocks (`key: >-` followed by indented lines)."""
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
    if not m:
        return None
    out, key, block = {}, None, None
    for line in m.group(1).splitlines():
        if block is not None and (line.startswith((" ", "\t")) or not line.strip()):
            block.append(line.strip())
            continue
        if block is not None:
            out[key] = " ".join(p for p in block if p)
            block = None
        km = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not km:
            continue
        key, value = km.group(1), km.group(2).strip()
        if value in (">", ">-", "|", "|-"):
            block = []
        else:
            out[key] = value.strip("\"'")
    if block is not None:
        out[key] = " ".join(p for p in block if p)
    return out


def load_json(path, errors):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        errors.append(f"{path.relative_to(ROOT)}: invalid JSON ({e})")
        return None


def check(root=ROOT):
    errors = []
    skill_dirs = sorted(p.parent for p in (root / "skills").glob("*/SKILL.md"))
    names = [d.name for d in skill_dirs]

    for d in skill_dirs:
        rel = d.relative_to(root) / "SKILL.md"
        fm = parse_frontmatter((d / "SKILL.md").read_text(encoding="utf-8"))
        if fm is None:
            errors.append(f"{rel}: missing --- frontmatter ---")
            continue
        if fm.get("name") != d.name:
            errors.append(f"{rel}: name '{fm.get('name')}' does not match folder '{d.name}'")
        desc = fm.get("description", "")
        if not desc:
            errors.append(f"{rel}: empty description")
        elif not desc.startswith("Use "):
            errors.append(f"{rel}: description should start with 'Use when/before…' (the trigger), got '{desc[:40]}…'")
        if len(desc) > MAX_DESCRIPTION:
            errors.append(f"{rel}: description is {len(desc)} chars (max {MAX_DESCRIPTION})")

    claude = load_json(root / ".claude-plugin/plugin.json", errors)
    market = load_json(root / ".claude-plugin/marketplace.json", errors)
    codex = load_json(root / ".codex-plugin/plugin.json", errors)

    if claude is not None:
        listed = [s.rstrip("/").split("/")[-1] for s in claude.get("skills", [])]
        for n in names:
            if n not in listed:
                errors.append(f".claude-plugin/plugin.json: skill '{n}' is not registered")
        for s in claude.get("skills", []):
            if not (root / s / "SKILL.md").is_file():
                errors.append(f".claude-plugin/plugin.json: '{s}' has no SKILL.md")
        if len(listed) != len(set(listed)):
            errors.append(".claude-plugin/plugin.json: duplicate skill entries")

    versions = {}
    if claude is not None:
        versions[".claude-plugin/plugin.json"] = claude.get("version")
    if market is not None:
        versions[".claude-plugin/marketplace.json metadata"] = market.get("metadata", {}).get("version")
        for p in market.get("plugins", []):
            versions[f".claude-plugin/marketplace.json plugin '{p.get('name')}'"] = p.get("version")
    if codex is not None:
        versions[".codex-plugin/plugin.json"] = codex.get("version")
    distinct = set(versions.values())
    if len(distinct) > 1:
        errors.append("manifest versions differ: " + ", ".join(f"{k}={v}" for k, v in versions.items()))
    version = next(iter(distinct)) if len(distinct) == 1 else None

    changelog = (root / "CHANGELOG.md").read_text(encoding="utf-8")
    if version and not re.search(r"^## \[" + re.escape(version) + r"\]", changelog, re.M):
        errors.append(f"CHANGELOG.md: no '## [{version}]' section for the manifest version")

    readme = (root / "README.md").read_text(encoding="utf-8")
    for n in names:
        if f"| `{n}` |" not in readme:
            errors.append(f"README.md: skill '{n}' missing from the Skills table")

    return errors


def main():
    errors = check()
    for e in errors:
        print("ERROR: " + e)
    if not errors:
        print("repo checks passed")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
