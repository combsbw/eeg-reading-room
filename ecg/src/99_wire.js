/* ============ tabs & atlas sub-sections ============ */
const SUBS={sys:buildSys,lead:buildLead,rate:buildRate,sig:buildSig},SID={pat:'#aPat',sys:'#aSys',lead:'#aLead',rate:'#aRate',sig:'#aSig'};
function redrawSub(){if(AX.cur==='pat'){aViewer.draw();return}(AX.draws[AX.cur]||[]).forEach(f=>f())}
function setSub(s){AX.cur=s;$$('#aSub button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sub===s)));Object.keys(SID).forEach(k=>$(SID[k]).hidden=k!==s);
  if(s!=='pat'&&!AX.built[s]){AX.built[s]=1;SUBS[s]()}if(s==='pat'&&!aCur)showAtlas('nsr');redrawSub()}
$$('#aSub button').forEach(b=>b.addEventListener('click',()=>setSub(b.dataset.sub)));
let rzT=0;const rzF=()=>{cancelAnimationFrame(rzT);rzT=requestAnimationFrame(()=>{if(!$('#tab-atlas').hidden)redrawSub()})};
if(window.ResizeObserver)new ResizeObserver(rzF).observe($('#tab-atlas'));window.addEventListener('resize',rzF);
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{rzF();if(S.q)qViewer.draw()})}catch(_){}
function setTab(t){$$('.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));['quiz','atlas','dash'].forEach(k=>$('#tab-'+k).hidden=k!==t);
  if(t==='dash')renderDash();if(t==='atlas'){if(!aCur&&AX.cur==='pat')showAtlas('nsr');setTimeout(redrawSub,0)}if(t==='quiz')setTimeout(()=>qViewer.draw(),0);
  try{history.replaceState(null,'','#'+t)}catch(_){}}
$$('.tabs button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
buildAtlasList();
const h0=(location.hash||'').slice(1),hs=h0.split('/');if(['quiz','atlas','dash'].includes(hs[0]))setTab(hs[0]);if(hs[0]==='atlas'&&SUBS[hs[1]])setSub(hs[1]);
window.__ecg={GEN,generate,P,PM,setTab,setSub,showAtlas,S,newQ,measOptions};
})();
