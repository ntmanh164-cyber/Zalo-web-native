const { _electron:electron } = require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
(async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'zalo-native-test-'));
 let app;
 try {
 app=await electron.launch({args:['.'],env:{...process.env,ZN_TEST_PROFILE:profile}});
 await app.firstWindow();
 let page;for(let i=0;i<100;i++){page=app.windows().find(p=>p.url().endsWith('/ui/index.html'));if(page)break;await new Promise(r=>setTimeout(r,100));}
 assert.ok(page,'Main shell page exists');await page.locator('#settings').waitFor({state:'attached'});
 assert.equal(await page.locator('.rail').count(),0);
 const bounds=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];return {view:w.contentView.children.find(v=>v.webContents && v.webContents!==w.webContents).getBounds(),size:w.getContentSize()};});
 assert.equal(bounds.view.x,0);assert.equal(bounds.view.y,0);assert.equal(bounds.view.width,bounds.size[0]);
 const chrome=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];return w.contentView.children.slice(1).map(v=>v.getBounds());});
 assert.deepEqual(chrome,[{x:0,y:0,width:316,height:44},{x:0,y:bounds.size[1]-64,width:316,height:64}]);
 const chromeSecurity=await app.evaluate(async({webContents})=>{
  const footer=webContents.getAllWebContents().find(w=>w.getURL().endsWith('/ui/footer.html'));
  for(let i=0;i<50 && !footer.getURL().endsWith('/ui/footer.html');i++)await new Promise(r=>setTimeout(r,50));
  return footer.executeJavaScript(`window.desktop.invoke('settings',{compact:false,hideBanners:false}).then(()=>false,()=>true)`);
 });
 assert.equal(chromeSecurity,true,'Footer cannot mutate arbitrary desktop settings');
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(940,700));
 const resized=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];return {footer:w.contentView.children[2].getBounds(),size:w.getContentSize()};});
 assert.equal(resized.footer.width,292);assert.equal(resized.footer.y,resized.size[1]-64);
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1280,820));
 await app.evaluate(async({webContents})=>{for(let i=0;i<100;i++){if(webContents.getAllWebContents().some(w=>w.getURL().startsWith('https://')))return;await new Promise(r=>setTimeout(r,100));}throw new Error('Zalo navigation did not start');});
 await page.evaluate(()=>window.desktop.invoke('settings:open'));await page.locator('#settings-panel').waitFor({state:'visible'});
 assert.equal(await app.evaluate(({webContents})=>webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://'))?.getLastWebPreferences().nodeIntegration),false);
 await page.locator('#compact').uncheck();
 await page.waitForTimeout(400);
 const stored=JSON.parse(await fs.readFile(path.join(profile,'preferences.json'),'utf8'));assert.equal(stored.compact,false);
 await page.screenshot({path:'test-results/settings.png'});
 await page.locator('#close-settings').click();
 await app.evaluate(async({webContents})=>{for(let i=0;i<450;i++){const w=webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://'));if(w && await w.executeJavaScript("document.body.innerText.includes('Đăng nhập')"))return;await new Promise(r=>setTimeout(r,100));}throw new Error('Zalo login UI did not render');});
 const remote=await app.evaluate(async({webContents})=>{const wc=webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://'));return {url:wc?.getURL(),bridge:wc?await wc.executeJavaScript('typeof window.desktop'):null,title:wc?.getTitle()};});
 assert.equal(remote.bridge,'undefined');assert.match(remote.url,/https:\/\/(chat|id)\.zalo\.(me|vn)/);
 const linkResult=await app.evaluate(async({BrowserWindow,ipcMain,session,webContents},preloadPath)=>{
  const permission=await webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://')).executeJavaScript('Notification.permission');
  const isolated=session.fromPartition('link-test');
  await isolated.protocol.handle('https',()=>new Response('<a href="https://example.com/zalo-link-test" style="position:fixed;left:20px;top:20px;width:200px;height:50px">Link</a><script>document.querySelector("a").onclick=e=>e.preventDefault()</script>',{headers:{'content-type':'text/html'}}));
  const fixture=new BrowserWindow({show:false,width:500,height:300,webPreferences:{session:isolated,preload:preloadPath,contextIsolation:true,sandbox:true,nodeIntegration:false}});
  const opened=[];const listener=(event,url)=>{if(event.sender===fixture.webContents)opened.push(url);};
  ipcMain.on('remote:open-link',listener);
  try {
   await fixture.loadURL('https://chat.zalo.me/');
   fixture.webContents.sendInputEvent({type:'mouseDown',x:60,y:40,button:'left',clickCount:1});fixture.webContents.sendInputEvent({type:'mouseUp',x:60,y:40,button:'left',clickCount:1});
   await new Promise(r=>setTimeout(r,300));
   return {permission,opened};
  } finally {ipcMain.removeListener('remote:open-link',listener);fixture.destroy();isolated.protocol.unhandle('https');}
 },path.join(process.cwd(),'src/remote-preload.cjs'));
 assert.equal(linkResult.permission,'granted');
 assert.deepEqual(linkResult.opened,['https://example.com/zalo-link-test']);
 console.log('PASS notification permission and trusted external link click',linkResult);
 console.log('PASS shell settings persistence, remote isolation, live Zalo URL:',remote);
 const image=await app.evaluate(async({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Zalo Native');const image=await w.capturePage();return image.toPNG().toString('base64');});
 await fs.writeFile('test-results/app.png',Buffer.from(image,'base64'));
 const remoteImage=await app.evaluate(async({webContents})=>(await webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://')).capturePage()).toPNG().toString('base64'));
 await fs.writeFile('test-results/zalo.png',Buffer.from(remoteImage,'base64'));
 const {style,filterScript}=require('../src/zalo-style.cjs');
 const filtering=await app.evaluate(async({BrowserWindow}, {css,script})=>{
 const fixture=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
 await fixture.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<div id="headerBtns"></div><div id="messageViewContainer" style="overflow-y:auto;height:100px"><div style="height:1000px"></div></div><div id="chat-box-input-container-id"><div style="height:41px"><div><ul class="chat-box-toolbar"><li><button id="original-tool">File</button></li></ul></div></div><div id="chatInput"><div id="richInput" contenteditable="true"></div></div></div><nav id="sidebarNav"><div id="main-tab"></div></nav><div class="download-pc-banner">Hãy tải ứng dụng Zalo PC để có trải nghiệm tốt hơn</div><div class="chat-message"><div class="banner">Hãy tải ứng dụng Zalo PC để có trải nghiệm tốt hơn</div></div><div role="dialog">Cuộc gọi đến</div><div class="zcard-body"><section><div>Nâng cao hiệu quả công việc với Zalo PC<a href="https://zalo.me/download/zalo-pc?utm=90000">Tải ngay</a></div></section></div>'));
 await fixture.webContents.executeJavaScript(`window.toolClicks=0;document.querySelector('#original-tool').addEventListener('click',()=>window.toolClicks++);`);
 const key=await fixture.webContents.insertCSS(css);await fixture.webContents.executeJavaScript(script);
 const result=await fixture.webContents.executeJavaScript(`({sidebarWidth:getComputedStyle(document.querySelector('#sidebarNav')).width,loginPromo:getComputedStyle(document.querySelector('.zcard-body section')).display,promo:getComputedStyle(document.querySelector('.download-pc-banner')).display,message:getComputedStyle(document.querySelector('.chat-message .banner')).display,dialog:getComputedStyle(document.querySelector('[role="dialog"]')).display})`);
 result.top=await fixture.webContents.executeJavaScript(`(async()=>{const el=document.querySelector('#messageViewContainer');el.scrollTop=500;document.querySelector('.zn-chat-top').click();await new Promise(r=>setTimeout(r,800));return el.scrollTop;})()`);
 result.composer=await fixture.webContents.executeJavaScript(`(() => {const before=getComputedStyle(document.querySelector('.chat-box-toolbar')).display;document.querySelector('.zn-attachments').click();const after=getComputedStyle(document.querySelector('.chat-box-toolbar')).display;document.querySelector('#original-tool').click();return {before,after,host:getComputedStyle(document.querySelector('.zn-tools-host')).display,clicks:window.toolClicks,editable:document.querySelector('#richInput').isContentEditable};})()`);
 await fixture.webContents.removeInsertedCSS(key);
 result.restored=await fixture.webContents.executeJavaScript(`getComputedStyle(document.querySelector('.download-pc-banner')).display`);
 fixture.destroy();return result;
 },{css:style({compact:true,hideBanners:true}),script:filterScript});
 assert.equal(filtering.top,0);
 assert.deepEqual(filtering.composer,{before:'none',after:'flex',host:'contents',clicks:1,editable:true});
 assert.equal(filtering.sidebarWidth,'316px');assert.equal(filtering.loginPromo,'none');assert.equal(filtering.promo,'none');assert.notEqual(filtering.message,'none');assert.notEqual(filtering.dialog,'none');assert.notEqual(filtering.restored,'none');
 console.log('PASS banner filtering preserves chat and call dialogs; disabling restores banners');
 } finally {if(app)await app.close();await fs.rm(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
