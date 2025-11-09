"use client";

import React from "react";
import { SiteHeader } from "@/components/SiteHeader";
import PremiumPage from "@/components/premium/PremiumPage";

export default function PremiumPageRoute() {
	return (
		<>
			<SiteHeader fadeLogo={true} />
			<PremiumPage />
		</>
	);
}

