import test from 'node:test';
import assert from 'node:assert/strict';
import {expenseEntry,readExpense,initDailyExpenses} from '../public/daily-expenses.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('KRW expenses validate whole won and reject invalid or negative amounts',()=>{
 assert.deepEqual(expenseEntry(' 점심 ','12,500'),{title:'점심',amount:12500});assert.throws(()=>expenseEntry('점심','-100'));assert.throws(()=>expenseEntry('점심','12.5'));assert.equal(readExpense({label:'broken'}),null);
});
test('expense form saves selected day, totals won, deletes rows and switches dates without leaking records',async()=>{
 const {document}=parseHTML('<div id="host"></div>');globalThis.document=document;let date='2026-11-14',saved,removed,emit;
 const store={watchExpenses:(day,fn)=>{emit=fn;fn([]);return ()=>{};},saveExpense:async entry=>{saved=entry;},removeExpense:async id=>removed=id};
 const component=initDailyExpenses({host:document.getElementById('host'),getData:()=>({store}),getDate:()=>date,today:()=> '2026-11-14',errorMessage:e=>e.message});component.render();
 document.querySelector('.expense-title').value='점심';document.querySelector('.expense-amount').value='12,500';await document.querySelector('form').onsubmit({preventDefault(){}});
 assert.equal(saved.date,'2026-11-14');assert.equal(saved.amount,12500);assert.match(saved.id,/^expense-/);assert.equal(document.querySelector('.expense-total').textContent,'12,500원');
 emit([{id:saved.id,label:JSON.stringify({title:'점심',amount:12500}),done:false},{id:'expense-old',label:JSON.stringify({title:'취소한 지출',amount:10000}),done:true}]);assert.equal(document.querySelectorAll('.expense-row').length,1);
 await document.querySelector('.expense-row button').onclick();assert.equal(removed,saved.id);assert.equal(document.querySelector('.expense-total').textContent,'0원');
 date='2026-11-13';component.render();assert.equal(document.querySelector('h3').textContent,'11/13 지출');assert.equal(document.querySelector('.expense-total').textContent,'0원');
});
