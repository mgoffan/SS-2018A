const fs = require('fs')
		, CLIProgress = require('cli-progress');

const STREET_LENGTH = 100
		, STREETS = 3
		, CAR_LENGTH = 5.26
		, CAR_WIDTH = 1.76
		, N = 8
		, DESIRED_VELOCITY = 8.333
		, REACTION_TIME = 1.6
		, MAXIMUM_ACCELERATION = 0.73
		, DESIRED_DECELERATION = 1.67
		, ACCELERATION_EXPONENT = 4
		, JAM_DISTANCE_0 = 2
		, JAM_DISTANCE_1 = 0
		, TIME_STEP = 0.01
		, FPS = 60
		, DURATION = 60
		, RUN_ID = Date.now() % 1000
		, OUTPUT_FILE = `./out/output-${RUN_ID}.xyz`
		, DEBUG = 0;

const outputStream = fs.createWriteStream(OUTPUT_FILE);
const bar = new CLIProgress.Bar({}, CLIProgress.Presets.shades_classic);

const generateCarGroup = () => Array.from({ length: N }).map((_, i) => ({
	id: i,
	length: CAR_LENGTH,
	width: CAR_WIDTH,
	x: Math.random() * STREET_LENGTH * STREETS,
	y: 0,
	desiredVelocity: DESIRED_VELOCITY * (1 + Math.random()),
	reactionTime: REACTION_TIME,
	maximumAcceleration: MAXIMUM_ACCELERATION,
	desiredDeceleration: DESIRED_DECELERATION,
	jamDistance0: JAM_DISTANCE_0,
	jamDistance1: JAM_DISTANCE_1,
	vx: 0,
	vy: 0,
	pax: 0,
	pay: 0
}));

const every = (coll, fn) => coll.reduce((memo, val, i) => memo && fn(val, i), true);
const isCarGroupOK = cars => every(cars, (car, i) => every(cars.slice(0, i), c => car.x - c.x - c.length - JAM_DISTANCE_0 > 0));

const cars = (() => {
	let n = 10000;
	do {
		const carGroup = generateCarGroup();
		carGroup.sort((a, b) => a.x - b.x);
		if (isCarGroupOK(carGroup))
			return carGroup;
	} while (n-- > 0);
	return null;
})();
if (!cars) {
	throw new Error('Could not generate car group');
}

cars.forEach((c, i) => {
	c.next = cars[(i + 1) % cars.length];
});

const totalTimeSteps = Math.ceil(DURATION / 0.01)
		, captureEvery = Math.ceil(DURATION / FPS / 0.01)

console.log(`
ID = ${RUN_ID}
Running simulation for ${N} cars.
Total time steps = ${totalTimeSteps}
FPS = ${FPS}
Capture every = ${captureEvery}
`);

const debug = [];

const s = car => {
	DEBUG && debug.push(`s(car = ${car.id}) = ${car.next.x} - ${car.x} - ${car.length}`);
	return car.next.x - car.x - car.length;
}
const sstar = car => {
	DEBUG && debug.push(`sstar(car = ${car.id}) = ${car.jamDistance0} + ${car.jamDistance1} * Math.sqrt(Math.abs(${car.vx} / ${car.desiredVelocity})) + ${car.reactionTime} * ${car.vx} + ${car.vx} * (${car.vx} - ${car.next.vx}) / 2 * Math.sqrt(${car.maximumAcceleration} * ${car.desiredDeceleration})`);
	return car.jamDistance0 + car.jamDistance1 * Math.sqrt(Math.abs(car.vx / car.desiredVelocity)) + car.reactionTime * car.vx + car.vx * (car.vx - car.next.vx) / 2 * Math.sqrt(car.maximumAcceleration * car.desiredDeceleration);
}
const acceleration = car => {
	const _sstar = sstar(car);
	const _s = s(car);
	DEBUG && debug.push(`ax(card = ${car.id}) = ${car.maximumAcceleration} * (1 - (${car.vx} / ${car.desiredVelocity}) ** ${ACCELERATION_EXPONENT} - (${_sstar} / ${_s}) ** 2)`);
	return car.maximumAcceleration * (1 - (car.vx / car.desiredVelocity) ** ACCELERATION_EXPONENT - (_sstar / _s) ** 2);
};


const ovitoXYZExporter = (cars, t) => {
	outputStream.write(`${N}\n`);
	outputStream.write(`t = ${t.toFixed(6)}\n`);
	// outputStream.write(`${-1}\t${(0).toFixed(6)}\t${(0).toFixed(6)}\t${(0).toFixed(6)}\t${(0).toFixed(6)}\t${(0.1).toFixed(6)}\t${(0.1).toFixed(6)}\n`);
	// outputStream.write(`${-2}\t${(STREETS * STREET_LENGTH).toFixed(6)}\t${(0).toFixed(6)}\t${(0).toFixed(6)}\t${(0).toFixed(6)}\t${(0.1).toFixed(6)}\t${(0.1).toFixed(6)}\n`);
	cars.forEach(c => {
		outputStream.write(`${c.id}\t${c.x.toFixed(6)}\t${c.y.toFixed(6)}\t${c.vx.toFixed(6)}\t${c.vy.toFixed(6)}\t${c.length.toFixed(6)}\t${c.length.toFixed(6)}\t${c.width.toFixed(6)}\n`);
	});
};

ovitoXYZExporter(cars, 0);

// start the progress bar with a total value of 200 and start value of 0
bar.start(DURATION, 0);

for (let time = 0; time < DURATION; time += TIME_STEP) {
	const nextCars = cars.map(c => {
		DEBUG && debug.push('');
		DEBUG && debug.push(`car ${c.id} => ${c.next.id}`);
		const ax = acceleration(c);
		const nx = (c.x + c.vx * TIME_STEP + (2 / 3 * ax - 1 / 6 * c.pax) * TIME_STEP * TIME_STEP) % (STREETS * STREET_LENGTH);
		const predictedParticle = {
			...c,
			x: nx,
			y: 0,
			vx: c.vx + 3 / 2 * ax * TIME_STEP - 1 / 2 * c.pax * TIME_STEP,
			vy: 0 
		};
		DEBUG && debug.push('predict');

		const nax = acceleration(predictedParticle);
		const nvx = c.vx  + 1 / 3 * nax * TIME_STEP + 5 / 6 * ax * TIME_STEP - 1 / 6 * c.pax * TIME_STEP;

		const values = [ax, nax, nvx, nx]
		if (values.map(isNaN).find(Boolean)) {
			console.log(values);
			fs.writeFileSync(`./out/error-${RUN_ID}.log`, debug.join('\n'));
			fs.writeFileSync(`./out/cars-${RUN_ID}.json`, JSON.stringify(cars.map(c => ({ ...c, next: c.next.id })), null, 2));
			outputStream.end();
			fs.unlinkSync(OUTPUT_FILE);
			process.exit(1);
		}

		return {
			...c,
			x: nx,
			y: 0,
			vx: nvx,
			vy: 0,
			ax: nax,
			ay: 0,
			pax: ax,
			pay: 0
		};
	});
	cars.forEach((c, i) => {
		cars[i] = nextCars[i];
		cars[i].next = nextCars[(i + 1) % nextCars.length];
	});
	if (time % (1 / FPS) < TIME_STEP) {
		ovitoXYZExporter(cars, time + TIME_STEP);
	}
	bar.update(time);
}

outputStream.end();
bar.stop();