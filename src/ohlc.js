import * as d3 from "d3";
import { hierarchy, text } from "d3";
import { title } from "process";
import {
	dateMinuteToDate,
	getPercChange,
	genDateTicksEveryMonth,
} from "./util.js";

export class Ohlc {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#ohlc-vis");
		this.updateBounds();
		this.textRotation = 55;

		this.updateXScale();
		this.updateYScale();
		this.updateXAxis();
		this.updateYAxis();

		// positions tutorial
		let tutorial = this.svg
			.select("g#tutorial")
			.attr(
				"transform",
				`translate(${(this.bounds.maxX - this.bounds.minX) / 2 + 60} ${
					(this.bounds.maxY - this.bounds.minY) / 2
				})`
			);

		this.gas.addEventListenerToEvent("selectedSingleCompany", (_) => {
			tutorial.attr(
				"visibility",
				this.selectedSingleCompany ? "visible" : "hidden"
			);
			this.updateOhlcChart(gas.selectedSingleCompany);
		});

		this.gas.addEventListenerToEvent("date", (_) => {
			this.updatePlayheadLine();
		});
		this.updatePlayheadLine();
		this.setupPlaybackHead();
	}

	updateBounds() {
		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));
		this.bounds = {
			minX: 40,
			maxX: svg_width - 22,
			minY: 20,
			maxY: svg_height - 55,
		};
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
			.attr("y", 0)
			.attr("x", 30)
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
		if (!company) {
			return;
		}
		let domain = d3.extent(company.chart, (d) => d[this.gas.yValueName]);
		let range = [this.bounds.maxY, this.bounds.minY];
		this.scaleY = d3.scaleLinear().domain(domain).range(range);

		this.updateYAxis();

		let series = this.svg.select("g.ohlc-series");
		let bars = series.selectAll("g.ohlc-bar").data(company.chart);
		bars = bars.join("g").classed("ohlc-bar", true);

		//Add company title
		let titleName = this.svg.select("g#title");
		let title = titleName.selectAll("text");
		title.remove();
		titleName
			.append("text")
			.attr("class", "title")
			.attr("x", this.bounds.minX + 5)
			.attr("y", this.bounds.minY - 5)
			.style("fill", "black")
			.text(company.company)
			.attr("text-anchor", "left")
			.style("font-size", "15px");

		let lines = bars.selectAll("line").data(function (d) {
			return [d];
		});
		lines
			.join("line")
			.classed("open-close-line-up-day", (d) => d.close > d.open)
			.classed("open-close-line-down-day", (d) => d.close < d.open)
			.attr("stroke-width", "1")
			.attr("x1", (d) => this.scaleX(dateMinuteToDate(d.date, d.minute)))
			.attr("y1", (d) => this.scaleY(d.open))
			.attr("x2", (d) => this.scaleX(dateMinuteToDate(d.date, d.minute)))
			.attr("y2", (d) => this.scaleY(d.close));
	}

	setupPlaybackHead() {
		let playback_follow = this.svg
			.select("g#playback-follow")
			.datum({ x: this.scaleX(this.gas.date) })
			.attr("transform", (d) => `translate(${d.x} 0)`);

		// Attaches a listener to the gas.date to make the d.x update when the date changes
		this.gas.addEventListenerToEvent("date", (_) =>
			playback_follow.datum({ x: this.scaleX(this.gas.date) })
		);
		let that = this;
		let range = this.scaleX.range();
		let rangePoints = d3.range(range[0], range[1], this.scaleX.step());
		let x = this.bounds.minX;
		let on_drag = function (e, d) {
			let index = d3.bisect(rangePoints, e.x);
			d.x += e.dx;
			d.x = Math.max(that.scaleX.range()[0], d.x);
			d.x = Math.min(d.x, that.bounds.maxX);
			d3.select(this).attr("transform", `translate(${d.x} 0)`);
			that.gas.set_index(index);
		};
		let drag = d3.drag().on("drag", on_drag);
		playback_follow.call(drag);
	}

	updatePlayheadLine() {
		this.svg
			.select("g#playback-follow")
			.attr("transform", `translate(${this.scaleX(this.gas.date)} 0)`);
		this.svg
			.select("g#playback-follow")
			.select("line")
			.attr("y2", this.bounds.maxY);
	}
}
