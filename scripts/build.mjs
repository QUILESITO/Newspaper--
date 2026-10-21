import {readFileSync,writeFileSync,mkdirSync,cpSync} from "node:fs";
import {createHash} from "node:crypto";
import {tok,cluster} from "../public/lib.mjs";
const feeds=JSON.parse(readFileSync("feeds.json","utf8")),outl=JSON.parse(readFileSync("outlets.json","utf8"));
const SITE=process.env.SITE_URL||"";
const TOPIC=process.env.NTFY_TOPIC||"contraste-"+createHash("sha1").update(SITE).digest("hex").slice(0,10);
const KW={
 es:/espa[nñ]a|español|sánchez|feijóo|\bpp\b|psoe|vox|moncloa|madrid|catalu|valenci|alicante|andaluc|ayuso|generalitat|guardia civil|aemet/i,
 ali:/alicante|elche|benidorm|torrevieja|alcoy|orihuela|san vicente del raspeig|elda|dénia|villena|marina baixa|vega baja/i,
 geo:/guerra|ucrania|rusia|putin|zelenski|gaza|israel|hamás|irán|otan|taiw[aá]n|china|misil|sanciones|onu\b|diplom[aá]tic|ataque/i,
 eco:/econom[ií]a|inflaci[oó]n|bolsa|ibex|\bbce\b|reserva federal|\bfed\b|\bpib\b|aranceles|petr[oó]leo|d[oó]lar|mercados|tipos de inter[eé]s|\bipc\b|banco central/i,
 fut:/f[uú]tbol|laliga|champions|real madrid|bar[cç]a|atl[eé]tico|selecci[oó]n|entrenador|premier league|serie a|bundesliga|ligue 1|copa del rey/i,
 ten:/tenis|roland garros|wimbledon|us open|open de australia|alcaraz|djokovic|sinner|\batp\b|\bwta\b/i,
 eu:/europa|europe|\bue\b|bruselas|comisi[oó]n europea|parlamento europeo|alemania|francia|italia|reino unido|macron|merz|starmer|eurozona/i,
 us:/estados unidos|ee\.? ?uu|trump|casa blanca|washington|pent[aá]gono|republican|dem[oó]crata|wall street/i,
 tec:/inteligencia artificial|ciberseguridad|tecnolog|openai|microsoft|apple|google|chip|rob[oó]t|ciberataque/i,
 cie:/ciencia|investigadores|nasa|astronom|cient[ií]fic|planeta|telescopio|vacuna|ensayo cl[ií]nico/i,
 cul:/\bcine\b|pel[ií]cula|serie\b|m[uú]sica|concierto|libro|literatura|exposici[oó]n|museo|festival|pintura|premio goya/i};
const EXC=/juvenil|cadete|infantil|alev[ií]n|cantera|f[uú]tbol base|femenin|liga f\b|segunda divisi[oó]n|segunda federaci[oó]n|primera rfef|tercera divisi[oó]n|sub-?\d{2}/i;
const decode=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g,"").replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d)).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const tag=(x,t)=>{const m=x.match(new RegExp("<"+t+"[^>]*>([\\s\\S]*?)</"+t+">","i"));return m?decode(m[1]):""};
const bias=h=>{h=h.replace(/^www\./,"");for(const d in outl)if(h===d||h.endsWith("."+d))return outl[d];return null};
const gurl=f=>"https://news.google.com/rss/"+(f.topic?"headlines/section/topic/"+f.topic+"?":"search?q="+encodeURIComponent(f.q)+"&")+"hl=es&gl=ES&ceid=ES:es";
function parse(xml,f){const out=[];
 for(const m of xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)){const x=m[0];
  let title=tag(x,"title"),link=tag(x,"link");
  if(!link){const h=x.match(/<link[^>]*href="([^"]+)"/i);link=h?h[1]:""}
  const d=new Date(tag(x,"pubDate")||tag(x,"updated")||tag(x,"published")||tag(x,"dc:date"));let o;
  if(f.d){o=bias(f.d)||[f.n||f.d,"?"]}
  else{const sm=x.match(/<source[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/source>/i);if(!sm)continue;let h;try{h=new URL(sm[1]).hostname}catch{continue}
   o=bias(h);if(!o)continue;const sn=decode(sm[2]);if(title.endsWith(" - "+sn))title=title.slice(0,-(sn.length+3))}
  if(!title||!/^https?:/.test(link)||isNaN(d))continue;
  out.push({title,url:link,t:d.getTime(),n:o[0],b:o[1],c:f.cat,dir:!!f.d});if(out.length>=40)break}
 return out}
