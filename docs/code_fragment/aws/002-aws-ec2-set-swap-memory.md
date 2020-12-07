---
title: AWS(EC2) 스왑(swap) 메모리 설정
date: "2020-04-11"
---
AWS free tire(t2.micro)를 사용중이라면, 메모리가 약 1G정도 주어진다.
<br/>많이 적다고 볼 수 있는데, 여기서 개발서버를 구축하게되면 적은 메모리 때문에 빈번한 GC가 발생하고, 빌드나 약간의 서비스 운영에 크게 지장이 생긴다.

나는 free tire(t2.micro) 인스턴스에 개발서버를 구축해 두고 있는데, 이 곳에 API Server, Image Server, Redis Session Server, Jenkins를 돌리고 있다.
<br/>당연하게도 서버에서 무언가의 작업이 이루어지면 엄청나게 느려지거나 무언가의 서비스가 하나 죽게된다.

free tire를 사용하는 것이 목적일 텐데 다른 여분의 인스턴스가 있을리도 만무하고 굳이 인스턴스 유형을 변경할 일도 없을 것 이다.
<br/>이 때, 유용하게 사용할만 방법이 swap 메모리를 할당하는 것이다.

swap 메모리 때문에 볼륨(용량)사이즈가 줄어들지만, 범용 SSD볼륨 비용이 기가당 0.1 USD정도이니 부족하면 볼륨을 늘리면 된다.

## 1. swapfile 만들기

나는 `/var/spool/swap/swapfile` 경로에 2GB만큼 만들었다.

```sh
// swap 파일 생성
sudo mkdir /var/spool/swap
sudo dd if=/dev/zero of=/var/spool/swap/swapfile count=2048000 bs=1024
sudo chmod 600 /var/spool/swap/swapfile
sudo mkswap /var/spool/swap/swapfile  // <-- 이 때 반환되는 UUID를 잘 적어두자
sudo swapon /var/spool/swap/swapfile
```
![make-swapfile](/assets/images/code/make-swapfile.png)

## 2. swapfile 영구설정

fstab을 편집하여 swapfile을 영구 설정한다.

```sh
sudo vi /etc/fstab
```

아래내용 추가

```sh
UUID=mkswap실행시반환된UUID / ext4 defaults 1 1
/var/spool/swap/swapfile none swap defaults 0 0
```

![set-fstab-swapfile](/assets/images/code/set-fstab-swapfile.png)

`free` 명령어를 통해 늘어난 swap 메모리를 확인할 수 있다.

![swap-complete](/assets/images/code/swap-complete.png)