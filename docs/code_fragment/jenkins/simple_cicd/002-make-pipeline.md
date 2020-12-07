---
title: AWS(EC2) Jenkins를 이용한 무정지 CI/CD 구성(2) - Job 생성 (pipeline)
title_label: 02. Job 생성 (pipeline)
date: "2020-04-17"
---
## Build JOB 만들기

![blueocean](/assets/images/code/cicd/blueocean.png)

목표: 
1. dev branche에 변경사항이 발생하면 즉시 빌드한다. (또는 정기적인 시간마다)
2. dev 서버로 빌드 내용을 복사한다.
3. 무정지를 위해 특별한 서비스 구성과 배포 방식을 구축한다.
    1. spring boot 내장 톰켓으로 8081 또는 8082 포트로 동작시킨다.
    2. nginx 설정을 통해 80포트가 8081 또는 8082 중 최신 서버로 접근하게 한다.

![nginx-cicd](/assets/images/code/cicd/nginx-cicd.png)

### pipeline 작성

```groovy
def SCM_VARS
/* 현재 동작죽인 port */
def SERVER_CURRENT_PORT
/* 현재 동작중인 JAR 디렉토리 경로 (port마다 jar파일을 갖게 된다.) */
def SERVER_CURRENT_DIR
/* 현재 동작중인 JAR 경로 */
def SERVER_CURRNET_SOURCE
/* 다음번 동작 대상 port */
def SERVER_NEXT_PORT
/* 다음번 동작 JAR 디렉토리 경로 (이 곳으로 새로 빌드된 JAR파일을 복제한다.) */
def SERVER_NEXT_DIR
/* 다음번 동작 JAR 경로 */
def SERVER_NEXT_SOURCE
/* 서비스 로컬 주소 배포서버 PORT 동작 확인을 위한 주소 */
def SERVER_URL = 'http://localhost'
/* 서비스 도메인 */
def SERVER_URL_API = 'http://dev-server.chalcak.kr'
/* 빌드된 JAR파일이 복제될 경로 */
def JAR_PATH = '/var/chalcak-server'
/* 빌드될 파일명 */
def JAR_FILENAME = 'chalcak-server-0.0.1-SNAPSHOT.jar'
/* jenkins 에서 sudo 권한으로 사용할 수 있는 스크립트 모음 디렉토리 */
def JENKINS_SH_PATH = '/var/jenkins-sh'
/* nginx config 명 (/etc/nginx.d/{nginxConfigName}) */
def NGINX_CONFD_NAME = 'chalcak-server.conf'
/* 스위칭될 PORT  */
def PORTS = ['8081', '8082']

pipeline {
    agent any
    parameters {
        /* 트리거에 의해 시작된 경우 기본값: ALL로 진행되며, 사용자가 강제로 시작 시, 빌드만 하거나, 배포만 하거나 선택할 수 있도록 한다. */
        choice(name: 'buildType', choices: ['ALL', 'BuildOnly', 'DeployOnly'], description: '빌드유형선택')
    }
    stages {
        stage('checkout and build') {
            when {
                /* ALL 또는 BuildOnly를 선택한 경우 checkout and build stage를 진행한다. */
                expression { 'ALL' == params.buildType || 'BuildOnly' == params.buildType }
            }
            stages {
                stage('checkout') {
                    steps {
                        script {
                            /* dev branch 체크아웃 */
                            SCM_VARS = checkout(
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
                        }
                    }
                }
                stage('build') {
                    steps {
                        /* gradle buuild 필요한 경우 jacoco 등의 추가 설정도 진행한다. */
                        sh(
                            label: '빌드 - gradlew',
                            script: './gradlew clean build test -Dfile.encoding=UTF-8 --no-daemon'
                        )
                        /* 배포를 위해 빌드한 jar파일을 jenkins workspace로 부터 적절한 경로로 복제한다.(JAR_PATH 경로에 jenkins 계정이 권한을 갖고 있어야 한다.) */
                        sh(
                            label: 'jar 파일복사',
                            script: """cp -f ./build/libs/${JAR_FILENAME} ${JAR_PATH}/${JAR_FILENAME}"""
                        )
                    }
                }
            }
        }
        stage('deploy') {
            when {
                /* ALL 또는 DeployOnly를 선택한 경우 deploy stage를 진행한다. */
                expression { 'ALL' == params.buildType || 'DeployOnly' == params.buildType }
            }
            stages {
                /* 무정지 배포를 위해 현재 동작중인 port를 확인 */
                stage('check port') {
                    steps {
                        script {
                            def shResult
                            try {
                                /* spring dev profile에서는 spring-actuator를 켜두었다. 이 것으로 현재 동작중인 포트를 알 수 있다. (포트 확인을 위한 접속 URL은 localhost:port 형식이 아닌 서비스되는 도메인으로 접근하여 확인한다.) */
                                shResult = sh(
                                    label: '현재포트확인',
                                    script: """curl -G -s ${SERVER_URL_API}/actuator/env/server.port | jq '.property.value'""",
                                    returnStdout: true
                                )
                                shResult = shResult.replace('\"', '').replace('"', '').trim()
                            }
                            catch (e) {
                                println e
                            }
                            finally {
                                if (!shResult?.trim()) {
                                    shResult = PORTS[0]
                                }
                            }

                            SERVER_CURRENT_PORT = shResult
                            SERVER_CURRENT_DIR = "${JAR_PATH}/${SERVER_CURRENT_PORT}"
                            SERVER_CURRNET_SOURCE = "${SERVER_CURRENT_DIR}/${JAR_FILENAME}"
                            SERVER_NEXT_PORT = PORTS[0].equals(SERVER_CURRENT_PORT) ? PORTS[1] : PORTS[0] 
                            SERVER_NEXT_DIR = "${JAR_PATH}/${SERVER_NEXT_PORT}"
                            SERVER_NEXT_SOURCE = "${SERVER_NEXT_DIR}/${JAR_FILENAME}"

println """
# deploy variables
# SERVER_CURRENT_PORT: ${SERVER_CURRENT_PORT}
# SERVER_CURRENT_DIR: ${SERVER_CURRENT_DIR}
# SERVER_CURRNET_SOURCE: ${SERVER_CURRNET_SOURCE}
# SERVER_NEXT_PORT: ${SERVER_NEXT_PORT}
# SERVER_NEXT_DIR: ${SERVER_NEXT_DIR}
# SERVER_NEXT_SOURCE: ${SERVER_NEXT_SOURCE}
                            """
                        }
                    }
                }
                stage('file copy') {
                    steps {
                        /* 다음번 동작 JAR 경로로 새로 빌드된 JAR파일을 복제한다. (필요한경우 디렉토리를 생성) */
                        sh(
                            label: '디렉토리생성',
                            script: """mkdir -p ${SERVER_NEXT_DIR}"""
                        )
                        sh(
                            label: 'jar파일복사',
                            script: """cp -f ${JAR_PATH}/${JAR_FILENAME} ${SERVER_NEXT_SOURCE}"""
                        )
                    }
                }
                stage('run springboot') {
                    steps {
                        /* spring boot 시작 - 여러 일을 권한을 갖고 처리해야 함으로 별도 sh생성. 아래 server-start.sh 참고 */
                        sh(
                            label: 'SpringBoot Start',
                            sh(
                            label: 'SpringBoot Start',
                            script: """
                                sudo ${JENKINS_SH_PATH}/server-start.sh ${SERVER_NEXT_PORT} ${SERVER_NEXT_SOURCE}
                            """
                        )
                        )
                        script {
                            /* spring이 정상 시작하였는지 판단한다. (5초간격으로 헬스 체크) */
                            def checkMax = 30;
                            def health
                            for(i = 1; i < checkMax; i = i + 1) {
                                sleep 5
                                try {
                                    health = sh(
                                        label: 'SpringBoot Health Check',
                                        script: """curl --connect-timeout 60 --max-time 60 -G -s ${SERVER_URL}:${SERVER_NEXT_PORT}/actuator/health | jq '.status'""",
                                        returnStdout: true
                                    )
                                    health = health.replace('\"', '').replace('"', '').trim()
                                } catch (e) { health = '' }
                                
                                println '>>> health: ' + health
                                if(health.equals('UP')) {
                                    println '>>> break for'
                                    break;
                                }
                            }
                            
                            if(health.equals('UP')) {
                                println 'SUCCESS SERVER HEALTH'
                                println ">>> SERVER_CURRENT_PORT: ${SERVER_CURRENT_PORT}"
                                println ">>> SERVER_NEXT_PORT: ${SERVER_NEXT_PORT}"
                                /* spring이 정상 부팅 되었다면, nginx의 port를 SERVER_NEXT_PORT로 변경한다. 여러 명령어와 권한이 필요함으로 별도 sh생성. 아래 nginx-switch.sh 참고 */
                                sh(
                                    label: 'start nginx server',
                                    script: """
                                        sudo ${JENKINS_SH_PATH}/nginx-switch.sh ${SERVER_CURRENT_PORT} ${SERVER_NEXT_PORT} ${NGINX_CONFD_NAME}
                                    """
                                )
                                /* nginx가 새로운 포트를 이용하게 되었음으로 기존 동작하는 spring에 종료 시그널을 준다. (강제종료 아님) */
                                sh(
                                    label: '기 동작중 서버 종료',
                                    script: """
                                        sudo ${JENKINS_SH_PATH}/server-stop.sh ${SERVER_CURRENT_PORT} ${JAR_PATH}
                                    """
                                )
                            } else {
                                throw 'FAIL SERVER HEALTH: ' + health
                            }
                        }
                    }
                }
            }
        }
    }
}
```

