const Genetic = require('genetic-js');

const genetic = Genetic.create();

genetic.optimize = Genetic.Optimize.Minimize;
genetic.select1 = Genetic.Select1.Tournament2;
genetic.select2 = Genetic.Select2.FittestRandom;

genetic.seed = function() {

	// create random strings that are equal in length to solution
	// return randomString(this.userData["solution"].length);
	return {
		period: Math.round(Math.random() * 332 + 1),
		phi0: Math.round(Math.random() * 332),
		phi1: Math.round(Math.random() * 332),
		phi2: Math.round(Math.random() * 332),
	}
};

genetic.mutate = function(entity) {
	
	// toin coss what to change
	const prop = ['period', 'phi0', 'phi1', 'phi2'].find(() => Math.random() > 0.5);
	
	// chromosomal drift
	return Object.assign({}, entity, {
		[prop]: Math.max(332, Math.min(1, entity + (Math.random() > 0.5 ? 1 : -1)))
	});
};

const pickBy = (obj, keys) => Object.keys(obj).filter(k => ~keys.indexOf(k)).reduce((memo, val) => {
	memo[val] = obj[val];
	return memo;
});

genetic.crossover = function(mother, father) {

	// two-point crossover
	const fatherProps = ['period', 'phi0', 'phi1', 'phi2'].filter(() => Math.random() > 0.5);
	const motherProps = ['period', 'phi0', 'phi1', 'phi2'].filter(p => !~fatherProps.indexOf(p));

	const son = Object.assign({}, father, pickBy(mother, motherProps));
	const daughter = Object.assign({}, mother, pickBy(father, fatherProps));
	
	return [son, daughter];
};

genetic.fitness = function(entity) {
	
	/// run program here synchronously

	

	return;
};


// genetic.generation = function(pop, generation, stats) {
// 	// stop running once we've reached the solution
// 	return pop[0].entity != this.userData["solution"];
// };


const config = {
	// iterations: 4000,
	// size: 250,
	// crossover: 0.3,
	// mutation: 0.3,
	// skip: 20
};

const userData = {
	"solution": $("#quote").val()
};

genetic.evolve(config, userData);