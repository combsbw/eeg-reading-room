
/* ============ atlas: mechanisms page ============ */
function buildMech(){const H=$('#aMech');H.innerHTML='';AX.draws.mech=[];
  const labs=[['ap','Action potentials & ions',buildApLab],['cond','Conduction system',typeof buildCondLab==='function'?buildCondLab:null],['cor','Coronary flow & occlusion',typeof buildCorLab==='function'?buildCorLab:null]].filter(x=>x[2]);
  const nav=el('div','row');H.appendChild(nav);const box=el('div','stack');H.appendChild(box);const made={};
  const show=k=>{$$('.mpane',box).forEach(p=>p.hidden=p.dataset.k!==k);if(!made[k]){const p=el('div','stack mpane');p.dataset.k=k;box.appendChild(p);made[k]=labs.find(l=>l[0]===k)[2](p)}AX.draws.mech=[()=>made[k]&&made[k].draw&&made[k].draw()];setTimeout(()=>AX.draws.mech.forEach(f=>f()),0)};
  const sg=segment(nav,labs.map(l=>[l[0],l[1]]),'ap',show);show('ap');AX.mechShow=k=>{const b=$$('button',sg).find(x=>x.dataset.v===k);if(b)b.click()}}
function openLab(k){setTab('atlas');setSub('mech');if(AX.mechShow)AX.mechShow(k);window.scrollTo({top:0,behavior:'smooth'})}
