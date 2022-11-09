function dateMinuteToDate(date, minute) {
	let datestring = `${date}T${minute}`;
	return new Date(datestring);
}

function getPercChange(row, index, yValueName) {
	return (
		(row.chart[index][yValueName] /
			row.chart[0][yValueName] -
			1) *
		100
	);
}