## server-start.sh
spring 내장 tomcat을 실행하기 위한 스크립트

```sh
#!/usr/bin/env bash

# active port target
TARGET_PORT=$1
# target soruce
TARGET_SOURCE=$2

printf """
################################################
#             SPRING TOMCAT STARTER            #
################################################
# TARGET_PORT   : %-28s #  
# TARGET_SOURCE : %-28s #
################################################
""" "$TARGET_PORT" "$TARGET_SOURCE"

# validation
if [ "$TARGET_PORT" = "" ]; then
    echo '$1(TARGET_PORT) is value empty'
    exit 125
fi

if [ "$TARGET_SOURCE" = "" ]; then
    echo '$2(TARGET_SOURCE) is value empty'
    exit 125
fi

# find PID currently running on port
RUNNING_PID=$(pgrep -f -o "$TARGET_SOURCE".*port."$TARGET_PORT")
printf """# RUNNGING_PID : %-29s #
################################################
""" "$RUNNING_PID"

# kill currently running process
if [ "$RUNNING_PID" != "" ]; then
    echo "KILL PROCESS..."
    kill "$RUNNING_PID"
    while :
    do
        EXISTS_PID=$(ps --pid "$RUNNING_PID" | grep -o "$RUNNING_PID")
        if [ "$EXISTS_PID" == "" ]; then
            echo "KILL PROCESS...SUCCESS"
            break
        fi
        sleep 5s
    done
fi

echo 'START NEW PROCESS'
nohup java -jar "$TARGET_SOURCE" --spring.profiles.active=dev --server.port="$TARGET_PORT" >/dev/null 2>&1 &
echo '################################################'
```

