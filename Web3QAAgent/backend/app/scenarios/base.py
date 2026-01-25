"""场景基类定义"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Type
import textwrap

import langextract as lx


class BaseScenario(ABC):
    """场景基类"""

    # 场景元信息
    name: str = "基础场景"
    description: str = "场景描述"
    extract_classes: List[str] = []

    @abstractmethod
    def get_prompt(self) -> str:
        """获取提示词"""
        pass

    @abstractmethod
    def get_examples(self) -> List[lx.data.ExampleData]:
        """获取 Few-shot 示例"""
        pass

    def get_samples(self) -> List[Dict[str, str]]:
        """获取样本数据"""
        return []

    def get_info(self) -> Dict[str, Any]:
        """获取场景信息"""
        return {
            "name": self.name,
            "description": self.description,
            "extract_classes": self.extract_classes,
        }


class ScenarioRegistry:
    """场景注册表"""

    _scenarios: Dict[str, Type[BaseScenario]] = {}

    @classmethod
    def register(cls, scenario_id: str, scenario_class: Type[BaseScenario]) -> None:
        """注册场景"""
        cls._scenarios[scenario_id] = scenario_class

    @classmethod
    def get(cls, scenario_id: str) -> BaseScenario:
        """获取场景实例"""
        if scenario_id not in cls._scenarios:
            raise ValueError(f"Unknown scenario: {scenario_id}")
        return cls._scenarios[scenario_id]()

    @classmethod
    def list_all(cls) -> Dict[str, Dict[str, Any]]:
        """列出所有场景"""
        result = {}
        for scenario_id, scenario_class in cls._scenarios.items():
            instance = scenario_class()
            result[scenario_id] = instance.get_info()
        return result
