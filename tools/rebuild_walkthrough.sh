#!/bin/zsh
# Re-export the Blender home to the web walkthrough. Run from anywhere.
set -e
HERE="${0:A:h}"; W="${HERE:h}"; P="${W:h}"
B=/Applications/Blender.app/Contents/MacOS/Blender
"$B" -b "$P/versions/v2/home_v2.blend" --python "$HERE/export_home.py" -- "$W" "$P/versions/v2/architecture.json"
"$B" -b --python "$HERE/grid_to_bin_and_png.py" -- "$W" "$W/grid_preview.png"
echo "Done. Serve with: cd $W && python3 -m http.server 8000"
