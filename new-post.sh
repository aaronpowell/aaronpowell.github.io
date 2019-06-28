#! /bin/bash

cd src

postDate=$(date +%Y-%m-%d)
postName=$(echo $1 | sed -e 's/ /-/g')

../hugo new posts/$postDate-$postName.md

cd ..