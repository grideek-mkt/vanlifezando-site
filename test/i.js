const {chromium}=require('playwright');const B='http://127.0.0.1:8765/';
const sel=n=>`[data-vlz*=":${n}"]`;
(async()=>{const b=await chromium.launch();const errs=[];
async function open(u,w=1280){const p=await b.newPage({viewport:{width:w,height:800}});p.on('pageerror',e=>errs.push(u+': '+e.message));await p.goto(B+u);await p.waitForTimeout(300);return p}
let p=await open('');
await p.click(sel('abrirMenu'));await p.waitForTimeout(200);
console.log('menu items',await p.locator(sel('fecharMenu')).count(), await p.locator(sel('alternarGuias')).count());
await p.click(sel('alternarGuias'));await p.waitForTimeout(200);await p.screenshot({path:__dirname+'/menu.png'});
await p.click(sel('fecharMenu')+' >> nth=0');await p.waitForTimeout(200);
const t0=await p.evaluate(()=>document.querySelector('.hs-trilho').scrollLeft);
await p.click(sel('avancar'));await p.waitForTimeout(800);
console.log('trilho',t0,await p.evaluate(()=>document.querySelector('.hs-trilho').scrollLeft), await p.evaluate(()=>getComputedStyle(document.querySelector('.hs-card')).getPropertyValue('--rot')));
await p.close();
p=await open('dolomitas-de-motorhome/');
const before=await p.evaluate(()=>document.body.innerText.length);
await p.click(sel('alternarToc'));await p.waitForTimeout(200);
console.log('toc',before,await p.evaluate(()=>document.body.innerText.length));
for(const n of ['t1Ir','tProx','lProx']){const c=await p.locator(sel(n)).count();if(c){const h=await p.evaluate(()=>document.body.innerText.slice(0,99999).length);await p.locator(sel(n)).first().click();await p.waitForTimeout(300);console.log(n,c,'ok')}else console.log(n,'none')}
await p.close();
p=await open('vida-na-estrada/');
const tabs=await p.locator('[data-vlz*="click:abas."]').count();console.log('abas',tabs);
if(tabs>1){await p.locator('[data-vlz*="click:abas."]').nth(1).click();await p.waitForTimeout(300);}
await p.locator(sel('verDepois')).first().click().catch(e=>console.log('verDepois',e.message.slice(0,80)));
await p.close();
p=await open('contato/',390);
await p.locator('form').first().evaluate(f=>f.scrollIntoView());
await p.locator('button[type=submit], form button').last().click();await p.waitForTimeout(200);
console.log('erros',await p.locator('[aria-invalid=true]').count());
const ins=p.locator('form input:not([type=hidden]), form textarea');console.log('campos',await ins.count());
await p.fill('input[type=email]','nica@exemplo.com');
const nm=p.locator('form input').first();await nm.fill('Nica');
await p.locator('form textarea').fill('Oi! teste');
await p.evaluate(()=>{window.__m=null;const d=Object.getOwnPropertyDescriptor(Location.prototype,'href');});await p.locator('button[type=submit], form button').last().click();await p.waitForTimeout(300);console.log('textarea',await p.inputValue('textarea'));
console.log('erros2',await p.locator('[aria-invalid=true]').count(), 'valor email',await p.inputValue('input[type=email]'));
await p.screenshot({path:__dirname+'/form.png',fullPage:true});
const pa=await p.locator(sel('prox4')).count();if(pa){await p.locator(sel('prox4')).first().click();await p.waitForTimeout(200);console.log('foto4 ok')}
await p.close();
console.log('ERRS',errs);await b.close();})();
