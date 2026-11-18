"""Wandelt schmelz-original.skp in grg15-gebaeude.glb um (so wie im Vorgänger-Thread).

Voraussetzung:  pip install openskp==1.5.0 pillow trimesh
Aufruf:         python konvertieren.py schmelz-original.skp grg15-gebaeude.glb

Was passiert:
1. OpenSKP (Open Source, MIT, Reverse Engineering des SketchUp-Formats) liest die .skp
   und exportiert eine GLB mit eingebetteten Texturen.
2. Die Google-Earth-Ebenen (altes Luftbild + grobes Gelände) fliegen raus,
   weil das Luftbild Google gehört und nicht veröffentlicht werden darf.
3. Skalierung von Millimetern auf Meter (glTF-Standard: 1 Einheit = 1 m).
"""
import sys
import tempfile
import os

import trimesh
from openskp import SkpFile
from openskp.export import glb

src, dst = sys.argv[1], sys.argv[2]

with tempfile.TemporaryDirectory() as tmp:
    roh = os.path.join(tmp, "roh.glb")
    skp = SkpFile.open(src)
    skp.parse()
    glb.export(skp, roh, textures=True)

    szene = trimesh.load(roh)
    for knoten in list(szene.graph.nodes_geometry):
        if "Google" in knoten:
            szene.delete_geometry(szene.graph[knoten][1])
    szene.apply_scale(0.001)
    szene.export(dst)
    print(dst, "Ausdehnung in m (x, y=Höhe, z):", szene.extents.round(1))
