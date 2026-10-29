"""가이드(TIPS) 인기 순위 — 최근 30일 사람 조회를 nginx 접속 로그에서 센다(2026-10-29).

Plants에는 가이드 조회수 집계가 없어 서버 접속 로그(매일 회전·30일 보관)를 쓴다. backend(ubuntu)가 adm 그룹이라 읽을 수 있다.
포털의 '이번달 가드닝 TOP 5'(matmatch/backend/portal.py scan_guide_views)와 같은 규칙이다 — 규칙을 바꿀 땐 두 곳을 함께.
로그가 수십 MB라 요청마다 읽지 않는다: 백그라운드에서 하루 한 번(서버 기동 시 1회 포함) 계산해 메모리에 두고, 계산이 끝나기 전·실패 시에는 이전 값을 쓴다."""
import collections
import glob
import gzip
import logging
import os
import re
import threading
import time
from datetime import datetime, timedelta

logger = logging.getLogger("guide_ranking")

NGINX_LOG_GLOB = "/var/log/nginx/access.log*"
HOST = "plants.nemoneai.com"
WINDOW_DAYS = 30
REFRESH_SECONDS = 24 * 3600
CRAWLER_SLUGS_PER_DAY = 30   # 하루에 가이드 30개 넘게 읽은 IP는 수집 프로그램으로 보고 제외

_LOG_RE = re.compile(r'^(\S+) - - \[([^\]]+)\] "(\S+) (\S+) [^"]*" (\d+) \d+ "[^"]*" "([^"]*)" "([^"]*)"')
_BOT_UA_RE = re.compile(r"bot|crawl|spider|slurp|yeti|facebookexternalhit|kakaotalk|curl|python|go-http|headless|monitor|uptime|preview|scrap|lighthouse|wget", re.I)
_GUIDE_PATH_RE = re.compile(r"^/guide/([a-z0-9][a-z0-9\-_]*)/?(?:\?.*)?$")


def scan_guide_views(lines, valid_slugs: set, since: datetime) -> "collections.Counter":
    """접속 로그 줄에서 가이드 상세의 사람 조회를 센다(순수 함수). GET 200만, 봇·미리보기·프리페치(_rsc) 제외,
    같은 IP의 같은 가이드는 하루 1회."""
    seen: set = set()
    per_ip_day: dict = collections.defaultdict(set)
    for line in lines:
        if HOST not in line:
            continue
        m = _LOG_RE.match(line)
        if not m:
            continue
        ip, ts, method, path, status, ua, host = m.groups()
        if host != HOST or method != "GET" or status != "200" or "_rsc=" in path or _BOT_UA_RE.search(ua):
            continue
        g = _GUIDE_PATH_RE.match(path)
        if not g or g.group(1) not in valid_slugs:
            continue
        try:
            t = datetime.strptime(ts.split()[0], "%d/%b/%Y:%H:%M:%S")   # 서버 로그는 UTC
        except ValueError:
            continue
        if t < since:
            continue
        day = t.strftime("%Y%m%d")
        seen.add((ip, day, g.group(1)))
        per_ip_day[(ip, day)].add(g.group(1))
    counts: collections.Counter = collections.Counter()
    for ip, day, slug in seen:
        if len(per_ip_day[(ip, day)]) <= CRAWLER_SLUGS_PER_DAY:
            counts[slug] += 1
    return counts


def _log_lines(since: datetime):
    cutoff = since.timestamp() - 86400
    for f in sorted(glob.glob(NGINX_LOG_GLOB)):
        try:
            if os.path.getmtime(f) < cutoff:
                continue
            op = gzip.open if f.endswith(".gz") else open
            with op(f, "rt", errors="ignore") as fh:
                for line in fh:
                    yield line
        except OSError as e:
            logger.warning("접속 로그 읽기 실패 %s: %s", f, str(e)[:80])


def rank_slugs(published: dict, counts: "collections.Counter") -> list:
    """조회 많은 순, 동률은 최신 글 먼저. published: {slug: published_at 문자열}."""
    items = sorted(counts.items(), key=lambda kv: published.get(kv[0]) or "", reverse=True)
    items.sort(key=lambda kv: -kv[1])
    return [s for s, _ in items]


class TopGuides:
    """메모리 캐시 — slug 순위 목록. 갱신은 백그라운드 스레드가 한다."""

    def __init__(self):
        self._slugs: list = []
        self._at = 0.0
        self._lock = threading.Lock()
        self._running = False

    def get(self) -> list:
        return list(self._slugs)

    def stale(self) -> bool:
        return time.time() - self._at > REFRESH_SECONDS

    def refresh_async(self, load_published) -> None:
        """load_published(): {slug: published_at} 를 돌려주는 함수(DB 조회는 호출자가 맡는다)."""
        with self._lock:
            if self._running:
                return
            self._running = True

        def run():
            try:
                published = load_published()
                since = datetime.utcnow() - timedelta(days=WINDOW_DAYS)
                counts = scan_guide_views(_log_lines(since), set(published), since)
                if counts:                      # 집계가 비면(로그 없음 등) 이전 값을 유지한다
                    self._slugs = rank_slugs(published, counts)
                    self._at = time.time()
                    logger.info("가이드 인기 순위 갱신: %s건 집계", len(counts))
            except Exception:  # noqa: BLE001
                logger.exception("가이드 인기 순위 계산 실패(이전 값 유지)")
            finally:
                with self._lock:
                    self._running = False

        threading.Thread(target=run, daemon=True).start()


TOP = TopGuides()
