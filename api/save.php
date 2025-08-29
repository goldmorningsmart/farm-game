<?php
include 'config.php';
header("Content-Type: application/json; charset=utf-8");

$dataDir = __DIR__ . "/./data/";
if (!file_exists($dataDir)) mkdir($dataDir, 0777, true);

$input = json_decode(file_get_contents("php://input"), true);
$username = trim($input["username"] ?? "");
$save = $input["save"] ?? null;

if (!$username || !$save) {
    echo json_encode(["success" => false, "message" => "缺少用户名或存档数据"]);
    exit;
}

$userFile = $dataDir . $username . ".json";

// 如果用户不存在 -> 返回失败（需要先登录注册）
if (!file_exists($userFile)) {
    echo json_encode(["success" => false, "message" => "用户不存在，请先登录"]);
    exit;
}

$userData = json_decode(file_get_contents($userFile), true);

// 更新存档
$userData["save"] = $save;
file_put_contents($userFile, json_encode($userData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(["success" => true, "message" => "存档已保存"]);
