import test from 'node:test';
import assert from 'node:assert/strict';
import {createDriveFiles} from '../public/drive-files.js';
test('document deletion trashes only matching app-owned original and never permanently deletes files',async()=>{
 const calls=[],request=async(url,options)=>{calls.push({url,options});return {ok:true,status:200,json:async()=>({appProperties:{ownerUid:'owner',archiveEntry:'entry'},trashed:false})};};
 await createDriveFiles('token','owner',request).trash('file_1234567890','entry');assert.equal(calls.length,2);assert.equal(calls[1].options.method,'PATCH');assert.deepEqual(JSON.parse(calls[1].options.body),{trashed:true});assert.ok(calls.every(c=>c.options.method!=='DELETE'));
 let mutations=0;await assert.rejects(createDriveFiles('token','owner',async(_,options)=>{if(options.method)mutations++;return {ok:true,status:200,json:async()=>({appProperties:{ownerUid:'someone-else',archiveEntry:'entry'}})};}).trash('file_1234567890','entry'),/본인/);assert.equal(mutations,0);
});
