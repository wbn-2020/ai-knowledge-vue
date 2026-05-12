import { chromium } from 'playwright';
const b=await chromium.launch({headless:true});
const p=await (await b.newContext()).newPage();
const events=[];
p.on('response', async r=>{const u=r.url(); if(u.includes('/api/documents/35/chat')){events.push({status:r.status(),post:r.request().postData(),body:await r.text()});}});
await p.goto('http://localhost:5173/login');
await p.locator('input').first().fill('admin');
await p.locator('input[type=password]').first().fill('admin123');
await p.getByRole('button').filter({hasText:/登录|Login/}).first().click();
await p.waitForTimeout(1400);
if (p.url().includes('/admin/')) { const toApp=p.getByRole('button').filter({hasText:/去前台/}); if(await toApp.count()){await toApp.first().click(); await p.waitForTimeout(800);} }
await p.goto('http://localhost:5173/app/chat?scope=document&documentId=35&documentName=topk-test-long-v2.md');
await p.waitForTimeout(1000);
await p.locator('textarea').fill('请介绍火星殖民计划的最新进展');
await p.getByRole('button',{name:'发送'}).click();
await p.waitForTimeout(3200);
const btn= p.getByRole('button',{name:'允许 AI 基于通用知识回答'}).last();
console.log('btn count', await p.getByRole('button',{name:'允许 AI 基于通用知识回答'}).count());
if(await btn.count()) { await btn.click(); await p.waitForTimeout(4500); }
console.log(JSON.stringify(events,null,2));
await b.close();
