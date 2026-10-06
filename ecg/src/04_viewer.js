
/* ============ record pipeline ============ */
function computeMeta(R){const q=R.ev.q.filter(x=>x.t>=0&&x.t<DUR&&x.k!=='s').map(x=>x.t).sort((a,b)=>a-b),M=R.meta;
  M.hr=q.length>1?Math.round(60*(q.length-1)/(q[q.length-1]-q[0])):null;const rr=M.hr?60/M.hr:null;
  if(R.tm){const vm=R.tm.vm;M.qrs=Math.round(vm.qrsd*1000);M.qt=Math.round((vm.qt-vm.on)*1000);if(M.pr===undefined)M.pr=R.tm.pr!=null?Math.round(R.tm.pr*1000):null;
    if(rr){M.qtcB=Math.round(M.qt/Math.sqrt(rr));M.qtcF=Math.round(M.qt/Math.cbrt(rr))}}
  if(R.ms)M.axis=R.ms.axis;M.reg=M.reg||'reg';
  if(!M.prq)M.prq=M.pr==null?'none':M.pr<120?'short':M.pr>200?'long':'normal'}
function stThr(k){return k==='V2'||k==='V3'?.15:.1}
function autoST(R){if(!R.ms)return;const up=[],dn=[];LEADS.forEach(k=>{const s=R.ms.leads[k].st40;if(s>=stThr(k))up.push(k);else if(s<=-.05)dn.push(k)});
  if(up.length)hl(R,up,'ST elevation','a');if(dn.length)hl(R,dn,'ST depression','b')}
function generate(pid,seed){const R=newRec(seed>>>0);GEN[pid](R);R.L=deriveLeads(R);R.ms=measure(R);computeMeta(R);if(R.autoST)autoST(R);R.pid=pid;R._c={};return R}

/* ============ 12-lead viewer ============ */
const LAYOUT={'3x4':[['I','aVR','V1','V4'],['II','aVL','V2','V5'],['III','aVF','V3','V6']],'6x2':[['I','V1'],['II','V2'],['III','V3'],['aVR','V4'],['aVL','V5'],['aVF','V6']],'12':LEADS.map(l=>[l])};
const FILT={diag:{hp:.05,lp:150,lab:'0.05–150 Hz'},st:{hp:.05,lp:40,lab:'0.05–40 Hz'},mon:{hp:.5,lp:40,lab:'0.5–40 Hz'}};
const DEFV={fmt:'3x4',gain:10,speed:25,filt:'diag',notch:false,strip:'II'};
function leadData(rec,v){const key=v.filt+'|'+v.notch;if(rec._c[key])return rec._c[key];const f=FILT[v.filt],o={};
  const P=1500;for(const k in rec.L){const s=rec.L[k],n=s.length,p=new Float32Array(n+P);for(let i=0;i<P;i++)p[i]=s[Math.min(n-1,P-i)];p.set(s,P);
    let x=rc1(p,f.hp,'hp');x=runbq(x,bq('lp',f.lp,.707));if(v.notch)x=runbq(x,bq('notch',60,30));o[k]=x.subarray(P)}rec._c[key]=o;return o}