## server-stop.sh
spring service를 중지하기 위한 스크립트

```sh
#!/usr/bin/env bash

# kill target port
TARGET_PORT=$1
# kill target jar path
TARGET_HINT=$2

printf """
################################################
#             SPRING TOMCAT STOPER             #
################################################
# TARGET_PORT : %-30s #
# TARGET_HINT : %-30s #
################################################
""" "$TARGET_PORT" "$TARGET_HINT"

# find stopping target PID
RUNNING_PID=$(pgrep -f -o "$TARGET_HINT".*port."$TARGET_PORT")
printf """# RUNNGING_PID : %-29s #
################################################
""" "$RUNNING_PID"

if [ "$RUNNING_PID" != "" ]; then
    echo "KILL PROCESS..."
    kill "$RUNNING_PID"
fi
echo '################################################'
```

## nginx-switch.sh
nginx configuration file을 수정하고 nginx를 reload 시키기 위한 스크립트

```sh
#!/usr/bin/env bash

# nginx current active  port
CURRENT_PORT=$1
# nginx next active  port
NEXT_PORT=$2
# nginx /etc/nginx/conf.d/{configration file name]
NGINX_CONFD_NAME=$3

printf """
################################################
#              NGINX PORT SWITCHING            #
################################################
# CURRENT_PORT     : %-25s #  
# NEXT_PORT        : %-25s #
# NGINX_CONFD_NAME : %-25s #
################################################
""" "$CURRENT_PORT" "$NEXT_PORT" "$NGINX_CONFD_NAME"

# validation
if [ "$CURRENT_PORT" = "" ]; then
    echo '$1(CURRENT_PORT) value is empty.'
    exit 125
fi

if [ "$NEXT_PORT" = "" ]; then
    echo '$2(NEXT_PORT) value is empty'
    exit 125
fi

if [ "$NGINX_CONFD_NAME" = "" ]; then
    echo '$3(NGINX_CONFD_NAME) value is empty'
    exit 125
fi

# nginx confg port switching
sed -i "s/server localhost:$CURRENT_PORT;/server localhost:$CURRENT_PORT down;/g" "/etc/nginx/conf.d/$NGINX_CONFD_NAME"
sed -i "s/server localhost:$NEXT_PORT down;/server localhost:$NEXT_PORT;/g" "/etc/nginx/conf.d/$NGINX_CONFD_NAME"

# nginx server reload
service nginx reload
echo '################################################'
```

