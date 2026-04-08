<?php

require __DIR__ . '/bootstrap.php';

logout_user();
flash_set('success', 'Sessão encerrada com sucesso.');
redirect_to('login.php');
