---
title: AWS SES 구성
date: '2020-10-01'
temp: true
---
## 1. 도메인 인증받기

AWS SES를 사용하려면, 우선 도메인을 인증 받아야만 한다.

![aws-ses-001](/assets/images/code/aws/ses/aws-ses-001.png)
![aws-ses-002](/assets/images/code/aws/ses/aws-ses-002.png)
![aws-ses-003](/assets/images/code/aws/ses/aws-ses-003.png)

> 이 글은 AWS EC2안에 운영중인 Route53을 사용한 도메인이 있다고 가정합니다.

##### Generate DKIM Settings?

이메일을 서비스하는 업체에서는 고객에게 이메일이 도착할 때, 여러가지 방법으로 이메일의 발신자 정보를 검증하여 문제가 있는 발진자의 이메일은 차단하거나 스팸으로 분류합니다.

DKIM(DomainKeys Identified Mail)은 이러한 검증 방법들 중, 보낸 사람의 도메인 유효성을 검사하고 실제 이 도메인으로 부터 발송되었는지 확인하는 방법입니다.

DKIM을 사용하면 메일을 발송할 때, 메일 헤더에 DKIM-Signature를 추가해서 발송하게 되는데, 수신측에서 발송자의 DNS서버에서 서명을 해독할 공개키를 확인하여 실제 발송여부를 확인할 수 있습니다.

## 2. 