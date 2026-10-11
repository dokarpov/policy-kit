import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const viewports=[
  {name:'mobile-320',width:320,height:700},
  {name:'mobile-390',width:390,height:844},
  {name:'tablet',width:768,height:1024},
  {name:'desktop',width:1440,height:1000}
];

const browser=await chromium.launch({headless:true});
for(const vp of viewports){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height}});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'/',{waitUntil:'networkidle'});
  const layout=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    viewport:innerWidth,
    title:document.title,
    outcome:document.querySelector('#outcome')?.textContent.trim(),
    offenders:[...document.querySelectorAll('body *')].map(el=>{
      const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
      return {tag:el.tagName.toLowerCase(),cls:String(el.className||'').slice(0,100),text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,100),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),display:cs.display};
    }).filter(x=>x.display!=='none'&&x.width>0&&(x.left<-2||x.right>innerWidth+2)).slice(0,20)
  }));
  if(layout.offenders.length) console.log('OFFENDERS',vp.name,JSON.stringify(layout.offenders));
  if(layout.title!=='Policy Kit v0.3') throw new Error(vp.name+': stale public version '+layout.title);
  if(layout.scrollWidth>layout.viewport+2) throw new Error(vp.name+': horizontal overflow');
  if(layout.outcome!=='EXECUTE') throw new Error(vp.name+': safe CRM write should execute');

  await page.locator('#blast').selectOption('money');
  if((await page.locator('#outcome').textContent()).trim()!=='HUMAN') throw new Error(vp.name+': money action should require human');

  await page.locator('#blast').selectOption('write_reversible');
  await page.locator('#allowed').uncheck();
  if((await page.locator('#outcome').textContent()).trim()!=='BLOCKED') throw new Error(vp.name+': disallowed action should be blocked');

  if(errors.length) throw new Error(vp.name+': '+errors.join(' | '));
  console.log('PASS',vp.name);
  await context.close();
}
await browser.close();
