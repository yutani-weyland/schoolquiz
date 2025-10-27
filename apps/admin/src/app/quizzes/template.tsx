"use client";

import React from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	return (
		<LayoutGroup>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.div
					key={pathname}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
				>
					{children}
				</motion.div>
			</AnimatePresence>
		</LayoutGroup>
	);
}
