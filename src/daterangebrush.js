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
			minX: 10,
			maxX: svg_width - 10,
			minY: 5,
			maxY: svg_height - 5,
		};
		this.handleWidth = 30;
		this.handleHeight = 30;
		this.svg
			.selectAll("image")
			.attr("width", this.handleWidth)
			.attr("height", this.handleHeight);
		this.handleLeft = this.svg.select("image#handle-left");
		this.handleRight = this.svg.select("image#handle-right");

		this.updateScaleX();
		this.drawXAxis();
		this.createBrush();
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
		axisG.attr(
			"transform",
			`translate(0 ${(this.bounds.maxY - this.bounds.minY) / 2})`
		);
	}

	createBrush() {
		let that = this;

		let domain = that.scaleX.domain();
		let range = that.scaleX.range();
		let rangePoints = d3.range(range[0], range[1], that.scaleX.step());

		let brushed = function (selection) {
			d3.select(this).call(brushedHandle, selection);
			let xPosMin = selection.selection[0];
			let left_index = d3.bisect(rangePoints, xPosMin) - 1;

			let xPosMax = selection.selection[1];
			let right_index = d3.bisect(rangePoints, xPosMax) - 1;
			that.gas.set_indexPlottedRange([left_index, right_index]);
		};
		let brushedHandle = function (g, selection) {
			that.handleLeft.attr(
				"transform",
				`rotate(90) translate(0 ${
					-1 * selection.selection[0] - that.handleWidth / 2
				})`
			);
			that.handleRight.attr(
				"transform",
				`rotate(90) translate(0 ${
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
			.on("start brush end", brushed);

		this.svg
			.select("g#controls")
			.call(brush)
			.call(brush.move, [this.bounds.minX, this.bounds.maxX]);
	}
}
