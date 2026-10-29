"""가이드 인기 순위 — 로그 집계 규칙과 정렬. (포털 portal.scan_guide_views와 같은 규칙)"""
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import guide_ranking as gr

HUMAN = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari"
NOW = datetime(2026, 10, 29, 12, 0, 0)
SINCE = NOW - timedelta(days=30)


def line(ip, when, path, status="200", ua=HUMAN, host="plants.nemoneai.com", method="GET"):
    return f'{ip} - - [{when.strftime("%d/%b/%Y:%H:%M:%S")} +0000] "{method} {path} HTTP/2.0" {status} 1234 "-" "{ua}" "{host}"'


def test_scan_rules():
    t = NOW - timedelta(days=1)
    lines = [line("1.1.1.1", t, "/guide/a"), line("1.1.1.1", t, "/guide/a"), line("2.2.2.2", t, "/guide/a"),
             line("3.3.3.3", t, "/guide/b", ua="Googlebot/2.1"), line("4.4.4.4", t, "/guide/b?_rsc=x"),
             line("4.4.4.4", t, "/guide/b", status="404"), line("4.4.4.4", t, "/guide/tag/x"), line("4.4.4.4", t, "/guide/zzz"),
             line("5.5.5.5", t, "/guide/c", host="now.nemoneai.com"), line("7.7.7.7", SINCE - timedelta(days=1), "/guide/c"), "junk"]
    c = gr.scan_guide_views(lines, {"a", "b", "c"}, SINCE)
    assert c == {"a": 2}


def test_crawler_ip_excluded():
    t = NOW - timedelta(days=2)
    valid = {f"g{i}" for i in range(40)}
    c = gr.scan_guide_views([line("9.9.9.9", t, f"/guide/g{i}") for i in range(31)] + [line("8.8.8.8", t, f"/guide/g{i}") for i in range(30)], valid, SINCE)
    assert sum(c.values()) == 30


def test_rank_order_and_tiebreak():
    import collections
    pub = {"a": "2026-10-01", "b": "2026-10-05", "c": "2026-10-02", "d": "2026-10-09"}
    counts = collections.Counter({"a": 3, "b": 3, "c": 5, "d": 1})
    assert gr.rank_slugs(pub, counts) == ["c", "b", "a", "d"]


def test_cache_keeps_previous_when_empty(monkeypatch=None):
    top = gr.TopGuides()
    top._slugs = ["x"]
    orig = gr._log_lines
    gr._log_lines = lambda since: iter([])
    try:
        top.refresh_async(lambda: {"x": "2026-10-01"})
        for _ in range(50):
            if not top._running:
                break
            import time; time.sleep(0.05)
    finally:
        gr._log_lines = orig
    assert top.get() == ["x"]


if __name__ == "__main__":
    n = 0
    for k, v in sorted(globals().items()):
        if k.startswith("test_") and callable(v):
            v(); n += 1
    print(n, "passed")
