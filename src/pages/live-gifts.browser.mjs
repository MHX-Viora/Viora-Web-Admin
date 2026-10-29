import assert from 'node:assert/strict';
import {build} from '../../../viora/node_modules/esbuild/lib/main.js';
import {openDocsBrowser} from '../../../viora/features/developer/docs/tests/browser-fixture.mjs';
import {createServer} from 'node:http';import {readFile,writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';
await mkdir('.codex-tmp',{recursive:true});
const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {Toaster} from 'sonner';import {LiveGiftsPage} from './src/pages/LiveGiftsPage';import './src/index.css';import './src/enterprise.css';import './src/ankt-admin.css';createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><main style={{padding:24}}><LiveGiftsPage/></main><Toaster/></QueryClientProvider>);`,loader:'tsx',resolveDir:process.cwd()},bundle:true,jsx:'automatic',write:false,outdir:'.codex-tmp/gifts',define:{'import.meta.env':'{}','process.env.NODE_ENV':'"development"'}});
const files=new Map(bundle.outputFiles.map(file=>['/'+path.basename(file.path),file.contents]));let gifts=[],saved=[];
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://test').pathname;
 if(pathname.startsWith('/gift-presets/')){try{res.end(await readFile('public'+pathname));}catch{res.statusCode=404;res.end();}return;}
 if(pathname==='/api/admin/images'){for await(const chunk of req){}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({url:'https://images.example.test/gift.png'}));return;}
 if(pathname.startsWith('/api/live-gifts')){
  res.setHeader('Content-Type','application/json');if(req.method==='GET'){res.end(JSON.stringify(gifts));return;}
  if(req.method==='DELETE'){gifts=gifts.filter(g=>!pathname.endsWith('/'+g.id));res.statusCode=204;res.end();return;}
  let data=[];for await(const chunk of req)data.push(chunk);const raw=Buffer.concat(data);assert.match(req.headers['content-type'],/multipart\/form-data/);
  const text=raw.toString('latin1');const match=text.match(/name="metadata"\r\n\r\n([^\r]+)\r\n/);assert.ok(match);const metadata=JSON.parse(Buffer.from(match[1],'latin1').toString('utf8'));
  const fileName=text.match(/filename="([^"\r\n]+\.svga)"/)?.[1];const hasFile=!!fileName;const remove=text.includes('name="removeAnimation"\r\n\r\ntrue');const id=req.method==='POST'?'gift-'+(gifts.length+1):pathname.split('/')[4];
  const current=gifts.find(g=>g.id===id);const item={...metadata,id,useCount:0,animationDurationMs:hasFile?(fileName==='kiss.svga'?3300:6467):remove?0:current?.animationDurationMs??0,animationUrl:hasFile?'/gift-presets/'+fileName:remove?null:current?.animationUrl??null};
  gifts=current?gifts.map(g=>g.id===id?item:g):[...gifts,item];saved.push({metadata,hasFile});res.end(JSON.stringify(item));return;
 }
 if(files.has(pathname)){res.setHeader('Content-Type',pathname.endsWith('.css')?'text/css':'text/javascript');res.end(files.get(pathname));return;}
 res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/stdin.css"><div id="root"></div><script src="/stdin.js"></script>');
});await new Promise(r=>server.listen(0,'127.0.0.1',r));let b;
async function button(text){await b.wait(`[...document.querySelectorAll('button')].some(e=>e.textContent===${JSON.stringify(text)}&&!e.disabled)`);const p=await b.read(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent===${JSON.stringify(text)}&&!e.disabled);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);assert.ok(p,text);await b.rpc('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await b.rpc('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});}
async function selectLabel(text,value){const selector=await b.read(`(()=>{const e=[...document.querySelectorAll('label')].find(e=>e.firstChild?.textContent===${JSON.stringify(text)}).querySelector('select');return [...document.querySelectorAll('select')].indexOf(e);})()`);await b.rpc('Runtime.evaluate',{expression:`(()=>{const e=document.querySelectorAll('select')[${selector}];e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`});}
try{
 b=await openDocsBrowser();await b.rpc('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await b.rpc('Page.navigate',{url:'http://127.0.0.1:'+server.address().port});await b.wait(`document.body.textContent.includes('Chưa có quà phù hợp')`);
 await button('Thêm quà');await b.wait(`!!document.querySelector('[role="dialog"]')`);await selectLabel('Hiệu ứng','lion');await b.wait(`document.querySelectorAll('canvas').length>0`);
 const price=await b.read(`(()=>{const r=document.querySelector('input[type="number"]').getBoundingClientRect();return{x:r.x+20,y:r.y+20}})()`);await b.rpc('Input.dispatchMouseEvent',{type:'mousePressed',...price,button:'left',clickCount:1});await b.rpc('Input.dispatchMouseEvent',{type:'mouseReleased',...price,button:'left',clickCount:1});await b.rpc('Input.insertText',{text:'5000'});
 await b.wait(`(()=>{const c=document.querySelector('canvas');return c&&c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)})()`);
 const geometry=await b.read(`(()=>{const f=document.querySelector('.gift-form-fields').getBoundingClientRect(),a=document.querySelector('.gift-form-grid aside').getBoundingClientRect(),d=document.querySelector('[role="dialog"]').getBoundingClientRect();return {overlap:f.right>a.left,inside:a.right<=d.right,width:d.width}})()`);assert.equal(geometry.overlap,false);assert.equal(geometry.inside,true);assert.ok(geometry.width>=900);
 await new Promise(r=>setTimeout(r,2000));
 const visiblePreview=await b.read(`(()=>{const c=document.querySelector('canvas').getBoundingClientRect(),p=document.querySelector('.gift-animation-preview').getBoundingClientRect();return c.left>=p.left-1&&c.right<=p.right+1&&c.top>=p.top-1&&c.bottom<=p.bottom+1&&c.height>=350})()`);assert.equal(visiblePreview,true);
 const shot=await b.rpc('Page.captureScreenshot',{format:'png'});await writeFile('.codex-tmp/live-gifts-1440.png',Buffer.from(shot.data,'base64'));
 await button('Lưu quà');await b.wait(`!document.querySelector('[role="dialog"]')`);assert.equal(saved.length,1);assert.equal(saved[0].hasFile,true);assert.equal(saved[0].metadata.price,5000);assert.equal(saved[0].metadata.name,'Sư tử');assert.equal(saved[0].metadata.isActive,false);
 await button('Đang tắt');await b.wait(`document.body.textContent.includes('Đang bật')`);assert.equal(gifts[0].isActive,true);
 await button('Sửa');await b.wait(`!!document.querySelector('[role="dialog"]')`);await b.wait(`!!document.querySelector('canvas')`);
 await selectLabel('Hiệu ứng','file');const doc=await b.rpc('DOM.getDocument');const input=await b.rpc('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[accept=".svga"]'});await b.rpc('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[path.resolve('public/gift-presets/kiss.svga')]});await b.wait(`!!document.querySelector('canvas')`);await button('Lưu quà');await b.wait(`!document.querySelector('[role="dialog"]')`);assert.equal(gifts[0].animationDurationMs,3300);
 await button('Sửa');await selectLabel('Hiệu ứng','none');await button('Lưu quà');await b.wait(`!document.querySelector('[role="dialog"]')`);assert.equal(gifts[0].animationUrl,null);
 await button('Xóa');await b.wait(`document.body.textContent.includes('Xóa Sư tử?')`);await button('Xóa quà');await b.wait(`document.body.textContent.includes('Chưa có quà phù hợp')`);
 await b.rpc('Emulation.setDeviceMetricsOverride',{width:375,height:900,deviceScaleFactor:1,mobile:false});await button('Thêm quà');await selectLabel('Hiệu ứng','kiss');await b.wait(`!!document.querySelector('canvas')`);assert.equal(await b.read('document.documentElement.scrollWidth>innerWidth'),false);
 assert.deepEqual(b.issues.filter(e=>!e.startsWith('Canvas2D: Multiple readback')),[]);console.log('PASS admin: add preset + required VND price, multipart animation, inactive default, toggle, edit animated preview, delete confirmation, responsive form.');
}catch(e){console.error(b?.issues);if(b)console.error(await b.read('document.body.innerText.slice(-600)'));throw e;}finally{if(b)await b.close();await new Promise(r=>server.close(r));}
