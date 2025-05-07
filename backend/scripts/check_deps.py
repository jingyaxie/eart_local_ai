#!/usr/bin/env python3
import sys
import os
import platform
import pkg_resources
import subprocess
from typing import Dict, List, Tuple, Optional
import logging
import json
import requests
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DependencyChecker:
    def __init__(self):
        self.system = platform.system().lower()
        self.python_version = sys.version_info[:2]
        self.requirements_file = Path('requirements.txt')
        self.cache_file = Path('.dependency_cache.json')
        self.cache_duration = 24 * 60 * 60  # 24小时缓存

    def get_package_info(self, package_name: str) -> Optional[Dict]:
        """从PyPI获取包信息"""
        try:
            response = requests.get(
                f'https://pypi.org/pypi/{package_name}/json',
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.warning(f"获取包 {package_name} 信息失败: {str(e)}")
        return None

    def parse_requirements(self) -> List[Dict]:
        """解析requirements.txt文件，返回包信息列表"""
        requirements = []
        with open(self.requirements_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    try:
                        req = pkg_resources.Requirement.parse(line)
                        requirements.append({
                            'name': req.name,
                            'specs': req.specs,
                            'markers': str(req.marker) if req.marker else None
                        })
                    except Exception as e:
                        logger.error(f"解析依赖项失败: {line} - {str(e)}")
        return requirements

    def check_package_compatibility(self, requirements: List[Dict]) -> List[Tuple[str, str]]:
        """检查包之间的兼容性"""
        conflicts = []
        
        # 检查缓存
        if self.cache_file.exists():
            cache_data = json.loads(self.cache_file.read_text())
            if cache_data.get('timestamp', 0) > (os.path.getmtime(self.cache_file) - self.cache_duration):
                logger.info("使用缓存的依赖检查结果")
                return cache_data.get('conflicts', [])

        try:
            # 创建虚拟环境进行依赖检查
            venv_dir = Path('.venv')
            if not venv_dir.exists():
                logger.info("创建虚拟环境...")
                subprocess.run([sys.executable, '-m', 'venv', str(venv_dir)], check=True)

            # 获取虚拟环境中的pip路径
            if self.system == 'windows':
                pip_path = venv_dir / 'Scripts' / 'pip'
            else:
                pip_path = venv_dir / 'bin' / 'pip'

            # 安装pip-tools
            logger.info("安装pip-tools...")
            subprocess.run([
                str(pip_path),
                'install',
                'pip-tools',
                '--no-cache-dir',
                '--quiet'
            ], check=True)

            # 生成依赖树
            logger.info("检查依赖兼容性...")
            result = subprocess.run([
                str(pip_path),
                'install',
                '--dry-run',
                '-r',
                str(self.requirements_file)
            ], capture_output=True, text=True)

            if result.returncode != 0:
                conflicts.append(('dependency-check', result.stderr))

            # 更新缓存
            cache_data = {
                'timestamp': os.path.getmtime(self.cache_file),
                'conflicts': conflicts
            }
            self.cache_file.write_text(json.dumps(cache_data))

        except subprocess.CalledProcessError as e:
            conflicts.append(('dependency-check', str(e)))
        except Exception as e:
            conflicts.append(('dependency-check', f"未知错误: {str(e)}"))

        return conflicts

    def check_system_requirements(self) -> List[str]:
        """检查系统要求"""
        issues = []
        
        # 检查Python版本
        if self.python_version < (3, 9):
            issues.append(f"Python版本不兼容: 需要 >= 3.9, 当前: {self.python_version[0]}.{self.python_version[1]}")

        # 检查操作系统特定要求
        if self.system == 'windows':
            # Windows特定检查
            if not os.environ.get('DOCKER_HOST'):
                issues.append("Windows环境下需要安装Docker Desktop")
        elif self.system == 'darwin':
            # macOS特定检查
            if not os.path.exists('/usr/local/bin/docker'):
                issues.append("macOS环境下需要安装Docker Desktop")
        elif self.system == 'linux':
            # Linux特定检查
            if not os.path.exists('/usr/bin/docker'):
                issues.append("Linux环境下需要安装Docker")

        return issues

    def check_package_versions(self, requirements: List[Dict]) -> List[Tuple[str, str]]:
        """检查包版本兼容性"""
        issues = []
        for req in requirements:
            package_info = self.get_package_info(req['name'])
            if package_info:
                latest_version = package_info['info']['version']
                if req['specs']:
                    current_spec = req['specs'][0]
                    if current_spec[0] == '>=' and current_spec[1] < latest_version:
                        issues.append((req['name'], f"有新版本可用: {latest_version}"))
        return issues

    def run_checks(self) -> bool:
        """运行所有检查"""
        logger.info("开始依赖检查...")
        
        # 检查系统要求
        system_issues = self.check_system_requirements()
        if system_issues:
            for issue in system_issues:
                logger.error(issue)
            return False

        # 解析requirements.txt
        try:
            requirements = self.parse_requirements()
            logger.info(f"成功解析 {len(requirements)} 个依赖项")
        except Exception as e:
            logger.error(f"解析requirements.txt失败: {str(e)}")
            return False

        # 检查包兼容性
        conflicts = self.check_package_compatibility(requirements)
        if conflicts:
            logger.error("发现依赖冲突:")
            for package, error in conflicts:
                logger.error(f"- {package}: {error}")
            return False

        # 检查包版本
        version_issues = self.check_package_versions(requirements)
        if version_issues:
            logger.warning("发现可更新的包:")
            for package, message in version_issues:
                logger.warning(f"- {package}: {message}")

        logger.info("依赖检查完成")
        return True

def main():
    checker = DependencyChecker()
    success = checker.run_checks()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main() 