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

		this.rect_height = 15;
		this.rect_width = 150;
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
			.attr("width", this.rect_width)
			.style("fill", (d) => this.gas.colorFunc(d));
		this.sector_groups
			.append("text")
			.text((d) => d)
			.attr("transform", `translate(0 ${this.rect_height - 4} )`)
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
	 *
	 * This should be called when gas.selectedSectors changes
	 */
	updateSectorControls(scaleX) {
		this.sector_groups.attr("transform", (d, i) => {
			let x_pos;
			if (this.gas.selectedSectors.has(d)) {
				x_pos = scaleX(d) - this.rect_width / 2;
			} else {
				x_pos = this.bounds.minX;
			}

			let y_pos;
			if (this.gas.selectedSectors.has(d)) {
				y_pos = this.rect_height;
			} else {
				y_pos = i * (this.rect_height + this.rect_spacing) + this.rect_height;
			}
			return `translate(${x_pos}, ${y_pos})`;
		});

		this.sector_groups
			.select("rect")
			.classed("sector-select-rect-selected", (d) =>
				this.gas.selectedSectors.has(d)
			);
	}
}
