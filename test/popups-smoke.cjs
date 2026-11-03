const {_electron:electron}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{let instance;try{
 instance=await electron.launch({args:[path.join(__dirname,'popups-fixture.cjs')]});
 let result;for(let i=0;i<100;i++){
  result=await instance.evaluate(({app,BrowserWindow})=>({results:app.popupResults,windows:BrowserWindow.getAllWindows().length}));
  if(result.results?.routed.length===3 && result.windows===1)break;
  await new Promise(r=>setTimeout(r,100));
 }
 assert.equal(result.results.direct,true);assert.equal(result.results.delayed,true);assert.equal(result.results.unsafe,true);assert.equal(result.results.trusted,true);
 assert.deepEqual(result.results.routed.sort(),['https://example.com/delayed','https://example.com/direct','https://id.zalo.me/account'].sort());
 assert.equal(result.windows,1);console.log('PASS direct and delayed window.open return WindowProxy, route once, reject unsafe URLs, and leave no popup windows');
}finally{if(instance)await instance.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
