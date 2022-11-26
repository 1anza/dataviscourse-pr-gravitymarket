import * as d3 from "d3";
import {
	dateMinuteToDate,
	getPercChange,
	genDateTicksEveryMonth,
} from "./util.js";

export class Ohlc {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#ohlc-vis");
		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));
		this.bounds = {
			minX: 50,
			maxX: svg_width - 50,
			minY: 20,
			maxY: svg_height - 50,
		};
		this.textRotation = 45;

		this.updateXScale();
		this.updateYScale();
		this.updateXAxis();
		this.updateYAxis();

		this.gas.addEventListenerToEvent("selectedSingleCompany", (_) =>
			this.updateOhlcChart(gas.selectedSingleCompany)
		);
	}

	/*
	 * updates this.scaleX which takes a date and maps it to the x position*/

	updateXScale() {
		let scale = this.gas.genDateDomain();
		let range = [this.bounds.minX, this.bounds.maxX];
		this.scaleX = scale.range(range);
	}

	updateYScale() {
		let domain = this.gas.yValueDataRange;
		let range = [this.bounds.maxY, this.bounds.minY];
		this.scaleY = d3.scaleLinear().domain(domain).range(range);
	}

	updateXAxis() {
		let axisG = this.svg
			.select("g#x-axis")
			.attr("transform", `translate(0 ${this.bounds.maxY})`);
		let xAxis = d3
			.axisBottom()
			.scale(this.scaleX)
			// Hardcoded to have dates every 20
			.tickValues(genDateTicksEveryMonth(this.gas.data[0].chart))
			.tickFormat(d3.timeFormat("%b %Y"));
		axisG
			.call(xAxis)
			.selectAll("text")
			.attr("y", 15)
			.attr("x", 25)
			.attr("transform", `rotate(${this.textRotation})`)
			.classed(".dateaxis-text", true);
	}

	updateYAxis() {
		let axisG = this.svg
			.select("g#y-axis")
			.attr("transform", `translate(${this.bounds.minX} 0)`);
		let yAxis = d3.axisLeft(this.scaleY);
		axisG.call(yAxis);
	}

	updateOhlcChart(company) {
		let domain = d3.extent(company.chart, (d) => d[this.gas.yValueName]);
		let range = [this.bounds.maxY, this.bounds.minY];
		this.scaleY = d3.scaleLinear().domain(domain).range(range);

		this.updateYAxis();

		let series = this.svg.select("g.ohlc-series");
		let bars = series.selectAll("g.ohlc-bar").data(company.chart);
		bars = bars.join("g").classed("ohlc-bar", true);

		let lines = bars.selectAll("line.open-close-line").data(function (d) {
			return [d];
		});
		lines
			.join("line")
			.classed("open-close-line", true)
			.attr("stroke", "black")
			.attr("stroke-width", "1")
			.attr("x1", (d) => this.scaleX(dateMinuteToDate(d.date, d.minute)))
			.attr("y1", (d) => this.scaleY(d.open))
			.attr("x2", (d) => this.scaleX(dateMinuteToDate(d.date, d.minute)))
			.attr("y2", (d) => this.scaleY(d.close));
	}
}
