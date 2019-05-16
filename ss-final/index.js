const fs = require('fs')
		, assert = require('assert')
		, chalk = require('chalk')
		, CLIProgress = require('cli-progress');

const STREET_LENGTH = 100
		, STREETS = 3
		, CAR_LENGTH = 5.26
		, CAR_WIDTH = 1.76
		, N = 14
		, DESIRED_VELOCITY = 12//8.333
		, REACTION_TIME = 1.6
		, MAXIMUM_ACCELERATION = 1.4//0.73
		, DESIRED_DECELERATION = 1.67
		, ACCELERATION_EXPONENT = 4
		, JAM_DISTANCE_0 = 2
		, JAM_DISTANCE_1 = 0.3
		, TIME_STEP = 0.01
		, FPS = 60
		, MINUTES_TO_SECONDS = 60
		, DURATION = 5 * MINUTES_TO_SECONDS
		, RUN_ID = Date.now() % 1000
		, OUTPUT_FILE = `./out/output-${RUN_ID}.xyz`
		, P = 30;

const stoplights = [{
	phi: 0,
	id: 's0',
	x: STREETS * STREET_LENGTH / 3,
	y: STREETS * STREET_LENGTH / 3 * 2
}, {
	phi: 15,
	id: 's1',
	x: STREETS * STREET_LENGTH / 3 * 2,
	y: STREETS * STREET_LENGTH / 3 * 2
}, {
	phi: 10,
	id: 's2',
	x: STREETS * STREET_LENGTH / 3,
	y: STREETS * STREET_LENGTH / 3
}];
const stoplightRepo = stoplights.reduce((memo, val) => {
	memo[val.id] = val;
	return memo;
}, {});

const streetsRepo = {
	"1": {
		id: 1,
		direction: 'y',
		stoplights: ['s0', 's2'],
		x: STREETS * STREET_LENGTH / 3,
	},
	"2": {
		id: 2,
		direction: 'x',
		stoplights: ['s0', 's1'],
		y: STREETS * STREET_LENGTH / 3 * 2
	}
};

const streets = Object.values(streetsRepo);

const outputStream = fs.createWriteStream(OUTPUT_FILE);
const bar = new CLIProgress.Bar({}, CLIProgress.Presets.shades_classic);

