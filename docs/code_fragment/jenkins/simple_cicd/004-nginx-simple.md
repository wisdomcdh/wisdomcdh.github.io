---
title: AWS(EC2) Jenkins를 이용한 무정지 CI/CD 구성(4) - nginx 설정
title_label: 04. nginx 설정
date: "2020-04-17"
---

## 1. nginx 설치

```sh
// 설치
sudo yum install nginx -y
// 실행
sudo service nginx start
```

## 2. 무정지 배포를 위한 upstream proxy 설정

### chalcak-server.conf

nginx 의 reverser proxy 기능을 이용하여 80 port로의 접속을 내부 8081 또는 8082 중 유효한 서버로 서비스를 연결시켜 준다.

```sh
# chalcak configuration
# 찰칵 API서버 구성
#
    upstream devapiUpstream {
        ip_hash;
        server localhost:8081 down;
        server localhost:8082;
    }

    server {
        listen       80;
        listen       [::]:80;
        server_name  dev-api.chalcak.kr;

        if ($http_x_forwarded_proto = 'http') {
            return 301 https://$host$request_uri;
        }

        location / {
            proxy_pass http://devapiUpstream;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Port $server_port;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header HOST $http_host;
        }
    }
```

### 설정 파일 반영을 위한 nginx reload

```sh
sudo service nginx reload
```

이 과정 까지 마쳤다면, jenkins job을 실행하여 [성공로그](/docs/code_fragment/simple_cicd/002-make-pipeline/#%EC%84%B1%EA%B3%B5-%EB%A1%9C%EA%B7%B8)를 확인할 수 있다.