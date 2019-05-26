const Simulation = require('./index')
		, fs = require('fs');

const args = process.argv.slice(2);

const N = parseInt(args[0], 10);

const data = [
  {
    "id": 583,
    "N": 16,
    "Est": "Heatmap",
    "Good": "OK",
    period: 60,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 315,
    "N": 24,
    "Est": "Heatmap",
    "Good": "OK",
    period: 60,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 603,
    "N": 32,
    "Est": "Heatmap",
    "Good": "OK",
    period: 60,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 528,
    "N": 40,
    "Est": "Heatmap",
    "Good": "OK",
    period: 60,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 163,
    "N": 48,
    "Est": "Heatmap",
    "Good": "OK",
    period: 60,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 344,
    "N": 56,
    "Est": "Heatmap",
    "Good": "OK",
    period: 60,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 32,
    "N": 16,
    "Est": "Same",
    "Good": "OK",
    period: 100,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 641,
    "N": 24,
    "Est": "Same",
    "Good": "OK",
    period: 5,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 748,
    "N": 32,
    "Est": "Same",
    "Good": "OK",
    period: 100,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 427,
    "N": 40,
    "Est": "Same",
    "Good": "OK",
    period: 100,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 689,
    "N": 48,
    "Est": "Same",
    "Good": "OK",
    period: 100,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 868,
    "N": 56,
    "Est": "Same",
    "Good": "OK",
    period: 105,
    phi1: 0,
    phi2: 0,
    phi3: 0
  },
  {
    "id": 773,
    "N": 16,
    "Est": "Genetic",
    "Good": "OK",
    period: 12,
    phi1: 27,
    phi2: 116,
    phi3: 95
  },
  {
    "id": 389,
    "N": 24,
    "Est": "Genetic",
    "Good": "OK",
    period: 12,
    phi1: 77,
    phi2: 42,
    phi3: 95
  },
  {
    "id": 456,
    "N": 32,
    "Est": "Genetic",
    "Good": "OK",
    period: 114,
    phi1: 12,
    phi2: 10,
    phi3: 14
  },
  {
    "id": 82,
    "N": 40,
    "Est": "Genetic",
    "Good": "OK",
    period: 14,
    phi1: 118,
    phi2: 96,
    phi3: 21
  },
  {
    "id": 396,
    "N": 48,
    "Est": "Genetic",
    "Good": "OK",
    period: 56,
    phi1: 102,
    phi2: 112,
    phi3: 102
  },
  {
    "id": 836,
    "N": 56,
    "Est": "Genetic",
    "Good": "OK",
    period: 118,
    phi1: 10,
    phi2: 13,
    phi3: 19
  },
  {
    "id": 484,
    "N": 16,
    "Est": "Hill Climbing",
    "Good": "OK",
    period: 14,
    phi1: 92,
    phi2: 26,
    phi3: 101
  },
  {
    "id": 102,
    "N": 24,
    "Est": "Hill Climbing",
    "Good": "OK",
    period: 65,
    phi1: 120,
    phi2: 119,
    phi3: 13
  },
  {
    "id": 135,
    "N": 32,
    "Est": "Hill Climbing",
    "Good": "OK",
    period: 109,
    phi1: 11,
    phi2: 29,
    phi3: 32
  },
  {
    "id": 734,
    "N": 40,
    "Est": "Hill Climbing",
    "Good": "OK",
    period: 13,
    phi1: 37,
    phi2: 88,
    phi3: 21
  },
  {
    "id": 983,
    "N": 48,
    "Est": "Hill Climbing",
    "Good": "OK",
    period: 19,
    phi1: 59,
    phi2: 69,
    phi3: 45
  },
  {
    "id": 87,
    "N": 56,
    "Est": "Hill Climbing",
    "Good": "OK",
    period: 115,
    phi1: 29,
    phi2: 24,
    phi3: 39
  }
];

const groupByN = data.reduce((memo, val) => {
	if (!memo[val.N]) memo[val.N] = {};
	if (!memo[val.N][val.Est]) memo[val.N][val.Est] = {};
	memo[val.N][val.Est] = val;
	return memo;
}, {});

const mapEntityToConfig = entity => ({
	justSim: true,
	showBar: false,
	n: N,
	...entity,
});

const streets = Object.keys(groupByN[N]).reduce((memo, key) => {
	console.log(`generate for ${key}`);
	memo[key] = [1, 2, 3, 4, 5].map(i => {
		console.log(`generate streets for ${N}/${key}. Run ${i}`);
		const s = Simulation.generate({ N });
		const dump = Simulation.dumpableStreets(s);
		let k = 100000;
		do {
			const speed = Simulation.run(mapEntityToConfig({
				...groupByN[N][key],
				streets: Simulation.fromDumpedStreets(dump)
			}));
			if (speed > 0) {
				return dump;
			}
		} while (k--);
	});
	return memo;
}, {});

const bad = [];
let best = { speed: 0 };
const results = [];

Object.keys(streets).forEach(k => {
	const testStreets = streets[k];
	testStreets.forEach((ts, i) => {
		const speed = Simulation.run(mapEntityToConfig({
			streets: Simulation.fromDumpedStreets(ts),
			...groupByN[N][k]
		}));
		if (speed < 0) {
			bad.push({ k, N, run: i, ...groupByN[N][k] });
			return;
		}
		if (speed > best.speed) {
			best = { k, N, speed, run: i, ...groupByN[N][k] };
		}
		results.push({
			...groupByN[N][k],
			speed,
			run: i,
			k,
			N
		});
	});
});

fs.writeFileSync(`./results/combined-best-${N}.json`, JSON.stringify(best, null, 2));
fs.writeFileSync(`./results/combined-bad-${N}.json`, JSON.stringify(bad, null, 2));
fs.writeFileSync(`./results/combined-${N}.json`, JSON.stringify(results, null, 2));

