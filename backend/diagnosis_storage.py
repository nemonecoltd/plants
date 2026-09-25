"""AI 진단 사진 저장소 — 비공개 GCS 버킷 우선, 디스크 폴백.

사진은 사용자가 올린 개인 데이터라 배포(앱 폴더 동기화)와 분리된 곳에 둔다.
2026-09-11, 09-18 두 번 배포 중 앱 폴더 안의 사진이 삭제된 사고의 근본 대책이다.

동작
  - PLANTS_DIAG_BUCKET 환경변수가 없으면 예전처럼 디스크(DIAGNOSES_IMAGE_DIR)만 쓴다.
    → 코드를 먼저 배포해도 동작이 바뀌지 않는다.
  - 있으면 저장은 GCS에 하고, GCS가 실패하면 디스크에 남겨 사용자 사진을 잃지 않는다.
  - 읽기는 GCS를 먼저 보고 없으면 디스크를 본다(이전 중에도 끊김 없음).
  - 버킷은 비공개 + 오브젝트 버전 관리 전제. 서비스가 공개 URL을 만들지 않고
    백엔드가 /api/diagnoses/image/{filename} 으로 대신 내보낸다.
"""
import logging
import os
from typing import Optional

from content_utils import DIAGNOSES_IMAGE_DIR

log = logging.getLogger(__name__)

_PREFIX = "diagnoses/"

_client = None


def bucket_name() -> str:
    # import 시점이 아니라 사용 시점에 읽는다 — main.py가 이 모듈을 import한 뒤에
    # load_dotenv(".env.local")를 호출하므로, 모듈 상단에서 읽으면 항상 빈 값이 된다.
    return os.getenv("PLANTS_DIAG_BUCKET", "").strip()


def enabled() -> bool:
    return bool(bucket_name())


def _bucket():
    global _client
    if _client is None:
        from google.cloud import storage  # 미사용 환경에서 import 실패하지 않도록 지연 import

        _client = storage.Client()
    return _client.bucket(bucket_name())


def save(filename: str, data: bytes) -> str:
    """저장하고 실제로 쓴 위치("gcs" | "disk")를 돌려준다."""
    if enabled():
        try:
            _bucket().blob(_PREFIX + filename).upload_from_string(data, content_type="image/jpeg")
            return "gcs"
        except Exception:
            # 업로드 실패로 사용자 사진을 잃지 않도록 디스크에 남긴다(나중에 migrate 스크립트로 이관)
            log.exception("진단 사진 GCS 업로드 실패 — 디스크에 저장: %s", filename)
    DIAGNOSES_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    (DIAGNOSES_IMAGE_DIR / filename).write_bytes(data)
    return "disk"


def load(filename: str) -> Optional[bytes]:
    """사진 바이트. 어디에도 없으면 None."""
    if enabled():
        try:
            blob = _bucket().blob(_PREFIX + filename)
            if blob.exists():
                return blob.download_as_bytes()
        except Exception:
            log.exception("진단 사진 GCS 읽기 실패 — 디스크로 폴백: %s", filename)
    path = DIAGNOSES_IMAGE_DIR / filename
    return path.read_bytes() if path.is_file() else None


def delete(filename: str) -> None:
    """양쪽에서 지운다. 버킷은 버전 관리라 지워도 이전 버전이 남아 복구할 수 있다."""
    if enabled():
        try:
            _bucket().blob(_PREFIX + filename).delete()
        except Exception:
            # 없는 파일(NotFound)이거나 일시 오류 — 어느 쪽이든 사용자에게 오류를 보일 이유가 없다
            pass
    try:
        (DIAGNOSES_IMAGE_DIR / filename).unlink(missing_ok=True)
    except OSError:
        pass
