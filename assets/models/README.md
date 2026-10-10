# 3D models served to the frontend

One file per car, named exactly like the car's `slug` in the database:

    porsche-911-gt3-rs.glb
    suzuki-swift.glb
    apex-f1gt.glb

`apex-f1gt.glb` is a reserved placeholder path and is not included yet. The frontend shows a named vehicle placeholder until the licensed model asset is added.

They are served at `http://<backend>/assets/models/<slug>.glb`. A `.gltf` + `.bin` + textures set must first be packed into one `.glb`:

    cd frontend
    npm run convert -- "C:\path\to\scene.gltf" suzuki-swift      # writes assets/models/suzuki-swift.glb
    npm run inspect                                               # lists the part/material names inside each GLB
