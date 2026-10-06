/* ============ tabs ============ */
function setTab(t){$$('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t));['quiz','atlas','dash'].forEach(k=>$('#tab-'+k).hidden=k!==t);
  if(t==='dash')renderDash();if(t==='atlas'&&!aCur)showAtlas('awake');if(t==='atlas')setTimeout(redrawSub,0);if(t==='quiz')setTimeout(()=>qViewer.draw(),0);
  try{history.replaceState(null,'','#'+t)}catch(_){}}
$$('.tabs button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
buildAtlasList();

const h0=(location.hash||'').slice(1);if(['quiz','atlas','dash'].includes(h0))setTab(h0);
const hs=h0.split('/');if(hs[0]==='atlas'&&SUBS[hs[1]]){setTab('atlas');setSub(hs[1])}
})();
