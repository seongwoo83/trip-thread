# trip-thread
One Thread per Trip

---
# CI/CD

## 🔵 CI (Continuous Integration)

### 1️⃣ 트리거

main 브랜치에 push가 발생하면 GitHub Actions 워크플로우가 실행된다.

### 2️⃣ 빌드

GitHub Actions 러너에서 Dockerfile을 기반으로 Vite 정적 파일을 포함한 nginx 이미지를 빌드한다.

### 3️⃣ 아티팩트 배포

빌드된 Docker 이미지를 AWS ECR에 버전 태그와 함께 푸시한다.

---

## 🟢 CD (Continuous Deployment)

### 4️⃣ 배포 트리거

ECR 푸시 완료 후 GitHub Actions가 SSH로 EC2에 접속한다.

### 5️⃣ 이미지 동기화

EC2에서 docker compose pull을 실행해 최신 이미지를 ECR에서 다운로드한다.

### 6️⃣ 컨테이너 교체

docker compose up -d --force-recreate로 기존 컨테이너를 최신 이미지 기반으로 재생성한다.

### 7️⃣ 서비스 반영

EC2의 Docker가 nginx 컨테이너를 재시작하고, 80포트를 통해 최신 정적 파일이 서비스된다.

---
