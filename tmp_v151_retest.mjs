import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const base='http://localhost:5173';
const outDir=path.resolve('test-artifacts-v151-retest');
const shotDir=path.join(outDir,'screenshots');
fs.mkdirSync(shotDir,{recursive:true});

const report={
  startedAt:new Date().toISOString(),
  env:{frontend:base,backend:'http://localhost:8080',account:'admin/admin123'},
  steps:[],
  api:[],
  consoleErrors:[],
  checks:{},
  localStorage:{}
};

const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();

page.on('console',m=>{if(m.type()==='error') report.consoleErrors.push(m.text());});
page.on('response', async (r)=>{
  const u=r.url();
  if(!u.includes('/api/')) return;
  const keys=['/api/auth/login','/api/auth/logout','/api/documents/35','/api/documents/35/chat','/api/chat/ask','/api/documents/35/summary','/api/documents/35/keywords','/api/knowledge-bases/45/summary','/api/knowledge-bases/45/keywords','/api/search/semantic','/api/admin/logs','/api/chat/sessions'];
  if(!keys.some(k=>u.includes(k))) return;
  const rec={ts:new Date().toISOString(),method:r.request().method(),url:u,status:r.status(),postData:r.request().postData()||null,body:''};
  try{rec.body=(await r.text()).slice(0,4000);}catch{}
  report.api.push(rec);
});

async function snap(name){await page.screenshot({path:path.join(shotDir,name),fullPage:true});}
async function step(name,fn){
  try{await fn(); report.steps.push({name,ok:true,url:page.url()});}
  catch(e){report.steps.push({name,ok:false,url:page.url(),error:String(e)});}
}

function parseJsonText(s){try{return JSON.parse(s);}catch{return null;}}

await step('open-login', async()=>{await page.goto(base+'/login'); await page.waitForTimeout(800); await snap('01-login.png');});

await step('login', async()=>{
  await page.locator('input').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.getByRole('button').filter({hasText:/登录|Login/}).first().click();
  await page.waitForTimeout(1800);
  if(page.url().includes('/admin/')){
    const toApp=page.getByRole('button').filter({hasText:/去前台/});
    if(await toApp.count()){await toApp.first().click(); await page.waitForTimeout(1200);} else {await page.goto(base+'/app/dashboard'); await page.waitForTimeout(1000);} 
  }
  report.localStorage=await page.evaluate(()=>({...localStorage}));
  await snap('02-after-login.png');
});

await step('refresh-login-state', async()=>{await page.reload(); await page.waitForTimeout(1000); await snap('03-refresh.png');});

await step('open-doc35', async()=>{await page.goto(base+'/app/documents/35'); await page.waitForTimeout(1800); await snap('04-doc35.png');});

await step('doc35-status-check', async()=>{
  const docApi=report.api.filter(x=>x.url.includes('/api/documents/35') && x.method==='GET').slice(-1)[0];
  const body=parseJsonText(docApi?.body||'');
  const data=body?.data||{};
  report.checks.doc35={parseStatus:data.parseStatus,embeddingStatus:data.embeddingStatus,vectorStatus:data.vectorStatus,chunkCount:data.chunkCount,name:data.name};
});

await step('entry-by-button', async()=>{
  const btn=page.getByRole('button',{name:'基于本文档提问'});
  report.checks.entryButtonCount=await btn.count();
  if(await btn.count()){
    report.checks.entryButtonDisabled=await btn.first().isDisabled();
    if(!report.checks.entryButtonDisabled){await btn.first().click(); await page.waitForTimeout(1500);}    
  }
  if(!page.url().includes('/app/chat?scope=document')){
    await page.goto(base+'/app/chat?scope=document&documentId=35&documentName=topk-test-long-v2.md');
    await page.waitForTimeout(1200);
  }
  await snap('05-doc-mode-entered.png');
});

await step('doc-mode-ui-check', async()=>{
  report.checks.docModeUrl=page.url();
  report.checks.docModeScope = page.url().includes('scope=document');
  report.checks.docModeDocId = page.url().includes('documentId=35');
  report.checks.scopeText = await page.locator('.scope-alert').first().textContent().catch(()=>null);
  report.checks.kbSelectorInDocMode = await page.locator('.chat-sidebar .el-select').count();
  report.checks.switchBackBtn = await page.getByRole('button',{name:'切换回知识库问答'}).count();
  await snap('06-doc-mode-ui.png');
});

async function askInUI(q, shot){
  await page.locator('textarea').fill(q);
  const send=page.getByRole('button',{name:'发送'}).first();
  report.checks.sendDisabledBeforeAsk = await send.isDisabled();
  if(!report.checks.sendDisabledBeforeAsk) await send.click();
  await page.waitForTimeout(4500);
  await snap(shot);
}

