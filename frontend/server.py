# server.py
import http.server
import socketserver

# 修复MIME类型：将.js文件的MIME设为application/javascript
class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        # 先调用默认的类型猜测
        mime_type = super().guess_type(path)
        # 如果是.js文件，强制设为application/javascript
        if path.endswith('.js'):
            return 'application/javascript'
        # 其他文件保持默认
        return mime_type

# 启动服务器（端口3000）
if __name__ == '__main__':
    PORT = 3000
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"Serving HTTP on localhost port {PORT} (http://localhost:{PORT}/)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped by user")
            httpd.server_close()