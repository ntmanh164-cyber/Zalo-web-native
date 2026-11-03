const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../src/remote-preload.cjs'),'utf8');
function click({href='https://example.com/doc',trusted=true,download=false,host='chat.zalo.me',message=false}={}) {
 let listener;const sent=[];let stopped=false;
 vm.runInNewContext(source,{require:()=>({ipcRenderer:{send:(...args)=>sent.push(args)}}),window:{addEventListener:(type,fn)=>listener=fn},location:{hostname:host,origin:'https://'+host},URL});
 listener({isTrusted:trusted,button:0,composedPath:()=>[{tagName:'A',href,hasAttribute:()=>download,closest:()=>message?{}:null}],preventDefault(){stopped=true;},stopImmediatePropagation(){}});
 return {sent,stopped};
}
test('trusted user clicks open HTTP and mail links before Zalo consumes the event',()=>{
 for(const href of ['https://example.com/doc','http://example.com/','mailto:hello@example.com'])assert.deepEqual(click({href}),{sent:[['remote:open-link',href]],stopped:true});
 assert.equal(click({href:'https://chat.zalo.me/some-document',message:true}).stopped,true);
});
test('downloads, internal navigation, synthetic clicks and unsafe schemes stay out of native shell',()=>{
 for(const options of [{download:true},{trusted:false},{host:'id.zalo.me'},{href:'javascript:alert(1)'},{href:'file:///etc/passwd'},{href:'https://chat.zalo.me/'}])assert.deepEqual(click(options),{sent:[],stopped:false});
});
