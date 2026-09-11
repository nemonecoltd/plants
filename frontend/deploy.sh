#!/bin/bash -l
set -euo pipefail

# plants 프론트 배포 (로컬 빌드 → msm VM standalone 배포)
#
# ⚠️ 이 스크립트가 생긴 이유 (2026-09-11 사고)
# 손으로 `rsync -az --delete public/ …` 를 돌렸다가 **서버에만 존재하는 런타임 생성물**을
# 통째로 날렸다. public/ 아래에는 저장소에 없는 파일이 두 종류 있다:
#   1) public/images/diagnoses/  — 사용자가 업로드한 AI 진단 사진 (백업 없음, 유실 시 복구 불가)
#   2) public/images/guides/     — 관리자가 발행할 때 서버가 만든 가드닝팁 썸네일
#                                  (일부는 저장소에도 커밋돼 있어 '섞여 있는' 디렉토리)
# 둘 다 로컬에는 없으므로 --delete 가 걸리면 서버에서 지워진다. 그래서
#   - diagnoses/ : 아예 동기화 대상에서 제외 (저장소가 관여하지 않는 순수 사용자 데이터)
#   - guides/    : 동기화는 하되 --delete 를 쓰지 않아 서버 생성분이 살아남게 함
# 위 두 경로에 대해서는 앞으로도 절대 --delete 를 쓰지 말 것.

cd "$(dirname "$0")"

SSH_KEY="$HOME/.ssh/msm_ci"
SSH_TARGET="ubuntu@34.64.111.65"
REMOTE_DIR="/home/ubuntu/apps/plants_frontend"

echo "▶ 빌드"
npm run build

echo "▶ standalone 서버 코드 동기화"
# node_modules 제외: 서버(Linux) 바이너리를 로컬(macOS) 빌드 결과로 덮으면 sharp 등이 깨진다.
# 의존성이 바뀐 배포에서는 서버에서 별도로 npm install 이 필요하다.
#
# ⚠️ public/ 과 .next/static/ 을 반드시 제외할 것 — 이 rsync의 소스인 .next/standalone/ 에는
# 그 두 디렉토리가 아예 없어서, --delete 가 서버의 public/(사용자 업로드 사진 포함)과
# .next/static/ 을 통째로 지워버린다. 2026-09-11 진단 사진 유실 사고의 실제 원인이 이 줄이었다
# (아래 public 동기화 단계의 --exclude 만으로는 막을 수 없다. 이미 여기서 지워진 뒤이기 때문).
# .next/cache/ 는 next/image 최적화 결과 캐시(런타임 생성물) — 지워도 재생성되지만
# 배포마다 날리면 첫 방문자들이 이미지 재변환을 기다리게 되므로 그대로 둔다.
rsync -az --delete \
  --exclude='node_modules' --exclude='.env' \
  --exclude='public/' --exclude='.next/static/' --exclude='.next/cache/' \
  -e "ssh -i $SSH_KEY" \
  .next/standalone/ "$SSH_TARGET:$REMOTE_DIR/"

echo "▶ 정적 자산(.next/static) 동기화"
rsync -az --delete -e "ssh -i $SSH_KEY" \
  .next/static/ "$SSH_TARGET:$REMOTE_DIR/.next/static/"

echo "▶ public 동기화 (런타임 생성물 보호 — 위 주석 참고)"
rsync -az --delete \
  --exclude='images/diagnoses/' \
  --exclude='images/guides/' \
  -e "ssh -i $SSH_KEY" \
  public/ "$SSH_TARGET:$REMOTE_DIR/public/"

# 저장소에 커밋된 썸네일만 추가/갱신하고, 서버에서 생성된 파일은 그대로 둔다(--delete 없음)
rsync -az -e "ssh -i $SSH_KEY" \
  public/images/guides/ "$SSH_TARGET:$REMOTE_DIR/public/images/guides/"

echo "▶ PM2 재시작"
ssh -i "$SSH_KEY" "$SSH_TARGET" "pm2 restart plants_frontend --update-env"

echo "✅ plants 프론트 배포 완료: $(date)"
