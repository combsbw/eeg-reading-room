/* ============ atlas: patterns ============ */
let aCur=null,aSeed=1;
function buildAtlasList(){const l=$('#aList'),sl=$('#aSel');l.innerHTML='';sl.innerHTML='';Object.keys(CAT).forEach(c=>{l.appendChild(el('h3',null,CAT[c]));const og=document.createElement('optgroup');og.label=CAT[c];
  P.filter(p=>p.cat===c).forEach(p=>{const b=el('button',null,p.name);b.type='button';b.dataset.id=p.id;b.addEventListener('click',()=>showAtlas(p.id));l.appendChild(b);og.appendChild(new Option(p.name,p.id))});sl.appendChild(og)});sl.addEventListener('change',()=>showAtlas(sl.value))}
function showAtlas(id,seed){aCur=id;aSeed=seed??Math.floor(Math.random()*1e9);const p=PM[id];$$('#aList button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.id===id)));$('#aSel').value=id;
  $('#aName').textContent=p.name;const pc=$('#aCat');pc.textContent=CAT[p.cat];pc.className='pill '+p.cat;
  const rec=generate(id,aSeed);aViewer.setRec(rec);aViewer.setAnn($('#aAnn').checked);
  const wy=$('#aWhy');wy.hidden=!p.mech;wy.innerHTML=p.mech?`<h3>Why it looks this way</h3><p style="margin:0;max-width:96ch">${p.mech}</p>${conChips(p.con,id)}`:'';
  const sim=(p.sim||[]).map(s=>{const t=(p.vs&&p.vs[s])||(PM[s].vs&&PM[s].vs[id]);return t?`<li><b>${PM[s].name}.</b> ${t}</li>`:''}).join('');const mt=metaTable(rec);
  $('#aInfo').innerHTML=`<div class="stack" style="gap:12px"><div><h3>What to look for</h3><ul class="f">${p.feats.map(f=>`<li>${f}</li>`).join('')}</ul></div>${mt?`<div><h3>This example</h3>${mt}</div>`:''}</div><div class="stack" style="gap:12px"><div><h3>Clinical note</h3><p style="margin-top:6px">${p.sig}</p></div>${p.q2?`<div><h3>Key question</h3><p style="margin-top:6px"><b>${p.q2.q}</b> ${p.q2.opts[p.q2.a]}. ${p.q2.why}</p></div>`:''}${sim?`<div><h3>Do not confuse with</h3><ul class="f">${sim}</ul></div>`:''}</div>`}
$('#aNew').addEventListener('click',()=>aCur&&showAtlas(aCur));
$('#aAnn').addEventListener('change',e=>aViewer.setAnn(e.target.checked));
function openAtlas(id,seed){setTab('atlas');setSub('pat');showAtlas(id,seed)}