const cssv=()=>{const s=getComputedStyle(document.documentElement),g=n=>s.getPropertyValue(n).trim();return{paper:g('--paper'),gmin:g('--gmin'),gmaj:g('--gmaj'),tr:g('--trace'),ink:g('--ink'),mu:g('--muted'),mk:g('--mark'),mb:g('--mark-bg'),ac:g('--accent'),panel:g('--panel'),line:g('--line'),good:g('--good'),bad:g('--bad'),mono:g('--font-mono'),ui:g('--font-ui')}};
function Viewer(host,opt={}){
  const self={rec:null,v:{...DEFV,...(opt.v||{})},ann:false,meas:null,overlay:null,cal:false};
  host.innerHTML='';const wrap=el('div','vwrap');
  wrap.innerHTML=(opt.tools===false?'':`<div class="vtools">
  <label>Layout <select data-k="fmt"><option value="3x4">3 × 4 + rhythm</option><option value="6x2">6 × 2 + rhythm</option><option value="12">12 × 1</option></select></label>
  <label>Rhythm strip <select data-k="strip">${LEADS.map(l=>`<option>${l}</option>`).join('')}</select></label>
  <label>Gain <select data-k="gain"><option value="5">5 mm/mV</option><option value="10">10 mm/mV</option><option value="20">20 mm/mV</option></select></label>
  <label>Speed <select data-k="speed"><option value="25">25 mm/s</option><option value="50">50 mm/s</option></select></label>
  <label>Filter <select data-k="filt"><option value="diag">Diagnostic 0.05–150</option><option value="st">ST 0.05–40</option><option value="mon">Monitor 0.5–40</option></select></label>
  <label class="chk"><input type="checkbox" data-k="notch"> 60 Hz notch</label>
  <button class="btn small" data-k="cal" type="button" aria-pressed="false" title="Turn on to measure with touch">Calipers</button>
  <button class="btn small" data-k="reset" type="button">Reset</button></div>`)+`<div class="vleg" hidden></div>
  <div class="vscroll"><canvas></canvas></div>
  <div class="vfoot"><span>${opt.foot||'Drag across the tracing to measure (calipers). Double-click to clear.'}</span><span class="read" aria-live="polite">&nbsp;</span></div>`;
  host.appendChild(wrap);
  const cv=$('canvas',wrap),sc=$('.vscroll',wrap),read=$('.read',wrap),leg=$('.vleg',wrap),ctx=cv.getContext('2d');let G={};
  const sync=()=>{$$('select[data-k],input[data-k]',wrap).forEach(c=>{const k=c.dataset.k;if(c.type==='checkbox')c.checked=self.v[k];else c.value=String(self.v[k])})};
  wrap.addEventListener('change',e=>{const c=e.target,k=c.dataset.k;if(!k)return;self.v[k]=c.type==='checkbox'?c.checked:(['fmt','filt','strip'].includes(k)?c.value:+c.value);self.draw()});
  const rb=$('[data-k=reset]',wrap);if(rb)rb.addEventListener('click',()=>{self.v={...DEFV,...(opt.v||{})};sync();self.meas=null;read.innerHTML='&nbsp;';self.draw()});
  const cb=$('[data-k=cal]',wrap);if(cb)cb.addEventListener('click',()=>{self.cal=!self.cal;cb.setAttribute('aria-pressed',String(self.cal));cv.style.touchAction=self.cal?'none':'pan-x pan-y'});
  self.setRec=rec=>{self.rec=rec;self.meas=null;read.innerHTML='&nbsp;';if(rec.opt&&rec.opt.strip){self.v.strip=rec.opt.strip;self._as=1}else if(self._as){self.v.strip=(opt.v&&opt.v.strip)||DEFV.strip;self._as=0}sync();self.draw()};
  self.setAnn=b=>{self.ann=b;self.draw()};
  self.setOverlay=f=>{self.overlay=f;self.draw()};
  self.draw=()=>{if(!self.rec)return;const rec=self.rec,v=self.v,D=leadData(rec,v),C=cssv(),dpr=window.devicePixelRatio||1;
    const lay=LAYOUT[v.fmt],cols=lay[0].length,strip=v.fmt!=='12'&&opt.strip!==false,nr=lay.length+(strip?1:0);
    const s=v.speed,g=v.gain,rowMM=v.fmt==='12'?{5:13,10:19,20:32}[g]:{5:17,10:27,20:44}[g],LM=3+.2*s+2,Wmm=LM+DUR*s+2;
    // annotation label levels (spans and points)
    const anns=self.ann?rec.ann:[],labs=anns.filter(a=>a.type!=='hl');let lev=0;const ends=[];
    const TMbase=4;const cw=Math.max(sc.clientWidth||700,320),pm=Math.max(opt.minPm??2.9,(cw-2)/Wmm);
    ctx.font='11px '+C.ui;const lab=labs.map(a=>{const t=a.type==='span'?a.t0:a.t,x=(LM+t*s)*pm,w=ctx.measureText(a.txt).width+12;let l=0;while(ends[l]!==undefined&&ends[l]>x-3)l++;ends[l]=x+w;lev=Math.max(lev,l+1);return{a,x,w,l}});
    const TOPpx=lev*17+(lev?4:0),Hmm=TMbase+nr*rowMM+5,W=Math.round(Wmm*pm),H=Math.round(Hmm*pm+TOPpx);
    cv.style.width=W+'px';cv.style.height=H+'px';cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const X=t=>(LM+t*s)*pm,Ymm=mm=>TOPpx+mm*pm;
    ctx.fillStyle=C.panel;ctx.fillRect(0,0,W,H);ctx.fillStyle=C.paper;ctx.fillRect(0,TOPpx,W,H-TOPpx);
    // grid
    const gx0=0,gy0=TOPpx;if(pm>=2.4){ctx.strokeStyle=C.gmin;ctx.lineWidth=1;ctx.beginPath();for(let m=0;m<=Wmm;m++){if(m%5===0)continue;const x=Math.round(m*pm)+.5;ctx.moveTo(x,gy0);ctx.lineTo(x,H)}for(let m=0;m<=Hmm;m++){if(m%5===0)continue;const y=Math.round(gy0+m*pm)+.5;ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke()}
    ctx.strokeStyle=C.gmaj;ctx.lineWidth=1;ctx.beginPath();for(let m=0;m<=Wmm;m+=5){const x=Math.round(m*pm)+.5;ctx.moveTo(x,gy0);ctx.lineTo(x,H)}for(let m=0;m<=Hmm;m+=5){const y=Math.round(gy0+m*pm)+.5;ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
    // rows
    const rows=[];lay.forEach((row,i)=>rows.push({leads:row,top:TMbase+i*rowMM}));if(strip)rows.push({leads:[v.strip],top:TMbase+lay.length*rowMM,strip:1});
    const cellOf={};rows.forEach((rw,i)=>{const ct=DUR/rw.leads.length;rw.leads.forEach((ld,c)=>{const cell={lead:ld,t0:c*ct,t1:(c+1)*ct,x0:X(c*ct),x1:X((c+1)*ct),y0:Ymm(rw.top),y1:Ymm(rw.top+rowMM),base:Ymm(rw.top+rowMM*.6),strip:!!rw.strip};if(!rw.strip||!cellOf[ld])cellOf[ld]=cellOf[ld]||cell;rw.cells=rw.cells||[];rw.cells.push(cell)})});
    G={pm,LM,s,g,X,Ymm,rows,cellOf,TOPpx,W,H,rowMM};
    // highlight boxes
    const hls=anns.filter(a=>a.type==='hl');
    hls.forEach(a=>{const col=a.k==='b'?C.ac:C.mk;rows.forEach(rw=>rw.cells.forEach(c=>{if(!a.leads.includes(c.lead)||(c.strip&&v.fmt!=='12'&&lay.flat().includes(c.lead)))return;ctx.fillStyle=col;ctx.globalAlpha=.09;ctx.fillRect(c.x0+1,c.y0+2,c.x1-c.x0-2,c.y1-c.y0-4);ctx.globalAlpha=.85;ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.strokeRect(c.x0+1.5,c.y0+2.5,c.x1-c.x0-3,c.y1-c.y0-5);ctx.globalAlpha=1}))});
    // spans
    anns.filter(a=>a.type==='span').forEach(a=>{ctx.fillStyle=C.mk;ctx.globalAlpha=.12;ctx.fillRect(X(a.t0),TOPpx,Math.max(3,X(a.t1)-X(a.t0)),H-TOPpx);ctx.globalAlpha=1});
    // traces
    ctx.lineJoin='round';ctx.lineCap='round';
    rows.forEach(rw=>rw.cells.forEach(c=>{const d=D[c.lead],i0=Math.max(0,Math.floor(c.t0*FS)),i1=Math.min(N-1,Math.ceil(c.t1*FS)-(c.t1<DUR?1:0));ctx.strokeStyle=C.tr;ctx.lineWidth=Math.max(1,pm*.34)*LRN.tw();ctx.beginPath();
      const step=pm*s/FS<.5?2:1;for(let i=i0;i<=i1;i+=step){const x=X(i/FS),y=c.base-d[i]*g*pm;i===i0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke();
      if(c.t0>0){ctx.strokeStyle=C.tr;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(c.x0,c.base-3*pm);ctx.lineTo(c.x0,c.base+3*pm);ctx.stroke()}
      ctx.fillStyle=C.ink;ctx.font=`600 ${Math.max(11,Math.round(pm*3))}px `+C.ui;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(c.lead,c.x0+pm*1.2,c.y0+pm*4.2)}));
    // calibration pulses
    rows.forEach(rw=>{const b=rw.cells[0].base,x0=2*pm,w=.2*s*pm,h=g*pm;ctx.strokeStyle=C.tr;ctx.lineWidth=Math.max(1,pm*.34)*LRN.tw();ctx.beginPath();ctx.moveTo(.5*pm,b);ctx.lineTo(x0,b);ctx.lineTo(x0,b-h);ctx.lineTo(x0+w,b-h);ctx.lineTo(x0+w,b);ctx.lineTo(x0+w+pm,b);ctx.stroke()});
    // labels for spans/points
    lab.forEach(o=>{const y=6+o.l*17;ctx.font='11px '+C.ui;ctx.textBaseline='middle';ctx.fillStyle=C.mk;ctx.globalAlpha=.15;ctx.fillRect(o.x,y-1,o.w,15);ctx.globalAlpha=1;ctx.fillRect(o.x,y-1,2,15);ctx.fillStyle=C.ink;ctx.textAlign='left';ctx.fillText(o.a.txt,o.x+6,y+7);
      if(o.a.type==='pt'){const sr=rows[rows.length-1];ctx.strokeStyle=C.mk;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(o.x,y+14);ctx.lineTo(o.x,Ymm(sr.top+rowMM*.15));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=C.mk;ctx.beginPath();const ty=Ymm(sr.top+rowMM*.15);ctx.moveTo(o.x-5,ty-7);ctx.lineTo(o.x+5,ty-7);ctx.lineTo(o.x,ty);ctx.fill()}});
    ctx.textBaseline='alphabetic';
    // footer
    ctx.fillStyle=C.mu;ctx.font='11px '+C.mono;ctx.textAlign='right';ctx.fillText(`${s} mm/s · ${g} mm/mV · ${FILT[v.filt].lab}${v.notch?' · notch':''}`,W-6,H-5);
    if(self.overlay)self.overlay(ctx,G,C);
    // calipers
    if(self.meas){const[a,b]=self.meas,xa=X(a.t),xb=X(b.t);ctx.strokeStyle=C.mk;ctx.lineWidth=1.3;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(xa,TOPpx);ctx.lineTo(xa,H);ctx.moveTo(xb,TOPpx);ctx.lineTo(xb,H);ctx.stroke();
      ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(xa,a.y);ctx.lineTo(xb,a.y);ctx.stroke();if(Math.abs(b.y-a.y)>4){ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(xb-14,b.y);ctx.lineTo(xb+14,b.y);ctx.moveTo(xb,a.y);ctx.lineTo(xb,b.y);ctx.stroke();ctx.setLineDash([])}}
    // legend for lead highlights
    if(hls.length){leg.hidden=false;leg.innerHTML=hls.map(a=>`<span class="lg ${a.k==='b'?'b':'a'}"><i></i>${a.txt}: <b>${a.leads.join(', ')}</b></span>`).join('')}else leg.hidden=true};
  const pos=e=>{const b=cv.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top}};
  const tOf=x=>clamp((x/G.pm-G.LM)/G.s,0,DUR);
  const show=()=>{if(!self.meas)return;const[a,b]=self.meas,dt=Math.abs(b.t-a.t),dv=(a.y-b.y)/(G.g*G.pm);read.textContent=dt<.01?'':`Δt ${(dt*1000).toFixed(0)} ms · ${(dt*25).toFixed(1)} small boxes · rate ${(60/dt).toFixed(0)}/min${Math.abs(dv)>.04?` · ΔV ${dv.toFixed(2)} mV (${(dv*10).toFixed(1)} mm)`:''}`};
  let drag=false;
  cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!self.cal)return;drag=true;const p=pos(e);self.meas=[{t:tOf(p.x),y:p.y},{t:tOf(p.x),y:p.y}];try{cv.setPointerCapture(e.pointerId)}catch(_){}self.draw();show();e.preventDefault()});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const p=pos(e);self.meas[1]={t:tOf(p.x),y:p.y};self.draw();show()});
  cv.addEventListener('pointerup',()=>{drag=false;if(self.meas&&Math.abs(self.meas[1].t-self.meas[0].t)<.015&&Math.abs(self.meas[1].y-self.meas[0].y)<4){self.meas=null;read.innerHTML='&nbsp;';self.draw()}});
  cv.addEventListener('dblclick',()=>{self.meas=null;read.innerHTML='&nbsp;';self.draw()});
  cv.style.touchAction='pan-x pan-y';
  if(window.ResizeObserver)new ResizeObserver(()=>self.draw()).observe(sc);
  try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>setTimeout(self.draw,30))}catch(_){}
  self.geo=()=>G;return self}
