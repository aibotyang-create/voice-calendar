import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticateStore} from '../public/google-session.js';
test('Google 로그인 토큰을 그대로 사용해 팝업 없이 같은 계정의 Firebase 세션을 만든다',async()=>{
  const session={},credential={},user={uid:'existing-google-uid',email:'owner@example.com'};let calls=0;
  const auth={GoogleAuthProvider:{credential(idToken,accessToken){assert.equal(idToken,null);assert.equal(accessToken,'calendar-access-token');return credential;}},signInWithCredential:async(s,c)=>{calls++;assert.equal(s,session);assert.equal(c,credential);return {user};},signInWithPopup(){assert.fail('두 번째 로그인 팝업을 열면 안 됩니다.');}};
  assert.equal(await authenticateStore(auth,session,'calendar-access-token'),user);assert.equal(calls,1);
  await assert.rejects(authenticateStore(auth,session,''),/로그인/);assert.equal(calls,1);
});
test('Firebase 인증 실패를 숨기거나 별도의 계정 로그인으로 우회하지 않는다',async()=>{
  const failure=Object.assign(Error('invalid credential'),{code:'auth/invalid-credential'});
  const auth={GoogleAuthProvider:{credential:()=>({})},signInWithCredential:async()=>{throw failure;}};
  await assert.rejects(authenticateStore(auth,{},'calendar-token'),e=>e===failure);
});
