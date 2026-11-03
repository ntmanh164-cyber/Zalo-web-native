const {test}=require('node:test');const assert=require('node:assert/strict');
const {trusted,external,cropRect}=require('../src/policy.cjs');
test('remote content stays within exact HTTPS Zalo origins',()=>{
 assert.equal(trusted('https://chat.zalo.me/'),true);assert.equal(trusted('https://id.zalo.me/account'),true);
 for(const u of ['http://chat.zalo.me','https://chat.zalo.me.evil.test','file:///etc/passwd','javascript:alert(1)','https://evil.test/?chat.zalo.me'])assert.equal(trusted(u),false);
 assert.equal(external('javascript:alert(1)'),false);assert.equal(external('https://example.com'),true);
});
test('crop uses actual thumbnail ratio, including retina and negative display origins',()=>{
 assert.deepEqual(cropRect({x:100,y:50,width:300,height:200},{x:-1440,y:0,width:1440,height:900},{width:2880,height:1800}),{x:200,y:100,width:600,height:400});
 assert.deepEqual(cropRect({x:900,y:500,width:200,height:200},{width:1000,height:600},{width:1000,height:600}),{x:900,y:500,width:100,height:100});
 assert.throws(()=>cropRect({x:NaN,y:1,width:4,height:4},{width:100,height:100},{width:100,height:100}));
 assert.throws(()=>cropRect({x:0,y:0,width:0,height:2},{width:100,height:100},{width:100,height:100}));
});
const {permissionAllowed,browserUserAgent}=require('../src/policy.cjs');
test('Zalo QR bridge can access storage only between trusted Zalo pages',()=>{
 for(const permission of ['storage-access','top-level-storage-access']) {
  assert.equal(permissionAllowed(permission,'https://chat.zalo.me/trusted-device-bridge.html','https://id.zalo.me/account','https://id.zalo.me'),true);
  assert.equal(permissionAllowed(permission,'https://id.zalo.me','https://chat.zalo.me'),true);
  assert.equal(permissionAllowed(permission,'https://evil.test','https://chat.zalo.me'),false);
  assert.equal(permissionAllowed(permission,'https://chat.zalo.me','https://evil.test'),false);
  assert.equal(permissionAllowed(permission,'https://chat.zalo.me','https://id.zalo.me','https://evil.test'),false);
  assert.equal(permissionAllowed(permission,'https://chat.zalo.me',undefined),false);
 }
 assert.equal(permissionAllowed('usb','https://chat.zalo.me','https://chat.zalo.me'),false);
 assert.equal(permissionAllowed('persistent-storage','https://chat.zalo.me','https://chat.zalo.me'),true);
});
test('browser identity matches embedded Chromium without app product tokens',()=>{
 const ua=browserUserAgent('145.0.1.2','darwin');assert.match(ua,/Chrome\/145\.0\.1\.2/);assert.doesNotMatch(ua,/Electron|Zalo|Native/);
 assert.match(browserUserAgent('145.0.1.2','win32'),/Windows NT 10.0; Win64; x64/);
});
test('QR confirmation may traverse the observed Zalo session synchronization endpoint',()=>{
 assert.equal(trusted('https://jr.zaloapp.com/jr/syncsession?continue=https%3A%2F%2Fchat.zalo.me'),true);
 assert.equal(trusted('https://jr.zaloapp.com/other'),false);
 assert.equal(trusted('https://evil.zaloapp.com/jr/syncsession'),false);
 assert.equal(trusted('http://jr.zaloapp.com/jr/syncsession'),false);
});
test('QR session push uses the exact observed chat bridge path',()=>{
 assert.equal(trusted('https://jr.chat.zalo.me/jr/pushsession?continue=https%3A%2F%2Fchat.zalo.me'),true);
 assert.equal(trusted('https://jr.chat.zalo.me/other'),false);
 assert.equal(trusted('https://jr.chat.zalo.me.evil.test/jr/pushsession'),false);
});

test('Electron notification permission is allowed only for trusted Zalo pages', () => {
  const {permissionAllowed}=require('../src/policy.cjs');
  assert.equal(permissionAllowed('notification','https://chat.zalo.me/','https://chat.zalo.me/'),true);
  assert.equal(permissionAllowed('notification','https://example.com/','https://chat.zalo.me/'),false);
});
