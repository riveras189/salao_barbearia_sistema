<?php

require __DIR__ . '/bootstrap.php';

logout_cliente_user();
flash_set('success', 'Sessão do cliente encerrada.');
redirect_to('cliente_login.php');
