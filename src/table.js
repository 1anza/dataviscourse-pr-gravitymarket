import * as d3 from "d3";
import { dateMinuteToDate, getPercChange } from "./util.js";

export class Table {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#details-vis");
		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));
		this.bounds = {
			minX: 50,
			maxX: svg_width - 50,
			minY: 20,
			maxY: svg_height - 50,
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
			"earnings",
			"marketcap",
		];

		this.addAttributesName();
		this.gas.addEventListenerToEvent("selectedSingleCompanyDetails", (_) =>
			this.updateDetails(gas.selectedSingleCompanyDetails)
		);
	}

	addAttributesName() {
		var size = 22;

		let attributesNames = this.svg
			.selectAll("labels")
			.data(this.attributes)
			.enter()
			.append("text")
			.attr("x", 20)
			.attr("y", function (d, i) {
				return 10 + i * (size + 1) + size / 2;
			})
			.style("fill", "black")
			.text(function (d) {
				return d + ": ";
			})
			.attr("text-anchor", "left")
			.style("font-weight", "bold")
			.style("alignment-baseline", "start");
	}

	updateDetails(data) {
		var size = 22;

		let attributesValues = this.svg.selectAll(".values").data(this.attributes);

		attributesValues.exit().remove();

		attributesValues
			.join("text")
			.attr("class", "values")
			.attr("x", 100)
			.attr("y", function (d, i) {
				return 9 + i * (size + 1) + size / 2;
			})
			.style("fill", "black")
			.style("font-weight", "normal")
			.text(function (d) {
				return data[d];
			})
			.attr("text-anchor", "left");
	}
}
