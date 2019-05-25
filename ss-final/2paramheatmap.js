const Simulation = require('./index')
		, fs = require('fs');

const args = process.argv.slice(2);

const N = parseInt(args[0], 10);

const dumpedStreets = require(`./cars/cars-${N}.json`);

const mapEntityToConfig = entity => ({
	period: 60,
	phi1: 0,
	justSim: true,
	showBar: false,
	streets: Simulation.fromDumpedStreets(dumpedStreets),
	n: N,
	...entity,
});

const heatmap = [];
const bad = [];
let best = { speed: 0 };

const start = 0;
const end = 120;
const step = 10;

console.log(`Running for N=${N}`);

for (let phi2 = start; phi2 <= end; phi2 += step) {
	for (let phi3 = start; phi3 <= end; phi3 += step) {
		const speed = Simulation.run(mapEntityToConfig({ phi2, phi3 }));
		if (speed < 0) {
			bad.push({ phi2, phi3 });
			continue;
		}
		if (speed > best.speed) {
			best = { phi2, phi3, speed };
		}
		heatmap.push({
			phi2,
			phi3,
			speed
		});
	}
}

fs.writeFileSync(`./results/hm-best-${N}-${start}-${step}-${end}.json`, JSON.stringify(best, null, 2));
fs.writeFileSync(`./results/hm-bad-${N}-${start}-${step}-${end}.json`, JSON.stringify(bad, null, 2));
fs.writeFileSync(`./results/hm-${N}-${start}-${step}-${end}.json`, JSON.stringify(heatmap, null, 2));
