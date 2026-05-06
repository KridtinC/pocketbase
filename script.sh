# Quick download via gh or curl:
for t in normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy; do
  curl -sL "https://raw.githubusercontent.com/partywhale/pokemon-type-icons/main/icons/${t}.svg" \
       -o "web/public/types/${t}.svg"
done
