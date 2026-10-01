import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "node:crypto";

const s3=new S3Client({});
const db=DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bucket=process.env.BUCKET_NAME;
const table=process.env.TABLE_NAME;
const response=(status,body)=>({statusCode:status,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(body)});

function userId(event){
  const claims=event.requestContext?.authorizer?.jwt?.claims;
  return claims?.sub;
}
function body(event){try{return JSON.parse(event.body||"{}")}catch{return null}}

export async function uploadSession(event){
  const uid=userId(event); const input=body(event);
  if(!uid||!input)return response(400,{error:"invalid_request"});
  const count=Number(input.blockCount), blockSize=Number(input.blockSize);
  if(!Number.isInteger(count)||count<1||count>10000||!Number.isInteger(blockSize)||blockSize<65536||blockSize>10485760)return response(400,{error:"invalid_block_configuration"});
  const id=crypto.randomUUID(), prefix=`users/${uid}/objects/${id}`;
  const urls=[];
  for(let i=1;i<=count;i++){
    const key=`${prefix}/block-${String(i).padStart(6,"0")}`;
    urls.push({index:i,key,url:await getSignedUrl(s3,new PutObjectCommand({Bucket:bucket,Key:key,ContentType:"application/octet-stream"}),{expiresIn:900})});
  }
  await db.send(new PutCommand({TableName:table,Item:{pk:`OBJ#${uid}#${id}`,owner:uid,id,createdAt:new Date().toISOString(),name:String(input.name||"file"),type:String(input.type||"application/octet-stream"),size:Number(input.size||0),blockCount:count,blockSize,ciphertextSha256:String(input.ciphertextSha256||""),blocks:urls.map(x=>({index:x.index,key:x.key}))}}));
  return response(200,{objectId:id,expiresIn:900,uploads:urls});
}

export async function downloadSession(event){
  const uid=userId(event); const input=body(event);
  if(!uid||!input?.objectId)return response(400,{error:"invalid_request"});
  const item=(await db.send(new GetCommand({TableName:table,Key:{pk:`OBJ#${uid}#${input.objectId}`}}))).Item;
  if(!item||item.owner!==uid)return response(404,{error:"not_found"});
  const blocks=await Promise.all(item.blocks.map(async b=>({index:b.index,key:b.key,url:await getSignedUrl(s3,new GetObjectCommand({Bucket:bucket,Key:b.key}),{expiresIn:900})})));
  return response(200,{object:{id:item.id,name:item.name,type:item.type,size:item.size,blockCount:item.blockCount,blockSize:item.blockSize,ciphertextSha256:item.ciphertextSha256},expiresIn:900,downloads:blocks});
}