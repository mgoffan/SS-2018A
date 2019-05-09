#!/bin/bash

# Generate 1000 particles
java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-in-1000.particles -g -p 1000

# Diametro 0,15
seq 1 5 | xargs -P 32 -I{} java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d15-run{}.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles -d 0.15 --fstats ./tp5-d15-run{}

# Diametro 0,20
seq 1 5 | xargs -P 32 -I{} java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d20-run{}.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles -d 0.20 --fstats ./tp5-d20-run{}

# Diametro 0,25
seq 1 5 | xargs -P 32 -I{} java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d25-run{}.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles -d 0.25 --fstats ./tp5-d25-run{}

# Diametro 0,30
seq 1 5 | xargs -P 32 -I{} java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d30-run{}.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles -d 0.30 --fstats ./tp5-d30-run{}