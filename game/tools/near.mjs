import { NodeIO } from '@gltf-transform/core';
const doc = await new NodeIO().read(process.argv[2]);
const [cx,cz,r]=process.argv.slice(3).map(Number);
for (const node of doc.getRoot().listNodes()) {
  const mesh=node.getMesh(); if(!mesh) continue;
  for (const p of mesh.listPrimitives()){
    const pos=p.getAttribute('POSITION'); const idx=p.getIndices();
    const n=idx?idx.getCount():pos.getCount();
    for(let t=0;t<n;t+=3){
      const vs=[0,1,2].map(k=>{const v=[0,0,0];pos.getElement(idx?idx.getScalar(t+k):t+k,v);return v.map(x=>x/1000);});
      const c=[0,1,2].map(k=>(vs[0][k]+vs[1][k]+vs[2][k])/3);
      const near = vs.some(v=>Math.hypot(v[0]-cx,v[2]-cz)<r);
      if(near) console.log(node.getName().slice(0,7), t/3, vs.map(v=>v.map(x=>x.toFixed(2)).join('/')).join('  '));
    }
  }
}
