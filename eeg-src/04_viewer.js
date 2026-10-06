/* ============ montages & rendering ============ */
const TCP=[['Fp1','F7'],['F7','T3'],['T3','T5'],['T5','O1'],['Fp2','F8'],['F8','T4'],['T4','T6'],['T6','O2'],['T3','C3'],['C3','Cz'],['Cz','C4'],['C4','T4'],['Fp1','F3'],['F3','C3'],['C3','P3'],['P3','O1'],['Fp2','F4'],['F4','C4'],['C4','P4'],['P4','O2']];
const TRANS=[['Fp1','Fp2'],['F7','F3'],['F3','Fz'],['Fz','F4'],['F4','F8'],['T3','C3'],['C3','Cz'],['Cz','C4'],['C4','T4'],['T5','P3'],['P3','Pz'],['Pz','P4'],['P4','T6'],['O1','O2']];
const AVGL=['Fp1','F3','C3','P3','O1','F7','T3','T5','Fz','Cz','Pz','Fp2','F4','C4','P4','O2','F8','T4','T6'];
const DEF={mont:'tcp',sens:7,lff:1,hff:70,notch:false};
function buildRows(rec,v){const key=[v.mont,v.lff,v.hff,v.notch].join('|');if(rec._c[key])return rec._c[key];
  const rows=[];const push=(label,sig,grp)=>{let x=sig;if(v.lff>0)x=runbq(x,bq('hp',v.lff,.707));if(v.hff<95)x=runbq(x,bq('lp',v.hff,.707));if(v.notch)x=runbq(x,bq('notch',60,25));rows.push({label,data:Float32Array.from(x),grp})};
  if(v.mont==='avg'){const m=new Float32Array(N);for(let e=0;e<NE;e++)for(let n=0;n<N;n++)m[n]+=rec.V[e][n]/NE;AVGL.forEach((k,i)=>{const s=new Float32Array(N),V=rec.V[IX[k]];for(let n=0;n<N;n++)s[n]=V[n]-m[n];push(k+'-Av',s,Math.floor(i/5))})}
  else{const pairs=v.mont==='tcp'?TCP:TRANS,gs=v.mont==='tcp'?4:5;pairs.forEach(([a,b],i)=>{const s=new Float32Array(N),A=rec.V[IX[a]],B=rec.V[IX[b]];for(let n=0;n<N;n++)s[n]=A[n]-B[n];push(a+'-'+b,s,Math.floor(i/gs))})}
  rows.push({label:'ECG',data:rec.ecg,grp:99,ecg:true});rec._c[key]=rows;return rows}

