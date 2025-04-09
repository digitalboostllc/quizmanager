"use client";

import { motion } from "framer-motion";
import { Check, Laptop, MoonStar, SunMedium } from "lucide-react";

interface ThemePreviewProps {
    theme: "system" | "light" | "dark";
    isActive: boolean;
    onClick: () => void;
}

export function ThemePreview({ theme, isActive, onClick }: ThemePreviewProps) {
    const getThemeIcon = () => {
        switch (theme) {
            case 'light': return <SunMedium className="h-6 w-6" />;
            case 'dark': return <MoonStar className="h-6 w-6" />;
            default: return <Laptop className="h-6 w-6" />;
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={onClick}
            className={`relative cursor-pointer rounded-lg p-4 transition-all ${isActive
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'border hover:border-primary/25 hover:bg-accent/50'
                }`}
        >
            <div className="space-y-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full mx-auto ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                    {getThemeIcon()}
                </div>
                <div className="text-center space-y-1">
                    <p className="font-medium">{theme.charAt(0).toUpperCase() + theme.slice(1)}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {theme === 'system'
                            ? 'Follow system preference'
                            : `Use ${theme} theme`}
                    </p>
                </div>
                {isActive && (
                    <motion.div
                        className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.3 }}
                    >
                        <Check className="h-3 w-3" />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
} 