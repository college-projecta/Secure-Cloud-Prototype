const $=id=>document.getElementById(id);
const fileInput=$("fileInput"),fileLabel=$("fileLabel"),dropzone=$("dropzone"),blockSizeInput=$("blockSize");
const processBtn=$("processBtn"),verifyBtn=$("verifyBtn"),downloadBtn=$("downloadBtn"),packageBtn=$("packageBtn");
const statusBadge=$("statusBadge"),statusText=$("statusText"),blockList=$("blockList");
const tamperLab=$("tamperLab"),tamperBtn=$("tamperBtn");
let selectedFile=null,state=null;

const MAX_DEMO_SIZE=100*1024*1024;
const formatBytes=b=>{if(!Number.isFinite(b))return"—";if(b<1024)return b+" B";const u=["KB","MB","GB"],v0=b/1024;let v=v0,i=0;while(v>=1024&&i<u.length-1){v/=1024;i++}return v.toFixed(v>=10?1:2)+" "+u[i]};
const shortHash=h=>h.slice(0,10)+"…"+h.slice(-8);
const setStatus=(text,kind="")=>{statusText.textContent=text;statusBadge.textContent=kind==="success"?"SECURE":kind==="error"?"ALERT":kind==="working"?"WORKING":"IDLE";statusBadge.className="badge "+kind};
const metric=(id,value)=>$(id).textContent=value;
const check=(id,ok,text)=>{const el=$(id);el.classList.toggle("ok",ok);el.classList.toggle("bad",!ok);el.querySelector("span").textContent=ok?"✓":"○";el.querySelector("small").textContent=text};
const progress=value=>{const bar=$("progressBar");if(bar)bar.style.width=Math.max(0,Math.min(100,value))+"%";const valueEl=$("progressValue");if(valueEl)valueEl.textContent=Math.round(value)+"%"};
const yieldToBrowser=()=>new Promise(resolve=>setTimeout(resolve,0));

async function digestHex(bytes){const hash=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function concatBlocks(blocks){const total=blocks.reduce((n,b)=>n+b.byteLength,0),out=new Uint8Array(total);let offset=0;for(const b of blocks){out.set(b,offset);offset+=b.byteLength}return out}
function bytesToBase64(bytes){let binary="";const step=0x8000;for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode(...bytes.subarray(i,i+step));return btoa(binary)}

function renderBlocks(blocks){
 blockList.innerHTML="";
 blocks.forEach((b,i)=>{
   const row=document.createElement("div");row.className="block-row";
   row.innerHTML=`<span class="index">#${String(i+1).padStart(3,"0")}</span><span class="hash" title="${b.hash}">${shortHash(b.hash)}</span><strong>${formatBytes(b.data.byteLength)}</strong><span class="state">● ENCRYPTED</span>`;
   blockList.appendChild(row);
 });
 $("blockSummary").textContent=blocks.length+" BLOCKS";
}

function enableWorkspace(enabled){verifyBtn.disabled=!enabled;downloadBtn.disabled=!enabled;packageBtn.disabled=!enabled;tamperBtn.disabled=!enabled}

fileInput.addEventListener("change",()=>handleFile(fileInput.files[0]));
async function handleFile(file){
 selectedFile=file||null;fileLabel.textContent=file?file.name:"Drop a file here";processBtn.disabled=!file;
 if(file){
   metric("originalSize",formatBytes(file.size));
   const meta=$("fileMeta");if(meta){meta.hidden=false;$("fileMetaName").textContent=file.name;$("fileMetaSize").textContent=formatBytes(file.size)}
   progress(5);
   if(file.size>MAX_DEMO_SIZE){setStatus("Demo limit is 100 MB. Choose a smaller file for fast browser processing.","error");processBtn.disabled=true;return}
   setStatus("File ready. Fast block encryption will run locally.","success");
 }
}

["dragenter","dragover"].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.add("drag")}));
["dragleave","drop"].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.remove("drag")}));
dropzone.addEventListener("drop",e=>handleFile(e.dataTransfer.files[0]));

