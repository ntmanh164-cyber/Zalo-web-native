const $=id=>document.getElementById(id);
window.desktop.invoke('preview:image').then(url=>$('image').src=url);
for(const action of ['save','copy','paste'])$(action).onclick=async()=>{
 const button=$(action);button.disabled=true;
 try {
  const done=await window.desktop.invoke(`preview:${action}`);
  if(done)$('status').textContent=action==='save'?'Đã lưu ảnh PNG.':action==='paste'?'Đã đính kèm ảnh vào cuộc trò chuyện.':'Đã sao chép ảnh. Dán bằng Cmd+V hoặc Ctrl+V.';
 } catch(error){$('status').textContent=error.message;}
 finally{button.disabled=false;}
};
