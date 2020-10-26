#!/usr/bin/env python

import pymysql
import os
import sys
from automan.libs.secret import secret

mysql_access_dict = secret.get_mysql_username_password()
MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_USER = mysql_access_dict["MYSQL_USER"]
MYSQL_PASSWORD = mysql_access_dict["MYSQL_PASSWORD"]
MYSQL_DB_NAME = os.getenv('MYSQL_DB_NAME')


if __name__ == '__main__':
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
    )
    conn.cursor().execute(f'create database if not exists {MYSQL_DB_NAME}')
