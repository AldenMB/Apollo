import Apollonius from './modules/apollonius.js';
import {make_drawing} from './modules/apollodraw.js';
import {make_draggable} from './modules/drag.js';

const SVGNS = "http://www.w3.org/2000/svg";
const basestyle = document.styleSheets[0].ownerNode;
const circlestyle = document.createElement('style');
document.head.appendChild(circlestyle);
const labelstyle = document.createElement('style');
document.head.appendChild(labelstyle);
const backgroundstyle = document.createElement('style');
document.head.appendChild(backgroundstyle);
const highlightstyle = document.createElement('style');
document.head.appendChild(highlightstyle);

function listen_run(input, to_run){
	to_run(input.value);
	input.addEventListener('input', () => to_run(input.value));
};

window.onload = function() {
	const inputs = document.getElementById("inputs");
	
	listen_run(inputs.elements['bends'], make_bend_gasket);
	listen_run(inputs.elements['color'],update_circle_colors);
	listen_run(inputs.elements['background'],update_background_color);
	listen_run(inputs.elements['highlight_color'], update_highlight_color);
	listen_run(inputs.elements['width'], function(w){
		for(const svgid of ['drag_3_svg', 'drag_2_svg']){
			const svg = document.getElementById(svgid);
			svg.setAttribute('width', w);
			svg.setAttribute('height', w);
		};
	});
	inputs.elements['max_count'].addEventListener('input', ()=>make_bend_gasket());
	
	function set_handle_visibility(){
		const handles = document.getElementsByClassName('drag_handle');
		const action = inputs.elements['show_handles'].checked ? 'remove' : 'add';
		[...handles].forEach(h => h.classList[action]('hide'));
	}
	
	listen_run(inputs.elements['show_handles'], function(){
		inputs.elements['show_handles_shadow'].checked = inputs.elements['show_handles'].checked;
		set_handle_visibility();
	});
	

	// Drag 2
	
	inputs.elements['show_handles_shadow'].addEventListener('input', function(){
		inputs.elements['show_handles'].checked = inputs.elements['show_handles_shadow'].checked;
		set_handle_visibility();
	});
	inputs.elements['export_drag2_svg'].onclick = function(){
		downloadToFile(to_svg_string(document.getElementById('drag_2_svg')), 'gasket.svg', 'image/svg+xml');	
	};
	inputs.elements['export_drag2_png'].onclick = function(){
		download_as_png(document.getElementById('drag_2_svg'));	
	};	
	function draw_drag2(){
		const hand1 = document.getElementById('drag_2_handle_1');
		const hand2 = document.getElementById('drag_2_handle_2');
		const c1 = [
			hand1.getAttribute('cx'), 
			hand1.getAttribute('cy')
		].map(Number);
		const c2 = [
			hand2.getAttribute('cx'), 
			hand2.getAttribute('cy')
		].map(Number);
		const min_radius = Number(inputs.elements['min_radius_drag2'].value)/100;
		const max_bend = 1/min_radius;
		const gasket = Apollonius.from_centers_pair(c1, c2, max_bend, Number(inputs.elements['max_count'].value));
		inputs.elements['export_drag2_csv'].onclick = function(){
			downloadToFile(to_csv(gasket), 'gasket.csv', 'text/css');
		};
		const {g_circles} = make_drawing(gasket);
		document.getElementById('interior_circles').replaceChildren(...g_circles.childNodes);
	}
	listen_run(inputs.elements['min_radius_drag2'],()=>draw_drag2());
	inputs.elements['max_count'].addEventListener('input', ()=>draw_drag2());
	
	function ellipse_from_foci({x1, y1, x2, y2, major_axis}){
		const cx = (x1+x2)/2;
		const cy = (y1+y2)/2;
		
		const ellipse = document.createElementNS(SVGNS, 'ellipse');
		ellipse.setAttributeNS(null, 'cx', 0);
		ellipse.setAttributeNS(null, 'cy', 0);
		ellipse.setAttributeNS(null, 'rx', major_axis/2);
		ellipse.setAttributeNS(null, 'ry', 
			Math.sqrt(major_axis**2 -(x1-x2)**2 -(y1-y2)**2)/2
		);
		ellipse.setAttributeNS(null, 'transform', `translate(${cx},${cy}) rotate(${Math.atan2(y2-y1, x2-x1)*180/Math.PI})`);
		return ellipse;
	};
	
	function make_constraint(handle){
		const hx = handle.getAttribute('cx');
		const hy = handle.getAttribute('cy');
		const h = Math.hypot(hx, hy);
		const e = h/(2-h);
		const a = 1-h/2;
		
		function to_ellipse({x, y}){
			const R = Math.hypot(x,y);
			const r = a*(1-e**2)/(1-(x*hx+y*hy)/(R*(2-h)));
			return {
				x: x*r/R,
				y: y*r/R
			};
		};
		return to_ellipse;
	};
	
	function both_pairs(x,y){
		return [[x,y], [y,x]];
	}
	for(const [h1, h2] of both_pairs(
		document.getElementById('drag_2_handle_1'),
		document.getElementById('drag_2_handle_2')
	)){
		function onDragStart(){
			const hx = h1.getAttribute('cx');
			const hy = h1.getAttribute('cy');
			const hint = ellipse_from_foci({x1:hx, y1:hy, x2:0, y2:0, major_axis:2-Math.hypot(hx, hy)});
			hint.setAttributeNS(null, 'class', 'drag_hint');
			document.getElementById('drag_hint').replaceChildren(hint);
		};
		function onDragDone(){
			document.getElementById('drag_hint').replaceChildren();
		};
		function constraintGen(){
			return make_constraint(h1);
		};
		make_draggable(h2, draw_drag2, onDragStart, onDragDone, constraintGen);
	}
	
	
	//Drag 3
	inputs.elements['export_drag3_svg'].onclick = function(){
		downloadToFile(to_svg_string(document.getElementById('drag_3_svg')), 'gasket.svg', 'image/svg+xml');	
	};
	inputs.elements['export_drag3_png'].onclick = function(){
		download_as_png(document.getElementById('drag_3_svg'));	
	};
	function draw_drag3(){
		const hand1 = document.getElementById('drag_3_handle_1');
		const hand2 = document.getElementById('drag_3_handle_2');
		const hand3 = document.getElementById('drag_3_handle_3');
		const c1 = [
			hand1.getAttribute('cx'), 
			hand1.getAttribute('cy')
		].map(Number);
		const c2 = [
			hand2.getAttribute('cx'), 
			hand2.getAttribute('cy')
		].map(Number);
		const c3 = [
			hand3.getAttribute('cx'), 
			hand3.getAttribute('cy')
		].map(Number);
		const min_radius = Number(inputs.elements['min_radius_drag3'].value)/100;
		const max_bend = 1/min_radius;
		const gasket = Apollonius.from_centers_triplet(c1, c2, c3, max_bend, Number(inputs.elements['max_count'].value));
		inputs.elements['export_drag3_csv'].onclick = function(){
			downloadToFile(to_csv(gasket), 'gasket.csv', 'text/css');
		};
		const {g_circles} = make_drawing(gasket);
		document.getElementById('interior_circles3').replaceChildren(...g_circles.childNodes);
	};
	listen_run(inputs.elements['min_radius_drag3'],()=>draw_drag3());
	inputs.elements['max_count'].addEventListener('input', ()=>draw_drag3());
	
	for(const handle_id of ['1', '2', '3']){
		const handle = document.getElementById('drag_3_handle_'+handle_id);
		make_draggable(handle, draw_drag3);
	}
	
	
	//Specify Bends
	function update_label_style(){
		const vis = (
			inputs.elements['show_numbers'].checked
			?
			'visible'
			:
			'hidden'
		);
		const color = inputs.elements["label_color"].value;
		const font = inputs.elements["font"].value;
		labelstyle.innerHTML = `
			.bend_label {
			visibility: ${vis};
			fill: ${color};
			font-family: ${font};
			}
		`;
	};
	update_label_style();
	for(const elt of ['show_numbers', 'label_color', 'font']){
		inputs.elements[elt].addEventListener('input', update_label_style);
	};
	
	function get_bends(){
		const b1 = inputs.elements['b1'].value;
		const b2 = inputs.elements['b2'].value;
		const b3 = inputs.elements['b3'].value;
		return [b1, b2, b3].map(Number);
	};
	
	function get_max_bend(){
		if(inputs.elements['threshold_type'].value === "bend"){
			return inputs.elements['max_bend'].value;
		}
		const b = get_bends();
		const outer_bend = Math.abs(Apollonius.get_outer_bend(...b));
		const min_radius = inputs.elements['min_radius'].value/100;
		return outer_bend / min_radius;		
	};
	
	function make_bend_gasket(){
		const b = get_bends();
		const max_bend = get_max_bend();
		const gasket = Apollonius.from_bends(...b, max_bend, Number(inputs.elements['max_count'].value));
		const {svg, set_rotate, set_flip, rescale_text} = make_drawing(gasket, true);
		document.getElementById("bend_display").replaceChildren(svg);
		listen_run(inputs.elements['rotation'], set_rotate);
		listen_run(inputs.elements['flip'], () => set_flip(inputs.elements['flip'].checked));
		listen_run(
			inputs.elements['width'],		
			function (x) {
				svg.setAttributeNS(null, 'width', x);
				svg.setAttributeNS(null, 'height', x);
			}
		);
		listen_run(inputs.elements['font'], () => rescale_text());
		
		inputs.elements['export_bends_csv'].onclick = function(){
			downloadToFile(to_csv(gasket), 'gasket.csv', 'text/css');
		};
		inputs.elements['export_bends_svg'].onclick = function(){
			downloadToFile(to_svg_string(svg), 'gasket.svg', 'image/svg+xml');
		};
		inputs.elements['export_bends_png'].onclick = function(){
			download_as_png(svg);
		};
	};
};