processBtn.addEventListener("click",async()=>{
 if(!selectedFile)return;
 const size=Number(blockSizeInput.value);
 processBtn.disabled=true;enableWorkspace(false);progress(10);
 setStatus("Generating a local AES-256 key…","working");
 try{
   const key=await crypto.subtle.generateKey({name:"AES-GCM",length:256},true,["encrypt","decrypt"]);
   const source=new Uint8Array(await selectedFile.arrayBuffer());
   const totalBlocks=Math.ceil(source.byteLength/size);
   const blocks=[];
   for(let i=0;i<totalBlocks;i++){
     const plain=source.subarray(i*size,Math.min(source.byteLength,(i+1)*size));
     const iv=crypto.getRandomValues(new Uint8Array(12));
     const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,tagLength:128},key,plain));
     blocks.push({index:i+1,data:encrypted,iv,hash:await digestHex(encrypted),plainSize:plain.byteLength});
     progress(10+((i+1)/totalBlocks)*75);
     if(i%2===0)await yieldToBrowser();
   }
   const ciphertext=concatBlocks(blocks.map(b=>b.data));
   state={key,blocks,blockSize:size,ciphertextHash:await digestHex(ciphertext),originalName:selectedFile.name,originalType:selectedFile.type||"application/octet-stream",originalSize:selectedFile.size,tampered:false};
   check("checkEncrypt",true,"AES-256-GCM encrypted block-by-block");
   check("checkSegment",true,totalBlocks+" encrypted blocks");
   check("checkIntegrity",true,"SHA-256 fingerprints ready");
   renderBlocks(blocks);
   metric("encryptedSize",formatBytes(ciphertext.byteLength));metric("blockCount",blocks.length);metric("effectiveBlockSize",formatBytes(size));
   enableWorkspace(true);tamperLab.classList.remove("hidden");progress(100);
   setStatus("Encryption completed. Your encrypted blocks are ready to verify or restore.","success");
 }catch(err){console.error(err);setStatus("Pipeline failed: "+err.message,"error");}
 finally{processBtn.disabled=false}
});

async function verifyState(){
 if(!state)return false;
 const parts=[];
 for(const block of state.blocks){
   if(await digestHex(block.data)!==block.hash)throw new Error("Block #"+block.index+" failed integrity verification");
   parts.push(block.data);
 }
 const reconstructed=concatBlocks(parts);
 if(await digestHex(reconstructed)!==state.ciphertextHash)throw new Error("Ciphertext hash mismatch");
 return true;
}

verifyBtn.addEventListener("click",async()=>{
 if(!state)return;
 setStatus("Verifying encrypted blocks…","working");
 try{await verifyState();check("checkIntegrity",true,"All encrypted blocks verified");setStatus("Integrity verification passed. Payload is unchanged.","success")}
 catch(err){check("checkIntegrity",false,err.message);setStatus("Integrity verification failed: "+err.message,"error")}
});

downloadBtn.addEventListener("click",async()=>{
 if(!state)return;
 downloadBtn.disabled=true;setStatus("Verifying and decrypting blocks…","working");
 try{
   await verifyState();
   const plainParts=[];
   for(let i=0;i<state.blocks.length;i++){
     const block=state.blocks[i];
     const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:block.iv,tagLength:128},state.key,block.data);
     plainParts.push(new Uint8Array(plain));
     progress(50+((i+1)/state.blocks.length)*50);
     if(i%2===0)await yieldToBrowser();
   }
   const plain=concatBlocks(plainParts);
   const blob=new Blob([plain],{type:state.originalType}),url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download=state.originalName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus("Original file decrypted and downloaded successfully.","success");check("checkIntegrity",true,"AES-GCM authentication passed");
 }catch(err){setStatus("Decryption rejected: "+err.message,"error");check("checkIntegrity",false,"Authentication failed")}
 finally{downloadBtn.disabled=false}
});

packageBtn.addEventListener("click",async()=>{
 if(!state)return;
 try{
   await verifyState();
   const manifest={format:"secure-cloud-cipher-package",version:2,createdAt:new Date().toISOString(),algorithm:"AES-256-GCM-per-block",tagBits:128,blockSize:state.blockSize,originalFile:{name:state.originalName,type:state.originalType,size:state.originalSize},ciphertextSha256:state.ciphertextHash,blocks:state.blocks.map(b=>({index:b.index,size:b.data.byteLength,plainSize:b.plainSize,ivBase64:btoa(String.fromCharCode(...b.iv)),sha256:b.hash,dataBase64:bytesToBase64(b.data)})),keyHandling:"Encryption key remains in browser memory and is intentionally not exported."};
   const blob=new Blob([JSON.stringify(manifest,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download=state.originalName+".secure-cloud.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus("Encrypted package exported. Secret key was not exported.","success");
 }catch(err){setStatus("Package export blocked: "+err.message,"error")}
});

tamperBtn.addEventListener("click",async()=>{
 if(!state)return;
 const target=state.blocks[Math.floor(state.blocks.length/2)];
 if(!target||!target.data.length)return;
 target.data=new Uint8Array(target.data);target.data[0]^=1;state.tampered=true;
 renderBlocks(state.blocks);check("checkIntegrity",false,"Block modified — expected failure");
 setStatus("Tamper simulation applied. Run verification to observe rejection.","error");verifyBtn.disabled=false;
});

window.addEventListener("beforeunload",()=>{selectedFile=null;state=null});
