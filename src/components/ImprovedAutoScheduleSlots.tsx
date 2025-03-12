'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlarmClock,
    Calendar,
    Clock,
    LayoutGrid,
    MoreVertical,
    Plus,
    Power,
    Settings2,
    Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TimeSlot {
    id: string;
    dayOfWeek: number;
    timeOfDay: string;
    isActive: boolean;
}

interface NewTimeSlot {
    dayOfWeek: string;
    timeOfDay: string;
}

interface AutoScheduleSlotsProps {
    slots: TimeSlot[];
}

const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

export function ImprovedAutoScheduleSlots({ slots: initialSlots }: AutoScheduleSlotsProps) {
    // State
    const [slots, setSlots] = useState<TimeSlot[]>(initialSlots);
    const [newSlot, setNewSlot] = useState<NewTimeSlot>({
        dayOfWeek: '0',
        timeOfDay: '09:00'
    });
    const [bulkTimes, setBulkTimes] = useState<string[]>(['09:00', '12:00', '15:00', '18:00']);
    const [activeTab, setActiveTab] = useState<string>("add-slots");

    useEffect(() => {
        setSlots(initialSlots);
    }, [initialSlots]);

    // Handlers
    const handleAddSlot = async () => {
        if (!newSlot.dayOfWeek || !newSlot.timeOfDay) {
            toast.error('Please select a day and time');
            return;
        }

        try {
            // In a real app, this would call an API
            const createdSlot: TimeSlot = {
                id: `new-${Date.now()}`,
                dayOfWeek: parseInt(newSlot.dayOfWeek),
                timeOfDay: newSlot.timeOfDay,
                isActive: true,
            };

            setSlots((prev) => [...prev, createdSlot]);
            setNewSlot({
                dayOfWeek: '0',
                timeOfDay: '09:00'
            });
            toast.success('Time slot added successfully');
        } catch {
            toast.error('Failed to add time slot');
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        try {
            // In a real app, this would call an API
            setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
            toast.success('Time slot deleted successfully');
        } catch {
            toast.error('Failed to delete time slot');
        }
    };

    const handleToggleSlot = (slotId: string, isActive: boolean) => {
        setSlots(prev =>
            prev.map(slot =>
                slot.id === slotId ? { ...slot, isActive } : slot
            )
        );
        toast.success(`Slot ${isActive ? 'activated' : 'deactivated'} successfully`);
    };

    const handleBulkCreate = async () => {
        try {
            // In a real app, this would call an API
            const newSlots: TimeSlot[] = [];

            DAYS_OF_WEEK.forEach((_, dayIndex) => {
                bulkTimes.forEach(timeOfDay => {
                    newSlots.push({
                        id: `bulk-${Date.now()}-${dayIndex}-${timeOfDay}`,
                        dayOfWeek: dayIndex,
                        timeOfDay,
                        isActive: true
                    });
                });
            });

            setSlots(prev => [...prev, ...newSlots]);
            toast.success('Bulk slots created successfully');
        } catch (error) {
            console.error('Error creating bulk slots:', error);
            toast.error('Failed to create bulk slots');
        }
    };

    const handleAddBulkTime = () => {
        setBulkTimes([...bulkTimes, '12:00']);
    };

    const handleRemoveBulkTime = (index: number) => {
        setBulkTimes(bulkTimes.filter((_, i) => i !== index));
    };

    const handleUpdateBulkTime = (index: number, value: string) => {
        const newTimes = [...bulkTimes];
        newTimes[index] = value;
        setBulkTimes(newTimes);
    };

    const handleBulkOperation = async (operation: string, data: Record<string, unknown>) => {
        try {
            // In a real app, this would call an API
            if (operation === 'toggleByDay') {
                const { dayOfWeek, isActive } = data as { dayOfWeek: number, isActive: boolean };
                setSlots(prev =>
                    prev.map(slot =>
                        slot.dayOfWeek === dayOfWeek ? { ...slot, isActive } : slot
                    )
                );
            } else if (operation === 'deleteByDay') {
                const { dayOfWeek } = data as { dayOfWeek: number };
                setSlots(prev =>
                    prev.filter(slot => slot.dayOfWeek !== dayOfWeek)
                );
            } else if (operation === 'deleteInactive') {
                setSlots(prev =>
                    prev.filter(slot => slot.isActive)
                );
            } else if (operation === 'deleteByTime') {
                const { timeOfDay } = data as { timeOfDay: string };
                setSlots(prev =>
                    prev.filter(slot => slot.timeOfDay !== timeOfDay)
                );
            }

            toast.success('Operation completed successfully');
        } catch (error) {
            console.error('Error performing bulk operation:', error);
            toast.error('Failed to perform bulk operation');
        }
    };

    // Helper functions
    const getDaySlots = (dayOfWeek: number) => {
        return slots.filter(slot => slot.dayOfWeek === dayOfWeek);
    };

    const getInactiveSlots = () => {
        return slots.filter(slot => !slot.isActive);
    };

    const allDaysWithSlots = () => {
        return DAYS_OF_WEEK.filter((_, index) =>
            slots.some(slot => slot.dayOfWeek === index)
        );
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="add-slots" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="add-slots" className="flex items-center gap-1">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Time Slots
                    </TabsTrigger>
                    <TabsTrigger value="manage-slots" className="flex items-center gap-1">
                        <Settings2 className="h-4 w-4 mr-1" />
                        Manage Existing Slots
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="add-slots" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <AlarmClock className="h-5 w-5 mr-2 text-primary" />
                                Add Individual Slot
                            </CardTitle>
                            <CardDescription>
                                Create a single time slot for a specific day
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                                    <Select
                                        value={newSlot.dayOfWeek}
                                        onValueChange={(value) => setNewSlot({ ...newSlot, dayOfWeek: value })}
                                    >
                                        <SelectTrigger id="dayOfWeek" className="w-[180px]">
                                            <SelectValue placeholder="Select day" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DAYS_OF_WEEK.map((day, index) => (
                                                <SelectItem key={index} value={index.toString()}>
                                                    {day}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timeOfDay">Time (UTC)</Label>
                                    <Input
                                        id="timeOfDay"
                                        type="time"
                                        value={newSlot.timeOfDay}
                                        onChange={(e) => setNewSlot({ ...newSlot, timeOfDay: e.target.value })}
                                        className="w-[180px]"
                                    />
                                </div>

                                <Button onClick={handleAddSlot} className="flex items-center">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Slot
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <LayoutGrid className="h-5 w-5 mr-2 text-primary" />
                                Bulk Time Slot Creation
                            </CardTitle>
                            <CardDescription>
                                Create multiple time slots across all days of the week at once
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Time Slots to Create (UTC)</Label>
                                {bulkTimes.map((time, index) => (
                                    <div key={index} className="flex gap-2 items-center mb-2">
                                        <Input
                                            type="time"
                                            value={time}
                                            onChange={(e) => handleUpdateBulkTime(index, e.target.value)}
                                            className="w-[180px]"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleRemoveBulkTime(index)}
                                            className="h-10 w-10 rounded-full"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6">
                            <Button variant="outline" onClick={handleAddBulkTime} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Another Time
                            </Button>
                            <Button onClick={handleBulkCreate} size="sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Create for All Days
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="manage-slots" className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center">
                                    <Clock className="h-5 w-5 mr-2 text-primary" />
                                    Existing Time Slots
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            Bulk Actions
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => handleBulkOperation('deleteInactive', {})}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete All Inactive ({getInactiveSlots().length})
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardDescription>
                                View and manage your configured scheduling slots
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-2">
                            {slots.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    No time slots have been created yet. Use the "Add Time Slots" tab to create some.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {allDaysWithSlots().map((day, index) => {
                                        const dayIndex = DAYS_OF_WEEK.indexOf(day);
                                        const daySlots = getDaySlots(dayIndex);

                                        return (
                                            <div key={index} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold flex items-center">
                                                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                                                        {day}
                                                        <Badge variant="outline" className="ml-2">
                                                            {daySlots.length} slots
                                                        </Badge>
                                                    </h4>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleBulkOperation('toggleByDay', {
                                                                    dayOfWeek: dayIndex,
                                                                    isActive: true
                                                                })}
                                                            >
                                                                <Power className="w-4 h-4 mr-2 text-green-500" />
                                                                Activate All
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleBulkOperation('toggleByDay', {
                                                                    dayOfWeek: dayIndex,
                                                                    isActive: false
                                                                })}
                                                            >
                                                                <Power className="w-4 h-4 mr-2 text-amber-500" />
                                                                Deactivate All
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleBulkOperation('deleteByDay', { dayOfWeek: dayIndex })}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete All
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {daySlots.map((slot) => (
                                                        <Card
                                                            key={slot.id}
                                                            className={`border ${!slot.isActive ? 'bg-muted/30 border-dashed' : ''}`}
                                                        >
                                                            <CardContent className="p-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Switch
                                                                        checked={slot.isActive}
                                                                        onCheckedChange={(isActive) => handleToggleSlot(slot.id, isActive)}
                                                                    />
                                                                    <div>
                                                                        <div className="font-medium flex items-center">
                                                                            <Clock className="h-4 w-4 mr-1 text-primary" />
                                                                            {slot.timeOfDay}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {slot.isActive ? 'Active' : 'Inactive'} slot
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 