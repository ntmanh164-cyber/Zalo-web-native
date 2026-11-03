const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');
const {navigationScript}=require('../src/navigation.cjs');
test('desktop navigation delegates to existing Zalo controls without replacing handlers',()=>{
 for(const command of ['chat','contacts','saved','account','zalo-settings','cloud','tools']){
  let clicks=0,selector;
  const result=vm.runInNewContext(navigationScript(command),{document:{querySelector:s=>{selector=s;return {click:()=>clicks++};}}});
  assert.equal(result,true);assert.equal(clicks,1);assert.match(selector,/^#main-tab /);
 }
});
test('missing Zalo controls fail explicitly and arbitrary selectors cannot be executed',()=>{
 assert.equal(vm.runInNewContext(navigationScript('contacts'),{document:{querySelector:()=>null}}),false);
 for(const command of ['__proto__','constructor','#richInput','document.cookie',null])assert.throws(()=>navigationScript(command));
});
