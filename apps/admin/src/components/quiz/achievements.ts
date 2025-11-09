import { Achievement } from "./AchievementNotification";

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'id' | 'unlockedAt'>[] = [
	{
		name: "Hail Caesar",
		description: "Sweep every question in a Roman history category",
		icon: "🦅",
		iconColor: "#B8860B",
		rarity: 4,
		artworkSrc: "/achievements/hail-caesar.png",
		artworkAlt: "Golden laurel profile badge",
	},
	{
		name: "The Hook",
		description: "Answer 10 questions correctly in a row",
		icon: "🎣",
		iconColor: "#00CED1",
		rarity: 10,
		artworkSrc: "/achievements/the-hook.png",
		artworkAlt: "Fishing hook achievement badge",
	},
	{
		name: "Ace",
		description: "Get a perfect score on a sports-themed round",
		icon: "🎾",
		iconColor: "#00FF00",
		rarity: 7,
		artworkSrc: "/achievements/ace.png",
		artworkAlt: "Tennis racket and ball achievement badge",
	},
	{
		name: "Unstoppable",
		description: "Complete 5 quizzes in a single week",
		icon: "🚀",
		iconColor: "#4169E1",
		rarity: 6,
		artworkSrc: "/achievements/unstoppable.png",
		artworkAlt: "Tank with speed lines achievement badge",
	},
	{
		name: "Flashback",
		description: "Revisit and complete a quiz from 3 weeks ago",
		icon: "⏪",
		iconColor: "#87CEEB",
		rarity: 9,
		artworkSrc: "/achievements/flashback.png",
		artworkAlt: "Clock with counter-clockwise arrow achievement badge",
	},
];

export type AchievementKey = 
	| "hail_caesar"
	| "the_hook"
	| "ace"
	| "unstoppable"
	| "flashback";

export const ACHIEVEMENT_MAP: Record<AchievementKey, Omit<Achievement, 'id' | 'unlockedAt'>> = {
	hail_caesar: ACHIEVEMENT_DEFINITIONS[0],
	the_hook: ACHIEVEMENT_DEFINITIONS[1],
	ace: ACHIEVEMENT_DEFINITIONS[2],
	unstoppable: ACHIEVEMENT_DEFINITIONS[3],
	flashback: ACHIEVEMENT_DEFINITIONS[4],
};

export interface AchievementProgress {
	achievementKey: AchievementKey;
	progress: number;
	target: number;
}


