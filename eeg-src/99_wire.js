/* ============ tabs & atlas sub-sections ============ */
const fnOr=f=>typeof f==='function'?f:null;
const SUBS={evo:fnOr(typeof buildEvo==='function'?buildEvo:null),mech:fnOr(typeof buildLabs==='function'?buildLabs:null),rhy:buildRhy,lead:buildLead,sig:buildSig,
  rep:fnOr(typeof buildReport==='function'?buildReport:null),edf:fnOr(typeof buildEdf==='function'?buildEdf:null),nfb:fnOr(typeof buildNfb==='function'?buildNfb:null),case:fnOr(typeof buildCase==='function'?buildCase:null)};
const SID={pat:'#aPat',evo:'#aEvo',mech:'#aMech',rhy:'#aRhy',lead:'#aLead',sig:'#aSig',rep:'#aRep',edf:'#aEdf',nfb:'#aNfb',case:'#aCase'};
Object.keys(SID).forEach(k=>{if(!$(SID[k])||(k!=='pat'&&!SUBS[k])){delete SID[k];const b=$(`#aSub [data-sub="${k}"]`);if(b)b.remove()}});
function redrawSub(){if(AX.cur==='pat'){aViewer.draw();return}(AX.draws[AX.cur]||[]).forEach(f=>f())}
function setSub(s){if(!SID[s])s='pat';AX.cur=s;$$('#aSub button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sub===s)));Object.keys(SID).forEach(k=>$(SID[k]).hidden=k!==s);
  if(s!=='pat'&&!AX.built[s]){AX.built[s]=1;SUBS[s]($(SID[s]))}if(s==='pat'&&!aCur)showAtlas('awake');redrawSub()}
$$('#aSub button').forEach(b=>b.addEventListener('click',()=>setSub(b.dataset.sub)));
let rzT=0;const rzF=()=>{cancelAnimationFrame(rzT);rzT=requestAnimationFrame(()=>{if(!$('#tab-atlas').hidden)redrawSub()})};
if(window.ResizeObserver)new ResizeObserver(rzF).observe($('#tab-atlas'));window.addEventListener('resize',rzF);
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{rzF();if(S.q)qViewer.draw()})}catch(_){}
function setTab(t){$$('.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));['path','quiz','atlas','dash'].forEach(k=>$('#tab-'+k).hidden=k!==t);if(t==='path')LRN.render($('#tab-path'));
  if(t==='dash')renderDash();if(t==='atlas'){if(!aCur&&AX.cur==='pat')showAtlas('awake');setTimeout(redrawSub,0)}if(t==='quiz')setTimeout(()=>qViewer.draw(),0);
  try{history.replaceState(null,'','#'+t)}catch(_){}}
$$('.tabs button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
buildAtlasList();
LRN.applySettings();const h0=(location.hash||'').slice(1),hs=h0.split('/');if(['path','quiz','atlas','dash'].includes(hs[0]))setTab(hs[0]);else setTab('path');if(hs[0]==='atlas'&&SID[hs[1]])setSub(hs[1]);
window.__eeg={GEN,generate,P,PM,CON,CIDX,CAT,showAtlas,setTab,setSub,showQ,newQ,descQ,locQ,clickQ,bgQ,caseQ,mechQ,anaQ,stageQ,LRN,MODS,S,DB:()=>DB,
  SCN:typeof SCN!=='undefined'?SCN:null,newTrajQ:typeof newTrajQ==='function'?newTrajQ:null,openEvo:typeof openEvo==='function'?openEvo:null};
})();
