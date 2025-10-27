"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface QuizFiltersProps {
	allTags: string[];
}

export function QuizFilters({ allTags }: QuizFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	const q = params.get("q") ?? "";
	const sort = params.get("sort") ?? "new";
	const tags = new Set((params.get("tags") ?? "").split(",").filter(Boolean));

	function setParam(key: string, value?: string) {
		const next = new URLSearchParams(params.toString());
		if (!value) next.delete(key);
		else next.set(key, value);
		router.replace(`${pathname}?${next.toString()}`);
	}

	function toggleTag(tag: string) {
		const next = new URLSearchParams(params.toString());
		const current = new Set((next.get("tags") ?? "").split(",").filter(Boolean));
		if (current.has(tag)) current.delete(tag); else current.add(tag);
		const value = Array.from(current).join(",") || undefined;
		if (!value) next.delete("tags"); else next.set("tags", value);
		router.replace(`${pathname}?${next.toString()}`);
	}

	return (
		<div className="sticky top-16 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-900/70 border-b border-neutral-200/60 dark:border-neutral-800">
			<div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 md:items-center">
				<input
					value={q}
					onChange={(e) => setParam("q", e.currentTarget.value || undefined)}
					placeholder="Search by title or tag…"
					className="w-full md:max-w-md rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					aria-label="Search by title or tag"
				/>
				<select
					value={sort}
					onChange={(e) => setParam("sort", e.currentTarget.value)}
					className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
					aria-label="Sort quizzes"
				>
					<option value="new">Newest</option>
					<option value="old">Oldest</option>
					<option value="az">A → Z</option>
				</select>
				<div className="flex flex-wrap gap-2">
					{allTags.map((t) => (
						<button
							key={t}
							onClick={() => toggleTag(t)}
							className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
								tags.has(t)
									? "bg-blue-600 text-white border-transparent"
									: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
							}`}
							aria-pressed={tags.has(t)}
						>
							{t}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
