import * as d3 from "d3";

export class SectorControls {
	constructor(gas, svg_width, svg_height) {
		this.gas = gas;
		this.svg = d3.select("svg#beeswarm-vis").select("g#sector-controls");

		this.bounds = {
			minX: 0,
			maxX: svg_width - 3,
			minY: 0,
			maxY: svg_height - 3,
		};

		this.rect_height = 22;
		this.rect_width = 165;
		this.rect_spacing = 3;

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
			.attr("width", this.rect_width)
			.style("fill", (d) => this.gas.colorFunc(d));
		this.sector_groups
			.append("text")
			.text((d) => d)
			.attr("transform", `translate(4 ${this.rect_height - 4} )`)
			.attr("text-anchor", "center")
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
			})
			.on("click", function (_) {
				let selected = d3.select(this);
				let hovered_sector = selected._groups[0][0].__data__;
				if (that.gas.selectedSectors.has(hovered_sector)) {
					that.gas.selectedSectors.delete(hovered_sector);
					that.gas.set_selectedSectors(that.gas.selectedSectors);
				} else {
					that.gas.selectedSectors.add(hovered_sector);
					that.gas.set_selectedSectors(that.gas.selectedSectors);
				}
			});
	}

	/*
	 * Positions the x positions of the sectors,
	 *
	 * unselected sectors are put to the side.
	 * selected sectors are positioned according to scaleX
	 *
	 * This should be called when gas.selectedSectors changes
	 */
	updateSectorControls(scaleX) {
		let counts = {};
		let i = 0;
		for (let d of this.gas.selectedSectors) {
			counts[d] = i;
			i += 1;
		}
		this.sector_groups
			.filter((d) => this.gas.selectedSectors.has(d))
			.attr("transform", (d) => {
				//let i = this.gas.selectedSectors.get(d);
				let i = counts[d];
				let x_pos = scaleX(d) - this.rect_width / 2;
				let y_pos = (i % 2) * this.rect_height;
				console.log("y pos is this: ", y_pos);
				return `translate(${x_pos}, ${y_pos})`;
			});
		this.sector_groups
			.filter((d) => !this.gas.selectedSectors.has(d))
			.attr("transform", (d, i) => {
				let x_pos = this.bounds.minX;
				let y_pos =
					i * (this.rect_height + this.rect_spacing) + this.rect_height;
				return `translate(${x_pos}, ${y_pos})`;
			});

		this.sector_groups
			.select("rect")
			.classed("sector-select-rect-selected", (d) =>
				this.gas.selectedSectors.has(d)
			);
	}
}
