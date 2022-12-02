import * as d3 from "d3";
import percentile from "percentile";
import {
	dateMinuteToDate,
	getPercChange,
	removeVanguardPrefixFromSector,
	genDateTicksEveryMonth,
} from "./util.js";
import { GlobalAppState } from "./globalAppState.js";

export class DateRangeBrush {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#daterangebrush");
		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));
		this.bounds = {
			minX: 40,
			maxX: svg_width - 40,
			minY: 5,
			maxY: svg_height - 10,
		};
		this.handleWidth = 20;
		this.handleHeight = 20;
		this.svg
			.selectAll("image")
			.attr("width", this.handleWidth)
			.attr("height", this.handleHeight);
		this.handleLeft = this.svg.select("image#handle-left");
		this.handleRight = this.svg.select("image#handle-right");

		this.updateScaleX();
		this.drawXAxis();
		this.createBrush();
		this.updatePlaybackHead();
		this.setupPlaybackHead();

		this.gas.addEventListenerToEvent("date", (_) => {
			this.updatePlaybackHead();
		});
	}

	updateScaleX() {
		let scale = this.gas.genDateDomain();
		let range = [this.bounds.minX, this.bounds.maxX];
		this.scaleX = scale.range(range);
	}

	drawXAxis() {
		let axisG = this.svg.select("g#x-axis");
		let axisX = d3
			.axisBottom()
			.scale(this.scaleX)
			.tickValues(genDateTicksEveryMonth(this.gas.data[0].chart))
			.tickFormat(d3.timeFormat("%b"));
		axisG.call(axisX);
		axisG.attr("transform", `translate(0 ${this.bounds.maxY - 10})`);
	}

	createBrush() {
		let that = this;
		let range = that.scaleX.range();
		let rangePoints = d3.range(range[0], range[1], that.scaleX.step());

		let brushed = function (selection) {
			let xPosMin = selection.selection[0];
			let left_index = d3.bisect(rangePoints, xPosMin) - 1;

			let xPosMax = selection.selection[1];
			let right_index = d3.bisect(rangePoints, xPosMax) - 1;
			that.gas.set_indexPlottedRange([left_index, right_index]);
		};
		let brushedHandle = function (selection) {
			let y_val = that.bounds.minY;
			that.handleLeft.attr(
				"transform",
				`rotate(90) translate(${y_val} ${
					-1 * selection.selection[0] - that.handleWidth / 2
				})`
			);
			that.handleRight.attr(
				"transform",
				`rotate(90) translate(${y_val} ${
					-1 * selection.selection[1] - that.handleWidth / 2
				})`
			);
		};

		let brush = d3
			.brushX()
			.extent([
				[this.bounds.minX, this.bounds.minY],
				[this.bounds.maxX, this.bounds.maxY],
			])
			.handleSize(15)
			.on("start brush end", brushedHandle)
			.on("end", brushed);

		this.svg
			.select("g#controls")
			.call(brush)
			.call(brush.move, [this.bounds.minX, this.bounds.maxX]);
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

	updatePlaybackHead() {
		this.svg
			.select("g#playback-follow")
			.attr("transform", `translate(${this.scaleX(this.gas.date)} 0)`);
	}
}
