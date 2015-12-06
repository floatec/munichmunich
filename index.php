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
    $dbConnection->query("CREATE TABLE IF NOT EXISTS `comments` ( `id` int(11) NOT NULL,`picture_id` int(11) NOT NULL,`name` varchar(100) NOT NULL,  `story` text NOT NULL,  `picture` varchar(200) NOT NULL,  `active` int(11) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1;");
    $dbConnection->query("CREATE TABLE IF NOT EXISTS `pictures` (  `id` int(11) NOT NULL,  `title` varchar(200) CHARACTER SET latin1 NOT NULL,  `place` varchar(200) CHARACTER SET latin1 NOT NULL,  `story` text CHARACTER SET latin1 NOT NULL,  `type` int(11) NOT NULL,  `picture` text CHARACTER SET latin1 NOT NULL,  `active` int(11) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
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

        $sth = $db->prepare("SELECT place FROM pictures WHERE active=1 GROUP By place  ");
        $sth->execute();


        $locations=[];
        $results = $sth->fetchAll(PDO::FETCH_ASSOC);
        //print_r($results);
        foreach($results as $row) {
            $sth = $db->prepare("SELECT id,title,story,picture,type FROM pictures WHERE place=:place AND active=1");
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

$app->get('/story/all', function () {

    $app = \Slim\Slim::getInstance();

    try
    {
        $db = getDB();

        $sth = $db->prepare("SELECT id,title,story,picture,type,place,active FROM pictures GROUP By place");
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
$app->get('/comments/all', function () {

    $app = \Slim\Slim::getInstance();

    try
    {
        $db = getDB();

        $sth = $db->prepare("SELECT id,name,story,picture FROM comments");

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
$app->get('/comments/:id', function ($id) {

    $app = \Slim\Slim::getInstance();

    try
    {
        $db = getDB();

        $sth = $db->prepare("SELECT id,name,story,picture FROM comments WHERE picture_id=:id AND active=1");
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
    $sth->bindValue(':story', htmlspecialchars($input->story));
    $sth->bindValue(':name', htmlspecialchars($input->name));
    $sth->bindValue(':picture', $input->picture);
    $sth->execute();
});

$app->post('/story/', function () {
    if (!isset($_FILES['upload'])) {
        echo "No files uploaded!!";
        return;
    }

    $imgs = array();

    $files = $_FILES['upload'];

    $cnt = count($files['name']);


            $name = uniqid('img-'.date('Ymd').'-');

            if (move_uploaded_file($files['tmp_name'], 'uploads/' . $name) === true) {
                $imgs = array('url' => '/uploads/' . $name, 'name' => $files['name']);
            }



    $app = \Slim\Slim::getInstance();
    $request = $app->request();
    $db = getDB();
    $body = $request->getBody();
    $input = json_decode($body);
    print_r($body);
    $sth = $db->prepare("INSERT INTO `munichmunich`.`pictures` (`id`, `picture`, `title`, `story`, `place`, `active`) VALUES (NULL, :picture, :title, :story,:location, '0');");
    $sth->bindValue(':picture', $imgs['url']);
    $sth->bindValue(':story', htmlspecialchars($app->request->post('story')));
    $sth->bindValue(':title', htmlspecialchars($app->request->post('title')));
    $sth->bindValue(':location', $app->request->post('location'));
    $sth->execute();
    $app->redirect($_SERVER["HTTP_REFERER"]);
});
$app->get('/story/:id/activate/:active', function ($id,$active) {
    $app = \Slim\Slim::getInstance();
    $db = getDB();
    $sth = $db->prepare("UPDATE `munichmunich`.`pictures` SET  `active`=:active WHERE id=:id");
    $sth->bindValue(':id', $id);
    $sth->bindValue(':active', $active);
    $sth->execute();
});


$app->run();