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
from datetime import datetime, timedelta

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
        # 修改requirements.txt的路径，使用相对于脚本的路径
        self.script_dir = Path(__file__).parent
        self.project_root = self.script_dir.parent
        self.requirements_file = self.project_root / 'requirements.txt'
        self.cache_file = self.project_root / '.dependency_cache.json'
        self.cache_duration = timedelta(hours=24)
        self.min_python_version = (3, 6)  # 修改最低Python版本要求为3.6

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
        if not self.requirements_file.exists():
            logger.error(f"requirements.txt文件不存在: {self.requirements_file}")
            return []
            
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
                            'line': line
                        })
                    except Exception as e:
                        logger.warning(f"解析依赖失败: {line}, 错误: {str(e)}")
        return requirements

    def check_package_compatibility(self) -> bool:
        """检查包兼容性"""
        try:
            # 创建虚拟环境
            venv_path = self.project_root / '.venv'
            if not venv_path.exists():
                logger.info("创建虚拟环境...")
                subprocess.run([sys.executable, '-m', 'venv', str(venv_path)], 
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE, 
                             check=True)
            
            # 获取虚拟环境中的Python解释器路径
            if self.system == 'windows':
                python_path = venv_path / 'Scripts' / 'python.exe'
            else:
                python_path = venv_path / 'bin' / 'python'
            
            # 安装pip-tools
            logger.info("安装pip-tools...")
            subprocess.run([str(python_path), '-m', 'pip', 'install', '--upgrade', 'pip'], 
                         stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE, 
                         check=True)
            
            # 使用pip的dry-run模式检查依赖
            logger.info("检查依赖兼容性...")
            result = subprocess.run([
                str(python_path),
                '-m',
                'pip',
                'install',
                '--dry-run',
                '-r',
                str(self.requirements_file)
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            if result.returncode != 0:
                logger.error(f"依赖检查失败: {result.stderr.decode()}")
                return False
            
            # 检查是否有警告信息
            output = result.stdout.decode() + result.stderr.decode()
            if "ERROR" in output or "error" in output.lower():
                logger.error(f"发现依赖问题: {output}")
                return False
                
            return True
        except Exception as e:
            logger.error(f"检查依赖兼容性时出错: {str(e)}")
            return False

    def check_system_requirements(self) -> bool:
        """检查系统要求"""
        try:
            # 检查Python版本
            if self.python_version < self.min_python_version:
                logger.error(f"Python版本不兼容: 需要 >= {self.min_python_version[0]}.{self.min_python_version[1]}, 当前版本: {self.python_version[0]}.{self.python_version[1]}")
                return False
            
            # 检查操作系统
            if self.system not in ['linux', 'darwin', 'windows']:
                logger.warning(f"不支持的操作系统: {self.system}")
            
            # 检查操作系统特定要求
            if self.system == 'windows':
                # Windows特定检查
                if not os.environ.get('DOCKER_HOST'):
                    logger.error("Windows环境下需要安装Docker Desktop")
                    return False
            elif self.system == 'darwin':
                # macOS特定检查
                if not os.path.exists('/usr/local/bin/docker'):
                    logger.error("macOS环境下需要安装Docker Desktop")
                    return False
            elif self.system == 'linux':
                # Linux特定检查
                if not os.path.exists('/usr/bin/docker'):
                    logger.error("Linux环境下需要安装Docker")
                    return False
            
            return True
        except Exception as e:
            logger.error(f"检查系统要求时出错: {str(e)}")
            return False

    def check_package_updates(self) -> None:
        """检查包更新"""
        requirements = self.parse_requirements()
        for req in requirements:
            package_info = self.get_package_info(req['name'])
            if package_info:
                latest_version = package_info['info']['version']
                current_version = next((v for v, _ in req['specs'] if v != '=='), None)
                if current_version and current_version != latest_version:
                    logger.info(f"包 {req['name']} 有新版本: {latest_version} (当前: {current_version})")

    def load_cache(self) -> Optional[Dict]:
        """加载缓存"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r') as f:
                    cache = json.load(f)
                    cache_time = datetime.fromisoformat(cache['timestamp'])
                    if datetime.now() - cache_time < self.cache_duration:
                        return cache
            except Exception as e:
                logger.warning(f"加载缓存失败: {str(e)}")
        return None

    def save_cache(self, result: bool) -> None:
        """保存缓存"""
        try:
            cache = {
                'timestamp': datetime.now().isoformat(),
                'result': result
            }
            with open(self.cache_file, 'w') as f:
                json.dump(cache, f)
        except Exception as e:
            logger.warning(f"保存缓存失败: {str(e)}")

    def run_checks(self) -> bool:
        """运行所有检查"""
        logger.info("开始依赖检查...")
        
        # 检查缓存
        cache = self.load_cache()
        if cache is not None:
            logger.info("使用缓存的检查结果")
            return cache['result']

        # 检查系统要求
        system_ok = self.check_system_requirements()
        if not system_ok:
            return False

        # 检查包兼容性
        compatibility_ok = self.check_package_compatibility()
        if not compatibility_ok:
            return False

        # 检查包更新
        self.check_package_updates()

        # 保存结果
        self.save_cache(True)
        logger.info("依赖检查完成")
        return True

def main():
    checker = DependencyChecker()
    success = checker.run_checks()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main() 