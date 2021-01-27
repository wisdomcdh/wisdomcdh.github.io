---
title: 소스 저장소 구성 - bitbucket
date: 2020-05-01
nav_order: 403
---
# 소스 저장소를 구성하며
{: .fs-9 }
원래는 MS azure devops와 gitHub 구성으로 전 과정을 좀 더 심플하게 진행하려 했었는데 AZURE FreeTire 에 익숙하지 않아 3주도 안되어 무료 크래딧을 다 써버리게 되었다.

그래서 그냥 JIRA로 오게되었고, 당연히 JIRA와 무료로 연동 가능한 bitbucket을 사용하게 되었다.

보통 gitHub을 한번이라도 써 보았으면 어떤 소스 저장소를 이용하던 딱히 문제될 것은 없는듯 하다.

---
## Repositories 구성
<img src="/assets/images/study/chalcak/bitbucket-repos.jpg" alt="bitbucket repos">
<br />

### ■ chalcak-image
imgae 서버 만들기 위한 프로젝트 이다.

이미지 및 동영상 파일들을 AWS S3에 프라이빗하게 저장하고 image서버가 중계 서버로써 권한등을 체크하여 필요한 경우 캐싱등의 기술을 사용하여 제공 해 줄 것이다.

이 서버는 외부에서 직접 접속할 수 없고 API서버에서만 접근 가능하다.

### ■ chalcak-server
API서버를 만들기 위한 소스코드가 위치한다.

API서버는 제품이 필요한 모든 요청을 담당하게 된다.

회원가입으로 부터 로그인, 게시판기능 등 모든 기능이 작성될 것이다.

### ■ chalcak-batch
배치 프로젝트

배치 작업이 필요한 경우 이 프로젝트에서만 작성된다.

control-m 같은것 대신 jenkins로 돌릴 것이다.

### ■ chalcak-app
APP 프로젝트

AOS, IOS 소스가 이 곳에 위치한다.