<?php
$path = $_GET['path'];
$uploaddir = $path;
$filename = basename($_FILES['myfile']['name']);
$uploadfile = $uploaddir.$filename;
while (file_exists($uploadfile)){
    $pref = date("Ymdhis");
    $ext = substr($filename, 1 + strrpos($filename, "."));
    $name = substr($filename,0,strlen($filename)-strlen($ext)-1);
    $uploadfile = $uploaddir.$name.$pref.'.'.$ext;
}
move_uploaded_file($_FILES['myfile']['tmp_name'], $uploadfile);
echo basename($uploadfile);

?>