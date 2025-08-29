<?php
header("Access-Control-Allow-Origin: *"); // 允许所有来源访问
header("Access-Control-Allow-Credentials: true"); // 允许发送 Cookie
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // 允许的 HTTP 方法
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // 允许的请求头
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
