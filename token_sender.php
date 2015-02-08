<?php 
$myfile = fopen("token", "r") or die("Unable to open file!");
echo fread($myfile,filesize("token"));
fclose($myfile);
?>