# Asset credits and provenance

Assets are stored locally for reliable demos. No NASA endorsement is implied. Keep this file with distributions and retain the on-screen credits.

## Rover

- File: `public/assets/perseverance.glb` (downloaded original, not edited).
- Flight derivative: `public/assets/perseverance-flight.glb`, generated locally from that original with glTF Transform and meshoptimizer. Animations removed, compatible primitives joined, geometry simplified with ratio .2 / error .008, textures resized to at most 512px and recompressed. 46,809 triangles, 118 primitives, 43 materials, 20 image resources; 1,230,452 bytes. This is a modified asset, not the original NASA file.
- Creator/source: NASA/Jet Propulsion Laboratory.
- Source page: https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/
- Original download: https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/mars-2020-perseverance-rover/Mars%202020%20Perseverance%20Rover.glb
- Runtime changes: normalization to roughly 3.1 m horizontal extent, centering, shadows. Embedded animation clips are not played.
- NASA media guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/

NASA content is generally not subject to copyright in the United States, but this is not a blanket license for every third-party work or NASA mark. Preserve source credit; review the linked guidelines for your intended distribution. Do not imply affiliation or endorsement.

## Photographic sky source

- File: `public/assets/mars-panorama.jpg`, PIA26080 (original 9000 × 2425 JPEG).
- Credit: NASA/JPL-Caltech/ASU/MSSS.
- Source: https://www.jpl.nasa.gov/images/pia26080-perseverances-360-degree-view-from-airey-hill/
- Download: https://d2pn8kiwq2w21t.cloudfront.net/original_images/PIA26080.jpg
- Shader displays only the unobstructed top sky strip, extends the zenith with a gradient and varies presentation exposure with altitude. It is not a full spherical HDR image or measured atmospheric simulation. The source file is unchanged.
- JPL image policy: https://www.jpl.nasa.gov/jpl-image-use-policy/

## Global Mars mosaic

- Files: `public/assets/mars-viking-z2/`, 32 locally bundled 256 px WMTS tiles assembled at runtime into a 2048 × 1024 equirectangular map.
- Product: Viking VIS, Global Color Mosaic (`Mars_Viking_MDIM21_ClrMosaic_global_232m`).
- Credit: NASA/JPL/USGS.
- Source and API documentation: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars
- Runtime use: direct albedo map for the orbital globe and the far-distance terrain surrounding the Jezero landing region. The close landing material is not replaced.
- The bundled level-2 tiles are unedited source imagery. The renderer performs lighting, mipmapping and a smooth distance blend into the local ground material.
- Files: `public/assets/mars-jezero-z9/`, 16 locally bundled 256 px PNG tiles assembled into a 1024 × 1024 orbital-detail map.
- Product: Northeast Syrtis–Jezero Midway Visible Mosaic, combining HiRISE, CTX and HRSC imagery (`NES_JEZ_MID_Visible_Mosaic_HiRISE_CTX_HRSC_GCS_MARS_07-10-2018`).
- Runtime use: real monochrome orbital detail over the high-altitude landing corridor. Its luminance modulates the Viking colour mosaic; transparent/no-data regions fall back to Viking imagery.

## Ground materials

- Source: Poly Haven, Rocky Terrain 02: https://polyhaven.com/a/rocky_terrain_02
- License: CC0, https://polyhaven.com/license
- Locally renamed 1K JPG diffuse, OpenGL normal and roughness maps: `terrain-color.jpg`, `terrain-normal.jpg`, `terrain-roughness.jpg`.
- Originals: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rocky_terrain_02/
- Runtime mineral colour grading removes the terrestrial green tint; the maps supply close-range surface detail. These are not photographed Martian soil textures. Above the local landing view, the renderer instead uses the NASA Viking mosaic credited above.

## Decoder and code

- Draco WebAssembly decoder and wrapper copied from Three.js 0.180.0, `examples/jsm/libs/draco/gltf/`.
- Draco license: Apache 2.0, retained at `public/draco/LICENSE.txt`.
- Three.js license: MIT, retained at `public/draco/THREE-LICENSE.txt`.
- Three.js and React dependencies remain the versions in package-lock.json.

Entry shell, heat shield, parachute, descent stage, terrain geometry, particles and HUD are custom project work. They are illustrative, not additional NASA models.
