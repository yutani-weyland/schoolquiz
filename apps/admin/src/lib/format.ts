export function formatWeek(weekISO: string): string {
	const d = new Date(weekISO);
	if (isNaN(d.getTime())) return weekISO;
	return d.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}
