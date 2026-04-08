const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, '../storage/backups/salao_rf_sistema_migrado_final.sql');
let sql = fs.readFileSync(sqlFile, 'utf8');

sql = sql
  .replace(/-- MariaDB dump.*\n/g, '')
  .replace(/-- Host:.*\n/g, '')
  .replace(/-- Server version.*\n/g, '')
  .replace(/-- ------------------------------------------------------\n/g, '')
  .replace(/\/\*![\d]+[\s\S]*?\*\//g, '')
  .replace(/CREATE DATABASE.*?\n/g, '')
  .replace(/USE `.*?`;/g, '')
  .replace(/DROP TABLE IF EXISTS `.*?`;/g, '')
  .replace(/LOCK TABLES `.*?` WRITE;/g, '')
  .replace(/UNLOCK TABLES;/g, '')
  .replace(/ENGINE=InnoDB.*$/gm, '')
  .replace(/DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/g, '')
  .replace(/SET @saved_cs_client.*$/gm, '')
  .replace(/SET character_set_client = .*$/gm, '')
  .replace(/`([^`]+)`/g, '"$1"')
  .replace(/datetime\(3\)/g, 'timestamp(3)')
  .replace(/tinyint\(1\)/g, 'boolean')
  .replace(/int\(11\)/g, 'integer')
  .replace(/varchar\(191\)/g, 'varchar(255)')
  .replace(/DEFAULT current_timestamp\(3\)/g, 'DEFAULT CURRENT_TIMESTAMP');

const outputFile = path.join(__dirname, '../storage/backups/salao_rf_sistema_pg.sql');
fs.writeFileSync(outputFile, sql);
console.log('SQL convertido para PostgreSQL:', outputFile);