import { chromium } from 'playwright';
import fs from 'fs';
const out='test-artifacts-v151-retest/targeted.json';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext()).newPage();
const events=[];
p.on('response', async r=>{const u=r.url(); if(u.includes('/api/documents/35/chat')||u.includes('/api/chat/ask')){ let body=''; try{body=await r.text();}catch{}; events.push({url:u,status:r.status(),post:r.request().postData(),body}); }});
await p.goto('http://localhost:5173/login');
await p.locator('input').first().fill('admin');
await p.locator('input[type="password"]').first().fill('admin123');
await p.getByRole('button').filter({hasText:/登录|Login/}).first().click();
await p.waitForTimeout(1600);
if (p.url().includes('/admin/')) {
  const toApp = p.getByRole('button').filter({hasText:/去前台/});
  if (await toApp.count()) { await toApp.first().click(); await p.waitForTimeout(900);} else { await p.goto('http://localhost:5173/app/dashboard'); }
}
await p.goto('http://localhost:5173/app/chat?scope=document&documentId=35&documentName=topk-test-long-v2.md');
await p.waitForTimeout(1200);
// NO_CONTEXT
await p.locator('textarea').fill('请介绍火星殖民计划的最新进展');
await p.getByRole('button',{name:'发送'}).click();
await p.waitForTimeout(3500);
const generalBtnCount = await p.getByRole('button',{name:'允许 AI 基于通用知识回答'}).count();
if (generalBtnCount) { await p.getByRole('button',{name:'允许 AI 基于通用知识回答'}).last().click(); await p.waitForTimeout(4000); }
// switch back
await p.getByRole('button',{name:'切换回知识库问答'}).first().click();
await p.waitForTimeout(1200);
const hasKbSelect = await p.locator('.chat-sidebar .el-select').count();
if (hasKbSelect) {
  await p.locator('.chat-sidebar .el-select').first().click();
  await p.waitForTimeout(500);
  const first = p.locator('.el-select-dropdown__item').first();
  if (await first.count()) await first.click();
}
await p.locator('textarea').fill('TopK 参数用于控制什么？');
const sendDisabled = await p.getByRole('button',{name:'发送'}).first().isDisabled();
if (!sendDisabled) { await p.getByRole('button',{name:'发送'}).first().click(); await p.waitForTimeout(3000); }
const result={generalBtnCount,sendDisabled,url:p.url(),events};
fs.writeFileSync(out,JSON.stringify(result,null,2));
console.log(out);
await b.close();
