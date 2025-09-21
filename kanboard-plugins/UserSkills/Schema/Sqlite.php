<?php

namespace Kanboard\Plugin\UserSkills\Schema;

const VERSION = 1;

function version_1($pdo)
{
    $pdo->exec("ALTER TABLE users ADD COLUMN skills TEXT DEFAULT ''");
}
