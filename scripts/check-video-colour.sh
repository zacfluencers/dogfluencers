#!/bin/sh
# Lists any video in public/ not tagged as standard (BT.709) colour.
# iPhone footage is often HDR (HLG, BT.2020); an encode that keeps that tag
# makes browsers show the clip brighter than the rest. Fix a listed file with:
#   ffmpeg -i in.mp4 -map 0 -c copy \
#     -bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1 \
#     -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart out.mp4
status=0
for f in $(find public -name '*.mp4'); do
  t=$(ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer -of csv=p=0 "$f" | head -1 | tr -d ,)
  if [ "$t" != "bt709" ]; then echo "$f: $t"; status=1; fi
done
[ $status -eq 0 ] && echo "All videos are BT.709."
exit $status
