---
title: AWS(EC2) Volume(HDD) 늘리기
date: "2020-04-11"
---
AWS free tire(t2.micro)를 사용중이라면, 하드디스크 용량이 8기가가 주어진다.
<br/>사실 무엇을 조금 하다보면 금새 부족해 지는데 EBS에 용량을 증설하는 비용은 1기가당 0.1 USD (200~300원)정도이니 고민말고 볼륨을 확장하도록 하자.

## 1. AWS EC2 볼륨 확장
AWS Management Console > EC2 > Elastic Block Store 메뉴에서 확장 하고자 하는 인스턴스를 선택 후 볼륨을 조정한다.

12GB로 증가 시켰다.

![ec2-volume-1](/assets/images/code/ec2-volume-1.png)

볼륨 수정 버튼을 클릭하여 설정하고자 하는 크기로 변경한다.

![ec2-volume-2](/assets/images/code/ec2-volume-2.png)

화면을 갱신하여 볼륨 크기가 변경되었는지 확인 후, 다음작업을 진행하면 된다.

![ec2-volume-3](/assets/images/code/ec2-volume-3.png)

## 2. Linux 파일 시스템 확장

### 볼륨 크기 확인

```sh
lsblk
```

전체 볼륨인 xvda가 12G로 증가 한 것을 확인할 수 있다.

![ec2-volume-4](/assets/images/code/ec2-volume-4.png)

### 파티션 크기 확장

```sh
sudo growpart /dev/xvda 1
```

![ec2-volume-5](/assets/images/code/ec2-volume-5.png)

`lsblk`를 통해 다시 볼륨 사이즈 확인

![ec2-volume-5-1](/assets/images/code/ec2-volume-5.1.png)

### 파티션 재할당 하기

현재 파일시스템에 따라 파티션 재할당을 위한 명령어가 다르다. 먼저 파일 시스템을 확인한다.
<br/>/dev/xvda1 의 Type 컬럼을 확인하자

```sh
df -T
```

![ec2-volume-6](/assets/images/code/ec2-volume-6.png)

### 파티션 확장

파일시스템 유형(Type)이 xfs인 경우

```sh
sudo xfs_growfs /dev/xvda1
```

파일시스템 유형(Type)이 ext4인 경우

```sh
sudo resize2fs /dev/xvda1
```

![ec2-volume-7](/assets/images/code/ec2-volume-7.png)

확장된 볼륨 확인

```sh
df -h
```

![ec2-volume-8](/assets/images/code/ec2-volume-8.png)

음.. 비용이 발생할 줄 알았는데 발생 하지 않았다.

![ec2-volume-9](/assets/images/code/ec2-volume-9.png)