const generateCarGroup = (s, length) => Array.from({ length }).map((_, i) => ({
	id: s.id * 100 + i,
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

streets.forEach(s => {
	s.cars = (() => {
		let n = 10000;
		do {
			const carGroup = generateCarGroup(s, Math.ceil(N / streets.length));
			carGroup.sort((a, b) => a.x - b.x);
			if (isCarGroupOK(carGroup))
				return carGroup;
		} while (n-- > 0);
		return null;
	})();
	if (!s.cars) {
		throw new Error('Could not generate car group');
	}
	s.cars.forEach((c, i) => {
		c.next = s.cars[(i + 1) % s.cars.length];
	});
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

const ovitoXYZExporter = (streets, t) => {
	const totalParticles = streets.reduce((acc, v) => acc + v.cars.length, 0) + streets.length * 2;
	outputStream.write(`${totalParticles}\n`);
	const stoplightState = streets.map(st => {
		const str = st.stoplights.map(id => stoplightRepo[id]).map(s => {
			const onx = Math.floor((t + s.phi) / P) % 2 === 0;
			if (st.direction === 'x') return `${s.id.toUpperCase()}x is ${onx ? 'ON' : 'OFF'}`;
			return `${s.id.toUpperCase()}y is ${onx ? 'OFF' : 'ON'}`
		});
		return `Street ${st.id}: [${str}]`;
	}).join(', ')
	outputStream.write(`t = ${t.toFixed(6)}, ${stoplightState}\n`);
	/// street endpoints
	streets.forEach((s, i) => {
		if (s.direction === 'x') {
			outputStream.write([5000 + i * 2 + 1, (0).toFixed(6)                      , s.y.toFixed(6)                      , s.y.toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (0.5).toFixed(6)].join('\t') + '\n');
			outputStream.write([5000 + i * 2 + 2, (STREETS * STREET_LENGTH).toFixed(6), s.y.toFixed(6)                      , (0).toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (0.5).toFixed(6)].join('\t') + '\n');	
		} else {
			outputStream.write([5000 + i * 2 + 1, s.x.toFixed(6)                      , (0).toFixed(6)                      , (0).toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (0.5).toFixed(6)].join('\t') + '\n');
			outputStream.write([5000 + i * 2 + 2, s.x.toFixed(6)                      , (STREETS * STREET_LENGTH).toFixed(6), (0).toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (0.5).toFixed(6)].join('\t') + '\n');	
		}
		s.cars.forEach(c => {
			if (s.direction === 'x') {
				outputStream.write([c.id, c.x.toFixed(6), s.y.toFixed(6), c.vx.toFixed(6), c.vy.toFixed(6), (c.length / 2).toFixed(6), (c.length / 2).toFixed(6), (c.width / 2).toFixed(6)].join('\t') + '\n');
			} else {
				outputStream.write([c.id, s.x.toFixed(6), c.x.toFixed(6), c.vx.toFixed(6), c.vy.toFixed(6), (c.width / 2).toFixed(6) , (c.width / 2).toFixed(6) , (c.length / 2).toFixed(6)].join('\t') + '\n');
			}
		});
	});
	
};

ovitoXYZExporter(streets, 0);

const debug = [];

const sForStreet = street => car => {
	if (typeof(car.next) === 'string') {
		const stoplight = stoplightRepo[car.next];
		const x = street.direction === 'x' ? stoplight.x : stoplight.y;
		if (x < car.x + car.length) {
			const prevNext = street.cars.find(c => c.id === car.prevNext);
			if (!prevNext) {
				console.log(stoplight);
				console.log(car);
			}
			// debug.push(`s1(car = ${car.id}) = ${prevNext.x} - ${car.x} - ${car.length}`);
			return prevNext.x - car.x - car.length;
		}
		// assert(STREETS * STREET_LENGTH / 2 > car.x + car.length, `car[id = ${car.id}].x = ${car.x}, ${STREETS * STREET_LENGTH / 2}`);
		// debug.push(`s2(car = ${car.id}) = ${stoplight.x} - ${car.x} - ${car.length}`);
		return x - car.x - car.length;
	}
	if (car.next.x > car.x) {
		// assert(car.next.x - car.x - car.length > 0);
		// debug.push(`s2(car = ${car.id}) = ${car.next.x} - ${car.x} - ${car.length}`);
		return car.next.x - car.x - car.length;
	}
	// assert(STREETS * STREET_LENGTH + car.next.x - car.x - car.length > 0, `next[id = ${car.next.id}].x = ${car.next.x}, car[id = ${car.id}].x = ${car.x}`);
	// debug.push(`s3(car = ${car.id}) = ${car.next.x} - ${car.x} - ${car.length}`);
	return STREETS * STREET_LENGTH + car.next.x - car.x - car.length;
};
const sstar = car => {
	if (typeof(car.next) === 'string') {
		// debug.push(`sstar1(car = ${car.id}) = ${car.jamDistance0} + ${car.jamDistance1} * Math.sqrt(Math.abs(${car.vx} / ${car.desiredVelocity})) + ${car.reactionTime} * ${car.vx} + ${car.vx} * (${car.vx} - 0) / 2 * Math.sqrt(${car.maximumAcceleration} * ${car.desiredDeceleration})`);
		return car.jamDistance0 + car.jamDistance1 * Math.sqrt(Math.abs(car.vx / car.desiredVelocity)) + car.reactionTime * car.vx + car.vx * (car.vx - 0) / 2 * Math.sqrt(car.maximumAcceleration * car.desiredDeceleration);
	}
	// debug.push(`sstar2(car = ${car.id}) = ${car.jamDistance0} + ${car.jamDistance1} * Math.sqrt(${car.vx} / ${car.desiredVelocity}) + ${car.reactionTime} * ${car.vx} + ${car.vx} * (${car.vx} - ${car.next.vx}) / 2 * Math.sqrt(${car.maximumAcceleration} * ${car.desiredDeceleration})`);
	return car.jamDistance0 + car.jamDistance1 * Math.sqrt(Math.abs(car.vx / car.desiredVelocity)) + car.reactionTime * car.vx + car.vx * (car.vx - car.next.vx) / 2 * Math.sqrt(car.maximumAcceleration * car.desiredDeceleration);
};
const accelerationForStreet = street => {
	const s = sForStreet(street);
	return car => {
		const _sstar = sstar(car);
		const _s = s(car);
		// debug.push(`ax(card = ${car.id}) = ${car.maximumAcceleration} * (1 - (${car.vx} / ${car.desiredVelocity}) ** ${ACCELERATION_EXPONENT} - (${_sstar} / ${_s}) ** 2)`);
		return car.maximumAcceleration * (1 - (car.vx / car.desiredVelocity) ** ACCELERATION_EXPONENT - (_sstar / _s) ** 2);
	};
};

const isStoplightOn = s => sl => {
	if (s.direction === 'x') return sl.phi % P !== 0;
	return sl.phi % P === 0;
};
streets.forEach(s => {
	const setCarTargetToStoplight = sl => {
		/// stoplight is on before starting
		const x = s.direction === 'x' ? sl.x : sl.y;
		const idx = s.cars.findIndex(c => c.x > x);
		const desiredIndex = (() => {
			if (~idx) return idx - 1 < 0 ? s.cars.length - 1 : idx - 1;
			return s.cars.length - 1;
		})();
		s.cars[desiredIndex].prevNext = s.cars[desiredIndex].next.id;
		s.cars[desiredIndex].next = sl.id;
		console.log(chalk.green(`STOPLIGHT ${sl.id} is ON in direction ${s.direction} before start at t=${-sl.phi % P} on car[id = ${s.cars[desiredIndex].id}] at index ${desiredIndex}, chased = ${s.cars[desiredIndex].prevNext}`));
	};
	s.stoplights.map(id => stoplightRepo[id]).filter(isStoplightOn(s)).forEach(setCarTargetToStoplight);
});

streets.forEach(s => {
	console.log(`Street ${s.id} direction ${s.direction}`);
	s.cars.forEach(c => {
		console.log(`${c.id} => ${typeof(c.next) === 'string' ? c.next : c.next.id} [${c.prevNext}]`);
	});
});
console.log(chalk.underline('Begin'));

let maxSpeed = 0;
// bar.start(DURATION, 0);
for (let time = 0; time < DURATION; time += TIME_STEP) {
	streets.forEach(street => {
		street.stoplights.map(id => stoplightRepo[id]).forEach(sl => {
			const isOn = (() => {
				if (street.direction === 'x') return Math.floor((time + sl.phi) / P) % 2 === 0 && Math.floor((time - TIME_STEP + sl.phi) / P) % 2 !== 0;
				return Math.floor((time + sl.phi) / P) % 2 !== 0 && Math.floor((time - TIME_STEP + sl.phi) / P) % 2 === 0;
			})();
			const isOff = (() => {
				if (street.direction === 'x') return Math.floor((time + sl.phi) / P) % 2 !== 0 && Math.floor((time - TIME_STEP + sl.phi) / P) % 2 === 0;
				return Math.floor((time + sl.phi) / P) % 2 === 0 && Math.floor((time - TIME_STEP + sl.phi) / P) % 2 !== 0;
			})();
			if (isOn) {
				/// stoplight turned on
				console.log(chalk.green(`STOPLIGHT ${sl.id} in direction ${street.direction} is ON at t=${time}`));
				const idx = street.cars.findIndex(c => {
					if (street.direction === 'x') return c.x > sl.x;
					return c.x > sl.y;
				});
				const desiredIndex = (() => {
					if (~idx) return idx - 1 < 0 ? street.cars.length - 1 : idx - 1;
					return street.cars.length - 1;
				})();
				if (typeof(street.cars[desiredIndex].next) === 'string') {
					street.cars[desiredIndex].shouldFollow = sl.id;
					// console.log(chalk.green(`\nSTOPLIGHT ${sl.id} ON at t=${time} but all cars are stuck in other stoplight`));
					return;
				}
				street.cars[desiredIndex].prevNext = street.cars[desiredIndex].next.id;
				street.cars[desiredIndex].next = sl.id;
				streets.forEach(s => {
					console.log(`Street ${s.id} direction ${s.direction}`);
					s.cars.forEach(c => {
						console.log(`${c.id} => ${typeof(c.next) === 'string' ? c.next : c.next.id} [${c.prevNext}]`);
					});
				});
				// console.log(chalk.green(`\nSTOPLIGHT ${sl.id} ON at t=${time} on car[id = ${street.cars[desiredIndex].id}] at index ${desiredIndex}, chases = ${sl.id}, chased = ${street.cars[desiredIndex].prevNext}, idx = ${desiredIndex}`));
			} else if (isOff) {
				/// stoplight turned off
				console.log(chalk.red(`STOPLIGHT ${sl.id} in direction ${street.direction} is OFF at t=${time}`));
				const carExpectingOtherStoplight = street.cars.find(c => c.shouldFollow);
				if (carExpectingOtherStoplight) {
					if (carExpectingOtherStoplight.shouldFollow === sl.id) {
						carExpectingOtherStoplight.next = street.cars.find(c => c.id === carExpectingOtherStoplight.prevNext);
						delete carExpectingOtherStoplight.shouldFollow;
						// console.log(chalk.red(`\nSTOPLIGHT ${sl.id} OFF at t=${time}, car ${carExpectingOtherStoplight.id} was to stop, but i'm off, so he'll chase ${carExpectingOtherStoplight.next.id}`));
						return;
					}
					carExpectingOtherStoplight.next = carExpectingOtherStoplight.shouldFollow;
					delete carExpectingOtherStoplight.shouldFollow;
				}
				
				const car = street.cars.find(c => c.next === sl.id);
				if (!car) {
					console.log(`\nt = ${time}, ${JSON.stringify(sl)}`);
					return;
				}
				// console.log(chalk.red(`\nSTOPLIGHT ${sl.id} OFF at t=${time} on car[id = ${car.id}], chases = ${car.prevNext}`));
				car.next = street.cars.find(c => c.id === car.prevNext);
				streets.forEach(s => {
					console.log(`Street ${s.id} direction ${s.direction}`);
					s.cars.forEach(c => {
						console.log(`${c.id} => ${typeof(c.next) === 'string' ? c.next : c.next.id} [${c.prevNext}]`);
					});
				});
			}
		});
	});

	streets.forEach(street => {
		const acceleration = accelerationForStreet(street);
		const nextCars = street.cars.map(c => {
			// debug.push('');
			// debug.push(`car ${c.id} => ${typeof(c.next) === 'string' ? c.next : c.next.id}`);
			const ax = acceleration(c);
			const nx = (c.x + c.vx * TIME_STEP + (2 / 3 * ax - 1 / 6 * c.pax) * TIME_STEP * TIME_STEP) % (STREETS * STREET_LENGTH);
			const predictedParticle = {
				...c,
				x: nx,
				y: 0,
				vx: c.vx + 3 / 2 * ax * TIME_STEP - 1 / 2 * c.pax * TIME_STEP,
				vy: 0
			};
			// debug.push('predict');
	
			const nax = acceleration(predictedParticle);
			const nvx = c.vx  + 1 / 3 * nax * TIME_STEP + 5 / 6 * ax * TIME_STEP - 1 / 6 * c.pax * TIME_STEP;
	
			const values = [ax, nax, nvx, nx]
			if (values.map(isNaN).find(Boolean)) {
				console.log(values);
				fs.writeFileSync(`./out/error-${RUN_ID}.log`, debug.join('\n'));
				const carOutput = street.cars.map(c => ({
					...c,
					next: typeof(c.next) === 'string' ? c.next : c.next.id
				}));
				fs.writeFileSync(`./out/cars-${RUN_ID}.json`, JSON.stringify(carOutput, null, 2));
				outputStream.end();
				// fs.unlinkSync(OUTPUT_FILE);
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
		street.cars.forEach((c, i) => {
			street.cars[i] = nextCars[i];
			if (typeof(street.cars[i].next) === 'string') return;
			street.cars[i].next = nextCars[(i + 1) % nextCars.length];
			if (street.cars[i].vx > maxSpeed) {
				maxSpeed = street.cars[i].vx;
			}
		});
	});
	if (time % (1 / FPS) < TIME_STEP) {
		ovitoXYZExporter(streets, time + TIME_STEP);
	}
	// bar.update(time);
}

console.log(`\nMax Speed = ${maxSpeed}`);

outputStream.end();
// bar.stop();