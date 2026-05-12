import pytest
import asyncio
from agents.orchestrator_agent import OrchestratorAgent
from agents.cache_router_agent import CacheRouterAgent
from agents.receipt_parser_agent import ReceiptParserAgent
from agents.data_cleaning_agent import DataCleaningAgent
from agents.system_monitor_agent import SystemMonitorAgent
from agents.failover_recovery_agent import FailoverRecoveryAgent


@pytest.fixture
def sample_quote():
    return {
        "service_type": "repair",
        "appliance_type": "refrigerator",
        "quoted_price": 2500.00,
        "user_zip_code": "110001",
        "provider_name": "Urgent Ice Repairs",
        "quote_details": "cash only, need capacitor replaced on my Voltas refrigerator"
    }


@pytest.mark.asyncio
async def test_orchestrator_agent(sample_quote):
    orchestrator = OrchestratorAgent()
    result = await orchestrator.run_analysis(sample_quote)
    
    assert "verdict" in result
    assert result["verdict"] in ["fair", "high", "low", "suspicious"]
    assert "confidence_score" in result
    assert "details" in result


@pytest.mark.asyncio
async def test_cache_router_agent(sample_quote):
    router = CacheRouterAgent()
    res = await router.analyze(sample_quote)
    assert res["status"] == "cache_miss"
    assert "cache_key" in res


@pytest.mark.asyncio
async def test_receipt_parser_agent():
    parser = ReceiptParserAgent()
    res = await parser.analyze("Need LG AC compressor gas R32 replacement")
    assert res["brand"] == "Lg"
    assert "compressor" in res["parts_replaced"]
    assert res["gas_type"] == "R32"


@pytest.mark.asyncio
async def test_data_cleaning_agent():
    cleaner = DataCleaningAgent()
    res = await cleaner.analyze("Messy Sulekha crawl ad body Rs. 1,500 and ₹2,200 discount code")
    assert res["status"] == "success"
    assert 1500.0 in res["extracted_prices"]
    assert 2200.0 in res["extracted_prices"]


@pytest.mark.asyncio
async def test_system_monitor_agent():
    monitor = SystemMonitorAgent()
    monitor._log_latency("LocationAgent", 0.12, "success")
    res = await monitor.analyze("summary")
    assert res["status"] == "active"
    assert res["logged_runs_count"] == 1


@pytest.mark.asyncio
async def test_failover_recovery_agent(sample_quote):
    recovery = FailoverRecoveryAgent()
    res = await recovery.analyze(sample_quote)
    assert res["status"] == "injected_fallback"
    assert "fallback_average" in res