function update_circle_colors(color){
circlestyle.innerHTML = `
.colored_circle {
fill: ${color};
stroke: none;
}
`;
};

function update_background_color(color){
backgroundstyle.innerHTML = `
.background_circle {
fill: ${color};
stroke: none;
}
`;
};

function update_highlight_color(color){
highlightstyle.innerHTML = `
.highlight {
fill: ${color};
}
`	
};

function to_csv(gasket){
	const data = gasket.map(({center: [x, y], bend}) => [bend, x, y]);
	data.unshift(['bend', 'x', 'y']);
	const rows = data.map(arr => arr.join(', '));
	const csv = rows.join('\n');
	return csv;
};

// thank you here: https://robkendal.co.uk/blog/2020-04-17-saving-text-to-client-side-file-using-vanilla-js
const downloadToFile = (content, filename, contentType) => {
  const a = document.createElement('a');
  const file = new Blob([content], {type: contentType});
  
  a.href= URL.createObjectURL(file);
  a.download = filename;
  a.click();

	URL.revokeObjectURL(a.href);
};

function to_svg_string(svg){
	svg = svg.cloneNode(true);
	svg.prepend(get_svg_style());
	return (new XMLSerializer()).serializeToString(svg);
};

function get_svg_style(){
	const style = document.createElementNS(SVGNS, 'style');
	for(const s of [basestyle, circlestyle, labelstyle, backgroundstyle, highlightstyle]){
		style.innerHTML += s.innerHTML;
	};
	return style;
};

function download_as_png(svg){
	const cv = document.createElement("canvas");
	cv.width = svg.getAttribute("width");
	cv.height = svg.getAttribute("height");
	const ctx = cv.getContext("2d");
	
	const svg_blob = new Blob([to_svg_string(svg)], {type:"image/svg+xml;charset=utf-8"});
	const svg_url = URL.createObjectURL(svg_blob);
	const img = new Image;
	img.onload = function(){
		ctx.drawImage(this, 0, 0);
		URL.revokeObjectURL(svg_url);
		
		const a = document.createElement('a');
		a.setAttribute('download', 'gasket.png');
		cv.toBlob(function(blob){
			const cv_url = URL.createObjectURL(blob);
			a.setAttribute('href', cv_url);
			a.click();
			URL.revokeObjectURL(cv_url);
		});
	};
	img.src = svg_url;
};