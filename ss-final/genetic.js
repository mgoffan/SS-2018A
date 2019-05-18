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
	const prop = ['period', 'phi0', 'phi1', 'phi2'].find(p => Math.random() > 0.5);
	
	// chromosomal drift
	return Object.assign({}, entity, {
		[prop]: Math.max(332, Math.min(1, entity + (Math.random() > 0.5 ? 1 : -1)))
	});
};

genetic.crossover = function(mother, father) {

	// two-point crossover
	var len = mother.length;
	var ca = Math.floor(Math.random()*len);
	var cb = Math.floor(Math.random()*len);		
	if (ca > cb) {
		var tmp = cb;
		cb = ca;
		ca = tmp;
	}
		
	var son = father.substr(0,ca) + mother.substr(ca, cb-ca) + father.substr(cb);
	var daughter = mother.substr(0,ca) + father.substr(ca, cb-ca) + mother.substr(cb);
	
	return [son, daughter];
};

genetic.fitness = function(entity) {
	var fitness = 0;
	
	var i;
	for (i=0;i<entity.length;++i) {
		// increase fitness for each character that matches
		if (entity[i] == this.userData["solution"][i])
			fitness += 1;
		
		// award fractions of a point as we get warmer
		fitness += (127-Math.abs(entity.charCodeAt(i) - this.userData["solution"].charCodeAt(i)))/50;
	}

	return fitness;
};

genetic.generation = function(pop, generation, stats) {
	// stop running once we've reached the solution
	return pop[0].entity != this.userData["solution"];
};

genetic.notification = function(pop, generation, stats, isFinished) {
	
	var value = pop[0].entity;
	this.last = this.last||value;
	
	if (pop != 0 && value == this.last)
		return;
	
	this.last = value;
};


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