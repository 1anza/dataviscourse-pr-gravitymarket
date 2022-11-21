import * as d3 from "d3";

export class SectorControls {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#sector-controls");

		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));

		this.bounds = {
			minX: 0,
			maxX: svg_width - 50,
			minY: 0,
			maxY: svg_height - 50,
		};

		this.rect_width = 10;
	}

	/*
	 * Draws a box for each sector in the data
	 * Doesn't position them x - wise
	 */
	initRects() {
		this.sector_rects = this.svg
			.selectAll("g#sector-select")
			.data(this.gas.allSectors)
			.join("g")
			.attr("id", "sector-select")
			.append("rect")
			.classed("sector-select-rect", true)
			.attr("y", 0)
			.attr("height", this.bounds.maxY - this.bounds.minY)
			.attr("width", this.rect_width);
	}
	
	/*
	 * Positions the x positions of the sectors, 
	 */
	updateXPositions() {
		//this.sector_rects
	}
}
