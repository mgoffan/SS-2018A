const Simulation = require('./index')

const args = process.argv.slice(2);

const intBetween = (min, max) => Math.round(Math.random() * (max - min) + min);

const MAX = 120;
const MIN = 10;

const N = parseInt(args[0], 10);


let best;
let current = {
	period: intBetween(MIN, MAX),
	phi1: intBetween(MIN, MAX),
	phi2: intBetween(MIN, MAX),
	phi3: intBetween(MIN, MAX),
};
let bestConfig = current;

const streets = Simulation.generate({ N });
const dumpedStreets = Simulation.dumpableStreets(streets);

const mapEntityToConfig = entity => ({
	justSim: true,
	showBar: false,
	streets: Simulation.fromDumpedStreets(dumpedStreets),
	n: N,
	...entity,
});

best = Simulation.run(mapEntityToConfig(current));

const flatten = arr => arr.reduce((memo, val) => memo.concat(val), []);

const uniqBy = (arr, predicate) => {
	const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];
	
	return [...arr.reduce((map, item) => {
		const key = (item === null || item === undefined) ? item : cb(item);
		
		map.has(key) || map.set(key, item);
		
		return map;
	}, new Map()).values()];
};

const neighbours = config => {
	const mapper = k => {
		const diff1 = Math.min(MAX, Math.max(MIN, config[k] + 1));
		const diff2 = Math.min(MAX, Math.max(MIN, config[k] - 1));
		const next = [];
		if (config[k] !== diff1) {
			next.push(Object.assign({}, config, { [k]: diff1 }));
		}
		if (config[k] !== diff2) {
			next.push(Object.assign({}, config, { [k]: diff2 }));
		}
		return next;
	};
	const possibilities = ['period', 'phi1', 'phi2', 'phi3', 'phi4'].map(mapper)
	return flatten(possibilities);
};

const cache = {};

const start = Date.now();
const totalTime = 20 * 60 * 1000;
console.log(`Running for ${N}. Started at: ${start}`);
while (Date.now() - start <= totalTime) {
	const next = neighbours(current);
	if (!next.length) {
		current = {
			period: intBetween(MIN, MAX),
			phi1: intBetween(MIN, MAX),
			phi2: intBetween(MIN, MAX),
			phi3: intBetween(MIN, MAX),
		};
		continue;
	}
	let found = false;
	for (let i = 0; i < next.length; i++) {
		const hash = JSON.stringify(next[i]);
		if (cache[hash]) continue;
		const speed = Simulation.run(mapEntityToConfig(next[i]));
		if (speed < 0) continue;
		cache[hash] = speed;
		if (speed > best) {
			best = speed;
			current = next[i];
			bestConfig = next[i];
			found = true;
		}
	}
	if (!found) {
		current = {
			period: intBetween(MIN, MAX),
			phi1: intBetween(MIN, MAX),
			phi2: intBetween(MIN, MAX),
			phi3: intBetween(MIN, MAX),
		};
	}
	console.log(`Left: ${(start + totalTime - Date.now())/1000}s`);
}

const extractCache = Object.keys(cache).map(k => {
	return {
		N,
		speed: cache[k]
	};
});

require('fs').writeFileSync(`./results/hc-${N}.json`, JSON.stringify(extractCache, null, 2));

require('fs').writeFileSync(`./results/hc-best-${N}.json`, JSON.stringify({
	N,
	runtime: totalTime,
	speed: best,
	bestConfig
}, null, 2))