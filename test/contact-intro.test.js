import test from 'node:test';import assert from 'node:assert/strict';
import {cleanContact} from '../public/people-data.js';import {contactChanges} from '../public/contact-autosave.js';
test('한줄 소개는 최대 200자로 읽고 줄바꿈을 한 줄로 정리하며 삭제도 자동저장에 반영한다',()=>{assert.equal(cleanContact({name:'사람',intro:' 첫 줄\n다음 줄 '}).intro,'첫 줄 다음 줄');assert.equal(cleanContact({name:'사람',intro:'a'.repeat(250)}).intro.length,200);assert.deepEqual(contactChanges({intro:'이전 소개'},{intro:''}),{intro:''});assert.equal(cleanContact({name:'기존 인맥'}).intro,undefined);});
