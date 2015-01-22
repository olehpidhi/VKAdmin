<?php 
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST');
header("Access-Control-Allow-Headers: X-Requested-With");
error_reporting(E_ALL);
$token = file_get_contents('token', true);

$upload_url = $_COOKIE["upload_url"];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $upload_url);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, array(
        'photo' => $_FILES[0]["tmp_name"],    // you'll have to change the name, here, I suppose
        // some other fields ?
));
$result = curl_exec($ch);
echo $result;


?>