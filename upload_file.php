<?php 
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST');
header("Access-Control-Allow-Headers: X-Requested-With");
// error_reporting(E_ALL);
$token = file_get_contents('token', true);

$upload_url = $_COOKIE["upload_url"];
$uploads_path = "upload/";

// echo($_FILES["file"]["tmp_name"]);
$uploads_path = $uploads_path.basename($_FILES["file"]["name"]);
move_uploaded_file( $_FILES['file']['tmp_name'], $uploads_path );
chmod($uploads_path, 0666);

$ch = curl_init($upload_url);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, array(
	'photo' => '@' . $uploads_path
	));

// $upload = curl_exec($ch);
if (($upload = curl_exec($ch)) === false) {
	throw new Exception(curl_error($ch));
}

curl_close($ch);

echo $upload;
unlink($uploads_path);


?>