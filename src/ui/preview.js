const $=id=>document.getElementById(id);
window.desktop.invoke('preview:image').then(url=>$('image').src=url);
for(const action of ['save','copy','paste'])$(action).onclick=async()=>{try{const done=await window.desktop.invoke(`preview:${action}`);if(done)$('status').textContent=action==='save'?'Đã lưu ảnh PNG.':'Đã sao chép ảnh. Dán bằng Cmd+V hoặc Ctrl+V.';}catch(e){$('status').textContent=e.message;}};
