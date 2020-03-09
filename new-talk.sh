#! /bin/bash

cd src

postName=$(echo $1 | sed -e 's/ /-/g' | tr '[:upper:]' '[:lower:]')

../hugo new talks/$postName.md

cd ..