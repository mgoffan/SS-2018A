const Simulation = require('./index')
		, fs = require('fs');

const mapEntityToConfig = entity => ({
	phi1: 0,
	phi2: 0,
	phi3: 0,
	justSim: true,
	showBar: false,
	n: N,
	...entity,
});

const args = process.argv.slice(2);

const N = parseInt(args[0], 10);

const streets = [1, 2, 3, 4, 5].map(i => {
	console.log(`generate streets for ${N}. Run ${i}`);
	const s = Simulation.generate({ N });
	const dump = Simulation.dumpableStreets(s);
	let k = 100000;
	do {
		const speed = Simulation.run(mapEntityToConfig({
			period: 60,
			streets: Simulation.fromDumpedStreets(dump)
		}));
		if (speed > 0) {
			return dump;
		}
	} while (k--);
});

// const dumpedStreets = require(`./cars/cars-${N}.json`);

const periods = [];
const bad = [];
let best = { speed: 0 };

const start = 1;
const end = 120;
const step = 5;

console.log(`Running for N=${N}`);

for (let period = start; period <= end; period += period === 1 ? step - 1 : step) {
	let values = [];
	let sum = 0;
	streets.forEach((st, i) => {
		const speed = Simulation.run(mapEntityToConfig({
			period,
			streets: Simulation.fromDumpedStreets(st)
		}));
		if (speed < 0) {
			bad.push({ period, N, run: i });
			return;
		}
		if (speed > best.speed) {
			best = { period, speed, N, run: i };
		}
		periods.push({
			period,
			speed,
			run: i,
			N
		});
		values.push(speed);
		sum += speed;
	});
	// const avg = sum / streets.length;
	// const stdev = Math.sqrt(values.reduce((memo, val) => memo + (val - avg) * (val - avg), 0) / (streets.length - 1));
	// periods.push({
	// 	period,
	// 	speed: sum / streets.length,
	// 	err: stdev,
	// 	N
	// });
}

fs.writeFileSync(`./results/same-best-${N}-${start}-${step}-${end}.json`, JSON.stringify(best, null, 2));
fs.writeFileSync(`./results/same-bad-${N}-${start}-${step}-${end}.json`, JSON.stringify(bad, null, 2));
fs.writeFileSync(`./results/same-${N}-${start}-${step}-${end}.json`, JSON.stringify(periods, null, 2));
