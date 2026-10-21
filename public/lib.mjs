const STOP=new Set("para como pero esta este esto estos estas sobre entre desde hasta tras cuando donde porque tambien segun mas muy sus del los las una uno unos unas que con por sin ser fue son han hay ante bajo contra hace dice dicen nuevo nueva tiene ahora hoy".split(" "));
export const tok=t=>new Set(t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(/[^a-z0-9]+/).filter(w=>w.length>3&&!STOP.has(w)));
export function sim(a,b){let i=0;for(const w of a)if(b.has(w))i++;const j=i/(a.size+b.size-i||1);return((i>=3&&j>=.25)||j>=.4)?j:0}
// Agrupa titulares del mismo hecho. Devuelve grupos con los elementos ordenados del más antiguo al más reciente.
export function cluster(items){const cl=[];
 for(const it of [...items].sort((a,b)=>a.t-b.t)){it.k=it.k||tok(it.title);let best=null,bs=0;
  for(const c of cl)for(const m of c)if(m.k.size){const s=sim(it.k,m.k);if(s>bs){bs=s;best=c}}
  best?best.push(it):cl.push([it])}
 return cl}
// Reparto por orientación: solo medios clasificados; "?" (sin clasificar) y "N" (deportes) no cuentan.
export function pct(src){let L=0,C=0,R=0,n=0,u=0;
 for(const s of src){if(s.b==="N")continue;if(s.b==="?"){u++;continue}n++;(s.b==="L"||s.b==="CL")?L++:(s.b==="R"||s.b==="CR")?R++:C++}
 if(!n&&!u)return null;if(!n)return{n:0,u};
 return{L:Math.round(L/n*100),C:Math.round(C/n*100),R:Math.round(R/n*100),n,u}}
const dk=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Madrid"});
export function section(t,now){if((now-t)/6e4<60)return"Última hora";const d=dk.format(t);if(d===dk.format(now))return"Hoy";if(d===dk.format(now-864e5))return"Ayer";return"Antes"}
