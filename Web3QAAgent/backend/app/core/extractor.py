"""核心提取器 - 基于 LangExtract + DeepSeek"""

import time
import logging
from typing import Any, Dict, List, Optional

import langextract as lx
from langextract.providers.openai import OpenAILanguageModel
from langextract.prompt_validation import PromptValidationLevel

from app.config import Settings
from app.scenarios.base import ScenarioRegistry
from app.utils.sanitize import sanitize_text

logger = logging.getLogger(__name__)


class Extractor:
    """文本提取器"""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._model: Optional[OpenAILanguageModel] = None

    def _get_model(self) -> OpenAILanguageModel:
        """获取或创建模型实例"""
        if self._model is None:
            self._model = OpenAILanguageModel(
                model_id=self.settings.default_model,
                api_key=self.settings.deepseek_api_key,
                base_url=self.settings.deepseek_base_url,
            )
        return self._model

    def extract(
        self,
        text: str,
        scenario_id: str
    ) -> Dict[str, Any]:
        """
        执行文本提取

        Args:
            text: 输入文本
            scenario_id: 场景ID

        Returns:
            提取结果字典
        """
        start_time = time.time()

        # 1. 预处理文本
        sanitized_text = sanitize_text(text)

        # 2. 获取场景配置
        try:
            scenario = ScenarioRegistry.get(scenario_id)
        except ValueError as e:
            return {
                "success": False,
                "error": str(e),
                "scenario": scenario_id,
                "segments": [],
                "extractions": [],
                "formatted_text": "",
                "sanitized_input": sanitized_text,
                "processing_time": time.time() - start_time
            }

        # 3. 执行提取
        try:
            result = self._perform_extraction(
                text=sanitized_text,
                prompt=scenario.get_prompt(),
                examples=scenario.get_examples()
            )

            # 4. 构建响应
            response = self._build_response(
                result=result,
                scenario_id=scenario_id,
                sanitized_text=sanitized_text
            )
            response["processing_time"] = time.time() - start_time

            return response

        except Exception as e:
            logger.exception(f"Extraction failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "scenario": scenario_id,
                "segments": [],
                "extractions": [],
                "formatted_text": "",
                "sanitized_input": sanitized_text,
                "processing_time": time.time() - start_time
            }

    def _perform_extraction(
        self,
        text: str,
        prompt: str,
        examples: List[lx.data.ExampleData]
    ) -> Any:
        """执行 LangExtract 提取"""
        model = self._get_model()

        result = lx.extract(
            text_or_documents=text,
            prompt_description=prompt,
            examples=examples,
            model=model,
            fence_output=True,
            use_schema_constraints=False,
            prompt_validation_level=PromptValidationLevel.OFF,
            show_progress=False,
        )

        return result

    def _build_response(
        self,
        result: Any,
        scenario_id: str,
        sanitized_text: str
    ) -> Dict[str, Any]:
        """构建响应字典"""
        extractions = []
        segments = []

        if hasattr(result, 'extractions') and result.extractions:
            for ext in result.extractions:
                extraction_item = {
                    "extraction_class": ext.extraction_class,
                    "extraction_text": ext.extraction_text,
                    "attributes": ext.attributes if ext.attributes else {},
                }

                # 字符位置
                if hasattr(ext, 'char_interval') and ext.char_interval:
                    extraction_item["char_interval"] = {
                        "start_pos": ext.char_interval.start_pos,
                        "end_pos": ext.char_interval.end_pos,
                    }

                extractions.append(extraction_item)

            # 构建分段信息 (按类别分组)
            segments = self._build_segments(extractions)

        # 格式化文本
        formatted_text = self._format_extractions(extractions)

        return {
            "success": True,
            "scenario": scenario_id,
            "segments": segments,
            "extractions": extractions,
            "formatted_text": formatted_text,
            "sanitized_input": sanitized_text,
        }

    def _build_segments(self, extractions: List[Dict]) -> List[Dict]:
        """从提取结果构建分段"""
        segments_by_class = {}

        for ext in extractions:
            cls = ext["extraction_class"]
            if cls not in segments_by_class:
                segments_by_class[cls] = {
                    "type": "body",
                    "label": cls,
                    "content": [],
                    "intervals": [],
                    "significance": None,
                }

            segments_by_class[cls]["content"].append(ext["extraction_text"])

            if "char_interval" in ext:
                segments_by_class[cls]["intervals"].append(ext["char_interval"])

            # 获取重要性
            if ext.get("attributes", {}).get("significance"):
                segments_by_class[cls]["significance"] = ext["attributes"]["significance"]

        # 转换为列表
        segments = []
        for cls, seg in segments_by_class.items():
            segments.append({
                "type": seg["type"],
                "label": seg["label"],
                "content": " | ".join(seg["content"]),
                "intervals": seg["intervals"],
                "significance": seg["significance"],
            })

        return segments

    def _format_extractions(self, extractions: List[Dict]) -> str:
        """格式化提取结果为文本"""
        if not extractions:
            return ""

        # 按类别分组
        by_class = {}
        for ext in extractions:
            cls = ext["extraction_class"]
            if cls not in by_class:
                by_class[cls] = []
            by_class[cls].append(ext["extraction_text"])

        # 格式化输出
        lines = []
        for cls, items in by_class.items():
            lines.append(f"【{cls}】")
            for i, item in enumerate(items, 1):
                lines.append(f"  {i}. {item}")
            lines.append("")

        return "\n".join(lines)
