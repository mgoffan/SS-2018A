const Genetic = require('genetic-js')
		, Simulation = require('./index')
		, N = 16;

const streets = Simulation.generate({ N });
const dumpedStreets = Simulation.dumpableStreets(streets);
const genetic = Genetic.create();

genetic.optimize = Genetic.Optimize.Maximize;
genetic.select1 = Genetic.Select1.Tournament2;
genetic.select2 = Genetic.Select2.FittestRandom;

const MAX = 10; //332;
const MIN = 1;

genetic.seed = function() {

	// create random strings that are equal in length to solution
	// return randomString(this.userData["solution"].length);
	return {
		period: Math.round(Math.random() * MAX + 1),
		phi1: Math.round(Math.random() * MAX),
		phi2: Math.round(Math.random() * MAX),
		phi3: Math.round(Math.random() * MAX),
	}
};

genetic.mutate = function(entity) {
	
	// toin coss what to change
	const prop = ['period', 'phi1', 'phi2', 'phi3'].find(() => Math.random() > 0.5) || 'period';
	const value = Math.min(MAX, Math.max(MIN, entity[prop] + (Math.random() > 0.5 ? 1 : -1)));


	console.log('mutating', entity, prop, value);

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

	console.log('crossing', mother, father, fatherProps, motherProps, pickBy(mother, motherProps), pickBy(father, fatherProps));

	const son = Object.assign({}, father, pickBy(mother, motherProps));
	const daughter = Object.assign({}, mother, pickBy(father, fatherProps));
	
	return [son, daughter];
};

const mapEntityToConfig = entity => ({
	justSim: true,
	streets: Simulation.fromDumpedStreets(dumpedStreets),
	n: N,
	...entity,
});

genetic.fitness = function(entity) {

	/// run program here synchronously
	return Simulation.run(mapEntityToConfig(entity));
};


// genetic.generation = function(pop, generation, stats) {
// 	// stop running once we've reached the solution
// 	console.log(g)
// 	return true;
// 	// return pop[0].entity != this.userData["solution"];
// };

genetic.notification = function (pop, gen, stats, isFinished) {
	if (isFinished) {
		console.log(gen);
		console.log(pop);
		console.log(stats);
	}
};


const config = {
	iterations: 10,
	size: 25,
	crossover: 0.3,
	mutation: 0.3,
	// skip: 20
};

Object.keys(config).forEach(k => {
	genetic.configuration[k] = config[k];
});

const userData = {};

genetic.start();

console.log(genetic.entities);

// genetic.evolve(config, userData);