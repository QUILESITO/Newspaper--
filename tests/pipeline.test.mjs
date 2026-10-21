import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const now=new Date().toUTCString();
const g=(t,s,u)=>`<item><title>${t} - ${s}</title><link>https://news.google.com/rss/articles/x${t.length}${s}</link><pubDate>${now}</pubDate><source url="${u}">${s}</source></item>`;
const r=(t,l)=>`<item><title>${t}</title><link>${l}</link><pubDate>${now}</pubDate></item>`;
const gb="<rss><channel>"+g("Sánchez anuncia un nuevo plan de vivienda en el Congreso","ABC","https://www.abc.es")+g("El Barça juvenil gana la liga juvenil","Marca","https://www.marca.com")+g("Titular de blog desconocido","Blog","https://blog.xyz")+"</channel></rss>";
const rb="<rss><channel>"+r("Sánchez presenta un plan de vivienda en el Congreso","https://www.elpais.com/a1")+r("Alcaraz gana el torneo de tenis en Madrid","https://alicanteplaza.es/a3")+"</channel></rss>";
globalThis.fetch=async(u,o)=>{u=String(u);if(u.includes("ntfy.sh"))return{ok:true};if(u.endsWith("news.json"))return{ok:false};
 return{ok:true,text:async()=>u.includes("news.google")?gb:rb}};
process.env.SITE_URL="https://x.github.io/y";process.env.FORCE_HOUR="9";
await import("../scripts/build.mjs");
const d=JSON.parse(readFileSync("site/news.json","utf8"));
test("portada en orden cronológico inverso",()=>assert.ok(d.clusters.every((c,i,a)=>!i||a[i-1].t>=c.t)));
test("descarta juveniles y medios fuera de la lista",()=>{const s=JSON.stringify(d);assert.ok(!s.includes("juvenil"));assert.ok(!s.includes("blog.xyz"))});
test("medio sin clasificar se marca como tal y el sesgo no se inventa",()=>{
 const srcs=d.clusters.flatMap(c=>c.src);assert.ok(srcs.some(s=>s.n==="Alicante Plaza"&&s.b==="?"));
 assert.ok(srcs.every(s=>s.u.startsWith("http")&&s.t>0))});
test("un medio cuenta una sola vez por noticia",()=>d.clusters.forEach(c=>assert.equal(new Set(c.src.map(s=>s.n)).size,c.src.length)));
