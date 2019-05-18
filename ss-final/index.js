const fs = require('fs')
		, assert = require('assert')
		, chalk = require('chalk')
		, CLIProgress = require('cli-progress');

process.on('uncaughtException', function (err) {
	console.log('uncaughtException');
	console.error(err);
	outputStream.end();
});

const minByIndex = (arr, iteratee) => {
  const func = typeof iteratee === 'function' ? iteratee : item => item[iteratee];
  const min = Math.min(...arr.map(func));
  return arr.findIndex(item => func(item) === min);
};

const STREET_LENGTH = 100
		, STREETS = 3
		, CAR_LENGTH = 5.26
		, CAR_WIDTH = 1.76
		, LANE_WIDTH = 3
		, N = 16
		, DESIRED_VELOCITY = 8.333
		, REACTION_TIME = 1.6
		, MAXIMUM_ACCELERATION = 0.73
		, DESIRED_DECELERATION = 1.67
		, ACCELERATION_EXPONENT = 4
		, JAM_DISTANCE_0 = 2
		, JAM_DISTANCE_1 = 0.3
		, TIME_STEP = 0.05
		, FPS = 60
		, MINUTES_TO_SECONDS = 60
		, DURATION = 5 * MINUTES_TO_SECONDS
		, RUN_ID = Date.now() % 1000
		, OUTPUT_FILE = `./out/output-${RUN_ID}.xyz`
		, P = 30 / Math.PI
		, INPUT_FILE = null;

const stoplights = [{
	phi: 0,
	id: 's0',
	x: STREETS * STREET_LENGTH / 3,
	y: STREETS * STREET_LENGTH / 3 * 2
}, {
	phi: 0,
	id: 's1',
	x: STREETS * STREET_LENGTH / 3 * 2,
	y: STREETS * STREET_LENGTH / 3 * 2
}, {
	phi: 0,
	id: 's2',
	x: STREETS * STREET_LENGTH / 3,
	y: STREETS * STREET_LENGTH / 3
}, {
	phi: 0,
	id: 's3',
	x: STREETS * STREET_LENGTH / 3 * 2,
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
		stoplights: ['s1', 's0'],
		y: STREETS * STREET_LENGTH / 3 * 2
	},
	"3": {
		id: 3,
		direction: 'y',
		stoplights: ['s1', 's3'],
		x: STREETS * STREET_LENGTH / 3 * 2
	},
	"4": {
		id: 4,
		direction: 'x',
		stoplights: ['s3', 's2'],
		y: STREETS * STREET_LENGTH / 3
	},
};

const streets = (() => {
	if (INPUT_FILE) {
		return require(INPUT_FILE);
	}
	return Object.values(streetsRepo).reverse();
})();

const outputStream = fs.createWriteStream(OUTPUT_FILE);
const bar = new CLIProgress.Bar({}, CLIProgress.Presets.shades_classic);