function Viewer(host){
  const self={rec:null,v:{...DEF},ann:false,meas:null,done:null};
  host.innerHTML='';const wrap=el('div','vwrap');
  wrap.innerHTML=`<div class="vtools">
  <label>Montage <select data-k="mont"><option value="tcp">Double banana</option><option value="avg">Average reference</option><option value="trans">Transverse</option></select></label>
  <label>Sensitivity <select data-k="sens">${[2,3,5,7,10,15,20,30,50].map(x=>`<option value="${x}">${x} µV/mm</option>`).join('')}</select></label>
  <label>LFF <select data-k="lff"><option value="0.3">0.3 Hz</option><option value="1">1 Hz</option><option value="5">5 Hz</option></select></label>
  <label>HFF <select data-k="hff"><option value="70">70 Hz</option><option value="35">35 Hz</option><option value="15">15 Hz</option></select></label>
  <label class="chk"><input type="checkbox" data-k="notch"> 60 Hz notch</label>
  <button class="btn small" data-k="reset" type="button">Reset display</button></div>
  <div class="vscroll"><canvas></canvas></div>
  <div class="vfoot"><span>Drag on the tracing to measure. Double-click to clear.</span><span class="read" aria-live="polite">&nbsp;</span></div>`;
  host.appendChild(wrap);
  const cv=$('canvas',wrap),sc=$('.vscroll',wrap),read=$('.read',wrap),ctx=cv.getContext('2d');
  let geo={};
  const sync=()=>{$$('[data-k]',wrap).forEach(c=>{const k=c.dataset.k;if(k==='reset')return;if(c.type==='checkbox')c.checked=self.v[k];else c.value=String(self.v[k])})};
  wrap.addEventListener('change',e=>{const c=e.target,k=c.dataset.k;if(!k)return;self.v[k]=c.type==='checkbox'?c.checked:(k==='mont'?c.value:+c.value);self.draw()});
  $('[data-k=reset]',wrap).addEventListener('click',()=>{self.v={...DEF,sens:self.rec&&self.rec.sens?self.rec.sens:DEF.sens};sync();self.draw()});
  const col=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  self.setRec=rec=>{self.rec=rec;self.marks=[];self.v={...DEF,sens:rec.sens||DEF.sens};self.meas=null;read.innerHTML='&nbsp;';sync();self.draw()};
  self.setAnn=b=>{self.ann=b;self.draw()};
  self.draw=()=>{if(!self.rec)return;const rec=self.rec,rows=buildRows(rec,self.v);const dpr=window.devicePixelRatio||1;
    const cw=Math.max(sc.clientWidth||640,640),LBL=cw<720?58:72,RP=10,rowH=26,gap=7,pxmm=3.6;
    const cs={bg:col('--panel'),tr:col('--trace'),gr:col('--grid'),gm:col('--grid-major'),mu:col('--muted'),ecg:col('--ecg'),mk:col('--mark'),mb:col('--mark-bg'),ink:col('--ink')};
    ctx.font='11px '+col('--font-mono');
    // annotation levels
    const plotW=cw-LBL-RP,X=t=>LBL+t/DUR*plotW;let levels=0;const chips=[];
    if(self.ann){const ends=[];for(const a of rec.ann.slice().sort((p,q)=>p.t0-q.t0)){const w=ctx.measureText(a.txt).width+12;let x0=X(a.t0);if(x0+w>cw-4)x0=cw-4-w;let l=0;while(ends[l]!==undefined&&ends[l]>x0-4)l++;ends[l]=x0+w;chips.push({a,x0,w,l});levels=Math.max(levels,l+1)}}
    const FOOT=38,top=26+levels*18;let ng=0,lastg=-1;rows.forEach(r=>{if(r.grp!==lastg){if(lastg!==-1)ng++;lastg=r.grp}});
    const H=top+rows.length*rowH+ng*gap+FOOT+4;cv.style.width=cw+'px';cv.style.height=H+'px';cv.width=Math.round(cw*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle=cs.bg;ctx.fillRect(0,0,cw,H);ctx.font='11px '+col('--font-mono');ctx.textBaseline='middle';
    // grid
    for(let i=0;i<=DUR*5;i++){const x=Math.round(X(i/5))+.5,major=i%5===0;ctx.strokeStyle=major?cs.gm:cs.gr;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,top-6);ctx.lineTo(x,H-FOOT);ctx.stroke();
      if(major){ctx.fillStyle=cs.mu;ctx.textAlign='center';ctx.fillText(String(i/5),x,top-12)}}
    // annotation bands & chips
    if(self.ann){for(const a of rec.ann){if(a.t1-a.t0>=4)continue;const x0=X(a.t0),x1=Math.max(X(a.t1),x0+8);ctx.fillStyle=cs.mb;ctx.fillRect(x0,top-6,x1-x0,H-FOOT-top+6)}
      ctx.textAlign='left';for(const c of chips){const y=12+c.l*18;ctx.fillStyle=cs.mk;ctx.globalAlpha=.16;ctx.fillRect(c.x0,y-8,c.w,16);ctx.globalAlpha=1;ctx.fillStyle=cs.mk;ctx.fillRect(c.x0,y-8,2,16);ctx.fillText(c.a.txt,c.x0+7,y)}}
    // traces
    const ppu=pxmm/self.v.sens;let y=top,lg=rows[0].grp;geo={LBL,plotW,top,H,cw};
    ctx.save();ctx.beginPath();ctx.rect(LBL,0,plotW+RP,H);ctx.clip();
    const ys=[];rows.forEach(r=>{if(r.grp!==lg){y+=gap;lg=r.grp}const cy=y+rowH/2;ys.push(cy);y+=rowH;
      ctx.strokeStyle=r.ecg?cs.ecg:cs.tr;ctx.lineWidth=(r.ecg?1:1.05)*LRN.tw();ctx.beginPath();const k=r.ecg?rowH*.42:ppu;
      for(let n=0;n<N;n++){const px=LBL+n/(N-1)*plotW,py=cy-r.data[n]*k;n?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke()});ctx.restore();
    ctx.textAlign='right';ctx.fillStyle=cs.mu;rows.forEach((r,i)=>{ctx.fillStyle=r.ecg?cs.ecg:cs.mu;ctx.fillText(r.label,LBL-8,ys[i])});
    // scale bar
    let uv=10;for(const c of[10,20,50,100,200,500])if(c*ppu<=24)uv=c;const len=uv*ppu,by=H-8;ctx.strokeStyle=cs.ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(LBL+10,by);ctx.lineTo(LBL+10,by-len);ctx.stroke();
    ctx.fillStyle=cs.mu;ctx.textAlign='left';ctx.fillText(uv+' µV',LBL+18,by-len/2);ctx.textAlign='right';ctx.fillText(self.v.sens+' µV/mm · '+self.v.lff+'–'+self.v.hff+' Hz'+(self.v.notch?' · notch':''),cw-RP,H-9);
    // measure
    (self.marks||[]).forEach(m=>{const x=X(m.t);ctx.strokeStyle=m.c==='ok'?col('--good'):m.c==='no'?col('--bad'):col('--accent');ctx.lineWidth=2;ctx.setLineDash(m.c==='ans'?[2,3]:[]);ctx.beginPath();ctx.moveTo(x,top-6);ctx.lineTo(x,H-FOOT);ctx.stroke();ctx.setLineDash([]);if(m.txt){ctx.fillStyle=ctx.strokeStyle;ctx.textAlign='left';ctx.fillText(m.txt,x+4,H-FOOT+12)}});
    if(self.meas){const[a,b]=self.meas,x0=X(Math.min(a,b)),x1=X(Math.max(a,b));ctx.strokeStyle=cs.mk;ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x0,top-6);ctx.lineTo(x0,H-FOOT);ctx.moveTo(x1,top-6);ctx.lineTo(x1,H-FOOT);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=cs.mk;ctx.globalAlpha=.08;ctx.fillRect(x0,top-6,x1-x0,H-FOOT-top+6);ctx.globalAlpha=1}
  };
  self.marks=[];const tOf0=0;const tOf=e=>{const b=cv.getBoundingClientRect(),x=e.clientX-b.left;return clamp((x-geo.LBL)/geo.plotW*DUR,0,DUR)};
  const show=()=>{if(!self.meas)return;const d=Math.abs(self.meas[1]-self.meas[0]);read.textContent=d<.005?'':`Δt ${(d*1000).toFixed(0)} ms  ·  ${(1/d).toFixed(1)} Hz`};
  let dragging=false;
  cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&false)return;dragging=true;const t=tOf(e);self.meas=[t,t];try{cv.setPointerCapture(e.pointerId)}catch(_){}self.draw();show()});
  cv.addEventListener('pointermove',e=>{if(!dragging)return;self.meas[1]=tOf(e);self.draw();show()});
  cv.addEventListener('pointerup',e=>{dragging=false;if(self.meas&&Math.abs(self.meas[1]-self.meas[0])<.02){const t=self.meas[0];self.meas=null;read.innerHTML='&nbsp;';if(self.pick){self.pick(t);return}self.draw()}});
  cv.addEventListener('dblclick',()=>{self.meas=null;read.innerHTML='&nbsp;';self.draw()});
  new ResizeObserver(()=>self.draw()).observe(sc);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>setTimeout(self.draw,30));
  new MutationObserver(()=>setTimeout(self.draw,30)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  return self}

