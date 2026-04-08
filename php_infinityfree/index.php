<?php

require __DIR__ . '/bootstrap.php';

if (app_user()) {
    redirect_to('dashboard.php');
}

redirect_to('login.php');
