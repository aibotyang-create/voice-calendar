// Reuse the token from the one Google consent flow; never open a Firebase popup.
export async function authenticateStore(auth,session,accessToken){
  if(typeof accessToken!=='string'||!accessToken)throw Error('먼저 Google 계정으로 로그인해주세요.');
  const credential=auth.GoogleAuthProvider.credential(null,accessToken);
  return (await auth.signInWithCredential(session,credential)).user;
}
