function dateMinuteToDate(date, minute) {
	//let datestring = `${date}T0${minute}`;
	// Back hack for now. Hardcoded minutes
	let datestring = `${date}T09:30`;
	return new Date(datestring);
}

function getPercChange(row, index, yValueName, zeroeth_index = 0) {
	row["percentChange"] =
		(row.chart[index][yValueName] / row.chart[zeroeth_index][yValueName] - 1) *
		100;
	row.chart[index]["percentChange"] =
		(row.chart[index][yValueName] / row.chart[zeroeth_index][yValueName] - 1) *
		100;
	return (
		(row.chart[index][yValueName] / row.chart[zeroeth_index][yValueName] - 1) *
		100
	);
}

function removeVanguardPrefixFromSector(stringName) {
	return stringName.replace(/^(Vanguard ETF )/, "");
}

function genDateTicksEveryN(chart, n) {
	let dateTicks = [];
	chart.forEach((d, i) => {
		if (i % n === 0) {
			dateTicks.push(dateMinuteToDate(d.date, d.minute));
		}
	});
	return dateTicks;
}

function genDateTicksEveryMonth(chart) {
	let dateTicks = [];
	chart.forEach((d) => {
		let date = dateMinuteToDate(d.date, d.minute);
		if (
			dateTicks.length === 0 ||
			date.getMonth() !== dateTicks[dateTicks.length - 1].getMonth()
		) {
			dateTicks.push(date);
		}
	});
	return dateTicks;
}

export {
	dateMinuteToDate,
	getPercChange,
	removeVanguardPrefixFromSector,
	genDateTicksEveryN,
	genDateTicksEveryMonth,
};
