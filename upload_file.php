<?php 
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST');
header("Access-Control-Allow-Headers: X-Requested-With");

$token = file_get_contents('token', true);

$upload_url = $_COOKIE["upload_url"];
// $uploads_path = "upload" . DIRECTORY_SEPARATOR;

// $uploads_path = $uploads_path.basename();
// move_uploaded_file( $_FILES['file']['tmp_name'], $uploads_path );
// chmod($uploads_path, 0666);

// echo $uploads_path;

$ch = curl_init($upload_url);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, array(
	'photo' => '@' . $_FILES["file"]["name"]
	));

// $upload = curl_exec($ch);
if (($upload = curl_exec($ch)) === false) {
	throw new Exception(curl_error($ch));
}
// echo var_dump($ch);
curl_close($ch);
echo $_FILES["file"]["name"];
echo $upload;
// unlink($uploads_path);


?>