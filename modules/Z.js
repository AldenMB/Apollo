// provides some simple utilities for working with complex numbers, represented as length-2 arrays.

function complex(z){
	if(typeof(z) === 'number'){
		return [z,0];
	}
	return z;
};

function sum(...z){
	z = z.map(complex);
	return complex_sum(...z);
};

function complex_sum(...z){
	return z.reduce( 
		(z1, z2) => [z1[0]+z2[0], z1[1]+z2[1]]
	);
};

function prod(...z){
	z = z.map(complex);
	return z.reduce( 
		(z1, z2) => [
			z1[0]*z2[0]-z1[1]*z2[1],
			z1[0]*z2[1]+z1[1]*z2[0]
		]
	);
};

function scalar_prod(s, z){
	return z.map(x => s*x);
};

function abs(z){
	return Math.sqrt(z.map(x => x**2).reduce((a, b)=>a+b));
};

function sqrt(z){
	const [x, y] = z;
	const arg = Math.atan2(y, x)/2;
	const mod = Math.sqrt(abs(z));
	return from_polar(mod, arg);
};

function from_polar(mod, arg){
	return [mod*Math.cos(arg), mod*Math.sin(arg)];
};

function descartes(c1, c2, c3, sign=-1){
	return sum(c1, c2, c3, prod(sign*2,
		sqrt(
			sum(prod(c1,c2), prod(c2, c3), prod(c1, c3))
		)
	));
};

function sqr(x){
	return prod(x, x);
};

function diff(x, y){
	return sum(x, prod(-1, y));
};

function descartes_check(c, b){
	const z = c.map((x, i) => prod(x, 1/b[i]));
	const r = b.map(x => 1/x);
	for(const [i, j] of [[0,1], [0,2], [0,3], [1,2], [1,3], [2,3]]){
		if(Math.abs(abs(diff(z[i], z[j]))-Math.abs(r[i]+r[j]))>1e-8){
			return false;
		};
	};
	return true;
};

function reflect(center, about){
	const ans = complex_sum(scalar_prod(2, complex_sum(...about)), scalar_prod(-1, center));
	return ans;
};

const Z = Object.freeze({sum, sqrt, prod, abs, from_polar, descartes, reflect, descartes_check});

export default Z;