<?php
include 'config.php';
header("Content-Type: application/json; charset=utf-8");

$dataDir = __DIR__ . "/./data/";
$input = json_decode(file_get_contents("php://input"), true);
$username = trim($input["username"] ?? "");

if (!$username) {
    echo json_encode(["success" => false, "message" => "缺少用户名"]);
    exit;
}

$userFile = $dataDir . $username . ".json";
if (!file_exists($userFile)) {
    echo json_encode(["success" => false, "message" => "用户不存在"]);
    exit;
}

$userData = json_decode(file_get_contents($userFile), true);

if (!isset($userData["save"])) {
    echo json_encode(["success" => false, "message" => "没有存档"]);
    exit;
}

echo json_encode(["success" => true, "save" => $userData["save"]]);
