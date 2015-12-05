<?php
error_reporting(-1);
ini_set('display_errors', 'On');
require 'vendor/autoload.php';
$app = new \Slim\Slim();
function getDB()
{
    $dbhost = "localhost";
    $dbuser = "root";
    $dbpass = "root";
    $dbname = "munichmunich";

    $mysql_conn_string = "mysql:host=$dbhost;dbname=$dbname";
    $dbConnection = new PDO($mysql_conn_string, $dbuser, $dbpass);
    $dbConnection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $dbConnection;
}


$app->get('/hello/:name', function ($name) {
    echo "Hello, " . $name;
});
$app->get('/', function() {
    $app = \Slim\Slim::getInstance();
    $app->response->setStatus(200);
    echo "Welcome to Slim 3.0 based API";
});
$app->get('/story/', function () {

    $app = \Slim\Slim::getInstance();

    try
    {
        $db = getDB();

        $sth = $db->prepare("SELECT place FROM pictures GROUP By place");
        $sth->execute();


        $locations=[];
        $results = $sth->fetchAll(PDO::FETCH_ASSOC);
        foreach($results as $row) {
            $sth = $db->prepare("SELECT id,title,story,picture,type FROM pictures WHERE place=:place");
            $sth->bindValue(':place', $row['place']);
            $sth->execute();
            $locations[$row['place']]=$sth->fetchAll(PDO::FETCH_ASSOC);

        }
        if($locations) {
            $app->response->setStatus(200);
            $app->response()->headers->set('Content-Type', 'application/json');
            echo json_encode($locations);
            $db = null;
        } else {
            throw new PDOException('No records found.');
        }

    } catch(PDOException $e) {
        $app->response()->setStatus(404);
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});
$app->get('/comments/:id', function ($id) {

    $app = \Slim\Slim::getInstance();

    try
    {
        $db = getDB();

        $sth = $db->prepare("SELECT id,name,story,picture FROM comments WHERE picture_id=:id");
        $sth->bindValue(':id', $id);
        $sth->execute();
        $results = $sth->fetchAll(PDO::FETCH_ASSOC);
        if($results) {
            $app->response->setStatus(200);
            $app->response()->headers->set('Content-Type', 'application/json');
            echo json_encode($results);
            $db = null;
        } else {
            throw new PDOException('No records found.');
        }

    } catch(PDOException $e) {
        $app->response()->setStatus(404);
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
});
$app->post('/comments/', function () {
    $app = \Slim\Slim::getInstance();
    $request = $app->request();
    $db = getDB();
    $body = $request->getBody();
    $input = json_decode($body);
    print_r($body);
    print_r($input->picture_id);
    $sth = $db->prepare("INSERT INTO `munichmunich`.`comments` (`id`, `picture_id`, `name`, `story`, `picture`, `active`) VALUES (NULL, :picture_id, :name, :story, :picture, '0');");
    $sth->bindValue(':picture_id', $input->picture_id);
    $sth->bindValue(':story', $input->story);
    $sth->bindValue(':name', $input->name);
    $sth->bindValue(':picture', $input->picture);
    $sth->execute();
});
$app->run();