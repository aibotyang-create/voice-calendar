# Firebase 연결 마무리

프로젝트: `aicalendar-af47d` · 앱 주소: https://voice-calendar-rose.vercel.app/

웹 앱 firebaseConfig는 코드에 반영했습니다. Analytics는 사용하지 않습니다. 서비스 계정 키·Admin SDK는 필요하지 않습니다.

## 1. Google 로그인 켜기

1. Firebase 콘솔에서 **Authentication → 시작하기 → 로그인 방법(Sign-in method) → Google**을 켭니다.
2. 프로젝트 지원 이메일을 선택하고 저장합니다.
3. **Authentication → 설정 → 승인된 도메인(Authorized domains)**에 `voice-calendar-rose.vercel.app`을 추가합니다.
4. 앱의 **인맥 저장소 연결**을 눌러 `qaz73700@gmail.com`으로 로그인합니다.

캘린더 OAuth와 Firebase는 서로 다른 프로젝트입니다. Firebase는 Firebase 프로젝트의 Google 로그인 팝업을 사용하며, 캘린더 연결은 기존 Google OAuth를 그대로 사용합니다. 앱 상단에서 Google 캘린더를 연결하고 인맥 섹션에서 저장소를 연결하면 두 기능을 함께 쓸 수 있습니다. 새로고침 후 다시 연결해야 합니다.

## 2. Firestore 만들기

1. **Cloud Firestore → 데이터베이스 만들기**를 누릅니다.
2. Standard edition, 기본 `(default)` 데이터베이스를 선택합니다.
3. 한국에서 사용한다면 제공되는 위치 중 서울(`asia-northeast3`)을 선택할 수 있습니다. 데이터 위치는 생성 전에 확인하세요.
4. **프로덕션 모드**로 생성합니다.
5. **규칙(Rules)** 탭에서 저장소 최상위의 `firestore.rules` 내용을 전체 복사해 붙여넣고 **게시(Publish)**합니다.

규칙은 Firebase UID와 이메일 `qaz73700@gmail.com`이 모두 맞는 사용자에게만 본인 경로 읽기·쓰기를 허용합니다. 다른 계정을 쓰려면 규칙의 이메일과 Vercel의 ALLOWED_EMAIL을 의도한 계정으로 함께 수정하세요. 공개 읽기/쓰기 규칙으로 바꾸지 마세요.

## 3. 사용 확인

1. 앱을 새로고침합니다.
2. **인맥 저장소 연결**로 Firebase에 로그인합니다.
3. **인맥 추가**로 본인이 만든 테스트 연락처를 저장합니다.
4. 인맥 지도에 나타나는지 확인합니다. 다른 기기에서 같은 Firebase 계정으로 로그인했을 때도 보이는지 확인합니다.
5. **Google 캘린더 연결** 후 실제 만남 상대의 이름이 들어간 일정을 등록합니다.
6. 월간 캘린더와 **다가오는 만남, 챙길 것**에 일정·관련 메모가 나타나는지 확인합니다.
7. 준비할 항목을 체크하고 새로고침·재연결 후에도 체크가 유지되는지 확인합니다.

인맥은 직접 등록하거나 대화 메모를 AI로 정리한 뒤 확인해 저장합니다. 전화번호부 전체 자동 가져오기, 명함 사진 OCR, 상시 녹음은 이번 버전에 포함하지 않았습니다. 휴대폰 키보드 음성 받아쓰기로 만남 메모를 입력할 수 있습니다.

## 저장 구조

```text
users/{Firebase UID}/contacts/{contact ID}
users/{Firebase UID}/tasks/{event/contact/action hash}
```

연락처에는 이름·회사·직함·관계·관계 강도·마지막 연락일·관심사·후속 할 일·메모·이메일·전화번호를 저장합니다. 삭제 대신 보관 기능을 제공하며, 보관한 인맥은 지도와 연결 후보에서 제외됩니다. 준비 체크리스트는 일정과 연락처, 할 일 내용에 따라 구분됩니다. 기기 내 연락처 사본을 별도로 저장하지 않습니다.

인맥은 최대 500개, 저장된 준비 상태는 최대 1,000개를 실시간 구독합니다. 지도에는 관계 강도순 최대 20명을 표시하며 전체 인맥은 아래 목록·검색으로 볼 수 있습니다. AI가 추측한 관계를 그리는 대신 직접 입력한 관계 강도를 사용합니다.

캘린더는 Google의 기본 캘린더 전체를 월 단위로 표시합니다. ‘말해에서 새로 등록한 일정’ 필터는 이번 업데이트 이후 출처 태그가 붙은 일정에 적용됩니다. 이전 앱 등록 일정도 ‘전체’ 필터에서 볼 수 있습니다. 다가오는 만남은 현재부터 14일 범위이며, 등록된 인맥 이름이 일정 제목/설명에 있거나 참석자 이메일이 같으면 연결 후보로 보여줍니다. 동명이인은 직접 확인해야 합니다. 사람의 신경 쓸 점은 저장한 정보만 표시하며, 알 수 없는 개인 특성을 추측하지 않습니다.

참고: [Firebase Google 로그인](https://firebase.google.com/docs/auth/web/google-signin), [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/rules-conditions).

## 검증 범위

단위 테스트 8개와 JS 문법 검사를 통과했습니다. 실제 Firebase Google 로그인, Firestore 보안 규칙과 계정 간 접근 격리, 저장·다른 기기 동기화, Google 캘린더 쓰기는 콘솔 설정 후 실제 계정으로 확인해야 합니다. 설정되지 않은 Firebase를 연결 완료로 표시하지 않습니다.