## 성공 로그

pipeline이 정상 동작한 경우 jenkins에서 아래 로그를 확인할 수 있다.
<br /> 하지만, 아직 이 장에서는 git과 nginx 설정이 마무리 되지 않았음으로 다음 장을 까지 마무리 해야 성공 로그를 확인할 수 있다.

```
Started by user chalcak
Running in Durability level: MAX_SURVIVABILITY
[Pipeline] Start of Pipeline
[Pipeline] node
Running on Jenkins in /var/lib/jenkins/workspace/build_dev_chalcak_server
[Pipeline] {
[Pipeline] withEnv
[Pipeline] {
[Pipeline] stage
[Pipeline] { (checkout and build)
[Pipeline] stage
[Pipeline] { (checkout)
[Pipeline] script
[Pipeline] {
[Pipeline] checkout
The recommended git tool is: NONE
using credential bitbucket_chalcak_server
 > /usr/bin/git rev-parse --is-inside-work-tree # timeout=10
Fetching changes from the remote Git repository
 > /usr/bin/git config remote.origin.url git@bitbucket.org:wisdomcdh/chalcak-server.git # timeout=10
Cleaning workspace
 > /usr/bin/git rev-parse --verify HEAD # timeout=10
Resetting working tree
 > /usr/bin/git reset --hard # timeout=10
 > /usr/bin/git clean -fdx # timeout=10
Fetching upstream changes from git@bitbucket.org:wisdomcdh/chalcak-server.git
 > /usr/bin/git --version # timeout=10
 > git --version # 'git version 2.23.3'
using GIT_SSH to set credentials 
 > /usr/bin/git fetch --tags --force --progress -- git@bitbucket.org:wisdomcdh/chalcak-server.git +refs/heads/*:refs/remotes/origin/* # timeout=10
 > /usr/bin/git rev-parse refs/remotes/origin/dev^{commit} # timeout=10
Checking out Revision eb74beaa742fb4f9f69d6865fdd1628d8e6ec1a7 (refs/remotes/origin/dev)
 > /usr/bin/git config core.sparsecheckout # timeout=10
 > /usr/bin/git checkout -f eb74beaa742fb4f9f69d6865fdd1628d8e6ec1a7 # timeout=10
Commit message: "Merge branch 'dev' of https://wisdomcdh@bitbucket.org/wisdomcdh/chalcak-server.git into dev"
[Pipeline] echo
>>> SCM_VARS: [GIT_BRANCH:origin/dev, GIT_COMMIT:eb74beaa742fb4f9f69d6865fdd1628d8e6ec1a7, GIT_PREVIOUS_COMMIT:eb74beaa742fb4f9f69d6865fdd1628d8e6ec1a7, GIT_PREVIOUS_SUCCESSFUL_COMMIT:eb74beaa742fb4f9f69d6865fdd1628d8e6ec1a7, GIT_URL:git@bitbucket.org:wisdomcdh/chalcak-server.git]
[Pipeline] }
[Pipeline] // script
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (build)
[Pipeline] sh (빌드 - gradlew)
+ ./gradlew clean build test -Dfile.encoding=UTF-8 --no-daemon
> Task :clean UP-TO-DATE
> Task :compileJava
> Task :processResources
> Task :classes
> Task :bootJar
> Task :jar SKIPPED
> Task :assemble
> Task :compileTestJava
> Task :processTestResources NO-SOURCE
> Task :testClasses
> Task :test
> Task :check
> Task :build

BUILD SUCCESSFUL in 51s
6 actionable tasks: 5 executed, 1 up-to-date
[Pipeline] sh (jar 파일복사)
+ cp -f ./build/libs/chalcak-server-0.0.1-SNAPSHOT.jar /var/chalcak-server/chalcak-server-0.0.1-SNAPSHOT.jar
[Pipeline] }
[Pipeline] // stage
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (deploy)
[Pipeline] stage
[Pipeline] { (check port)
[Pipeline] script
[Pipeline] {
[Pipeline] sh (현재포트확인)
+ jq .property.value
+ curl -G -s http://dev-server.chalcak.kr/actuator/env/server.port
[Pipeline] echo

# deploy variables
# SERVER_CURRENT_PORT: 8081
# SERVER_CURRENT_DIR: /var/chalcak-server/8081
# SERVER_CURRNET_SOURCE: /var/chalcak-server/8081/chalcak-server-0.0.1-SNAPSHOT.jar
# SERVER_NEXT_PORT: 8082
# SERVER_NEXT_DIR: /var/chalcak-server/8082
# SERVER_NEXT_SOURCE: /var/chalcak-server/8082/chalcak-server-0.0.1-SNAPSHOT.jar
                            
[Pipeline] }
[Pipeline] // script
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (file copy)
[Pipeline] sh (디렉토리생성)
+ mkdir -p /var/chalcak-server/8082
[Pipeline] sh (jar파일복사)
+ cp -f /var/chalcak-server/chalcak-server-0.0.1-SNAPSHOT.jar /var/chalcak-server/8082/chalcak-server-0.0.1-SNAPSHOT.jar
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (run springboot)
[Pipeline] sh (SpringBoot Start)
+ sudo /var/jenkins-sh/server-start.sh 8082 /var/chalcak-server/8082/chalcak-server-0.0.1-SNAPSHOT.jar

################################################
#             SPRING TOMCAT STARTER            #
################################################
# TARGET_PORT   : 8082                         #  
# TARGET_SOURCE : /var/chalcak-server/8082/chalcak-server-0.0.1-SNAPSHOT.jar #
################################################
# RUNNGING_PID : 26348                         #
################################################
KILL PROCESS...
KILL PROCESS...SUCCESS
START NEW PROCESS
################################################
[Pipeline] script
[Pipeline] {
[Pipeline] sleep
Sleeping for 5 sec
[Pipeline] sh (SpringBoot Health Check)
+ jq .status
+ curl --connect-timeout 60 --max-time 60 -G -s http://localhost:8082/actuator/health
[Pipeline] echo
>>> health: 
[Pipeline] sleep
Sleeping for 5 sec
[Pipeline] sh (SpringBoot Health Check)
+ jq .status
+ curl --connect-timeout 60 --max-time 60 -G -s http://localhost:8082/actuator/health
[Pipeline] echo
>>> health: 
[Pipeline] sleep
Sleeping for 5 sec
[Pipeline] sh (SpringBoot Health Check)
+ jq .status
+ curl --connect-timeout 60 --max-time 60 -G -s http://localhost:8082/actuator/health
[Pipeline] echo
>>> health: 
[Pipeline] sleep
Sleeping for 5 sec
[Pipeline] sh (SpringBoot Health Check)
+ jq .status
+ curl --connect-timeout 60 --max-time 60 -G -s http://localhost:8082/actuator/health
[Pipeline] echo
>>> health: 
[Pipeline] sleep
Sleeping for 5 sec
[Pipeline] sh (SpringBoot Health Check)
+ curl --connect-timeout 60 --max-time 60 -G -s http://localhost:8082/actuator/health
+ jq .status
[Pipeline] echo
>>> health: UP
[Pipeline] echo
>>> break for
[Pipeline] echo
SUCCESS SERVER HEALTH
[Pipeline] echo
>>> SERVER_CURRENT_PORT: 8081
[Pipeline] echo
>>> SERVER_NEXT_PORT: 8082
[Pipeline] sh (start nginx server)
+ sudo /var/jenkins-sh/nginx-switch.sh 8081 8082 chalcak-server.conf

################################################
#              NGINX PORT SWITCHING            #
################################################
# CURRENT_PORT     : 8081                      #  
# NEXT_PORT        : 8082                      #
# NGINX_CONFD_NAME : chalcak-server.conf       #
################################################
Redirecting to /bin/systemctl reload nginx.service
################################################
[Pipeline] sh (기 동작중 서버 종료)
+ sudo /var/jenkins-sh/server-stop.sh 8081 /var/chalcak-server

################################################
#             SPRING TOMCAT STOPER             #
################################################
# TARGET_PORT : 8081                           #
# TARGET_HINT : /var/chalcak-server            #
################################################
# RUNNGING_PID :                               #
################################################
################################################
[Pipeline] }
[Pipeline] // script
[Pipeline] }
[Pipeline] // stage
[Pipeline] }
[Pipeline] // stage
[Pipeline] }
[Pipeline] // withEnv
[Pipeline] }
[Pipeline] // node
[Pipeline] End of Pipeline
Finished: SUCCESS
```
{: .highlighter-rouge-box-400 }