# Texture assets

The final build bundles 1K terrain colour, normal and roughness maps, the Mars
panorama and NASA Viking MDIM global colour tiles under `public/assets/`. Colour
data is treated as sRGB and surface data as linear. Runtime mineral grading
adapts the CC0 terrain scan to the close-range Mars palette; the Viking mosaic
supplies orbital and far-distance terrain colour. Provenance and usage notes are
recorded in `docs/ASSET_CREDITS.md`.
