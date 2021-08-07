// thank you to this tutorial: https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/

const NS = "http://www.w3.org/2000/svg";

function make_draggable(obj, onDrag, onDragStart = (()=>null), onDragDone = (()=>null), constraintGen = (() => (x => x))){
	obj.addEventListener('mousedown', startDrag);
	obj.addEventListener('mousemove', drag);
	obj.addEventListener('mouseup', endDrag);
	obj.addEventListener('mouseleave', endDrag);
	let dragging = false;
	
	function startDrag(evt){
		evt.preventDefault();
		
		dragging = true;
		onDragStart()
		drag(evt);
	};
	
	function drag(evt){
		if(!dragging){
			return;
		}
		evt.preventDefault();
		
		const {x, y} = constraintGen()(getMousePosition(evt));
		obj.setAttributeNS(null, "cx", x);
		obj.setAttributeNS(null, "cy", y);
		
		onDrag();
	};
	
	function endDrag(evt){
		evt.preventDefault();
		
		dragging = false;
		
		onDragDone();
	};
	
	function getMousePosition(evt){
		const CTM = obj.getScreenCTM();
		return {
			x: (evt.clientX - CTM.e) / CTM.a,
			y: (evt.clientY - CTM.f) / CTM.d
		};
	};
}

export {make_draggable}