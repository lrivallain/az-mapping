#!/usr/bin/env python3
"""Interactive plugin scaffold generator for az-scout."""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path


def slugify(value: str) -> str:
    lowered = value.strip().lower()
    cleaned = re.sub(r"[^a-z0-9]+", "-", lowered)
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned


def to_camel_case(value: str) -> str:
    parts = [part for part in value.split("_") if part]
    return "".join(part[:1].upper() + part[1:] for part in parts)


def prompt_with_default(prompt: str, default_value: str) -> str:
    response = input(f"{prompt} [{default_value}]: ").strip()
    return response or default_value


def confirm(prompt: str) -> bool:
    response = input(f"{prompt} [y/N]: ").strip().lower()
    return response == "y"


def replace_in_file(path: Path, replacements: list[tuple[str, str]]) -> None:
    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return

    updated = original
    for old, new in replacements:
        updated = updated.replace(old, new)

    if updated != original:
        path.write_text(updated, encoding="utf-8")


def replace_with_regex(path: Path, regex_replacements: list[tuple[str, str]]) -> None:
    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return

    updated = original
    for pattern, replacement in regex_replacements:
        updated = re.sub(pattern, replacement, updated, flags=re.MULTILINE)

    if updated != original:
        path.write_text(updated, encoding="utf-8")


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent.parent
    scaffold_dir = repo_root / "docs" / "plugin-scaffold"

    if not scaffold_dir.is_dir():
        print(f"Scaffold not found at: {scaffold_dir}", file=sys.stderr)
        return 1

    print("\naz-scout plugin scaffold generator")
    print(f"Scaffold source: {scaffold_dir}\n")

    display_name = prompt_with_default("Plugin display name", "My Plugin")

    default_slug = slugify(display_name) or "my-plugin"
    plugin_slug = prompt_with_default("Plugin slug (kebab-case, no az-scout- prefix)", default_slug)

    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", plugin_slug):
        print(
            f"Invalid plugin slug: '{plugin_slug}'. Use kebab-case (letters, numbers, hyphens).",
            file=sys.stderr,
        )
        return 1

    module_suffix = plugin_slug.replace("-", "_")
    package_name = prompt_with_default("Python package name", f"az-scout-{plugin_slug}")

    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]*", package_name):
        print(f"Invalid package name: '{package_name}'.", file=sys.stderr)
        return 1

    if not package_name.startswith("az-scout-"):
        print(
            "Package name should usually start with 'az-scout-' for discoverability.",
            file=sys.stderr,
        )
        if not confirm("Continue with non-standard package name?"):
            return 1

    github_owner = prompt_with_default("GitHub owner/org", "your-org")
    github_repo = prompt_with_default("GitHub repository name", package_name)

    module_name = f"az_scout_{module_suffix}"
    entrypoint_key = module_suffix
    class_name = f"{to_camel_case(module_suffix)}Plugin"
    asset_prefix = plugin_slug
    tool_function = f"{module_suffix}_tool"

    if class_name == "Plugin":
        print(
            f"Could not derive a plugin class name from slug '{plugin_slug}'.",
            file=sys.stderr,
        )
        return 1

    default_target = (Path.cwd() / package_name).resolve()
    target_dir = Path(
        prompt_with_default("Output directory for the new plugin", str(default_target))
    )
    target_dir = target_dir.expanduser().resolve()

    if target_dir.exists():
        has_content = any(target_dir.iterdir())
        if has_content and not confirm(
            f"""Target directory exists and is not empty: {target_dir}.
            Overwrite existing files in this directory?"""
        ):
            return 1
    else:
        target_dir.mkdir(parents=True, exist_ok=True)

    print("\nGenerating plugin scaffold...\n")

    ignore = shutil.ignore_patterns(".git", "__pycache__", ".ruff_cache", ".DS_Store")
    shutil.copytree(scaffold_dir, target_dir, dirs_exist_ok=True, ignore=ignore)

    src_dir = target_dir / "src"
    old_module_dir = src_dir / "az_scout_example"
    new_module_dir = src_dir / module_name
    if old_module_dir.exists():
        if new_module_dir.exists():
            shutil.rmtree(new_module_dir)
        old_module_dir.rename(new_module_dir)

    renames = [
        (
            new_module_dir / "static" / "js" / "example-tab.js",
            new_module_dir / "static" / "js" / f"{asset_prefix}-tab.js",
        ),
        (
            new_module_dir / "static" / "html" / "example-tab.html",
            new_module_dir / "static" / "html" / f"{asset_prefix}-tab.html",
        ),
        (
            new_module_dir / "static" / "css" / "example.css",
            new_module_dir / "static" / "css" / f"{asset_prefix}.css",
        ),
    ]
    for old_path, new_path in renames:
        if old_path.exists():
            old_path.rename(new_path)

    replacements = [
        ("az-scout-example", package_name),
        ("az_scout_example", module_name),
        ("ExamplePlugin", class_name),
        ("example_tool", tool_function),
        ("example-tab", f"{asset_prefix}-tab"),
        ("example.css", f"{asset_prefix}.css"),
        ("example-", f"{asset_prefix}-"),
        ("plugin-tab-example", f"plugin-tab-{plugin_slug}"),
        ("/plugins/example/", f"/plugins/{plugin_slug}/"),
        ("Example Plugin", display_name),
        ('label="Example"', f'label="{display_name}"'),
        ('PLUGIN_NAME = "example"', f'PLUGIN_NAME = "{plugin_slug}"'),
        ('id="example"', f'id="{plugin_slug}"'),
        ('name = "example"', f'name = "{plugin_slug}"'),
        (
            "https://github.com/lrivallain/az-scout-example/issues",
            f"https://github.com/{github_owner}/{github_repo}/issues",
        ),
        (
            "https://github.com/lrivallain/az-scout-example",
            f"https://github.com/{github_owner}/{github_repo}",
        ),
        ("https://pypi.org/p/az-scout-example", f"https://pypi.org/p/{package_name}"),
    ]

    regex_replacements = [
        (
            r'^example\s*=\s*"[a-zA-Z0-9_]+:plugin"$',
            f'{entrypoint_key} = "{module_name}:plugin"',
        ),
    ]

    for path in target_dir.rglob("*"):
        if not path.is_file() or path.name == ".DS_Store":
            continue
        replace_in_file(path, replacements)
        replace_with_regex(path, regex_replacements)

    print("Plugin scaffold created successfully.\n")
    print(f"Location: {target_dir}")
    print(f"Package:  {package_name}")
    print(f"Module:   {module_name}")
    print(f"Slug:     {plugin_slug}\n")
    print("Next steps:")
    print(f"  cd '{target_dir}'")
    print("  uv sync --group dev")
    print("  uv pip install -e .")
    print("  uv run pytest\n")
    print("Then run az-scout in your main workspace to verify plugin discovery.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
