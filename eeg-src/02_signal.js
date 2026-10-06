/* ============ signal primitives ============ */
function newRec(){return{V:EL.map(()=>new Float32Array(N)),ecg:new Float32Array(N),beats:[],ann:[],sens:null,loc:null}}
const ones=()=>new Float32Array(N).fill(1);
const mul=(a,b)=>{const o=new Float32Array(N);for(let i=0;i<N;i++)o[i]=a[i]*b[i];return o};
const inv=a=>{const o=new Float32Array(N);for(let i=0;i<N;i++)o[i]=1-a[i];return o};
function wind(spans,ramp=.2){const a=new Float32Array(N);for(const[t0,t1]of spans){const i0=Math.max(0,Math.floor((t0-ramp)*FS)),i1=Math.min(N-1,Math.ceil((t1+ramp)*FS));for(let n=i0;n<=i1;n++){const t=n/FS,u=ss(clamp((t-t0+ramp)/(2*ramp),0,1))*ss(clamp((t1+ramp-t)/(2*ramp),0,1));if(u>a[n])a[n]=u}}return a}
function waxwane(r,depth=.5,per=[1,2.2]){const p=r.r(per[0],per[1]),ph=r.u()*6.28,o=new Float32Array(N);for(let n=0;n<N;n++)o[n]=1-depth+depth*(.5+.5*Math.sin(2*Math.PI*n/FS/p+ph));return o}
function phaseOf(r,f0,drift=.04,fn){const dr=bandNoise(r,.1,.8,1),P=new Float64Array(N);let ph=r.u()*6.28;for(let n=0;n<N;n++){const f=(fn?fn(n/FS):f0)*(1+drift*dr[n]);ph+=2*Math.PI*f/FS;P[n]=ph}return P}
function addBg(R,r,o={}){const rms=o.rms??4;for(let e=0;e<NE;e++){const x=bandNoise(r,o.lo??1,o.hi??30,rms*(o.w?o.w[e]:1)),V=R.V[e];for(let n=0;n<N;n++)V[n]+=x[n]}}
function addBand(R,r,w,f1,f2,rms,env){for(let e=0;e<NE;e++){if(w[e]<.02)continue;const x=bandNoise(r,f1,f2,rms*w[e]),V=R.V[e];for(let n=0;n<N;n++)V[n]+=x[n]*(env?env[n]:1)}}
function addOsc(R,w,P,env,amp,lagK=0,shape){for(let e=0;e<NE;e++){if(w[e]<.015)continue;const lag=lagK*(YY[e]+.95),a=amp*w[e],V=R.V[e];for(let n=0;n<N;n++){const ph=P[n]-lag;V[n]+=a*env[n]*(shape?shape(ph):Math.sin(ph))}}}
function addSig(R,w,sig,amp){for(let e=0;e<NE;e++){if(w[e]<.01)continue;const V=R.V[e],a=amp*w[e];for(let n=0;n<N;n++)V[n]+=a*sig[n]}}
function ev(R,r,times,fn,w,amp,o={}){const sp=o.span||.6,jit=o.jit??.1,dl=o.dly;for(const tc of times){const A=amp*(1+jit*r.n());const i0=Math.max(0,Math.floor((tc-sp)*FS)),i1=Math.min(N-1,Math.ceil((tc+sp)*FS));
  for(let e=0;e<NE;e++){const we=w[e];if(we<.015)continue;const d=dl?dl[e]:0,V=R.V[e];for(let n=i0;n<=i1;n++)V[n]+=we*A*fn(n/FS-tc-d)}}}
function per(r,t0,t1,p,jit=.05){const o=[];let t=t0;while(t<t1){o.push(t);t+=p*(1+jit*r.n())}return o}
const T={
  sharp:t=>g(t,.022)-.25*g(t+.045,.025)-.45*g(t-.17,.07),
  spk:t=>g(t,.011)-.2*g(t+.03,.013)-.15*g(t-.05,.02),
  sw:t=>g(t,.012)-.15*g(t+.03,.015)-.75*g(t-.14,.065),
  tri:t=>.35*g(t+.1,.035)-1.0*g(t,.05)+.5*g(t-.12,.07),
  blink:t=>-(g(t,.075)-.25*g(t-.22,.1)),
  kc:t=>g(t+.06,.07)-1.25*g(t-.2,.17),
  vtx:t=>g(t,.08)-.3*g(t-.14,.09),
  pop:t=>t<0?0:Math.exp(-t/.25),
  qrs:t=>g(t,.012)-.28*g(t-.035,.014)+.12*g(t+.04,.012)+.22*g(t-.26,.05),
  posts:t=>-Math.max(0,1-Math.abs(t)/.06),
  wick:t=>g(t,.028)-.2*g(t-.075,.05),
  bets:t=>g(t,.012)-.3*g(t-.03,.02),
  spind:t=>{const u=(t+.6)/1.2;return u<0||u>1?0:Math.sin(Math.PI*u)**2*Math.sin(2*Math.PI*13*t)}
};
function makeEcg(r){const hr=r.r(62,92),beats=[];let t=r.r(0,.5);while(t<DUR+.5){beats.push(t);t+=60/hr*(1+.03*r.n())}
  const s=new Float32Array(N);for(const b of beats){const i0=Math.max(0,Math.floor((b-.3)*FS)),i1=Math.min(N-1,Math.ceil((b+.5)*FS));for(let n=i0;n<=i1;n++)s[n]+=T.qrs(n/FS-b)}
  return{sig:s,beats}}
const lagA=YY.map(y=>.1*(1-y)/2);

