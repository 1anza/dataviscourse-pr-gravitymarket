import * as d3 from "d3";
import { dateMinuteToDate, getPercChange } from "./util.js";

export class Table {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#details-vis");
		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));
		this.bounds = {
			minX: 0,
			maxX: svg_width - 5,
			minY: 15,
			maxY: svg_height - 10,
		};
		this.attributes = [
			"open",
			"close",
			"high",
			"low",
			"volume",
			"pe",
			"eps",
			"beta",
			"dividend",
			"marketcap",
		];

		this.textHeight = 22;

		this.addAttributesName();
		this.gas.addEventListenerToEvent("index", (_) =>
			this.updateDetails(gas.selectedSingleCompany)
		);
		this.gas.addEventListenerToEvent("selectedSingleCompany", (_) =>
			this.updateDetails(gas.selectedSingleCompany)
		);
	}

	addAttributesName() {
		this.svg
			.selectAll("text")
			.data(this.attributes)
			.join("text")
			.attr("x", this.bounds.minX)
			.attr(
				"y",
				(d, i) =>
					this.bounds.minY + i * (this.textHeight + 1) + this.textHeight / 2
			)
			.style("fill", "black")
			.text(function (d) {
				return d + ": ";
			})
			.attr("text-anchor", "left")
			.style("font-weight", "bold")
			.style("alignment-baseline", "start");
	}

	updateDetails(data) {
		let attributesValues = this.svg.selectAll(".values").data(this.attributes);

		attributesValues.exit().remove();

		attributesValues
			.join("text")
			.attr("class", "values")
			.attr("x", 75)
			.attr(
				"y",
				(d, i) =>
					this.bounds.minY + i * (this.textHeight + 1) + this.textHeight / 2
			)
			.style("fill", "black")
			.style("font-weight", "normal")
			.text((d) => {
				/*
				 * Some data values are accessed in a weird way. Some depend on the gas index,
				 * and some and constant across all time values
				 */
				if (new Set(["open", "high", "low", "close"]).has(d)) {
					return data.chart[this.gas.index][d];
				}
				if (d === "volume") {
					return d3.format(",.5r")(data.chart[this.gas.index][d]);
				}
				if (d === "marketcap") {
					return "$" + d3.format(",.3r")(data[d] / 1e9) + " B";
				}
				return data[d];
			})
			.attr("text-anchor", "left");
	}
}
