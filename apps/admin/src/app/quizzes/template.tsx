"use client";

import React from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { LayoutGroup } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
	return (
		<LayoutGroup>
			<PageTransition>{children}</PageTransition>
		</LayoutGroup>
	);
}
