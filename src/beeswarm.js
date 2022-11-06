class Beeswarm {
	constructor(gas) {
		this.gas = gas;

		// Circle radius

		// When selectedSectors changes we need to redraw the grid, and update the simulation x forces
		this.updateScaleX();
		this.updateScaleY();
		this.updateScaleRadius();

		this.drawYAxis();
	}


	/*  ----------------Data scales---------------------    */

	updateScaleRadius(minRadius = 5, maxRadius = 20) {
		this.radius_scale = d3
			.scaleLinear()
			.domain(this.gas.zValueDataRange)
			.range([minRadius, maxRadius]);
	}

	updateScaleX(minX = 20, maxX = 600) {
		let x_range = d3.range(minX, maxX + 0.001, this.gas.selectedSectors.length);
		let x_domain_map = Object.assign(
			{},
			...this.gas.selectedSectors.map((d, i) => ({ [d]: i }))
		);
		// This is a function sector => coordinate
		this.scaleX = (sector) => x_range[x_domain_map[sector]];
	}

	updateScaleY(minY = 20, maxY = 600) {
		this.scaleY = d3
			.scaleLinear()
			.domain([-60, 100])
			.range([minY, maxY]);
	}

	/*  ----------------Rendering-----------------------    */

	// Draws the horizontal lines and the axis labels
	drawYAxis() {
		// Hardcoded ticks
		// this can be made to be dynamic - just base 
		// these ticks on the extent of the percentages in the data at
		// the current index.
		let ticks = d3.range(-60, 100.01, 20);

		let lines = d3
			.select("svg#beeswarm-vis")
			.select("g#grid")
			.selectAll("line#horizontal")
			.data(ticks);
		lines.exit().remove();
		lines.join("line").attr("id", "horizontal").attr("x1", 0)
			.classed("beeswarm-gridline", true)
			.attr("x2", 1000)
			.attr("y1", d => this.scaleY(d))
			.attr("y2", d => this.scaleY(d));
	}

	drawGridVertical(selectedSectors) {}

	drawAxes() {}
}
