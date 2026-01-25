"""PDF 文档解析服务 - 基于 MinerU API"""

import io
import os
import time
import zipfile
from pathlib import Path
from typing import Optional
import logging

import requests

logger = logging.getLogger(__name__)


class PDFParser:
    """PDF 文档解析器 - 基于 MinerU API"""

    MINERU_API_BASE = "https://mineru.net/api/v4"

    def __init__(self, api_key: str = None):
        """
        初始化 PDF 解析器

        Args:
            api_key: MinerU API Key，如不传则从环境变量获取
        """
        self.api_key = api_key or os.getenv("MINERU_API_KEY", "")
        if not self.api_key:
            raise ValueError("未配置 MINERU_API_KEY")

        self.api_base = os.getenv("MINERU_API_BASE", self.MINERU_API_BASE)

        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    def create_task(self, pdf_url: str, model_version: str = "vlm") -> Optional[str]:
        """
        创建 PDF 解析任务

        Args:
            pdf_url: PDF 文件的 URL 地址
            model_version: 模型版本，"vlm" 或 "pipeline"

        Returns:
            task_id 或 None（失败时）
        """
        url = f"{self.api_base}/extract/task"
        data = {
            "url": pdf_url,
            "model_version": model_version
        }

        try:
            response = requests.post(url, headers=self.headers, json=data, timeout=30)
            result = response.json()

            if result.get("code") == 0:
                task_id = result["data"]["task_id"]
                logger.info(f"任务创建成功: {task_id}")
                return task_id
            else:
                logger.error(f"任务创建失败: {result.get('msg', '未知错误')}")
                return None

        except Exception as e:
            logger.error(f"请求异常: {e}")
            return None

    def get_task_result(self, task_id: str) -> dict:
        """
        获取任务结果

        Args:
            task_id: 任务 ID

        Returns:
            任务状态和结果
        """
        url = f"{self.api_base}/extract/task/{task_id}"

        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            result = response.json()

            if result.get("code") == 0:
                return result["data"]
            else:
                return {"state": "error", "err_msg": result.get("msg", "未知错误")}

        except Exception as e:
            return {"state": "error", "err_msg": str(e)}

    def wait_for_completion(
        self,
        task_id: str,
        timeout: int = 600,
        poll_interval: int = 5,
        progress_callback=None
    ) -> dict:
        """
        等待任务完成

        Args:
            task_id: 任务 ID
            timeout: 超时时间（秒）
            poll_interval: 轮询间隔（秒）
            progress_callback: 进度回调函数

        Returns:
            最终任务结果
        """
        start_time = time.time()

        while True:
            elapsed = time.time() - start_time
            if elapsed > timeout:
                return {"state": "timeout", "err_msg": f"任务超时 ({timeout}秒)"}

            result = self.get_task_result(task_id)
            state = result.get("state", "unknown")

            if state == "done":
                logger.info("任务完成!")
                return result

            elif state == "failed":
                logger.error(f"任务失败: {result.get('err_msg', '未知错误')}")
                return result

            elif state == "running":
                progress = result.get("extract_progress", {})
                extracted = progress.get("extracted_pages", 0)
                total = progress.get("total_pages", "?")
                if progress_callback:
                    progress_callback({
                        "state": "running",
                        "extracted_pages": extracted,
                        "total_pages": total,
                        "elapsed": elapsed
                    })
                logger.info(f"解析中... {extracted}/{total} 页 (已等待 {elapsed:.0f}秒)")

            elif state == "pending":
                if progress_callback:
                    progress_callback({"state": "pending", "elapsed": elapsed})
                logger.info(f"排队中... (已等待 {elapsed:.0f}秒)")

            elif state == "converting":
                if progress_callback:
                    progress_callback({"state": "converting", "elapsed": elapsed})
                logger.info(f"格式转换中... (已等待 {elapsed:.0f}秒)")

            time.sleep(poll_interval)

    def download_and_extract_markdown(self, zip_url: str) -> Optional[str]:
        """
        下载结果压缩包并提取 Markdown 内容

        Args:
            zip_url: 压缩包下载 URL

        Returns:
            Markdown 文本内容
        """
        try:
            print(f"[DEBUG] 下载结果文件: {zip_url}")
            logger.info("下载结果文件...")
            response = requests.get(zip_url, timeout=60)
            response.raise_for_status()

            # 解压并查找 markdown 文件
            with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
                file_list = zf.namelist()
                print(f"[DEBUG] 压缩包包含文件: {file_list}")
                logger.info(f"压缩包包含 {len(file_list)} 个文件")

                # 查找 .md 文件
                md_files = [f for f in file_list if f.endswith('.md')]
                print(f"[DEBUG] 找到 markdown 文件: {md_files}")

                if not md_files:
                    logger.warning("压缩包中未找到 Markdown 文件")
                    return None

                # 优先选择 full.md 或最大的 md 文件
                target_file = None
                for f in md_files:
                    if 'full' in f.lower() or f.endswith('full.md'):
                        target_file = f
                        break

                if not target_file:
                    target_file = md_files[0]

                print(f"[DEBUG] 读取文件: {target_file}")
                logger.info(f"读取文件: {target_file}")
                markdown_content = zf.read(target_file).decode('utf-8')
                print(f"[DEBUG] Markdown 长度: {len(markdown_content)} 字符")
                print(f"[DEBUG] Markdown 前200字符: {markdown_content[:200]}")
                return markdown_content

        except Exception as e:
            print(f"[DEBUG] 下载/解压失败: {e}")
            logger.error(f"下载/解压失败: {e}")
            logger.exception("详细异常:")
            return None

    def parse(
        self,
        pdf_url: str,
        model_version: str = "vlm",
        timeout: int = 600,
        progress_callback=None
    ) -> dict:
        """
        解析 PDF 文档（完整流程）

        Args:
            pdf_url: PDF 文件 URL
            model_version: 模型版本
            timeout: 超时时间（秒）
            progress_callback: 进度回调函数

        Returns:
            包含解析结果的字典
        """
        logger.info(f"正在解析 PDF: {pdf_url}")
        logger.info(f"模型版本: {model_version}")
        start_time = time.time()

        # 步骤 1: 创建任务
        task_id = self.create_task(pdf_url, model_version)
        if not task_id:
            return {
                "success": False,
                "error": "任务创建失败",
                "source": pdf_url,
            }

        # 步骤 2: 等待完成
        result = self.wait_for_completion(
            task_id,
            timeout=timeout,
            progress_callback=progress_callback
        )

        if result.get("state") != "done":
            return {
                "success": False,
                "error": result.get("err_msg", "任务未完成"),
                "source": pdf_url,
                "task_id": task_id,
            }

        # 步骤 3: 下载并提取 Markdown
        zip_url = result.get("full_zip_url")
        if not zip_url:
            return {
                "success": False,
                "error": "未获取到结果下载链接",
                "source": pdf_url,
                "task_id": task_id,
            }

        markdown_text = self.download_and_extract_markdown(zip_url)
        if not markdown_text:
            return {
                "success": False,
                "error": "Markdown 提取失败",
                "source": pdf_url,
                "task_id": task_id,
            }

        elapsed = time.time() - start_time
        logger.info(f"PDF 解析完成 (耗时: {elapsed:.2f}秒)")
        logger.info(f"文本长度: {len(markdown_text):,} 字符")

        return {
            "success": True,
            "markdown": markdown_text,
            "source": pdf_url,
            "task_id": task_id,
            "parse_time": elapsed,
            "zip_url": zip_url,
        }

    def get_upload_urls(self, files: list[dict]) -> dict:
        """
        获取文件上传预签名 URL

        Args:
            files: 文件列表，每个文件包含 name 和 is_ocr 字段
                   例如: [{"name": "doc.pdf", "is_ocr": False}]

        Returns:
            包含 batch_id 和上传 URLs 的字典
        """
        url = f"{self.MINERU_API_BASE}/file-urls/batch"
        data = {"files": files}

        try:
            print(f"\n[DEBUG] 请求 MinerU API: {url}")
            print(f"[DEBUG] 请求数据: {data}")
            response = requests.post(url, headers=self.headers, json=data, timeout=30)
            result = response.json()

            # 添加详细日志
            print(f"[DEBUG] MinerU API 响应: {result}")
            logger.info(f"MinerU API 响应: {result}")

            if result.get("code") == 0:
                data = result.get("data", {})
                # MinerU API 返回的是 file_urls 而不是 files
                file_urls = data.get("file_urls", [])
                print(f"[DEBUG] batch_id: {data.get('batch_id')}")
                print(f"[DEBUG] file_urls 数据: {file_urls}")

                # 将 file_urls 转换为我们需要的格式
                files = [{"presigned_url": url} for url in file_urls]

                logger.info(f"获取上传 URL 成功，batch_id: {data.get('batch_id')}")
                logger.info(f"file_urls 数据: {file_urls}")
                return {
                    "success": True,
                    "batch_id": data.get("batch_id"),
                    "files": files
                }
            else:
                error_msg = result.get("msg", "未知错误")
                logger.error(f"获取上传 URL 失败: {error_msg}")
                logger.error(f"完整响应: {result}")
                return {"success": False, "error": error_msg}

        except Exception as e:
            logger.error(f"请求异常: {e}")
            logger.exception("详细异常信息:")
            return {"success": False, "error": str(e)}

    def upload_file_to_presigned_url(self, presigned_url: str, file_content: bytes) -> bool:
        """
        上传文件到预签名 URL

        Args:
            presigned_url: MinerU 返回的预签名上传 URL
            file_content: 文件内容（二进制）

        Returns:
            是否上传成功
        """
        try:
            print(f"[DEBUG] 正在上传文件到预签名 URL，大小: {len(file_content)} bytes")
            # 使用 PUT 方法上传到预签名 URL
            # OSS 预签名 URL 不需要额外的 headers，直接上传原始数据
            response = requests.put(
                presigned_url,
                data=file_content,
                timeout=120
            )

            print(f"[DEBUG] 上传响应状态码: {response.status_code}")
            if response.status_code not in [200, 201]:
                print(f"[DEBUG] 上传失败响应: {response.text[:500]}")

            if response.status_code in [200, 201]:
                logger.info("文件上传成功")
                return True
            else:
                logger.error(f"文件上传失败: HTTP {response.status_code}")
                logger.error(f"响应内容: {response.text[:500]}")
                return False

        except Exception as e:
            logger.error(f"上传异常: {e}")
            logger.exception("详细异常信息:")
            return False

    def get_batch_result(self, batch_id: str) -> dict:
        """
        获取批量任务结果

        Args:
            batch_id: 批量任务 ID

        Returns:
            批量任务状态和结果
        """
        url = f"{self.MINERU_API_BASE}/extract-results/batch/{batch_id}"

        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            result = response.json()

            print(f"[DEBUG] 批量任务状态查询响应: {result}")

            if result.get("code") == 0:
                data = result.get("data", {})
                extract_result = data.get("extract_result", [])
                if extract_result:
                    state = extract_result[0].get("state", "unknown")
                    print(f"[DEBUG] 当前状态: {state}")
                return {"success": True, "data": data}
            else:
                error_msg = result.get("msg", "未知错误")
                print(f"[DEBUG] 获取批量任务结果失败: {error_msg}")
                return {"success": False, "error": error_msg}

        except Exception as e:
            print(f"[DEBUG] 获取批量任务结果异常: {e}")
            return {"success": False, "error": str(e)}

    def wait_for_batch_completion(
        self,
        batch_id: str,
        timeout: int = 600,
        poll_interval: int = 5,
        progress_callback=None
    ) -> dict:
        """
        等待批量任务完成

        Args:
            batch_id: 批量任务 ID
            timeout: 超时时间（秒）
            poll_interval: 轮询间隔（秒）
            progress_callback: 进度回调函数

        Returns:
            最终任务结果
        """
        start_time = time.time()

        while True:
            elapsed = time.time() - start_time
            if elapsed > timeout:
                return {"success": False, "error": f"任务超时 ({timeout}秒)"}

            result = self.get_batch_result(batch_id)

            if not result["success"]:
                return result

            data = result["data"]
            extract_result = data.get("extract_result", [])

            if extract_result:
                # 检查第一个文件的状态
                first_file = extract_result[0]
                state = first_file.get("state", "unknown")

                if state == "done":
                    logger.info("批量任务完成!")
                    return {"success": True, "data": data}

                elif state == "failed":
                    error_msg = first_file.get("err_msg", "未知错误")
                    logger.error(f"任务失败: {error_msg}")
                    return {"success": False, "error": error_msg}

                elif state in ["running", "pending", "converting"]:
                    if progress_callback:
                        progress_callback({
                            "state": state,
                            "elapsed": elapsed,
                            "progress": first_file.get("extract_progress", {})
                        })
                    logger.info(f"处理中 ({state})... (已等待 {elapsed:.0f}秒)")

            time.sleep(poll_interval)

    def parse_uploaded_file(
        self,
        file_content: bytes,
        filename: str,
        model_version: str = "vlm",
        timeout: int = 600,
        progress_callback=None
    ) -> dict:
        """
        解析上传的 PDF 文件（完整流程）

        Args:
            file_content: PDF 文件内容（二进制）
            filename: 文件名
            model_version: 模型版本 (vlm 或 pipeline)
            timeout: 超时时间（秒）
            progress_callback: 进度回调函数

        Returns:
            包含解析结果的字典
        """
        logger.info(f"正在解析上传的 PDF: {filename}")
        logger.info(f"文件大小: {len(file_content):,} bytes")
        start_time = time.time()

        # 步骤 1: 获取上传 URL
        is_ocr = model_version == "pipeline"
        upload_result = self.get_upload_urls([{"name": filename, "is_ocr": is_ocr}])

        if not upload_result["success"]:
            return {
                "success": False,
                "error": f"获取上传 URL 失败: {upload_result.get('error')}",
                "source": filename,
            }

        batch_id = upload_result["batch_id"]
        files_info = upload_result["files"]

        if not files_info:
            return {
                "success": False,
                "error": "未获取到上传信息",
                "source": filename,
            }

        presigned_url = files_info[0].get("presigned_url")
        if not presigned_url:
            return {
                "success": False,
                "error": "未获取到预签名 URL",
                "source": filename,
            }

        # 步骤 2: 上传文件
        if progress_callback:
            progress_callback({"state": "uploading", "elapsed": 0})

        print(f"[DEBUG] 开始上传文件...")
        if not self.upload_file_to_presigned_url(presigned_url, file_content):
            return {
                "success": False,
                "error": "文件上传失败",
                "source": filename,
                "batch_id": batch_id,
            }

        print(f"[DEBUG] 文件上传成功，batch_id: {batch_id}")

        # 步骤 3: 等待解析完成（上传后系统自动开始解析）
        if progress_callback:
            progress_callback({"state": "parsing", "elapsed": time.time() - start_time})

        print(f"[DEBUG] 开始等待解析完成...")
        result = self.wait_for_batch_completion(
            batch_id,
            timeout=timeout,
            progress_callback=progress_callback
        )
        print(f"[DEBUG] 等待完成，结果: {result.get('success')}")

        if not result["success"]:
            return {
                "success": False,
                "error": result.get("error", "解析失败"),
                "source": filename,
                "batch_id": batch_id,
            }

        # 步骤 4: 下载并提取 Markdown
        extract_result = result["data"].get("extract_result", [])
        if not extract_result:
            return {
                "success": False,
                "error": "未获取到解析结果",
                "source": filename,
                "batch_id": batch_id,
            }

        first_file = extract_result[0]
        zip_url = first_file.get("full_zip_url")

        if not zip_url:
            return {
                "success": False,
                "error": "未获取到结果下载链接",
                "source": filename,
                "batch_id": batch_id,
            }

        markdown_text = self.download_and_extract_markdown(zip_url)
        if not markdown_text:
            return {
                "success": False,
                "error": "Markdown 提取失败",
                "source": filename,
                "batch_id": batch_id,
            }

        elapsed = time.time() - start_time
        logger.info(f"PDF 解析完成 (耗时: {elapsed:.2f}秒)")
        logger.info(f"文本长度: {len(markdown_text):,} 字符")

        return {
            "success": True,
            "markdown": markdown_text,
            "source": filename,
            "batch_id": batch_id,
            "parse_time": elapsed,
            "zip_url": zip_url,
        }

    def parse_file(
        self,
        file_path: str,
        upload_url: str = None,
        model_version: str = "vlm",
        timeout: int = 600
    ) -> dict:
        """
        解析本地 PDF 文件

        Args:
            file_path: 本地 PDF 文件路径
            upload_url: 如果已有上传后的 URL 则直接使用
            model_version: 模型版本
            timeout: 超时时间

        Returns:
            解析结果
        """
        if upload_url:
            return self.parse(upload_url, model_version, timeout)

        # 读取本地文件并使用上传 API
        try:
            with open(file_path, "rb") as f:
                file_content = f.read()

            filename = Path(file_path).name
            return self.parse_uploaded_file(
                file_content=file_content,
                filename=filename,
                model_version=model_version,
                timeout=timeout
            )

        except FileNotFoundError:
            return {
                "success": False,
                "error": f"文件不存在: {file_path}",
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"读取文件失败: {e}",
            }
