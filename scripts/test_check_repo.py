"""Tests for check_repo: the real repo passes, and each drift is caught."""
import importlib.util
import json
import shutil
from pathlib import Path

HERE = Path(__file__).parent
_spec = importlib.util.spec_from_file_location("check_repo", HERE / "check_repo.py")
cr = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cr)


def _copy_repo(tmp_path):
    root = tmp_path / "repo"
    for rel in ["README.md", "CHANGELOG.md", ".claude-plugin", ".codex-plugin"]:
        src = cr.ROOT / rel
        if src.is_dir():
            shutil.copytree(src, root / rel)
        else:
            root.mkdir(parents=True, exist_ok=True)
            shutil.copy(src, root / rel)
    for skill in (cr.ROOT / "skills").glob("*/SKILL.md"):
        dst = root / "skills" / skill.parent.name / "SKILL.md"
        dst.parent.mkdir(parents=True)
        shutil.copy(skill, dst)
    return root


def _edit_json(path, fn):
    data = json.loads(path.read_text(encoding="utf-8"))
    fn(data)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def test_real_repo_passes():
    assert cr.check() == []


def test_folded_description_is_parsed():
    fm = cr.parse_frontmatter("---\nname: x\ndescription: >-\n  Use when a\n  thing.\n---\nbody\n")
    assert fm == {"name": "x", "description": "Use when a thing."}


def test_unregistered_skill_is_caught(tmp_path):
    root = _copy_repo(tmp_path)
    _edit_json(root / ".claude-plugin/plugin.json",
               lambda d: d["skills"].remove("./skills/stand-up-server-agent"))
    assert any("'stand-up-server-agent' is not registered" in e for e in cr.check(root))


def test_name_mismatch_and_bad_description_are_caught(tmp_path):
    root = _copy_repo(tmp_path)
    p = root / "skills/pick-skill/SKILL.md"
    p.write_text("---\nname: picker\ndescription: Picks things.\n---\n", encoding="utf-8")
    errors = cr.check(root)
    assert any("does not match folder 'pick-skill'" in e for e in errors)
    assert any("should start with 'Use" in e for e in errors)


def test_version_drift_and_missing_changelog_are_caught(tmp_path):
    root = _copy_repo(tmp_path)
    _edit_json(root / ".codex-plugin/plugin.json", lambda d: d.update(version="9.9.9"))
    assert any("manifest versions differ" in e for e in cr.check(root))
    for rel in [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]:
        _edit_json(root / rel, lambda d: d.update(version="9.9.9"))
    def bump_market(d):
        d["metadata"]["version"] = "9.9.9"
        for p in d["plugins"]:
            p["version"] = "9.9.9"
    _edit_json(root / ".claude-plugin/marketplace.json", bump_market)
    errors = cr.check(root)
    assert not any("versions differ" in e for e in errors)
    assert any("no '## [9.9.9]' section" in e for e in errors)


def test_missing_readme_row_is_caught(tmp_path):
    root = _copy_repo(tmp_path)
    readme = root / "README.md"
    readme.write_text(readme.read_text(encoding="utf-8").replace("| `web-companion` |", "| web-companion |"), encoding="utf-8")
    assert any("'web-companion' missing from the Skills table" in e for e in cr.check(root))
