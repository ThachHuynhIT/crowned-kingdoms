"""Extract reviewed sheet regions without resampling or changing artwork.

Usage: python tools/extract_asset_sheet.py --config docs/art-review/<batch>/<version>/sheet.json
Requires Pillow. Configuration and outputs are relative to the config directory.
"""

import argparse
import json
from pathlib import Path
import re

from PIL import Image


def local_path(root: Path, value: str) -> Path:
    result = (root / value).resolve()
    if not result.is_relative_to(root):
        raise ValueError(f"Path escapes config directory: {value}")
    return result


def extract(config_path: Path) -> list[dict]:
    config_path = config_path.resolve()
    root = config_path.parent
    config = json.loads(config_path.read_text(encoding="utf-8-sig"))
    source = local_path(root, config["source"])
    output = local_path(root, config["outputDirectory"])
    padding = config.get("padding", 8)
    if type(padding) is not int or padding < 0:
        raise ValueError("padding must be a non-negative integer")
    with Image.open(source) as opened:
        if "A" not in opened.getbands():
            raise ValueError("Source must contain an alpha channel")
        sheet = opened.convert("RGBA")
    if list(sheet.size) != config["sourceSize"]:
        raise ValueError("Source size does not match configuration")

    prepared = []
    seen = set()
    for asset in config["assets"]:
        name = asset["id"]
        if not re.fullmatch(r"[a-z][a-z0-9_]*", name) or name in seen:
            raise ValueError(f"Invalid or duplicate asset ID: {name}")
        seen.add(name)
        x, y, width, height = asset["crop"]
        if any(type(v) is not int for v in (x, y, width, height)):
            raise ValueError("Crop coordinates must be integers")
        if min(x, y) < 0 or min(width, height) <= 0:
            raise ValueError(f"Invalid crop for {name}")
        if x + width > sheet.width or y + height > sheet.height:
            raise ValueError(f"Crop outside source for {name}")
        region = sheet.crop((x, y, x + width, y + height))
        alpha = region.getchannel("A")
        bounds = alpha.getbbox()
        if bounds is None:
            raise ValueError(f"Empty asset: {name}")
        # An opaque pixel at an internal column boundary can indicate cut artwork.
        if (x > 0 and alpha.crop((0, 0, 1, height)).getbbox()) or (
            x + width < sheet.width
            and alpha.crop((width - 1, 0, width, height)).getbbox()
        ):
            raise ValueError(f"Artwork touches an internal crop boundary: {name}")
        trimmed = region.crop(bounds)
        result = Image.new("RGBA", (trimmed.width + padding * 2, trimmed.height + padding * 2))
        result.paste(trimmed, (padding, padding))
        target = output / f"{name}.png"
        if target.exists():
            raise FileExistsError(f"Use a new outputDirectory; refusing to overwrite {target}")
        prepared.append((target, result, {
            "id": name,
            "sourceCrop": asset["crop"],
            "sourceAlphaBounds": [x + bounds[0], y + bounds[1], x + bounds[2], y + bounds[3]],
            "output": str(target.relative_to(root)),
            "size": list(result.size),
        }))
    if not prepared:
        raise ValueError("No assets configured")
    if source.parent == output:
        raise ValueError("Use a separate output directory")
    output.mkdir(parents=True, exist_ok=True)
    for target, result, _ in prepared:
        result.save(target)
    report = [entry for _, _, entry in prepared]
    (output / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(extract(args.config), indent=2))
