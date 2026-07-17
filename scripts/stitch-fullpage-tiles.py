import json
import os
import sys

from PIL import Image


def main(manifest_path):
    with open(manifest_path, "r", encoding="utf-8") as file:
        manifest = json.load(file)

    for capture in manifest:
        canvas = Image.new("RGB", (capture["width"], capture["height"]), "#130f0b")
        for tile in capture["tiles"]:
            with Image.open(tile["path"]) as image:
                remaining = capture["height"] - tile["y"]
                crop = image.convert("RGB").crop((0, 0, capture["width"], min(image.height, remaining)))
                canvas.paste(crop, (0, tile["y"]))
        canvas.save(capture["output"], format="PNG", optimize=True)


if __name__ == "__main__":
    main(os.path.abspath(sys.argv[1]))
