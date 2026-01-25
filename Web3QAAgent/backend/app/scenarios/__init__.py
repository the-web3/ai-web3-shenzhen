"""场景定义模块"""

from app.scenarios.base import BaseScenario, ScenarioRegistry
from app.scenarios.web3_dev_learning import Web3DevLearningScenario
from app.scenarios.web3_product_learning import Web3ProductLearningScenario
from app.scenarios.web3_testing_learning import Web3TestingLearningScenario

# 仅保留 Web3 相关场景
ScenarioRegistry.register("web3_dev", Web3DevLearningScenario)
ScenarioRegistry.register("web3_product", Web3ProductLearningScenario)
ScenarioRegistry.register("web3_testing", Web3TestingLearningScenario)

__all__ = [
    "BaseScenario",
    "ScenarioRegistry",
    "Web3DevLearningScenario",
    "Web3ProductLearningScenario",
    "Web3TestingLearningScenario",
]