const res=await Promise.all(feeds.map(async f=>{try{
 const r=await fetch(f.u||gurl(f),{headers:{"user-agent":"Mozilla/5.0 Contraste/3.0"},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new Error("HTTP "+r.status);return{f,items:parse(await r.text(),f)}}catch(e){return{f,err:String(e.message||e)}}}));
const seen0=new Set(),key=i=>i.n+"|"+i.title.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g,"");
const items=res.flatMap(r=>r.items||[]).filter(i=>i.t>Date.now()-48*36e5&&i.t<Date.now()+36e5&&!(EXC.test(i.title)&&(i.c==="fut"||KW.fut.test(i.title))))
 .sort((a,b)=>b.dir-a.dir).filter(i=>!seen0.has(key(i))&&seen0.add(key(i))).sort((a,b)=>a.t-b.t);
const cl=cluster(items);
const clusters=cl.map(c=>{const seen=new Set(),src=[];
 for(const i of c.slice().sort((a,b)=>b.dir-a.dir)){if(seen.has(i.n))continue;seen.add(i.n);src.push({n:i.n,b:i.b,u:i.url,h:i.title,d:i.dir,t:i.t})}
 const all=c.map(i=>i.title).join(" "),al2=all.replace(/real madrid|atl[eé]tico de madrid/gi,""),cats=new Set(c.map(i=>i.c).filter(Boolean));
 for(const k in KW)if(KW[k].test(k==="es"?al2:all))cats.add(k);
 return{id:createHash("sha1").update(c[0].n+c[0].title).digest("hex").slice(0,12),t:Math.max(...c.map(i=>i.t)),t0:c[0].t,cats:[...cats],title:c[0].title,src}})
 .sort((a,b)=>b.t-a.t).slice(0,250);
let prev=null;
try{const r=await fetch(SITE+"/news.json",{signal:AbortSignal.timeout(15000)});if(r.ok)prev=await r.json()}catch{}
const ntfy=b=>fetch("https://ntfy.sh",{method:"POST",body:JSON.stringify({topic:TOPIC,click:SITE,tags:["newspaper"],...b})}).catch(()=>{});
const notified=new Set(prev?.notified||[]);
const fresh=clusters.filter(c=>c.src.length>=(c.cats.length===1&&c.cats[0]==="fut"?6:3)&&!notified.has(c.id));
if(prev){for(const c of fresh.slice(0,5)){
 let L=0,C=0,R=0,n=0;c.src.forEach(s=>{if(s.b==="N"||s.b==="?")return;n++;(s.b==="L"||s.b==="CL")?L++:(s.b==="R"||s.b==="CR")?R++:C++});const p=x=>Math.round(x/n*100);
 await ntfy({title:c.title,message:c.src.length+" fuentes"+(n>1?` · Izquierda ${p(L)}% · Centro ${p(C)}% · Derecha ${p(R)}%`:"")})}}
fresh.forEach(c=>notified.add(c.id));
const mp=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hour12:false}).formatToParts(new Date()).map(p=>[p.type,p.value]));
const day=`${mp.year}-${mp.month}-${mp.day}`,hour=process.env.FORCE_HOUR?+process.env.FORCE_HOUR:+mp.hour%24;
let summary=prev?.summary||null,lastDay=prev?.lastSummaryDay||"";
if(prev&&hour===8&&lastDay!==day){
 const top=clusters.filter(c=>c.t0>=Date.now()-10*36e5&&c.src.length>=2).sort((a,b)=>b.src.length-a.src.length||b.t-a.t).slice(0,3);
 summary={day,items:top.map(c=>({id:c.id,title:c.title,n:c.src.length}))};lastDay=day;
 if(top.length)await ntfy({title:"Resumen de las 08:00",message:top.map((c,i)=>`${i+1}. ${c.title} (${c.src.length} fuentes)`).join("\n")})}
mkdirSync("site",{recursive:true});cpSync("public","site",{recursive:true});
writeFileSync("site/news.json",JSON.stringify({updated:Date.now(),topic:process.env.NTFY_TOPIC?"":TOPIC,summary,lastSummaryDay:lastDay,errors:res.filter(r=>r.err).map(r=>({n:r.f.d||r.f.topic||(r.f.q||"").slice(0,25),e:r.err})),notified:[...notified].slice(-500),clusters}));
console.log(clusters.length+" noticias; fallos:",res.filter(r=>r.err).map(r=>(r.f.d||r.f.topic||"q")+" "+r.err).join(", ")||"ninguno");
