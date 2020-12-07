---
title: AWS(EC2) Java OpenJDK 8 설치
date: '2020-04-11'
---
## 1. OpenJDK 8 설치

```sh
sudo yum install -y java-1.8.0-openjdk-devel.x86_64
```
{{page.date}}
## 2. 인스턴스 자바 버전 변경 (Optional)

설치가 끝나면 사용하고자 하는 버전의 자바를 선택한다.

```sh
sudo /usr/sbin/alternatives --config java
```

![alternatives-config-java](/assets/images/code/alternatives-config-java.png)


## 3. 기존 자바 삭제 (Optional)

1.7버전을 딱히 유지할 이유가 없다면 삭제하도록 한다.

```sh
sudo yum remove java-1.7.0-openjdk.x86_64 -y
```

## 4. JAVA_HOME 환경변수 설정(Optional)

아래 내용을 /etc/profile 파일에 직접 입력하거나 /etc/profile.d 경로 아래 환변 변수 등록용 파일을 만들어 등록되게 한다.

> 나는 sh파일을 만들어 관리 히였다. (/etc/profile.d/custom_env.sh)

![env-java-home](/assets/images/code/env-java-home.png)

```sh
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.265.b01-1.amzn2.0.1.x86_64
export CLASSPATH=.:$JAVA_HOME/lib/tools.jar
export PATH=$PATH:$JAVA_HOME/bin
```

### JAVA_HOME 설정을 위한 JDK 설치 위치 찾는 방법

![find-jdk-install-path1](/assets/images/code/find-jdk-install-path1.png)

```sh
which java
// result: /usr/bin/java
readlink -f /usr/bin/java
// result: /usr/lib/jvm/java-1.8.0-openjdk-1.8.0.265.b01-1.amzn2.0.1.x86_64/jre/bin/java
// (JRE 이전경로까지가 JAVA_HOME이 된다.) /usr/lib/jvm/java-1.8.0-openjdk-1.8.0.265.b01-1.amzn2.0.1.x86_64
```