export const metadata = {
    title: "System Settings | Admin Dashboard",
    description: "Global platform configuration and settings"
};

import React from "react";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
} 