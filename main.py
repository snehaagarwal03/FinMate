import http.server
import socketserver
import os

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        # Add colored output for easier reading
        print(f"\033[92m[{self.log_date_time_string()}] {args[0]} {args[1]} {args[2]}\033[0m")

PORT = 8080
Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Serving FinMate at http://0.0.0.0:{PORT}")
    print(f"You can access the application in the web preview.")
    httpd.serve_forever()