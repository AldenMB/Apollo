const NS = "http://www.w3.org/2000/svg";

function make_node(name, attrs = {}){
	const node = document.createElementNS(NS, name);
	for (const a in attrs) {
		node.setAttributeNS(null, a, String(attrs[a]));
	};
	return node;
};

function make_drawing(gasket, make_labels = false){
	const outer_bend = gasket[0].bend;
	const radius = Math.abs(1/outer_bend);
	const diameter = 2*radius;
	
	const svg = make_node(
		'svg', 
		{
			viewBox:`${-radius} ${-radius} ${diameter} ${diameter}`
		}
	);
	
	
	const outer_transforms = svg.transform.baseVal;
	const outer_flip = svg.createSVGTransform();
	outer_transforms.appendItem(outer_flip);
	const outer_rotate = svg.createSVGTransform();
	outer_transforms.appendItem(outer_rotate);
	
	const g_circles = make_node('g', {id:'circles'});
	svg.appendChild(g_circles);
	
	const g_labels = make_node('g', {id:'labels'});
	svg.appendChild(g_labels);
	
	for(const {center: [x, y], bend} of gasket){
		const r = Math.abs(1/bend);
		const circle = make_node('circle', {cx:x, cy:y, r});
		g_circles.appendChild(circle);
		const alpha = Math.abs(r * outer_bend)**(1/4);
		circle.setAttributeNS(null, 'fill-opacity', alpha);
		if(bend < 0){
			circle.setAttributeNS(null, 'class', "background_circle");
		} else {
			circle.setAttributeNS(null, 'class', "colored_circle");
			
			if(make_labels && bend >= 0.01){
				const label = make_node('text', {x, y, class:'bend_label', dy:".3em"});
				label.textContent = (
					Number.isInteger(bend)
					?
					String(bend)
					:
					bend.toFixed(2)
				);
				g_labels.appendChild(label);
				label.setAttributeNS(null, 'text-anchor', 'middle');
				label.setAttributeNS(null, 'transform-origin', `${x} ${y}`);
				
				const transforms = label.transform.baseVal;
				const resize = svg.createSVGTransform();
				transforms.appendItem(resize);
				const rotate = svg.createSVGTransform();
				transforms.appendItem(rotate);
				const flip = svg.createSVGTransform();
				transforms.appendItem(flip);
				
				for(const target of [label, circle]){
					target.addEventListener('click', function(){
						label.classList.toggle('highlight');
					});
				}				
			};		
		}
	};
	
	
	function rescale_text(tweak_factor = 1){
		for(const label of g_labels.childNodes){
			const r = 1/Number(label.textContent);
			const resize = label.transform.baseVal[0];
			resize.setScale(1, 1);
			const {width, height} = label.getBBox();
			const scale = tweak_factor * 2 * r / Math.hypot(width,height);
			resize.setScale(scale, scale);
		}
	};
	
	function set_flip(flipit){
		const xscale = flipit ? -1 : 1;
		for(const label of g_labels.childNodes){
			const flp = label.transform.baseVal[2];
			flp.setScale(xscale, 1);
		}
		outer_flip.setScale(xscale, 1);
	};
	
	function set_rotate(angle){//degrees
		for(const label of g_labels.childNodes){
			const rot = label.transform.baseVal[1];
			rot.setRotate(-angle, 0, 0);
		}
		outer_rotate.setRotate(angle, 0, 0);
	};
	
	return Object.freeze({svg, set_rotate, set_flip, rescale_text, g_circles});
};

export {make_drawing};