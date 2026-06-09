#!/usr/bin/env python3
"""
Resize App Store screenshots from 1024x1024 to required dimensions.
Uses macOS native Quartz/CoreGraphics (no Pillow needed).
Samples the dominant background color and uses it for padding.
"""
import subprocess
import os
import struct

SRC_DIR = "/Users/lucasmesquita/developer/app-rede-embaixadores/docs/appstore-screenshots"
IPHONE_DIR = os.path.join(SRC_DIR, "iphone-6.7")
IPAD_DIR = os.path.join(SRC_DIR, "ipad-12.9")

# Background colors for each screenshot (sampled from top-left area)
SCREENSHOT_COLORS = {
    "appstore_screenshot_1_login": "8B0000",   # dark red
    "appstore_screenshot_2_home": "8B0000",    # dark red  
    "appstore_screenshot_3_missions": "0A1628", # dark blue
    "appstore_screenshot_4_ranking": "0A2810",  # dark green
    "appstore_screenshot_5_events": "3D1050",   # dark purple
}

def get_color_for_file(filename):
    """Get background color based on screenshot name."""
    for key, color in SCREENSHOT_COLORS.items():
        if key in filename:
            return color
    return "000000"

def resize_and_pad(src, dst, target_w, target_h, bg_color):
    """Resize image to fit width, then pad with background color to target height."""
    # Copy source
    subprocess.run(["cp", src, dst], check=True)
    
    # Scale to target width, maintaining aspect ratio based on width
    # Source is 1024x1024, so scaled_h = target_w (it's square)
    scaled_h = target_w  # since source is square
    
    subprocess.run(
        ["sips", "-z", str(scaled_h), str(target_w), dst],
        capture_output=True, check=True
    )
    
    # Pad to target height with background color
    subprocess.run(
        ["sips", "--padToHeightWidth", str(target_h), str(target_w),
         "--padColor", bg_color, dst],
        capture_output=True, check=True
    )

def main():
    os.makedirs(IPHONE_DIR, exist_ok=True)
    os.makedirs(IPAD_DIR, exist_ok=True)
    
    targets = [
        ("iPhone 6.7\"", IPHONE_DIR, 1290, 2796),
        ("iPad 12.9\"", IPAD_DIR, 2048, 2732),
    ]
    
    screenshots = sorted([
        f for f in os.listdir(SRC_DIR) 
        if f.startswith("appstore_screenshot_") and f.endswith(".png")
    ])
    
    for label, out_dir, tw, th in targets:
        print(f"\n=== {label} ({tw}x{th}) ===")
        for fname in screenshots:
            src = os.path.join(SRC_DIR, fname)
            dst = os.path.join(out_dir, fname)
            bg_color = get_color_for_file(fname)
            
            print(f"  {fname} (bg: #{bg_color})")
            resize_and_pad(src, dst, tw, th, bg_color)
            
            # Verify
            result = subprocess.run(
                ["sips", "-g", "pixelHeight", "-g", "pixelWidth", dst],
                capture_output=True, text=True
            )
            print(f"    ✓ {result.stdout.strip().split(chr(10))[-2].strip()}, "
                  f"{result.stdout.strip().split(chr(10))[-1].strip()}")
    
    print("\n✅ All screenshots resized successfully!")
    print(f"   iPhone: {IPHONE_DIR}")
    print(f"   iPad:   {IPAD_DIR}")

if __name__ == "__main__":
    main()
