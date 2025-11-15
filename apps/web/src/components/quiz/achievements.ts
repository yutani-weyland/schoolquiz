import { Achievement } from "./AchievementNotification";

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'id' | 'unlockedAt'>[] = [
	{
		name: "Perfect Round",
		description: "Go 6/6 in any round",
		icon: "🏆",
		iconColor: "#FFD700",
		rarity: 12, // 12% of players
	},
	{
		name: "History Buff",
		description: "Get a total of 50 history questions correct",
		icon: "📚",
		iconColor: "#8B4513",
		rarity: 8,
	},
	{
		name: "The People's Champ",
		description: "Ace the community People's Question",
		icon: "👑",
		iconColor: "#C084FC",
		rarity: 5,
	},
	{
		name: "Speed Demon",
		description: "Complete a quiz in less than 10 minutes",
		icon: "⚡",
		iconColor: "#FF10F0",
		rarity: 15,
	},
	{
		name: "I was here!",
		description: "Complete the first quiz",
		icon: "🌟",
		iconColor: "#FFE135",
		rarity: 3, // Exclusive to first quiz
	},
	{
		name: "Perfect Quiz",
		description: "Get all 25 questions correct",
		icon: "💎",
		iconColor: "#00E5FF",
		rarity: 2,
	},
	{
		name: "HAIL, CAESAR!",
		description: "Sweep every question in a Roman history category",
		icon: "🦅",
		iconColor: "#B8860B",
		rarity: 4,
		artworkSrc: "/achievements/hail-caesar.png",
		artworkAlt: "Golden laurel profile badge",
	},
];

export type AchievementKey = 
	| "perfect_round"
	| "history_buff"
	| "peoples_champ"
	| "speed_demon"
	| "i_was_here"
	| "perfect_quiz"
	| "hail_caesar";

export const ACHIEVEMENT_MAP: Record<AchievementKey, Omit<Achievement, 'id' | 'unlockedAt'>> = {
	perfect_round: ACHIEVEMENT_DEFINITIONS[0],
	history_buff: ACHIEVEMENT_DEFINITIONS[1],
	peoples_champ: ACHIEVEMENT_DEFINITIONS[2],
	speed_demon: ACHIEVEMENT_DEFINITIONS[3],
	i_was_here: ACHIEVEMENT_DEFINITIONS[4],
	perfect_quiz: ACHIEVEMENT_DEFINITIONS[5],
	hail_caesar: ACHIEVEMENT_DEFINITIONS[6],
};

export interface AchievementProgress {
	achievementKey: AchievementKey;
	progress: number;
	target: number;
}


