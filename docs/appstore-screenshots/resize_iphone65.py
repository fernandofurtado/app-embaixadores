#!/usr/bin/env python3
"""
Resize screenshots to exact App Store Connect dimensions:
- iPhone 6.5": 1284x2778
- iPad 13": 2048x2732 (already done)
"""
import subprocess
import os

SRC_DIR = "/Users/lucasmesquita/developer/app-rede-embaixadores/docs/appstore-screenshots"
IPHONE_DIR = os.path.join(SRC_DIR, "iphone-6.5")

SCREENSHOT_COLORS = {
    "appstore_screenshot_1_login": "8B0000",
    "appstore_screenshot_2_home": "8B0000",
    "appstore_screenshot_3_missions": "0A1628",
    "appstore_screenshot_4_ranking": "0A2810",
    "appstore_screenshot_5_events": "3D1050",
}

def get_color(filename):
    for key, color in SCREENSHOT_COLORS.items():
        if key in filename:
            return color
    return "000000"

def resize_and_pad(src, dst, tw, th, bg_color):
    subprocess.run(["cp", src, dst], check=True)
    # Scale to target width (source is 1024x1024 square)
    scaled_h = tw  # square so height = width after scaling
    subprocess.run(["sips", "-z", str(scaled_h), str(tw), dst], capture_output=True, check=True)
    # Pad to target height
    subprocess.run(["sips", "--padToHeightWidth", str(th), str(tw), "--padColor", bg_color, dst],
                   capture_output=True, check=True)

os.makedirs(IPHONE_DIR, exist_ok=True)

screenshots = sorted([f for f in os.listdir(SRC_DIR)
                       if f.startswith("appstore_screenshot_") and f.endswith(".png")])

print("=== iPhone 6.5\" (1284x2778) ===")
for fname in screenshots:
    src = os.path.join(SRC_DIR, fname)
    dst = os.path.join(IPHONE_DIR, fname)
    bg = get_color(fname)
    print(f"  {fname} (bg: #{bg})")
    resize_and_pad(src, dst, 1284, 2778, bg)
    r = subprocess.run(["sips", "-g", "pixelHeight", "-g", "pixelWidth", dst], capture_output=True, text=True)
    lines = r.stdout.strip().split("\n")
    print(f"    ✓ {lines[-2].strip()}, {lines[-1].strip()}")

print("\n✅ Done! Upload from:")
print(f"   iPhone 6.5\": {IPHONE_DIR}")
print(f"   iPad 13\":    {os.path.join(SRC_DIR, 'ipad-12.9')}")
