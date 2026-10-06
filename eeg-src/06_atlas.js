/* ============ atlas ============ */
let aCur=null,aSeed=1;
function buildAtlasList(){const l=$('#aList');l.innerHTML='';Object.keys(CAT).forEach(c=>{l.appendChild(el('h3',null,CAT[c]));P.filter(p=>p.cat===c).forEach(p=>{const b=el('button',null,p.name);b.type='button';b.dataset.id=p.id;b.addEventListener('click',()=>showAtlas(p.id));l.appendChild(b)})})}
function showAtlas(id,seed){aCur=id;aSeed=seed??Math.floor(Math.random()*1e9);const p=PM[id];$$('#aList button').forEach(b=>b.setAttribute('aria-current',b.dataset.id===id));
  $('#aName').textContent=p.name;const pc=$('#aCat');pc.textContent=CAT[p.cat];pc.className='pill '+p.cat;
  const rec=generate(id,aSeed);aViewer.setRec(rec);aViewer.setAnn($('#aAnn').checked);
  const sim=(p.sim||[]).map(s=>{const t=p.vs&&p.vs[s];return t?`<li><b>${PM[s].name}.</b> ${t}</li>`:''}).join('');
  $('#aInfo').innerHTML=`<div><h3>What to look for</h3><ul class="f">${p.feats.map(f=>`<li>${f}</li>`).join('')}</ul></div><div class="stack" style="gap:12px"><div><h3>Clinical note</h3><p style="margin-top:6px">${p.sig}</p></div>${sim?`<div><h3>Do not confuse with</h3><ul class="f">${sim}</ul></div>`:''}</div>`}
$('#aNew').addEventListener('click',()=>aCur&&showAtlas(aCur));
$('#aAnn').addEventListener('change',e=>aViewer.setAnn(e.target.checked));
function openAtlas(id,seed){setTab('atlas');showAtlas(id,seed)}

