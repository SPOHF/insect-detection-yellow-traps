from __future__ import annotations

from app.api import analysis as analysis_api


def test_detect_question_intents_finds_keywords() -> None:
    out = analysis_api._detect_question_intents(
        "Compare year 2025 vs 2026 with weather and trap differences"
    )
    assert out["compare"] is True
    assert out["weather"] is True
    assert out["trap"] is True


def test_line_scatter_bar_and_yearly_svg_helpers() -> None:
    no_data_line = analysis_api._line_chart_svg("T", [], [], "Y", "#111")
    assert "No data available" in no_data_line

    line_html = analysis_api._line_chart_svg(
        "Trend",
        ["01-01", "01-08", "01-15"],
        [1.0, 2.5, 1.8],
        "Avg",
        "#2563eb",
    )
    assert "<svg" in line_html
    assert "polyline" in line_html

    no_points = analysis_api._scatter_svg("Scatter", [])
    assert "No overlapping" in no_points

    scatter_html = analysis_api._scatter_svg(
        "Scatter",
        [
            {"week_start": "2026-01-01", "temp_avg": 10, "avg_population": 2},
            {"week_start": "2026-01-08", "temp_avg": 12, "avg_population": 3},
        ],
    )
    assert "<circle" in scatter_html

    no_data_bar = analysis_api._bar_chart_svg("Bars", [], [], "Y", "#333")
    assert "No data available" in no_data_bar
    bar_html = analysis_api._bar_chart_svg("Bars", ["A", "B"], [3.0, 5.0], "Count", "#333")
    assert "<rect" in bar_html

    insufficient = analysis_api._yearly_week_comparison_svg(
        "Year compare", [{"week_start": "2026-01-01", "avg_population": 2.0}]
    )
    assert "Not enough yearly series" in insufficient

    yearly_html = analysis_api._yearly_week_comparison_svg(
        "Year compare",
        [
            {"week_start": "2025-01-01", "avg_population": 1.0},
            {"week_start": "2025-01-08", "avg_population": 1.2},
            {"week_start": "2026-01-01", "avg_population": 2.0},
            {"week_start": "2026-01-08", "avg_population": 2.4},
        ],
    )
    assert "ISO week" in yearly_html
    assert "<polyline" in yearly_html


def test_render_exploratory_report_html_includes_expected_sections() -> None:
    context = {
        "field": {"name": "Demo Field"},
        "range": {
            "all_data": False,
            "year": 2026,
            "weeks": 10,
            "start_date": "2026-01-01",
            "end_date": "2026-03-01",
        },
        "weekly_population": [
            {"week_start": "2025-01-01", "avg_population": 1.2, "total_population": 8, "uploads": 4},
            {"week_start": "2025-01-08", "avg_population": 1.4, "total_population": 10, "uploads": 5},
            {"week_start": "2026-01-01", "avg_population": 2.1, "total_population": 12, "uploads": 6},
            {"week_start": "2026-01-08", "avg_population": 2.6, "total_population": 15, "uploads": 6},
        ],
        "weekly_weather": [
            {"week_start": "2025-01-01", "temp_avg": 8.2, "rain_sum": 2.0, "gdd_avg": 0.3, "deficit_avg": 0.1},
            {"week_start": "2025-01-08", "temp_avg": 9.0, "rain_sum": 3.1, "gdd_avg": 0.5, "deficit_avg": 0.2},
            {"week_start": "2026-01-01", "temp_avg": 10.5, "rain_sum": 1.5, "gdd_avg": 0.9, "deficit_avg": 0.2},
            {"week_start": "2026-01-08", "temp_avg": 11.8, "rain_sum": 1.0, "gdd_avg": 1.1, "deficit_avg": 0.3},
        ],
        "by_trap": [
            {"trap_code": "R01-P01", "detections": 25, "uploads": 10},
            {"trap_code": "R01-P02", "detections": 18, "uploads": 9},
        ],
    }
    html = analysis_api._render_exploratory_report_html(
        question="Compare 2025 and 2026 weather and trap behavior",
        answer="Summary here",
        context=context,
    )
    assert "Exploratory Analysis Report" in html
    assert "Population Trend by Week" in html
    assert "Year Comparison: Weekly Avg Detections per Image" in html
    assert "Detections vs Temperature (Weekly)" in html
    assert "Top Traps by Total Detections" in html
    assert "Weekly Data Table" in html


def test_exploratory_report_wrapper_uses_chat_result(monkeypatch) -> None:  # noqa: ANN001
    def fake_chat(payload, db, current_user):  # noqa: ANN001
        return {
            "answer": "ok",
            "used_openai": False,
            "provider_error": "",
            "context": {"totals": {"uploads": 1, "detections": 2, "avg_confidence": 0.5}},
            "full_context": {"field": {"name": "My Field"}, "range": {}, "weekly_population": [], "weekly_weather": [], "by_trap": []},
        }

    monkeypatch.setattr(analysis_api, "exploratory_chat", fake_chat)
    out = analysis_api.exploratory_report({"question": "Q"}, db=None, current_user=None)
    assert out["answer"] == "ok"
    assert out["filename"].startswith("exploratory-report-my-field-")
    assert "<html" in out["html"]

