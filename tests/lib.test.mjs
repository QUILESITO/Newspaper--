import test from "node:test";import assert from "node:assert/strict";
import {cluster,pct,section} from "../public/lib.mjs";
const it=(title,t,n)=>({title,t,n});
test("agrupa titulares del mismo hecho y separa los distintos",()=>{
 const g=cluster([it("Sánchez anuncia un plan de vivienda en el Congreso",3,"A"),it("Sánchez presenta un plan de vivienda ante el Congreso",1,"B"),it("Alcaraz gana el torneo de tenis en Madrid",2,"C")]);
 assert.equal(g.length,2);const dos=g.find(x=>x.length===2);assert.equal(dos[0].t,1);assert.equal(dos[1].t,3)});
test("no agrupa titulares sin relación",()=>assert.equal(cluster([it("Bolsa europea cierra en alza",1,"A"),it("Terremoto sacude la costa de Chile",2,"B")]).length,2));
test("porcentajes: solo medios clasificados; sin clasificar y deportes no cuentan",()=>{
 assert.deepEqual(pct([{b:"L"},{b:"CL"},{b:"C"},{b:"R"},{b:"?"},{b:"N"}]),{L:50,C:25,R:25,n:4,u:1})});
test("datos ausentes no se inventan",()=>{assert.equal(pct([{b:"N"}]),null);assert.deepEqual(pct([{b:"?"},{b:"?"}]),{n:0,u:2});assert.equal(pct([]),null)});
test("secciones cronológicas en hora de Madrid",()=>{
 const now=Date.UTC(2026,9,21,12,0);
 assert.equal(section(now-30*6e4,now),"Última hora");assert.equal(section(Date.UTC(2026,9,21,8,0),now),"Hoy");
 assert.equal(section(Date.UTC(2026,9,20,10,0),now),"Ayer");assert.equal(section(Date.UTC(2026,9,18,10,0),now),"Antes")});
