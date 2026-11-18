import { NodeIO } from '@gltf-transform/core';
const io = new NodeIO();
const doc = await io.read(process.argv[2]);
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  for (const p of mesh.listPrimitives()) {
    const pos = p.getAttribute('POSITION');
    const min=[1e9,1e9,1e9], max=[-1e9,-1e9,-1e9];
    const v=[0,0,0];
    for (let i=0;i<pos.getCount();i++){pos.getElement(i,v);for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}}
    const mat=p.getMaterial();
    console.log(node.getName().slice(0,40), mat?.getName(), 'tris', (p.getIndices()?.getCount()??pos.getCount())/3, 'min', min.map(x=>x.toFixed(1)).join(','), 'max', max.map(x=>x.toFixed(1)).join(','), 'T', node.getTranslation().map(x=>x.toFixed(1)).join(','), 'S', node.getScale().join(','), 'R', node.getRotation().map(x=>x.toFixed(2)).join(','));
  }
}
