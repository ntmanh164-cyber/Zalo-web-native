const {app,BrowserWindow,clipboard,ClipboardItem,nativeImage}=require('electron');
const {writeClipboardImage}=require('../src/image-clipboard.cjs');
const {focusEditorScript}=require('../src/attachments.cjs');
app.whenReady().then(async()=>{
 let original,win;
 try {
  app.clipboardPhase="read-original";original=await Promise.all((await clipboard.read()).map(async item=>new ClipboardItem(Object.fromEntries(await Promise.all(item.types.map(async type=>[type,await item.getType(type)]))))));app.clipboardPhase="create-window";
  win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  app.clipboardPhase="load-window";await win.loadURL('data:text/html,<div id="chatInput"><div id="richInput" contenteditable="true">Existing draft</div></div>');
  await win.webContents.executeJavaScript(`window.result=null;window.sent=0;document.querySelector('#richInput').addEventListener('paste',async event=>{event.preventDefault();const file=event.clipboardData.files[0];window.result={trusted:event.isTrusted,type:file?.type,size:file?.size,count:event.clipboardData.files.length,signature:file?Array.from(new Uint8Array(await file.arrayBuffer()).slice(0,8)):[]};});document.addEventListener('keydown',()=>window.sent++);`);
  const image=nativeImage.createFromBitmap(Buffer.alloc(32*24*4,255),{width:32,height:24});
  app.clipboardPhase="write-png";await writeClipboardImage(image);app.clipboardPhase="read-png";
  app.clipboardResults={hasPNG:await clipboard.has('image/png'),focused:await win.webContents.executeJavaScript(focusEditorScript)};
  win.webContents.paste();
  for(let i=0;i<100;i++){
   const result=await win.webContents.executeJavaScript('window.result');
   if(result){Object.assign(app.clipboardResults,{paste:result,...await win.webContents.executeJavaScript(`({draft:document.querySelector('#richInput').textContent,sent:window.sent})`)});break;}
   await new Promise(resolve=>setTimeout(resolve,25));
  }
 } catch(error){app.clipboardResults={error:error.message};}
 finally {app.clipboardPhase="restore-original";if(original)await clipboard.write(original);if(win)win.hide();app.clipboardDone=true;}
});
