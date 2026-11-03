const canvas=document.getElementById('screen'),ctx=canvas.getContext('2d'),label=document.getElementById('size');
const image=new Image();let start,rect,busy=false;
function paint(){
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
 ctx.fillStyle='#0c1b3380';ctx.fillRect(0,0,canvas.width,canvas.height);
 if(rect){ctx.save();ctx.beginPath();ctx.rect(rect.x,rect.y,rect.width,rect.height);ctx.clip();ctx.drawImage(image,0,0,canvas.width,canvas.height);ctx.restore();ctx.strokeStyle='#62baff';ctx.lineWidth=1.5;ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);}
}
window.desktop.invoke('capture:source').then(url=>{image.onload=()=>{canvas.width=innerWidth;canvas.height=innerHeight;paint();};image.src=url;});
canvas.onpointerdown=e=>{if(busy||!image.complete)return;start={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!start)return;const x=Math.max(0,Math.min(innerWidth,e.clientX)),y=Math.max(0,Math.min(innerHeight,e.clientY));rect={x:Math.min(x,start.x),y:Math.min(y,start.y),width:Math.abs(x-start.x),height:Math.abs(y-start.y)};paint();label.style.display='block';label.style.left=Math.min(innerWidth-130,x+12)+'px';label.style.top=Math.min(innerHeight-40,y+12)+'px';label.textContent=`${Math.round(rect.width)} × ${Math.round(rect.height)}`;};
canvas.onpointerup=async()=>{if(!start)return;start=null;if(!rect||rect.width<4||rect.height<4)return;busy=true;try{await window.desktop.invoke('capture:crop',rect);}catch(e){busy=false;document.querySelector('.hint').textContent=e.message;}};
document.addEventListener('keydown',e=>{if(e.key==='Escape')window.desktop.invoke('capture:cancel');});
