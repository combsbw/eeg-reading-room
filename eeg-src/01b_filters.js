/* ============ filters ============ */
function bq(type,f,Q){const w0=2*Math.PI*f/FS,c=Math.cos(w0),s=Math.sin(w0),al=s/(2*Q);let b0,b1,b2;
  if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=(1-c)/2}else if(type==='hp'){b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2}else{b0=1;b1=-2*c;b2=1}
  const a0=1+al;return[b0/a0,b1/a0,b2/a0,-2*c/a0,(1-al)/a0]}
function runbq(x,k){const y=new Float64Array(x.length);let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<x.length;i++){const v=k[0]*x[i]+k[1]*x1+k[2]*x2-k[3]*y1-k[4]*y2;y[i]=v;x2=x1;x1=x[i];y2=y1;y1=v}return y}
function ff(x,k){const n=x.length,P=Math.min(100,n-2),p=new Float64Array(n+2*P);for(let i=0;i<P;i++){p[i]=2*x[0]-x[P-i];p[n+P+i]=2*x[n-1]-x[n-2-i]}p.set(x,P);let y=runbq(p,k);y.reverse();y=runbq(y,k);y.reverse();return y.subarray(P,P+n)}
function bandNoise(r,f1,f2,rms){let x=new Float64Array(N+400);for(let i=0;i<x.length;i++)x[i]=r.n();
  if(f1>0)x=Float64Array.from(ff(x,bq('hp',f1,.707)));if(f2<95)x=Float64Array.from(ff(x,bq('lp',f2,.707)));
  const o=new Float32Array(N);let s=0;for(let i=0;i<N;i++){const v=x[i+200];o[i]=v;s+=v*v}const k=rms/Math.sqrt(s/N+1e-12);for(let i=0;i<N;i++)o[i]*=k;return o}

