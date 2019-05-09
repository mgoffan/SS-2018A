#!/bin/bash

# Generate 1000 particles
# java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-in-1000.particles -g -p 1000

seq 0.15 0.05 0.30 | xargs -P 32 -I{} sh -c "seq 1 5 | xargs -P 32 -I+ java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d{}-run+.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 200000 -d {} --fstats ./tp5-d{}-run+"

# Diametro 0,15
# seq 1 5 | xargs -P 32 -I{} java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d15-run{}.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 200000 -d 0.15 --fstats ./tp5-d15-run{}

# Diametro 0,20
# seq 1 5 | xargs -P 32 -I{} java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d20-run{}.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 200000 -d 0.20 --fstats ./tp5-d20-run{}

# Diametro 0,25
# seq 1 5 | xargs -P 32 -I{} java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d25-run{}.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 200000 -d 0.25 --fstats ./tp5-d25-run{}

# Diametro 0,30
# seq 1 5 | xargs -P 32 -I{} java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d30-run{}.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 200000 -d 0.30 --fstats ./tp5-d30-run{}

# Estudio de Relajacion

# mu = 2 / 10 * KN
# java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d0-mu20000.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 20000 -d 0 --fstats ./tp5-d0-mu20000 &

# mu = 2 * KN
# java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d0-mu200000.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 200000 -d 0 --fstats ./tp5-d0-mu200000 &

# mu = 4 * KN
# java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d0-mu400000.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 400000 -d 0 --fstats ./tp5-d0-mu400000 &

# mu = 20 * KN
# java -jar target/g6-1.0-SNAPSHOT-jar-with-dependencies.jar -o ./tp5-d0-mu2000000.xyz -s -ts 0.00001 -f 60 -i ./tp5-in-1000.particles --mu 2000000 -d 0 --fstats ./tp5-d0-mu2000000 &

# wait
echo "Done"