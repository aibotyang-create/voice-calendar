# Google 로그인 뒤 PIN 잠금 설정

코드는 준비되어 있지만 아래 서버 설정과 Firebase 규칙 게시 전에는 잠금이 활성화되지 않습니다. PIN 원문은 프런트엔드나 저장소에 넣지 않습니다. 최초 성공 시 Firebase의 클라이언트 접근 금지 영역에 scrypt 해시를 저장합니다. 별도 pepper는 Vercel 서버 환경변수에만 둡니다.

## 1. Firebase 서버 키 발급

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 `aicalendar-af47d` 프로젝트를 엽니다.
2. 톱니바퀴 → 프로젝트 설정 → 서비스 계정 → Firebase Admin SDK → 새 비공개 키 생성으로 JSON 파일을 받습니다.
3. 이 JSON은 채팅, GitHub, 공개 폴더에 올리지 마세요. 다음 단계에서 Vercel에 직접 입력합니다.

## 2. Vercel 환경변수 등록

[Vercel](https://vercel.com/) → `voice-calendar` 프로젝트 → Settings → Environment Variables에서 Production 환경에 다음을 등록합니다. Sensitive 옵션이 있으면 사용하세요. Preview에도 잠금이 필요하면 별도로 적용합니다.

| 이름 | 값 |
| --- | --- |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | 1단계에서 받은 JSON 파일 전체 내용 |
| `APP_LOCK_PEPPER` | 로컬 비공개 설정 파일의 같은 이름 값 |
| `APP_PIN_BOOTSTRAP_RECORD` | 로컬 비공개 설정 파일의 같은 이름 JSON 값 |
| `APP_LOCK_REQUIRED` | `true` |

요청한 PIN으로 비공개 설정 파일을 이 컴퓨터에 생성했습니다: `C:\Users\user\Documents\Codex\2026-11-06\new-chat\work\pin-lock-private.env`. 메모장으로 열어 위 두 값만 직접 복사합니다. 이 파일도 채팅에 보내거나 저장소에 올리지 마세요. PIN 원문은 들어 있지 않습니다. 기존 `ALLOWED_EMAIL`, `GOOGLE_CLIENT_ID` 설정은 유지합니다.

## 3. 배포와 Firebase 규칙 게시

1. Vercel → Deployments → 최신 배포의 메뉴 → Redeploy를 실행합니다. 환경변수 변경은 재배포 후 적용됩니다.
2. Firebase → Build → Firestore Database → Rules에서 이 저장소의 `firestore.rules` 전체를 붙여넣고 Publish를 누릅니다. 로컬의 `outputs/Firebase-보안규칙.txt`도 같은 내용입니다.
3. 이 두 단계 사이에는 잠시 로그인이 막힐 수 있습니다. 서버는 이전 규칙이 PIN 없이 데이터 읽기를 허용하면 잠금 해제를 거절합니다.
4. 사이트를 새로 열고 Google 로그인 → PIN 입력 → 데이터 표시를 확인합니다. 인맥 관리 진입 시 같은 PIN을 다시 입력합니다.
5. 한 번 정상 로그인한 뒤에는 `APP_PIN_BOOTSTRAP_RECORD`를 Vercel에서 제거하고 재배포할 수 있습니다. 최초 해시는 이미 Firebase에 생성되어 있습니다. `APP_LOCK_PEPPER`는 유지하세요.

## 동작 확인과 범위

- 틀린 PIN은 거절하며, 5회 실패하면 계정 전체에서 15분간 제한합니다. 서버 인스턴스가 달라도 동일하게 적용됩니다.
- 잠금 세션은 20분 후 만료됩니다. Firestore 규칙도 세션의 유효기간과 취소 상태를 확인합니다.
- Firebase 기존 사용자 UID를 유지하므로 기존 기록을 다른 계정으로 옮기지 않습니다.
- 인맥 재확인은 화면 접근에 대한 추가 검증입니다. 앱 잠금 해제 뒤 대시보드와 AI 비서는 인맥 데이터를 종합할 수 있습니다. 인맥 데이터 자체를 별도 암호로 분리 암호화한 구조는 아닙니다.
- PIN은 복호화 가능한 암호문 대신 단방향 해시로 저장합니다. 모든 문서 본문을 PIN으로 암호화하는 기능은 아닙니다. Google Drive나 Google Calendar에 직접 로그인하는 경로는 이 웹사이트 PIN의 보호 범위 밖입니다.
- 6자리 PIN이나 어떤 시스템도 절대 해킹 불가를 보장하지 못합니다. Firebase·Vercel 관리자 계정과 서버 키 보호도 필요합니다.

## PIN 변경 또는 복구

관리자만 수행합니다. 서버에서 `scripts/prepare-pin-lock.mjs`에 새 PIN을 표준 입력으로 전달하여 새 비공개 파일을 생성합니다. 새 pepper와 bootstrap record를 Vercel에 등록하고, 해당 사용자의 `_privatePin/{uid}` 문서를 Firebase 콘솔에서 삭제한 뒤 재배포합니다. 새 pepper는 기존 서버 쿠키를 무효화하지만 기존 Firestore 세션도 즉시 끊으려면 `_privateSessions`의 해당 UID 문서를 모두 `revoked: true`로 바꾸세요. 관리자 자격 증명 없이 클라이언트에서 PIN을 초기화하는 기능은 제공하지 않습니다.

참고: [Firebase 커스텀 토큰](https://firebase.google.com/docs/auth/admin/create-custom-tokens), [Firebase ID 토큰 검증](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [OWASP 비밀번호 저장 지침](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
