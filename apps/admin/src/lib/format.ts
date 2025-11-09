export function formatWeek(weekISO: string): string {
	const d = new Date(weekISO);
	if (isNaN(d.getTime())) return weekISO;
	
	// Use consistent formatting to avoid hydration errors
	// Format: "Jan 15, 2024" (consistent across server/client)
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const month = months[d.getMonth()];
	const day = d.getDate();
	const year = d.getFullYear();
	
	return `${month} ${day}, ${year}`;
}
