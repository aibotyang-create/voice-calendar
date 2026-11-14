import test from 'node:test';
import assert from 'node:assert/strict';
import {deleteCalendarEvent} from '../public/calendar-delete.js';
test('delete confirms event name, deletes just selected recurring instance, and tolerates already deleted events',async()=>{
 const event={id:'series_20261114T000000Z',summary:'주간 회의',recurringEventId:'series',start:{dateTime:'2026-11-14T09:00:00+09:00'}};let requested;
 assert.equal(await deleteCalendarEvent(event,{confirm:message=>{assert.match(message,/주간 회의/);assert.match(message,/선택한 이 일정만/);return true;},request:async(path,options)=>{requested={path,options};return {ok:true};}}),true);
 assert.equal(requested.path,'/series_20261114T000000Z');assert.equal(requested.options.method,'DELETE');
 assert.equal(await deleteCalendarEvent(event,{confirm:()=>false,request:()=>{throw Error('must not request');}}),false);
 assert.equal(await deleteCalendarEvent(event,{confirm:()=>true,request:async()=>({ok:false,status:410})}),true);
 await assert.rejects(()=>deleteCalendarEvent(event,{confirm:()=>true,request:async()=>({ok:false,status:403})}),/권한/);
});
