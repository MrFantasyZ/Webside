#!/bin/bash

# 等待 MongoDB 启动
echo "Waiting for MongoDB to be ready..."
sleep 10

# 初始化数据库
echo "Initializing database..."
docker-compose exec server npm run init-db

echo "Database initialization completed!"
echo "Visit http://localhost:3000 to view the website"