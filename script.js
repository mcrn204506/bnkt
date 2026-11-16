const imageInput=document.getElementById('imageInput');
const fileName=document.getElementById('fileName');
const countInput=document.getElementById('count');
const countValue=document.getElementById('countValue');
const previewGrid=document.getElementById('previewGrid');
const previewArea=document.getElementById('previewArea');
const emptyState=document.getElementById('emptyState');
let sourceImage=null, mode='vertical', slices=[];

document.querySelectorAll('.mode').forEach(button=>{
  button.addEventListener('click',()=>{
    document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active'));
    button.classList.add('active'); mode=button.dataset.mode; render();
  });
});
function setCount(value){
  countInput.value=Math.max(2,Math.min(20,Number(value)));
  countValue.textContent=countInput.value; render();
}
countInput.addEventListener('input',()=>setCount(countInput.value));
document.getElementById('minus').addEventListener('click',()=>setCount(Number(countInput.value)-1));
document.getElementById('plus').addEventListener('click',()=>setCount(Number(countInput.value)+1));

imageInput.addEventListener('change',()=>{
  const file=imageInput.files&&imageInput.files[0]; if(!file)return;
  if(!file.type.startsWith('image/')){alert('画像ファイルを選んでください。');return;}
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{sourceImage=img;fileName.textContent=file.name;render();URL.revokeObjectURL(url);};
  img.onerror=()=>{alert('画像を読み込めませんでした。');URL.revokeObjectURL(url);};
  img.src=url;
});
function makeSlices(){
  if(!sourceImage)return [];
  const total=Number(countInput.value),w=sourceImage.naturalWidth,h=sourceImage.naturalHeight;
  return Array.from({length:total},(_,i)=>{
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    if(mode==='vertical'){
      const x0=Math.round(w*i/total),x1=Math.round(w*(i+1)/total);
      canvas.width=x1-x0;canvas.height=h;ctx.drawImage(sourceImage,x0,0,x1-x0,h,0,0,x1-x0,h);
    }else{
      const y0=Math.round(h*i/total),y1=Math.round(h*(i+1)/total);
      canvas.width=w;canvas.height=y1-y0;ctx.drawImage(sourceImage,0,y0,w,y1-y0,0,0,w,y1-y0);
    }
    return canvas;
  });
}
async function shareCanvas(canvas,index,button){
  const original=button.textContent;button.disabled=true;button.textContent='準備中…';
  try{
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('画像を作成できませんでした');
    const file=new File([blob],`bunkatsu-${String(index+1).padStart(2,'0')}.png`,{type:'image/png'});
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:`分割画像 ${index+1}`});
    }else{
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      alert('このブラウザでは共有メニューに対応していないため、画像をダウンロードしました。');
    }
  }catch(error){
    if(error.name!=='AbortError')alert('共有できませんでした。ブラウザの共有機能をご確認ください。');
  }finally{button.disabled=false;button.textContent=original;}
}
function render(){
  countValue.textContent=countInput.value;
  if(!sourceImage){previewArea.hidden=true;emptyState.hidden=false;return;}
  slices=makeSlices();previewGrid.innerHTML='';
  slices.forEach((canvas,i)=>{
    const card=document.createElement('div');card.className='slice-card'+(mode==='horizontal'?' horizontal':'');
    const img=document.createElement('img');img.alt=`分割画像 ${i+1}`;img.src=canvas.toDataURL('image/png');
    const info=document.createElement('div');info.className='slice-info';
    const label=document.createElement('span');label.textContent=`${i+1} / ${slices.length}`;
    const button=document.createElement('button');button.type='button';button.textContent='共有・保存';
    button.addEventListener('click',()=>shareCanvas(canvas,i,button));
    info.append(label,button);card.append(img,info);previewGrid.append(card);
  });
  emptyState.hidden=true;previewArea.hidden=false;
}
