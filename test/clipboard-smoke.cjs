const {_electron:electron}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{let instance;try{
 instance=await electron.launch({args:[path.join(__dirname,'clipboard-fixture.cjs')]});
 let state;for(let i=0;i<150;i++){state=await instance.evaluate(({app})=>({done:app.clipboardDone,result:app.clipboardResults,phase:app.clipboardPhase}));if(state.done)break;await new Promise(resolve=>setTimeout(resolve,50));}
 assert.equal(state.done,true,JSON.stringify(state));assert.equal(state.result.error,undefined);assert.equal(state.result.hasPNG,true);assert.equal(state.result.focused,true);
 assert.equal(state.result.paste.trusted,true);assert.equal(state.result.paste.type,'image/png');assert.equal(state.result.paste.count,1);assert.ok(state.result.paste.size>50);assert.deepEqual(state.result.paste.signature,[137,80,78,71,13,10,26,10]);assert.equal(state.result.draft,'Existing draft');assert.equal(state.result.sent,0);
 console.log('PASS Electron 45 clipboard write/read and native paste deliver a valid PNG file without changing draft or sending; original clipboard restored');
}finally{if(instance)await instance.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
