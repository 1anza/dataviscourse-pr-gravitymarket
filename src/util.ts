function dateMinuteToDate(date: string, minute: string) {
	//let datestring = `${date}T0${minute}`;
	// Back hack for now. Hardcoded minutes
	let datestring = `${date}T09:30`;
	return new Date(datestring);
}

function getPercChange(row, index, yValueName) {
	return (row.chart[index][yValueName] / row.chart[0][yValueName] - 1) * 100;
}

export {dateMinuteToDate, getPercChange};
