#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
设计协同系统 - 本地静态资源服务
以脚本所在目录（原型根目录）为站点根路径，避免 404。
"""
import os
import sys
import http.server
import socketserver

# 端口（可通过环境变量 SERVER_PORT 覆盖）
PORT = int(os.environ.get('SERVER_PORT', '8080'))

# 切换到脚本所在目录
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

Handler = http.server.SimpleHTTPRequestHandler


def main():
    try:
        with socketserver.TCPServer(('', PORT), Handler) as httpd:
            print('=' * 50)
            print('  设计协同系统 - 本地服务')
            print('=' * 50)
            print('  端口: %d' % PORT)
            print('  根目录: %s' % ROOT)
            print()
            print('  浏览器访问:')
            print('    http://localhost:%d/main.html' % PORT)
            print('    http://127.0.0.1:%d/main.html' % PORT)
            print()
            print('  按 Ctrl+C 停止服务')
            print('=' * 50)
            httpd.serve_forever()
    except OSError as e:
        err = str(e).lower()
        if 'address already in use' in err or '通常每个套接字地址' in err or 'only one usage' in err:
            print('错误: 端口 %d 已被占用。请关闭占用程序或设置 SERVER_PORT=其他端口 后重试。' % PORT, file=sys.stderr)
        else:
            print('错误: %s' % e, file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print('\n服务已停止。')
        sys.exit(0)


if __name__ == '__main__':
    main()
