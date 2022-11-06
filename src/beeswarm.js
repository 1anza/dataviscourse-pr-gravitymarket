class Beeswarm {
    constructor(gas) {
        this.gas = gas;

	// Circle radius
	this.max_radius = 20;
	this.min_radius = 5;
	let update_radius_scale = () => {
		this.radius_scale = d3.scaleLinear().domain(this.gas.zValueDataRange).range();
	}
	update_radius_scale();
	this.gas.addEventListenerToEvent("zValueDataRange", update_radius_scale);

	// When selectedSectors changes we need to redraw the grid, and update the simulation x forces
    }
    
    initAxes() {
    }

    drawGrid(selectedSectors) {
    }
    
    drawAxes() {
    }
}
