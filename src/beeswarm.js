class Beeswarm {
	constructor(gas) {
		this.gas = gas;
		this.bounds = {
			minX: 20,
			maxX: 600,
			minY: 20,
			maxY: 600,
		};

		// When selectedSectors changes we need to redraw the grid, and update the simulation x forces
		this.updateScaleX();
		this.updateScaleY();
		this.updateScaleRadius();

		this.drawYAxis();
		this.drawXAxis();
	}

	/*  ----------------Data scales---------------------    */

	updateScaleRadius(minRadius = 5, maxRadius = 20) {
		this.radius_scale = d3
			.scaleLinear()
			.domain(this.gas.zValueDataRange)
			.range([minRadius, maxRadius]);
	}

	updateScaleX() {
		if (this.gas.groupingBySector) {
			let x_range = d3.range(
				this.bounds.minX,
				this.bounds.maxX + 0.001,
				this.gas.selectedSectors.length
			);
			let x_domain_map = Object.assign(
				{},
				...this.gas.selectedSectors.map((d, i) => ({ [d]: i }))
			);
			// This is a function sector => coordinate
			this.scaleX = (sector) => x_range[x_domain_map[sector]];
		} else {
			this.scaleX = _ => (this.bounds.maxX - this.bounds.minX) / 2
		}
	}

	updateScaleY() {
		this.scaleY = d3
			.scaleLinear()
			.domain([-60, 100])
			.range([this.bounds.maxY, this.bounds.minY]);
	}

	/*  ----------------Rendering-----------------------    */

	drawYAxis() {
		// Hardcoded ticks
		// this can be made to be dynamic - just base
		// these ticks on the extent of the percentages in the data at
		// the current index.
		let ticks = d3.range(-60, 100.01, 20);

		let grid = d3.select("svg#beeswarm-vis").select("g#grid");

		let lines = grid.selectAll("line#horizontal").data(ticks);
		lines.exit().remove();
		lines
			.join("line")
			.attr("id", "horizontal")
			.attr("x1", this.bounds.minX)
			.classed("beeswarm-gridline", true)
			.attr("x2", this.bounds.maxX)
			.attr("y1", (d) => this.scaleY(d))
			.attr("y2", (d) => this.scaleY(d));

		let axis_labels = grid.selectAll("text#axis-label-y").data(ticks);
		axis_labels.exit().remove();
		axis_labels
			.join("text")
			.attr("id", "axis-label-y")
			.attr("x", this.bounds.maxY)
			.attr("y", (d) => this.scaleY(d))
			.text((d) => d);
	}

	drawXAxis() {
		let grid = d3.select("svg#beeswarm-vis").select("g#grid");
		let data_to_bind;
		if (this.gas.groupingBySector) {
			data_to_bind = this.gas.selectedSectors;
		} else {
			data_to_bind = [""];
		}
		let lines = grid.selectAll("line#vertical").data(data_to_bind);
		lines.exit().remove();
		lines.join("line")
			.attr("id", "vertical")
			.attr("x1", d => this.scaleX(d))
			.attr("x2", d => this.scaleX(d))
			.attr("y1", this.bounds.minY)
			.attr("y2", this.bounds.maxY)
			.classed("beeswarm-gridline", true);
		let text = grid.selectAll("text#axis-label-x")
			.data(data_to_bind);
		text.exit().remove();
		text.join("text")
			.attr("id", "axis-label-x")
			.attr("x", d => this.scaleX(d))
			.attr("y", this.bounds.maxY)
			.text(d => d);
	}
}
