import * as d3 from "d3";

export class SectorControls {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#sector-controls");

		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));

		this.bounds = {
			minX: 0,
			maxX: svg_width - 3,
			minY: 0,
			maxY: svg_height - 3,
		};

		this.rect_width = 15;
		this.rect_height = 150;
		this.rect_spacing = 2;

		this.initRects();
	}

	/*
	 * Draws a box for each sector in the data
	 * Doesn't position them x - wise
	 */
	initRects() {
		this.sector_groups = this.svg
			.selectAll("g#sector-select")
			.data(this.gas.allSectors)
			.join("g")
			.attr("id", "sector-select");
		this.sector_groups
			.append("rect")
			.classed("sector-select-rect", true)
			.attr("y", 0)
			.attr("height", this.rect_height)
			.attr("width", this.rect_width);
		this.sector_groups
			.append("text")
			.text((d) => d)
			.attr(
				"transform",
				`translate(${this.rect_width / 2 - 4}, ${this.bounds.minY}) rotate(90)`
			)
			.classed("sector-select-text-label", true);

		// handles click and mouse hover interaction
		let that = this;
		this.sector_groups
			.on("mouseover", function (_) {
				let selected = d3.select(this);
				let hovered_sector = selected._groups[0][0].__data__;
				that.sector_groups
					.filter((d) => d === hovered_sector)
					.select("rect")
					.classed("sector-select-rect-hovered", true);
			})
			.on("mouseleave", function (_) {
				let selected = d3.select(this);
				let hovered_sector = selected._groups[0][0].__data__;
				that.sector_groups
					.filter((d) => d === hovered_sector)
					.select("rect")
					.classed("sector-select-rect-hovered", false);
				console.log("mouseleave", hovered_sector);
			})
			.on("click", function (_) {
				let selected = d3.select(this);
				let hovered_sector = selected._groups[0][0].__data__;
				if (that.gas.selectedSectors.has(hovered_sector)) {
					that.gas.selectedSectors.delete(hovered_sector);
					that.gas.set_selectedSectors(that.gas.selectedSectors);
				} else {
					that.gas.set_selectedSectors(
						that.gas.selectedSectors.add(hovered_sector)
					);
				}
			});
	}

	/*
	 * Positions the x positions of the sectors,
	 *
	 * unselected sectors are put to the side.
	 * selected sectors are positioned according to scaleX
	 */
	updateSectorControls(scaleX) {
		this.sector_groups.attr("transform", (d, i) => {
			let x_pos = scaleX(d) - this.rect_height / 2;
			console.log(x_pos);
			if (isNaN(x_pos)) {
				x_pos = this.bounds.minX;
			}
			return `translate(${x_pos}, ${
				i * (this.rect_width + this.rect_spacing) + this.rect_width
			}) rotate(-90)`;
		});

		this.sector_groups
			.select("rect")
			.classed("sector-select-rect-selected", (d) =>
				this.gas.selectedSectors.has(d)
			);
	}
}
