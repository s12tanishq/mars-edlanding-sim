# Model assets

The final build loads the optimized NASA/JPL Perseverance derivative at
`public/assets/perseverance-flight.glb`. The unmodified downloaded model remains
at `public/assets/perseverance.glb` for detailed inspection, and the procedural
mesh in `src/scene/FlightRover.js` is the loading fallback.

Both GLB files are loaded through Three.js GLTFLoader with the bundled Draco
decoder. Runtime normalization produces an approximately 3.1 m horizontal
vehicle extent without changing Physics dimensions or phase logic. Full source,
modification and license notes are in `docs/ASSET_CREDITS.md`.
