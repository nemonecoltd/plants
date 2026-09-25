"""디스크의 AI 진단 사진을 비공개 GCS 버킷으로 복사한다 (원본은 절대 지우지 않음).

사용:
  PLANTS_DIAG_BUCKET=버킷명 python migrate_diagnoses_to_gcs.py           # dry-run(기본)
  PLANTS_DIAG_BUCKET=버킷명 python migrate_diagnoses_to_gcs.py --apply   # 실제 업로드

- 버킷에 이미 있고 크기가 같으면 건너뛴다(여러 번 실행해도 안전).
- 업로드 후 크기를 다시 대조하고, 하나라도 다르면 실패로 종료한다.
- GCS 업로드 실패로 디스크에 폴백 저장된 사진을 나중에 옮기는 용도로도 쓴다.
"""
import sys

from content_utils import DIAGNOSES_IMAGE_DIR
from diagnosis_storage import _PREFIX, _bucket, enabled


def main(apply: bool) -> int:
    if not enabled():
        print("PLANTS_DIAG_BUCKET 환경변수가 필요합니다.")
        return 2
    files = sorted(DIAGNOSES_IMAGE_DIR.glob("*.jpg"))
    bucket = _bucket()
    todo, ok, bad = 0, 0, 0
    for f in files:
        blob = bucket.blob(_PREFIX + f.name)
        size = f.stat().st_size
        if blob.exists():
            blob.reload()
            if blob.size == size:
                ok += 1
                continue
        todo += 1
        if not apply:
            print(f"[dry-run] 업로드 예정: {f.name} ({size} bytes)")
            continue
        blob.upload_from_filename(str(f), content_type="image/jpeg")
        blob.reload()
        if blob.size != size:
            print(f"❌ 크기 불일치: {f.name} local={size} gcs={blob.size}")
            bad += 1
        else:
            print(f"✅ {f.name}")
            ok += 1
    print(f"\n디스크 {len(files)}개 | 버킷 확인 완료 {ok} | {'업로드 대상' if not apply else '업로드 시도'} {todo} | 불일치 {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main("--apply" in sys.argv))
