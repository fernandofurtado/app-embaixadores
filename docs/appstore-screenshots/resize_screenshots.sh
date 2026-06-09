#!/bin/bash
# Resize App Store screenshots from 1024x1024 to required dimensions
# Uses macOS native tools (sips + Python with Quartz - built-in)

SRC_DIR="/Users/lucasmesquita/developer/app-rede-embaixadores/docs/appstore-screenshots"
IPHONE_DIR="$SRC_DIR/iphone-6.7"
IPAD_DIR="$SRC_DIR/ipad-12.9"

# iPhone 6.7": 1290x2796
# iPad 12.9": 2048x2732

# Background colors extracted from each screenshot (top pixel)
# 1_login: dark red #8B0000 -> will sample
# 2_home: dark red
# 3_missions: dark blue
# 4_ranking: dark green
# 5_events: purple gradient

echo "=== Generating iPhone 6.7\" screenshots (1290x2796) ==="

for f in "$SRC_DIR"/appstore_screenshot_*.png; do
  BASENAME=$(basename "$f" .png)
  echo "Processing: $BASENAME"
  
  # Use Python with built-in Quartz/CoreGraphics to resize properly
  python3 << PYEOF
import subprocess, os

src = "$f"
basename = "$BASENAME"

# iPhone 6.7"
iphone_w, iphone_h = 1290, 2796
# iPad 12.9"  
ipad_w, ipad_h = 2048, 2732

for target_dir, tw, th, label in [
    ("$IPHONE_DIR", iphone_w, iphone_h, "iPhone"),
    ("$IPAD_DIR", ipad_w, ipad_h, "iPad"),
]:
    out = os.path.join(target_dir, basename + ".png")
    
    # Scale source to fit width, then pad vertically
    # Source is 1024x1024
    scale = tw / 1024.0
    scaled_h = int(1024 * scale)
    
    # Create temp scaled file
    tmp = os.path.join(target_dir, "_tmp_scaled.png")
    subprocess.run(["cp", src, tmp])
    subprocess.run(["sips", "-z", str(scaled_h), str(tw), tmp], 
                   capture_output=True)
    
    # Now pad to target height (add padding at bottom)
    # sips --padToHeightWidth pads evenly
    subprocess.run(["sips", "--padToHeightWidth", str(th), str(tw), 
                    "--padColor", "000000", tmp],
                   capture_output=True)
    
    subprocess.run(["mv", tmp, out])
    print(f"  ✓ {label}: {tw}x{th} -> {out}")

PYEOF
done

echo ""
echo "=== Done! ==="
echo "iPhone screenshots: $IPHONE_DIR"
echo "iPad screenshots: $IPAD_DIR"
