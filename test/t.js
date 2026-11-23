const {chromium}=require('playwright');
const pages=['','dolomitas-de-motorhome/','vida-na-estrada/','sobre-nos/','contato/','politica-de-privacidade/','politica-de-cookies/'];
(async()=>{const b=await chromium.launch();
for(const w of [1280,390]){for(const pg of pages){
 const p=await b.newPage({viewport:{width:w,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('http://127.0.0.1:8765/'+pg,{waitUntil:'load'});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const n=document.querySelectorAll('[data-vlz]').length;const bound=[...document.querySelectorAll('[data-vlz]')].filter(e=>e.__vlzSpec).length;return {n,bound,h:document.body.scrollHeight,sw:document.documentElement.scrollWidth,imgs:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)}});
 console.log(w,pg||'/',JSON.stringify(r),errs.filter(e=>!/fonts|ERR_/.test(e)).join(' | '));
 await p.screenshot({path:`${__dirname}/s_${w}_${(pg||'home').replace(/\//g,'')}.png`,fullPage:pg!==''&&w===390?false:false});
 await p.close();}}
await b.close();})();
