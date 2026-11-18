// Welche Modell-Dreiecke liegen im geplanten Innenraum (Eingangs-Koordinaten)?
import { NodeIO } from '@gltf-transform/core';
const doc = await new NodeIO().read('public/modell/grg15-gebaeude.glb');
const E=[-2.70,-33.055], W=-0.1101, c=Math.cos(W), s=Math.sin(W);
const lokal=(x,z)=>{const dx=x-E[0], dz=z-E[1]; return [dx*c - dz*s, dx*s + dz*c];}; // inverse Drehung
const [x0,x1,z0,z1]=process.argv.slice(2).map(Number);
const out={};
for (const node of doc.getRoot().listNodes()) { const mesh=node.getMesh(); if(!mesh) continue;
 for (const p of mesh.listPrimitives()){ const pos=p.getAttribute('POSITION'), idx=p.getIndices(); const n=idx?idx.getCount():pos.getCount();
  for(let t=0;t<n;t+=3){ const v=[0,1,2].map(k=>{const a=[0,0,0];pos.getElement(idx?idx.getScalar(t+k):t+k,a);return a.map(q=>q/1000);});
   // Punkte entlang des Dreiecks abtasten
   for (const [a,b] of [[0.33,0.33],[0.8,0.1],[0.1,0.8],[0.1,0.1]]) { const x=v[0][0]+(v[1][0]-v[0][0])*a+(v[2][0]-v[0][0])*b, z=v[0][2]+(v[1][2]-v[0][2])*a+(v[2][2]-v[0][2])*b, y=v[0][1]+(v[1][1]-v[0][1])*a+(v[2][1]-v[0][1])*b;
    const [lx,lz]=lokal(x,z); if(lx>x0&&lx<x1&&lz>z0&&lz<z1&&y<11){ const k=node.getName().slice(0,7); out[k]=out[k]||[]; out[k].push([lx.toFixed(1),(y+1.1).toFixed(1),lz.toFixed(1)].join('/')); break; } } } } }
for (const k in out) console.log(k, out[k].length, out[k].slice(0,8).join('  '));
// Glasdach in lokalen Koordinaten
