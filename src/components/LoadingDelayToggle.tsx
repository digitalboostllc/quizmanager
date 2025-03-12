'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useLoadingDelay } from '@/contexts/LoadingDelayContext';
import { ClockIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LoadingDelayToggle() {
    const {
        isLoadingDelayEnabled,
        isPauseEnabled,
        delayDuration,
        enableLoadingDelay,
        disableLoadingDelay,
        enablePauseLoading,
        disablePauseLoading
    } = useLoadingDelay();

    const [localDuration, setLocalDuration] = useState(delayDuration);

    // Log to verify component is mounted
    useEffect(() => {
        console.log('LoadingDelayToggle mounted, isEnabled:', isLoadingDelayEnabled, 'isPaused:', isPauseEnabled, 'duration:', delayDuration);
    }, [isLoadingDelayEnabled, isPauseEnabled, delayDuration]);

    const handleToggle = (checked: boolean) => {
        console.log('Toggle loading delay:', checked);
        if (checked) {
            enableLoadingDelay(localDuration);
        } else {
            disableLoadingDelay();
        }
    };

    const handlePauseToggle = (checked: boolean) => {
        console.log('Toggle pause loading:', checked);
        if (checked) {
            enablePauseLoading();
        } else {
            disablePauseLoading();
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant={isPauseEnabled ? "destructive" : (isLoadingDelayEnabled ? "default" : "outline")}
                    size="sm"
                    className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 p-0"
                >
                    <ClockIcon className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Loading Delay (Developer Mode)</DialogTitle>
                    <DialogDescription>
                        Control artificial loading delays to test skeleton states.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="loading-delay-toggle" className="flex flex-col space-y-1">
                            <span>Enable Loading Delay</span>
                            <span className="font-normal text-sm text-muted-foreground">
                                Forces all data loading to take longer
                            </span>
                        </Label>
                        <Switch
                            id="loading-delay-toggle"
                            checked={isLoadingDelayEnabled}
                            onCheckedChange={handleToggle}
                            disabled={isPauseEnabled}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Delay Duration: {localDuration}ms</Label>
                        <Slider
                            value={[localDuration]}
                            min={500}
                            max={5000}
                            step={500}
                            onValueChange={(value) => setLocalDuration(value[0])}
                            onValueCommit={() => isLoadingDelayEnabled && enableLoadingDelay(localDuration)}
                            disabled={isPauseEnabled}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <Label htmlFor="pause-loading-toggle" className="flex flex-col space-y-1">
                            <span>Pause Loading</span>
                            <span className="font-normal text-sm text-muted-foreground text-destructive">
                                Freezes loading states indefinitely until disabled
                            </span>
                        </Label>
                        <Switch
                            id="pause-loading-toggle"
                            checked={isPauseEnabled}
                            onCheckedChange={handlePauseToggle}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <div className="text-xs text-muted-foreground">
                        For testing skeleton loading states only. Remove before production.
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 