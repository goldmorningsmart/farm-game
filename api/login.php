
<?php
include 'config.php';
header("Content-Type: application/json; charset=utf-8");

// 确保 data 文件夹存在
$dataDir = __DIR__ . "/./data/";
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

// 获取请求数据
$input = json_decode(file_get_contents("php://input"), true);
$username = trim($input["username"] ?? "");
$password = trim($input["password"] ?? "");

if (!$username || !$password) {
    echo json_encode(["success" => false, "message" => "用户名和密码不能为空"]);
    exit;
}

$userFile = $dataDir . $username . ".json";

// 如果用户不存在 -> 新建
if (!file_exists($userFile)) {
    $newUser = [
        "password" => password_hash($password, PASSWORD_DEFAULT), // 哈希存储
        "save" => [] // 初始存档
    ];
    file_put_contents($userFile, json_encode($newUser, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(["success" => true, "message" => "新用户已创建", "save" => []]);
    exit;
}

// 如果用户存在 -> 验证密码
$userData = json_decode(file_get_contents($userFile), true);

if (password_verify($password, $userData["password"])) {
    echo json_encode(["success" => true, "message" => "登录成功", "save" => $userData["save"]]);
} else {
    echo json_encode(["success" => false, "message" => "密码错误"]);
}