const generateCarGroup = (s, l, length) => Array.from({ length }).map((_, i) => ({
	id: `${s.id}${l}${i}`,
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

if (INPUT_FILE) {
	streets.forEach(s => {
		s.cars.forEach(car => {
			car.next = s.cars.find(c => car.next === c.id);
		});
	});
} else {
	streets.forEach(s => {
		s.lanes = [1, 2].map(id => {
			const cars = (() => {
				let n = 10000;
				do {
					const carGroup = generateCarGroup(s, id, Math.ceil(N / streets.length / 2));
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
			return { id, cars };
		});
	});
	
	const carDump = streets.map(s => ({
		...s,
		lanes: s.lanes.map(l => ({
			...l,
			cars: l.cars.map(c => ({
				...c,
				next: c.next.id
			}))
		}))
	}));
	fs.writeFileSync(`./cars/cars-${RUN_ID}.json`, JSON.stringify(carDump, null, 2));
}

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
	const totalParticles = streets.reduce((acc, s) => acc + s.lanes.reduce((acc, l) => acc + l.cars.length, 0), 0) + streets.length * 2 + stoplights.length;
	outputStream.write(`${totalParticles}\n`);
	outputStream.write(`t = ${t.toFixed(6)}\n`);
	streets.forEach((s, i) => {
		s.lanes.forEach(l => {
			const deltaX = l.id === 1 ? -LANE_WIDTH / 2 : LANE_WIDTH / 2;
			l.cars.forEach(c => {
				if (s.direction === 'x') {
					outputStream.write([c.id, c.x.toFixed(6)           , (s.y + deltaX).toFixed(6), c.vx.toFixed(6), c.vy.toFixed(6), (c.length / 2).toFixed(6), (c.length / 2).toFixed(6), (c.width / 2).toFixed(6)].join('\t') + '\n');
				} else {
					outputStream.write([c.id, (s.x + deltaX).toFixed(6), c.x.toFixed(6)           , c.vx.toFixed(6), c.vy.toFixed(6), (c.width / 2).toFixed(6) , (c.width / 2).toFixed(6) , (c.length / 2).toFixed(6)].join('\t') + '\n');
				}
			});
		});
		if (s.direction === 'x') {
			outputStream.write([5000 + i * 2 + 1, (0).toFixed(6)                      , s.y.toFixed(6)                      , (0).toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (0.5).toFixed(6)].join('\t') + '\n');
			outputStream.write([5000 + i * 2 + 2, (STREETS * STREET_LENGTH).toFixed(6), s.y.toFixed(6)                      , (0).toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (0.5).toFixed(6)].join('\t') + '\n');	
		} else {
			outputStream.write([5000 + i * 2 + 1, s.x.toFixed(6)                      , (0).toFixed(6)                      , (0).toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (0.5).toFixed(6)].join('\t') + '\n');
			outputStream.write([5000 + i * 2 + 2, s.x.toFixed(6)                      , (STREETS * STREET_LENGTH).toFixed(6), (0).toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (0.5).toFixed(6)].join('\t') + '\n');	
		}
	});
	stoplights.forEach((sl, i) => {
		if (Math.sin((t - sl.phi) / P) < 0) {
			outputStream.write([6000 + i * 2, sl.x.toFixed(6), sl.y.toFixed(6), (15).toFixed(6), (0).toFixed(6), (5).toFixed(6), (5).toFixed(6), (1).toFixed(6)].join('\t') + '\n');
		} else {
			outputStream.write([6000 + i * 2, sl.x.toFixed(6), sl.y.toFixed(6), (15).toFixed(6), (0).toFixed(6), (1).toFixed(6), (1).toFixed(6), (5).toFixed(6)].join('\t') + '\n');
		}
	});
};

ovitoXYZExporter(streets, 0);

const debug = [];

const sForStreet = (street, lane) => car => {
	if (typeof(car.next) === 'string') {
		const stoplight = stoplightRepo[car.next];
		const x = street.direction === 'x' ? stoplight.x : stoplight.y;
		if (x < car.x + car.length) {
			const prevNext = lane.cars.find(c => c.id === car.prevNext);
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
const accelerationForStreet = (street, lane) => {
	const s = sForStreet(street, lane);
	return car => {
		const _sstar = sstar(car);
		const _s = s(car);
		// debug.push(`ax(card = ${car.id}) = ${car.maximumAcceleration} * (1 - (${car.vx} / ${car.desiredVelocity}) ** ${ACCELERATION_EXPONENT} - (${_sstar} / ${_s}) ** 2)`);
		return car.maximumAcceleration * (1 - (car.vx / car.desiredVelocity) ** ACCELERATION_EXPONENT - (_sstar / _s) ** 2);
	};
};

const isStoplightOn = s => sl => {
	if (s.direction === 'x') return Math.sin(-sl.phi / P) >= 0;
	return Math.sin(-sl.phi / P) < 0;
};
streets.forEach(s => {
	const setCarTargetToStoplight = sl => {
		/// stoplight is on before starting
		const x = s.direction === 'x' ? sl.x : sl.y;
		s.lanes.forEach(l => {
			const desiredIndex = minByIndex(l.cars, c => {
				return c.x > x ? STREETS * STREET_LENGTH + x - c.x : x - c.x;
			});
			const car = l.cars[desiredIndex];
			const otherStoplight = stoplightRepo[s.stoplights[(s.stoplights.indexOf(sl.id) + 1) % s.stoplights.length]];
			const ox = s.direction === 'x' ? otherStoplight.x : otherStoplight.y;
			const odist = car.x > ox ? STREETS * STREET_LENGTH - car.x + ox : ox - car.x;
			const dist = car.x > x ? STREETS * STREET_LENGTH - car.x + x : x - car.x;
			// console.log(sl.id, car.id, dist, odist);
			if (odist < dist) {
				console.log(chalk.red(`${sl.id} in direction ${s.direction} before start at t=${-(2 * Math.PI * P - sl.phi) % (2 * Math.PI * P)}`));
				return;
			}
			car.prevNext = car.next.id;
			car.next = sl.id;
			console.log(chalk.red(`${sl.id} in direction ${s.direction} before start at t=${-(2 * Math.PI * P - sl.phi) % (2 * Math.PI * P)} on car[id = ${car.id}] at index ${desiredIndex}, chased = ${car.prevNext}`));
		});
	};
	s.stoplights.map(id => stoplightRepo[id]).filter(isStoplightOn(s)).forEach(setCarTargetToStoplight);
});

const showChaseStatus = () => false;
// streets.forEach(s => {
// 	console.log(`Street ${s.id} direction ${s.direction}`);
// 	s.cars.forEach(c => {
// 		console.log(`${c.id} => ${typeof(c.next) === 'string' ? c.next : c.next.id} [${c.prevNext}] [${c.shouldFollow}]`);
// 	});
// });
showChaseStatus();

// process.exit(0);

console.log(chalk.underline('Begin'));

let maxSpeed = 0;
// bar.start(DURATION, 0);
for (let time = 0; time < DURATION; time += TIME_STEP) {
	streets.forEach(street => {
		if (!time) return;
		street.stoplights.map(id => stoplightRepo[id]).forEach(sl => {
			const isOn = (() => {
				if (street.direction === 'x')
					return Math.sin((time - sl.phi) / P) >= 0 && Math.sin((time - TIME_STEP - sl.phi) / P) < 0;
				return Math.sin((time - sl.phi) / P) <= 0 && Math.sin((time - TIME_STEP - sl.phi) / P) > 0;
			})();
			const isOff = (() => {
				if (street.direction === 'x')
					return Math.sin((time - sl.phi) / P) <= 0 && Math.sin((time - TIME_STEP - sl.phi) / P) > 0;
				return Math.sin((time - sl.phi) / P) >= 0 && Math.sin((time - TIME_STEP - sl.phi) / P) < 0;
			})();
			if (isOn) {
				/// stoplight turned on, means wen RED in the direction of the street
				console.log(chalk.red(`${sl.id} in direction ${street.direction} is RED at t=${time}`));
				const x = street.direction === 'x' ? sl.x : sl.y;
				street.lanes.forEach(l => {
					const desiredIndex = minByIndex(l.cars, c => {
						return (c.x > x || Math.abs(x - c.x) < 5) ? STREETS * STREET_LENGTH + x - c.x : x - c.x;
					});
					const car = l.cars[desiredIndex];
					console.log(`first car before stoplight is ${l.cars[desiredIndex].id}`);
					if (typeof(car.next) === 'string') {
						/// all cars are waiting the other stoplight
						if (car.next !== sl.id) {
							const otherStoplight = stoplightRepo[street.stoplights[(street.stoplights.indexOf(sl.id) + 1) % street.stoplights.length]];
							const ox = street.direction === 'x' ? otherStoplight.x : otherStoplight.y;
							const dx = (car.x > x || Math.abs(x - car.x) < 5) ? STREETS * STREET_LENGTH + x - car.x : x - car.x;
							const odx = (car.x > ox || Math.abs(ox - car.x) < 5) ? STREETS * STREET_LENGTH + ox - car.x : ox - car.x;
							if (dx > odx) {
								car.shouldFollow = sl.id;
							} else {
								car.shouldFollow = otherStoplight.id;
								car.next = sl.id
							}
						}
						// console.log(chalk.green(`\n${sl.id} ON at t=${time} but all cars are stuck in other stoplight`));
						showChaseStatus();
						return;
					}
					/// the selected car should stop at this stoplight
					car.prevNext = car.next.id;
					car.next = sl.id;
				});
				showChaseStatus();
				// console.log(chalk.green(`\n${sl.id} ON at t=${time} on car[id = ${street.cars[desiredIndex].id}] at index ${desiredIndex}, chases = ${sl.id}, chased = ${street.cars[desiredIndex].prevNext}, idx = ${desiredIndex}`));
			} else if (isOff) {
				/// stoplight turned off, this means its GREEN in the direction of the street
				console.log(chalk.green(`${sl.id} in direction ${street.direction} is GREEN at t=${time}`));
				street.lanes.forEach(l => {
					const carExpectingOtherStoplight = l.cars.find(c => c.shouldFollow);
					if (carExpectingOtherStoplight) {
						console.log(`car ${carExpectingOtherStoplight.id} is stopped by ${carExpectingOtherStoplight.next} and will be stopped by ${carExpectingOtherStoplight.shouldFollow}`)
						if (carExpectingOtherStoplight.shouldFollow === sl.id) {
							console.log(`stoplight ${sl.id} is now GREEN => car ${carExpectingOtherStoplight.id} should just keep stopped at ${carExpectingOtherStoplight.next}`);
							// carExpectingOtherStoplight.next = street.cars.find(c => c.id === carExpectingOtherStoplight.prevNext);
							delete carExpectingOtherStoplight.shouldFollow;
							// console.log(chalk.red(`\n${sl.id} OFF at t=${time}, car ${carExpectingOtherStoplight.id} was to stop, but i'm off, so he'll chase ${carExpectingOtherStoplight.next.id}`));
							showChaseStatus();
							return;
						}
						console.log(`stoplight ${sl.id} is now GREEN => car ${carExpectingOtherStoplight.id} next stop is ${carExpectingOtherStoplight.shouldFollow}`);
						carExpectingOtherStoplight.next = carExpectingOtherStoplight.shouldFollow;
						delete carExpectingOtherStoplight.shouldFollow;
						showChaseStatus();
						return;
					}

					const cars = l.cars.filter(c => c.next === sl.id);
					if (!cars.length) {
						showChaseStatus();
						return;
					}
					cars.forEach(car => {
						// console.log(chalk.red(`\n${sl.id} OFF at t=${time} on car[id = ${car.id}], chases = ${car.prevNext}`));
						car.next = l.cars.find(c => c.id === car.prevNext);
						if (typeof(car.prevNext) !== 'string') {
							delete car.prevNext;
						}
					});
					
					showChaseStatus();
				});
			}
		});
	});

	streets.forEach(street => {
		street.lanes.forEach(l => {
			const acceleration = accelerationForStreet(street, l);
			const nextCars = l.cars.map(c => {
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
					const carOutput = l.cars.map(c => ({
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
			l.cars.forEach((c, i) => {
				l.cars[i] = nextCars[i];
				if (typeof(l.cars[i].next) === 'string') return;
				l.cars[i].next = nextCars[(i + 1) % nextCars.length];
				if (l.cars[i].vx > maxSpeed) {
					maxSpeed = l.cars[i].vx;
				}
			});
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