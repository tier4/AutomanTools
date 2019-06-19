#!/bin/bash
cd setup/kubernetes

cd db
kubectl describe secret mysql-secret || kubectl create -f mysql-secret.yaml
sleep 5
kubectl describe deployment automan-labeling-mysql || kubectl create -f mysql-deployment.yaml
sleep 5

cd ../app
kubectl describe deployment automan-labeling-app || kubectl kustomize overlays/development | kubectl apply -f -
