function dateMinuteToDate(date, minute) {
	let datestring = `${date}T${minute}`;
	return new Date(datestring);
}
