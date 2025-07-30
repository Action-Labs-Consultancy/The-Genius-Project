#!/usr/bin/env python3
"""
Simple HTTP server for LAN testing
This will help verify if the issue is Flask-specific or network-wide
"""
import http.server
import socketserver
import json
from datetime import datetime

class TestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/test':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'message': 'Simple HTTP server test successful',
                'timestamp': datetime.now().isoformat(),
                'client_ip': self.client_address[0],
                'server_message': 'If you can see this from another device, the network is working!'
            }
            
            self.wfile.write(json.dumps(response, indent=2).encode())
        else:
            super().do_GET()

if __name__ == "__main__":
    PORT = 8888
    Handler = TestHandler
    
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"🌐 Simple test server running on http://192.168.100.63:{PORT}/test")
        print("🔗 Test this URL from another device on your LAN")
        print("📱 Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
