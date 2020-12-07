---
title: AWS(EC2) Jenkins를 이용한 무정지 CI/CD 구성(1) - Jenkins 설치
title_label: 01. Jenkins 설치
date: "2020-05-17"
---

## 1. Jenkins 설치

### jenkins repository 설정

```sh
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
```

### jenkins key 등록

```sh
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key
```

### jenkins 설치

```sh
sudo yum install jenkins -y
```

## 2. Jenkins 서비스 시작 전 설정 (Optional)

jenkins가 설치되면 기본포트 8080으로 동작하게 된다.
<br />다른 포트로 동작해야 할 때, 아래 파일을 수정한다. (나는 8080을 다른데 써야 해서 9090포트를 사용하기로 하였다.)

```sh
sudo vi /etc/sysconfig/jenkins

JENKINS_PORT="9090"
```

## 3. Jenkins 서비스 시작

```sh
sudo systemctl start jenkins
```

## 4. Jenkins 초기화
Jenkins 서비스를 시작하게되면 아래 경로에 패스워드 파일이 생성된다.
<br />이 텍스트를 jenkins 웹페이지에 처음 진입할 때 입력한다.

```sh
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
// ex, 58d59f4c272e4556b2169f3778e751a4
```

### 패스워드 입력

![admin-password](/assets/images/code/cicd/admin-password.png)

### 기본 플러그인 설치 (추천)

기본제안 플러그인을 설치하고 이 후, 원하는 플러그인을 추가하는 것을 권장한다.

![admin-password](/assets/images/code/cicd/getting-started.png)