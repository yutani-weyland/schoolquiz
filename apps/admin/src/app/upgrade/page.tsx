"use client";

import React from "react";
import { SiteHeader } from "@/components/SiteHeader";
import UpgradePage from "@/components/auth/UpgradePage";

export default function UpgradePageRoute() {
	return (
		<>
			<SiteHeader />
			<main className="min-h-screen pt-24 pb-12">
				<UpgradePage />
			</main>
		</>
	);
}

