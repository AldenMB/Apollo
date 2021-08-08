import Z from './Z.js';

// This creates an apollonian gasket
// (a list of {center=[x, y], bend} triples)
// either from a triplet of interior centers, a 
// pair of centers with respect to an exterior
// unit circle, or a triplet of bends.


function descartes(b1, b2, b3, sign = -1){
	return b1+b2+b3+2*sign*Math.sqrt(b1*b2+b2*b3+b1*b3);
};

function get_outer_bend(b1, b2, b3){
	return bend_walk(b1, b2, b3)[0];
};

function from_centers_triplet(c1, c2, c3, max_bend, max_count){
	
	// opposite side of triangle length
	const s1 = Z.abs(Z.sum(c2, Z.prod(-1,c3)));
	const s2 = Z.abs(Z.sum(c1, Z.prod(-1,c3)));
	const s3 = Z.abs(Z.sum(c1, Z.prod(-1,c2)));
	const b1 = 2/(s2+s3-s1);
	const b2 = 2/(s1+s3-s2);
	const b3 = 2/(s1+s2-s3);
	const b0 = descartes(b1,b2,b3);
	
	c1 = Z.prod(c1,b1);
	c2 = Z.prod(c2,b2);
	c3 = Z.prod(c3,b3);
	
	const cplus  = Z.descartes(c1,c2,c3,1);	
	const c0 = (
		Z.descartes_check([cplus,c1,c2,c3],[b0,b1,b2,b3])
		?
		cplus
		:
		Z.descartes(c1,c2,c3,-1)
	);
	
	const circles = [
		{center:c0, bend:b0},
		{center:c1, bend:b1},
		{center:c2, bend:b2},
		{center:c3, bend:b3}
	];
	
	return gasket(circles, max_bend, max_count);
};

function from_centers_pair(c1, c2, max_bend, max_count){
	const b1 = 1/(1-Z.abs(c1));
	const b2 = 1/(1-Z.abs(c2));
	const b3 = descartes(-1,b1,b2);
	
	c1 = Z.prod(c1, b1);
	c2 = Z.prod(c2, b2);
	
	const root = Z.prod(2,Z.sqrt(Z.prod(c1, c2)));
	
	const cplus = Z.sum(c1, c2, root);
	
	const c3 = (
		Z.descartes_check([[0,0],c1,c2,cplus],[-1,b1,b2,b3])
		?
		cplus
		:
		Z.sum(c1, c2, Z.prod(-1, root))
	);
	
	const circles = [
		{center:[0,0], bend:-1},
		{center:c1, bend:b1},
		{center:c2, bend:b2},
		{center:c3, bend:b3}
	];
	return gasket(circles, max_bend, max_count);
};

function from_bends(b1, b2, b3, max_bend, max_count){
	const bends = bend_walk(b1, b2, b3);
	const centers = bend_placement(bends);
	const circles = bends.map((b, i) => ({center:centers[i], bend:b}));
	return gasket(circles, max_bend, max_count);
};

function bend_walk(b1, b2, b3){
	// find the smallest bends in the gasket which contains these three bends tangent.
	// Note: 2, 3, 10 does something weird -- it terminates on all positives.
	const b0 = descartes(b1,b2,b3);
	const bends = [b0, b1, b2, b3];
	while(true){
		bends.sort((x, y) => x-y);
		const b = bends.pop();
		const nextb = 2*bends.reduce((x, y)=>x+y)-b;
		if(nextb >= b){
			bends.push(b);
			break;
		}
		bends.push(nextb);
	}
	return bends;
};

function bend_placement(quadruplet){
	// given four bends, place them sensibly.
	// returned centers are multiplied by their bends.
	const [b0, b1, b2, b3] = quadruplet;
	
	const c0 = [0,0];
	
	const c1 = [1+b1/b0, 0];
	
	const x2 = b2/b0 + (b1-b0)/(b1+b0);
	const y2 = -Math.sqrt((1+b2/b0)**2-x2**2);
	const c2 = [x2, y2];
	
	const x3 = b3/b0 + (b1-b0)/(b1+b0);
	const y3 = Math.sqrt((1+b3/b0)**2-x3**2);
	const c3 = [x3, y3];
	
	return [c0, c1, c2, c3];
};


function reflect_across_triplet(singlet, triplet){
	// Given one circle from a 
	// mutually-tangent-quadruplet,
	// reflect it to get the other tangent to the
	// triplet. Each center should already be multiplied by its corresponding bend.
	const {center:c0, bend:b0} = singlet;
	const [c1, c2, c3] = triplet.map(x => x.center);
	const [b1, b2, b3] = triplet.map(x => x.bend);
	const bend   = 2*(b1+b2+b3)-b0;
	const center = Z.reflect(c0, [c1, c2, c3]);
	return {center, bend};
};

function children(quadruplet, initial=false){
	// given four mutually tangent circles with
	// one singled out as first, find the three
	// children.
	const children = [];
	const indices = initial ? [0, 1, 2, 3] : [1, 2, 3];
	for(const i of indices){
		const triplet = [...quadruplet];
		const [singlet] = triplet.splice(i, 1);
		const reflection = reflect_across_triplet(singlet, triplet);
		children.push([reflection, ...triplet]);
	};
	return children;
};

function gasket(quadruplet, max_bend, max_count){
	// assuming the first has negative bend and the rest positive bend, make the gasket down to a given size threshold.
	let active = children(quadruplet, true);
	const gasket = quadruplet;
	while(active.length){
		gasket.push(...active.map(x => x[0]));
		if(gasket.length > max_count){
			break;
		};
		active = ([]
			.concat(...active.map(q => children(q)))
			.filter(x => x.every(y => y.bend < max_bend) && x.filter(y => y<0).length<=1)
		);
	};
	return gasket.map(normalize).sort((a, b) => a.bend - b.bend);	
};

function normalize(circle){
	const {center: c, bend} = circle;
	const center = Z.prod(c, 1 / bend);
	return Object.freeze({center, bend});
};

const Apollonius = Object.freeze({
	from_centers_triplet,
	from_centers_pair, 
	from_bends,
	get_outer_bend
});

export default Apollonius;