await step('doc-question-1', async()=>{await askInUI('TopK 参数用于控制什么？','07-doc-q1.png');});
await step('doc-question-2', async()=>{await askInUI('这篇文档主要讲了什么？','08-doc-q2.png');});

await step('open-reference-if-any', async()=>{
  const refs=page.locator('.reference-item');
  report.checks.referenceVisibleCountAfterQ = await refs.count();
  if(await refs.count()){
    await refs.first().click(); await page.waitForTimeout(1200); await snap('09-reference-dialog.png');
    await page.getByRole('button',{name:'关闭'}).click().catch(()=>{});
  }
});

await step('followup', async()=>{await askInUI('再详细一点','10-followup.png');});

await step('no-context-question', async()=>{await askInUI('请介绍火星殖民计划的最新进展','11-no-context.png');
  report.checks.generalBtnCount = await page.getByRole('button',{name:'允许 AI 基于通用知识回答'}).count();
});

await step('general-click', async()=>{
  const btn=page.getByRole('button',{name:'允许 AI 基于通用知识回答'}).last();
  if(await btn.count()){await btn.click(); await page.waitForTimeout(5000);} 
  await snap('12-general.png');
});

await step('manual-topk-threshold-fetch', async()=>{
  const result=await page.evaluate(async ()=>{
    const token=localStorage.getItem('knowflow_token');
    const headers={ 'Content-Type':'application/json', Authorization: token ? `Bearer ${token}` : '' };
    const ask=async (body)=>{
      const res=await fetch('/api/documents/35/chat',{method:'POST',headers,body:JSON.stringify(body)});
      const json=await res.json();
      return {http:res.status,body:json};
    };
    return {
      topk1: await ask({question:'TopK 参数用于控制什么？',topK:1,allowGeneralAnswer:false}),
      topk5: await ask({question:'TopK 参数用于控制什么？',topK:5,allowGeneralAnswer:false}),
      th095: await ask({question:'TopK 参数用于控制什么？',similarityThreshold:0.95,allowGeneralAnswer:false}),
      th01: await ask({question:'TopK 参数用于控制什么？',similarityThreshold:0.1,allowGeneralAnswer:false}),
    };
  });
  report.checks.manualParamTests=result;
});

await step('switch-back-kb-mode', async()=>{
  const btn=page.getByRole('button',{name:'切换回知识库问答'});
  if(await btn.count()){await btn.first().click(); await page.waitForTimeout(1500);} 
  report.checks.urlAfterSwitch=page.url();
  report.checks.kbSelectorAfterSwitch=await page.locator('.chat-sidebar .el-select').count();
  await snap('13-after-switch-back.png');
});

await step('kb-send-after-switch', async()=>{
  const sel=page.locator('.chat-sidebar .el-select').first();
  if(await sel.count()){
    await sel.click(); await page.waitForTimeout(600);
    const opt=page.locator('.el-select-dropdown__item').first();
    if(await opt.count()) await opt.click();
  }
  await page.locator('textarea').fill('TopK 参数用于控制什么？');
  const send=page.getByRole('button',{name:'发送'}).first();
  report.checks.sendDisabledAfterSwitch=await send.isDisabled();
  if(!report.checks.sendDisabledAfterSwitch){await send.click(); await page.waitForTimeout(4000);} 
  await snap('14-kb-ask-after-switch.png');
});

await step('doc-understanding-regression', async()=>{await page.goto(base+'/app/documents/35'); await page.waitForTimeout(1200); await snap('15-doc-understanding.png');});
await step('kb-understanding-regression', async()=>{await page.goto(base+'/app/knowledge/45'); await page.waitForTimeout(1200); await snap('16-kb-understanding.png');});
await step('search-page-regression', async()=>{await page.goto(base+'/app/search'); await page.waitForTimeout(1000); await snap('17-search.png');});
await step('admin-logs-regression', async()=>{await page.goto(base+'/admin/logs'); await page.waitForTimeout(1200); await snap('18-admin-logs.png');});

await step('logout-back-check', async()=>{
  await page.goto(base+'/app/settings'); await page.waitForTimeout(800);
  const out=page.getByRole('button').filter({hasText:/退出|退出登录/}).first();
  if(await out.count()){await out.click(); await page.waitForTimeout(1400);} 
  report.checks.urlAfterLogout=page.url();
  await page.goBack(); await page.waitForTimeout(800);
  report.checks.urlAfterBack=page.url();
  await snap('19-logout.png');
});

report.finishedAt=new Date().toISOString();
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
await context.close();
await browser.close();
console.log(path.join(outDir,'report.json'));
