"use client";

import React, { useEffect, useState } from "react";

export function Timer({ startedAt }: { startedAt: number }) {
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);

	const s = Math.max(0, Math.floor((now - startedAt) / 1000));
	const m = String(Math.floor(s / 60)).padStart(2, "0");
	const ss = String(s % 60).padStart(2, "0");

	return (
		<span className="rounded-full bg-black/10 px-3 py-1.5 text-sm font-mono">
			{m}:{ss}
		</span>
	);
}

