"""API 路由定义"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException

from app.config import Settings, get_settings
from app.core.extractor import Extractor
from app.models.schemas import (
    ExtractionRequest,
    ExtractionResponse,
    HealthResponse,
    ScenarioInfo,
    SampleReport,
    ScenarioType,
)
from app.scenarios.base import ScenarioRegistry

router = APIRouter()

# 全局提取器实例
_extractor = None


def get_extractor(settings: Settings = Depends(get_settings)) -> Extractor:
    """获取提取器实例"""
    global _extractor
    if _extractor is None:
        _extractor = Extractor(settings)
    return _extractor


@router.get("/health", response_model=HealthResponse, tags=["系统"])
async def health_check(settings: Settings = Depends(get_settings)):
    """健康检查"""
    return HealthResponse(
        status="ok",
        version="0.1.0",
        model=settings.default_model
    )


@router.get("/scenarios", response_model=List[ScenarioInfo], tags=["场景"])
async def list_scenarios():
    """获取所有支持的场景"""
    scenarios = ScenarioRegistry.list_all()
    return [
        ScenarioInfo(
            id=scenario_id,
            name=info["name"],
            description=info["description"],
            extract_classes=info["extract_classes"]
        )
        for scenario_id, info in scenarios.items()
    ]


@router.get("/scenarios/{scenario_id}", response_model=ScenarioInfo, tags=["场景"])
async def get_scenario(scenario_id: str):
    """获取场景详情"""
    try:
        scenario = ScenarioRegistry.get(scenario_id)
        info = scenario.get_info()
        return ScenarioInfo(
            id=scenario_id,
            name=info["name"],
            description=info["description"],
            extract_classes=info["extract_classes"]
        )
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Scenario not found: {scenario_id}")


@router.get("/scenarios/{scenario_id}/samples", response_model=List[SampleReport], tags=["场景"])
async def get_scenario_samples(scenario_id: str):
    """获取场景的样本数据"""
    try:
        scenario = ScenarioRegistry.get(scenario_id)
        samples = scenario.get_samples()
        return [
            SampleReport(
                id=s["id"],
                title=s["title"],
                scenario=ScenarioType(scenario_id),
                text=s["text"]
            )
            for s in samples
        ]
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Scenario not found: {scenario_id}")


@router.post("/extract", response_model=ExtractionResponse, tags=["提取"])
async def extract_text(
    request: ExtractionRequest,
    extractor: Extractor = Depends(get_extractor)
):
    """
    执行文本提取

    - **text**: 输入文本
    - **scenario**: 场景类型 (web3_dev/web3_product/web3_testing)
    """
    # 验证输入
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")

    # 执行提取
    result = extractor.extract(
        text=request.text,
        scenario_id=request.scenario.value
    )

    return ExtractionResponse(
        success=result["success"],
        scenario=request.scenario,
        segments=[
            {
                "type": seg["type"],
                "label": seg.get("label"),
                "content": seg["content"],
                "intervals": seg.get("intervals", []),
                "significance": seg.get("significance"),
            }
            for seg in result.get("segments", [])
        ],
        extractions=[
            {
                "extraction_class": ext["extraction_class"],
                "extraction_text": ext["extraction_text"],
                "attributes": ext.get("attributes"),
                "char_interval": ext.get("char_interval"),
            }
            for ext in result.get("extractions", [])
        ],
        formatted_text=result.get("formatted_text", ""),
        sanitized_input=result.get("sanitized_input", ""),
        error=result.get("error"),
        processing_time=result.get("processing_time"),
    )
