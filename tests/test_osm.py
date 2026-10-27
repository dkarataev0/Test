import json
from pathlib import Path

from leadfinder.osm import build_query, parse_elements

FIX = Path(__file__).parent / "fixtures"


def load():
    return parse_elements(json.loads((FIX / "overpass_sample.json").read_text())["elements"])


def test_parse_skips_brands_and_unnamed():
    names = {c.name for c in load()}
    assert names == {"Локон", "Зерно", "Гараж"}


def test_kinds_and_fields():
    by = {c.name: c for c in load()}
    assert by["Локон"].kind == "no_site"
    assert by["Локон"].address == "улица Красная, 10"
    assert by["Локон"].category == "Парикмахерская"
    assert by["Зерно"].kind == "social_only"
    assert by["Зерно"].website is None
    assert by["Зерно"].socials["telegram"] == "https://t.me/zerno"
    assert by["Гараж"].website == "http://garage23.ru"
    assert by["Гараж"].kind == "unchecked"
    assert by["Гараж"].lat == 45.05  # центр way


def test_query_contains_bbox_and_tags():
    q = build_query(["beauty", "sauna"], "city")
    assert "[bbox:" in q
    assert '["shop"="hairdresser"]' in q and '["leisure"="sauna"]' in q
    assert '"cafe"' not in q and '"car_repair"' not in q
    krai = build_query(["beauty"], "krai")
    assert 'area["ISO3166-2"="RU-KDA"]' in krai and "(area.r)" in krai
