const Genetic = require('genetic-js')
		, Simulation = require('./index');

const args = process.argv.slice(2);
const N = parseInt(args[0], 10);

const streets = Simulation.generate({ N });
const dumpedStreets = Simulation.dumpableStreets(streets);
const genetic = Genetic.create();

genetic.optimize = function (f1, f2) {
	if (f1 && f2) return f1 >= f2;
	if (f1) return true;
	return false;
};

Genetic.Optimize.Maximize;
genetic.select1 = Genetic.Select1.Tournament2;
genetic.select2 = Genetic.Select2.FittestRandom;

const MAX = 120; //332;
const MIN = 10;

const intBetween = (min, max) => Math.round(Math.random() * (max - min) + min);

genetic.seed = function() {

	// create random strings that are equal in length to solution
	// return randomString(this.userData["solution"].length);
	return {
		period: intBetween(MIN, MAX),
		phi1: intBetween(MIN, MAX),
		phi2: intBetween(MIN, MAX),
		phi3: intBetween(MIN, MAX),
	}
};

genetic.mutate = function(entity) {
	
	// toin coss what to change
	const prop = ['period', 'phi1', 'phi2', 'phi3'].find(() => Math.random() > 0.5) || 'period';
	const value = Math.min(MAX, Math.max(MIN, entity[prop] + (Math.random() > 0.5 ? 1 : -1)));

	// console.log('mutating', entity, prop, value);

	// chromosomal drift
	return Object.assign({}, entity, { [prop]: value });
};

const pickBy = (obj, keys) => Object.keys(obj).filter(k => ~keys.indexOf(k)).reduce((memo, val) => {
	memo[val] = obj[val];
	return memo;
}, {});

genetic.crossover = function(mother, father) {

	// two-point crossover
	const fatherProps = ['period', 'phi1', 'phi2', 'phi3'].filter(() => Math.random() > 0.5);
	const motherProps = ['period', 'phi1', 'phi2', 'phi3'].filter(p => !~fatherProps.indexOf(p));

	// console.log('crossing', mother, father, fatherProps, motherProps, pickBy(mother, motherProps), pickBy(father, fatherProps));

	const son = Object.assign({}, father, pickBy(mother, motherProps));
	const daughter = Object.assign({}, mother, pickBy(father, fatherProps));
	
	return [son, daughter];
};

const mapEntityToConfig = entity => ({
	justSim: true,
	showBar: false,
	streets: Simulation.fromDumpedStreets(dumpedStreets),
	n: N,
	...entity,
});

const cache = {};

genetic.fitness = function(entity) {

	/// run program here synchronously
	const serialized = JSON.stringify(entity);
	if (cache[serialized]) {
		console.log('cache hit', serialized, cache[serialized]);
		return cache[serialized];
	}
	const fitness = Simulation.run(mapEntityToConfig(entity));
	if (fitness < 0) return;
	cache[serialized] = fitness;
	return fitness;
};


// genetic.generation = function(pop, generation, stats) {
// 	// stop running once we've reached the solution
// 	console.log(g)
// 	return true;
// 	// return pop[0].entity != this.userData["solution"];
// };

genetic.notification = function (pop, gen, stats, isFinished) {
	if (isFinished) {
		const extractCache = Object.keys(cache).map(k => {
			return {
				N,
				speed: cache[k]
			};
		});
		
		require('fs').writeFileSync(`./results/ga-${N}.json`, JSON.stringify(extractCache, null, 2));
		require('fs').writeFileSync(`./results/ga-best-${N}.json`, JSON.stringify({
			N,
			best: pop[0],
			stats
		}, null, 2));
		// console.log(N);
		// console.log(gen);
		// console.log(pop);
		// console.log(stats);
	}
};


const config = {
	iterations: 100,
	size: 100,
	crossover: 0.1,
	mutation: 0.9,
	// skip: 20
};

Object.keys(config).forEach(k => {
	genetic.configuration[k] = config[k];
});

const userData = {};

genetic.start();

console.log(genetic.entities);

// genetic.evolve(config, userData);

// { period: 13, phi1: 33, phi2: 77, phi3: 29 }