---
title: AWS(EC2) Jenkins를 이용한 무정지 CI/CD 구성(3) - jenkins git 연결(ssh)
title_label: 03. git 연결
date: "2020-06-17"
---
jenkins 에서 git에 접근하기 위해서는 id/pw로 인증받거나 ssh로 접속이 필요하다.
<br />보통 ID/PW는 사용하지 않고 ssh로 접속하게 되는데 아래는 그 방법이다.

## SSH 연결

```groovy
checkout(
        changelog: false,
        scm: [
            $class: 'GitSCM',
            branches: [[name: '*/dev']],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[$class: 'CleanBeforeCheckout'], [$class: 'AuthorInChangelog']],
            submoduleCfg: [],
            userRemoteConfigs: [[credentialsId: 'bitbucket_chalcak_server', url: 'git@bitbucket.org:wisdomcdh/chalcak-server.git']]
        ]
    )
```

pipeline 위와 같이 ssh 주소로 접근하게 되면, `credentialsId`를 사용하기 위해 jenkins와 git에 ssh 접속을 위한 추가 설정이 필요하다.

### 1. ssh key 만들기

#### 1.1 jenkins user bash 실행

```sh
sudo -u jenkins /bin/bash
```

#### 1.2 ssh-keygen 수행

```sh
ssh-keygen -t rsa
```

![jenkins-ssh-keygen](/assets/images/code/cicd/jenkins-ssh-keygen.png)

<span style="color:red">①</span> key가 생성될 파일명을 포함한 경로 (그냥 엔터를 치면 괄호안의 위치에 파일이 생성된다.)
<br/><span style="color:red">②</span> 패스워드 설정

#### 1.3 생성된 private key를 jenkins에 등록

Jenkins관리 > Managed Credentials

```sh
// private key 확인 (이 값을 jenkins에 등록하게 된다.)
sudo cat /var/lib/jenkins/.ssh/id_rsa
```

![jenkins-ssh-keygen-reg2](/assets/images/code/cicd/jenkins-ssh-keygen-reg2.png)

![jenkins-ssh-keygen-reg](/assets/images/code/cicd/jenkins-ssh-keygen-reg.png)

<span style="color:red">①</span> jenkins credentialsId (예제에선 bitbucket_chalcak_server 이름을 사용)
<br/><span style="color:red">②</span> git ssh 접속에 사용될 username (큰 의미 없음)
<br/><span style="color:red">③</span> private key 입력
<br/><span style="color:red">④</span> 패스워드 입력

### 2. git에 public key 등록하기

```sh
// public key 확인하기
sudo cat /var/lib/jenkins/.ssh/id_rsa.pub
```

![jenkins-ssh-keygen-reg-pub](/assets/images/code/cicd/jenkins-ssh-keygen-reg-pub.png)

#### github

Repository > Settings > Deploy keys 메뉴에서
<br />Add deploy key 버튼 클릭 후, public key를 등록한다.

![ssh-key-reg-github](/assets/images/code/cicd/ssh-key-reg-github.png)

#### bitbucket

Repository > Repository Settings > Access keys 메뉴에서
<br />Add key 버튼 클릭 후, public key를 등록한다.

![ssh-key-reg-bitbucket](/assets/images/code/cicd/ssh-key-reg-bitbucket.png)