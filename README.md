# 말해 캘린더

말하거나 입력한 한국어 문장에서 일정을 정리해 본인 Google 캘린더에 등록하는 개인용 웹앱입니다. 월간 캘린더, 인맥 지도, 사람별 메모, 다가오는 만남의 준비 체크리스트를 제공합니다. 배포 주소: https://voice-calendar-rose.vercel.app/

인맥·준비 상태는 Firebase Authentication과 Firestore에 저장합니다. Firebase 콘솔 연결 마무리는 `FIREBASE_SETUP.md`를 따라 진행하세요. 인맥 설정값은 반영했으며 실제 저장은 Google 로그인과 데이터베이스·보안 규칙 설정이 필요합니다.

## 사용할 때

1. Google 캘린더 연결을 누릅니다.
2. 마이크로 “내일 오후 3시 강남에서 민수랑 미팅, 한 시간, 30분 전 알림”처럼 말합니다.
3. 말을 마치거나 마이크를 다시 누르면 정리합니다. 날짜·시간이 모호하면 질문에 답합니다.
4. 기본 설정은 자동 등록입니다. ‘내용이 명확하면 바로 등록’을 끄면 수정 후 직접 등록합니다.
5. 완료 화면에서 Google 캘린더를 열거나 방금 등록한 일정을 취소할 수 있습니다.

음성 입력이 지원되지 않으면 휴대폰 키보드의 음성 받아쓰기 또는 텍스트 입력을 사용하세요. 앱을 닫은 상태에서 듣는 기능은 없습니다. 시간대는 Asia/Seoul로 고정합니다. 종료 시간 생략 시 1시간, 알림 생략 시 30분 전입니다. 초대·반복·종일 일정, 여러 일정 동시 등록은 지원하지 않습니다. 연결 토큰은 메모리에만 두므로 새로고침·만료 시 다시 연결해야 합니다. 한 번 설정 후 영구 연결되는 버전은 아닙니다.

## 처음 설정하기

### 1. Google Cloud 설정

[Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 새로 만듭니다.

1. API 및 서비스의 라이브러리에서 **Google Calendar API**를 찾아 사용 설정합니다.
2. **Google Auth Platform → Branding**에서 앱 이름(말해 캘린더), 지원 이메일, 연락 이메일을 설정합니다.
3. 일반 개인 Google 계정은 **Audience → External**로 설정하고 테스트 사용자에 본인 이메일을 추가합니다. 개인 테스트 사용을 위해 테스트 상태로 유지할 수 있습니다. 조직 계정은 관리자 정책에 영향을 받을 수 있습니다.
4. **Data Access**에서 `openid`, `email`, `https://www.googleapis.com/auth/calendar.events` 범위를 설정합니다. 캘린더 일정 권한은 등록·취소에 사용합니다.
5. **Clients → Create client → Web application**을 만듭니다.
6. **Authorized JavaScript origins**에 로컬 개발용 `http://localhost:3000`을 추가합니다. Vercel 배포 후에는 실제 서비스 주소(예: `https://본인프로젝트.vercel.app`)도 추가합니다. 경로 없이 도메인까지만 입력합니다.
7. 발급된 **Client ID**를 보관합니다. 이 앱은 브라우저 토큰 방식을 사용하므로 Client Secret이나 Redirect URI는 사용하지 않습니다.

공식 안내: [Calendar JavaScript quickstart](https://developers.google.com/workspace/calendar/api/quickstart/js), [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model).

### 2. OpenAI API 설정

[OpenAI API 키](https://platform.openai.com/api-keys)를 만들고 API 이용에 필요한 계정 결제·사용 한도를 확인하세요. API 키는 Vercel 환경 변수에만 입력합니다. 소스나 채팅에 붙여넣지 마세요. AI 호출에는 API 사용량에 따른 비용이 발생할 수 있습니다.

기본 모델은 `gpt-4o-mini`입니다. `OPENAI_MODEL` 환경 변수로 Responses API의 Structured Outputs를 지원하며 본인 계정에서 사용할 수 있는 모델로 변경할 수 있습니다. [공식 Structured Outputs 문서](https://developers.openai.com/api/docs/guides/structured-outputs).

### 3. Vercel 배포

가장 쉬운 방법은 이 폴더를 본인의 GitHub 비공개 저장소에 올린 후 [Vercel](https://vercel.com/new)에서 가져오는 것입니다. GitHub 저장소 최상단에 `package.json`, `vercel.json`, `api`, `public`이 있어야 합니다.

Vercel 프로젝트 생성 화면에서 다음과 같이 설정하세요.

| 항목 | 값 |
| --- | --- |
| Framework Preset | Other |
| Root Directory | 이 소스 폴더 또는 저장소 최상위 |
| Build Command | 비워두기 |
| Output Directory | public |
| Install Command | 기본값(추가 패키지 없음) |
| Node.js | 22 이상 |

Environment Variables에 아래 3개를 입력하고 Deploy를 누릅니다.

| 이름 | 입력할 값 |
| --- | --- |
| GOOGLE_CLIENT_ID | Google의 `...apps.googleusercontent.com` Client ID |
| OPENAI_API_KEY | 본인 OpenAI API 키 |
| ALLOWED_EMAIL | 앱을 사용할 본인 Google 이메일, 테스트 사용자와 동일 |

배포 완료 주소를 Google Cloud의 Authorized JavaScript origins에 추가합니다. 환경 변수를 나중에 바꿨다면 Vercel에서 Redeploy해야 적용됩니다.

명령줄을 선호한다면 이 폴더에서 `npx vercel`로 로그인·프로젝트 생성·배포를 진행하고, Vercel 대시보드에서 환경 변수를 넣은 뒤 `npx vercel --prod`로 다시 배포할 수 있습니다. 이 작업에는 본인의 계정 로그인이 필요합니다. [Vercel Node.js Functions 문서](https://vercel.com/docs/functions/runtimes/node-js).

### 4. 첫 사용 확인

1. 배포 주소를 휴대폰 브라우저에서 열고 Google 캘린더를 연결합니다.
2. 자동 등록 스위치를 끕니다.
3. 내일 날짜와 명확한 시간을 포함해 ‘테스트 일정’을 말합니다.
4. 정리된 날짜, 시간, 제목을 확인하고 등록합니다.
5. Google 캘린더에서 실제 반영을 확인한 다음 앱에서 등록 취소를 누릅니다.
6. 문제가 없으면 자동 등록을 켜고 사용하세요.

## 로컬 실행

Node.js 22 이상에서 별도 패키지 설치 없이 실행합니다.

```powershell
Copy-Item .env.example .env
# .env를 편집해 환경 변수 3개를 입력합니다.
npm run dev
```

`http://localhost:3000`을 엽니다. `.env`는 Git에서 제외됩니다. 로컬 서버는 127.0.0.1에만 바인딩하므로 휴대폰에서는 Vercel HTTPS 주소로 사용하세요.

`npm` 명령이 없는 환경에서는 `node dev.mjs`로 실행하고, `node --test`, `node --check public/app.js`, `node --check api/parse.js`로 검증할 수 있습니다.

## 데이터와 제한

- Google 액세스 토큰은 브라우저 메모리에만 저장하며 AI 요청 시 서버로 전달해 Google에서 계정·클라이언트 ID를 검증합니다. `ALLOWED_EMAIL` 계정만 AI를 호출할 수 있습니다.
- 변환된 텍스트와 추가 질문 대화는 OpenAI로 전달됩니다. Responses 요청은 `store:false`를 사용합니다. 서비스 제공자의 별도 보존 정책까지 비활성화하는 의미는 아닙니다.
- 브라우저 음성 인식은 브라우저 제공 서비스에 의존합니다. 원본 음성을 앱 서버에 업로드하지 않습니다.
- 일정은 기본 캘린더(`primary`)에 저장하며, 인맥과 준비 체크 상태는 본인 Firebase UID 아래 Firestore에 저장합니다.
- 등록 재시도는 같은 event ID를 사용해 네트워크 오류로 인한 중복 등록을 줄입니다. 새 입력으로 같은 일정을 다시 요청하는 경우까지 중복을 제거하지는 않습니다.
- 자동 등록의 해석 결과가 잘못될 수 있습니다. 완료 화면과 캘린더에서 확인하고 필요하면 취소하세요.
- 이 버전은 개인용입니다. 다중 사용자 서비스나 상시 백그라운드 연결을 위해서는 별도의 OAuth 서버 세션·토큰 저장·운영 설계가 필요합니다.

## 문제 해결

| 증상 | 확인할 내용 |
| --- | --- |
| origin_mismatch | Google Clients에 현재 접속한 정확한 origin이 등록됐는지 확인 |
| access_denied | Audience의 테스트 사용자에 본인 이메일이 있는지 확인 |
| 본인 계정으로 연결하라는 메시지 | ALLOWED_EMAIL, 로그인 계정, 테스트 사용자 이메일, Client ID 확인 |
| AI 연결 실패 | API 키, 결제 설정, 모델 사용 권한 확인 |
| 마이크 사용 불가 | 브라우저 지원, HTTPS, 마이크 권한 확인. 키보드 받아쓰기 사용 가능 |
| Google 연결 만료 | 연결 버튼을 다시 눌러 인증 후 재시도 |

## 검증 상태

`npm test`는 이벤트 시간 검증, 추가 질문, 인증 없는 요청 차단, 다른 OAuth 클라이언트 차단, AI 구조화 응답 처리를 모의 응답으로 검증합니다. `npm run check`는 JavaScript 문법을 확인합니다. 실제 음성 인식, Google OAuth/캘린더 쓰기, OpenAI 응답, Vercel 배포는 본인 계정 설정 후 위의 첫 사용 절차로 확인해야 합니다. 이 환경의 브라우저는 로컬 서버에 접근하지 못해 시각적 QA를 완료하지 못했습니다.
