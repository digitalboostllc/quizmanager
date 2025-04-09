# Templates Design System

This document outlines the design patterns, components, and layout structures used across the template-related pages in the dashboard.

## Pages

The templates section consists of three main pages:

1. **Templates List** (`/dashboard/templates`)
   - Overview of all templates
   - Filtering and searching capabilities
   - Card-based grid layout

2. **New Template** (`/dashboard/templates/new`)
   - Step-by-step creation flow
   - Form-based input with live preview
   - Progressive disclosure of complexity

3. **Template Detail** (`/dashboard/templates/[id]`)
   - Edit existing template with tabbed interface
   - Live preview of template
   - Metadata and publishing controls

## Common UI Patterns

### Header Structure

```
<div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
    <div className="absolute inset-0" style={gridBgStyle}></div>
    <div className="p-6 relative">
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <!-- Header content -->
            </div>
        </div>
    </div>
</div>
```

- Background pattern with grid using CSS
- Responsive layout with column on mobile, row on desktop
- Left side: Title, badge, description
- Right side: Action buttons

### Page Layout

```
<div className="pt-6">
    <!-- Header component -->
    
    <!-- Main content with grid layout -->
    <div className="grid grid-cols-12 gap-6">
        <!-- Main content - 8 columns on large screens -->
        <div className="col-span-12 lg:col-span-8">
            <!-- Primary content -->
        </div>
        
        <!-- Sidebar/Preview - 4 columns on large screens -->
        <div className="col-span-12 lg:col-span-4">
            <!-- Preview/supplementary content -->
        </div>
    </div>
</div>
```

- Consistent padding at the top
- 12-column grid system
- Main content takes 8/12 columns on desktop
- Preview/sidebar takes 4/12 columns on desktop
- Full width (12/12) for both sections on mobile

### Card Structure

```
<Card className="border shadow-sm">
    <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Section Title</CardTitle>
            <Badge>Optional Badge</Badge>
        </div>
    </CardHeader>
    <CardContent className="pt-6 space-y-6">
        <!-- Card content -->
    </CardContent>
</Card>
```

- Consistent border and shadow
- Header with bottom border
- Flexible space between title and optional badge
- Consistent padding in content area
- Vertical spacing between content elements

### Button Patterns

Primary actions (right-aligned):
```
<Button>
    <IconComponent className="mr-2 h-4 w-4" />
    Primary Action
</Button>
```

Secondary actions (left-aligned):
```
<Button variant="outline">
    <IconComponent className="mr-2 h-4 w-4" />
    Secondary Action
</Button>
```

Navigation buttons:
```
<Button variant="ghost" size="icon" className="h-8 w-8">
    <ArrowLeft className="h-4 w-4" />
    <span className="sr-only">Description</span>
</Button>
```

### Badge Styles

Quiz type badges:
```
<Badge 
    variant="outline" 
    className={quizTypeDetails?.color || "bg-gray-500/10 text-gray-500 border-gray-200"}
>
    {quizTypeDetails?.name}
</Badge>
```

Status badges:
```
<!-- Public -->
<Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
    <Globe className="h-3 w-3 mr-1" />
    Public
</Badge>

<!-- Private -->
<Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-200">
    <Lock className="h-3 w-3 mr-1" />
    Private
</Badge>
```

### Icon Standards

Section headings:
```
<div className="flex items-center gap-2 mb-2">
    <FileCode className="h-5 w-5 text-primary" />
    <h3 className="font-medium text-base">Section Title</h3>
</div>
```

Buttons:
- Icon size: `h-4 w-4`
- Margin right when with text: `mr-2`

Badges:
- Icon size: `h-3 w-3`
- Margin right: `mr-1`

### Form Components

Standard form field:
```
<FormField
    control={form.control}
    name="fieldName"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Field Label</FormLabel>
            <FormControl>
                <Input placeholder="Placeholder text" {...field} />
            </FormControl>
            <FormDescription>
                Helper text for this field
            </FormDescription>
            <FormMessage />
        </FormItem>
    )}
/>
```

Text area for code:
```
<FormField
    control={form.control}
    name="code"
    render={({ field }) => (
        <FormItem>
            <FormControl>
                <Textarea
                    placeholder="Enter code"
                    className="font-mono min-h-[250px]"
                    {...field}
                />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Preview Card

```
<Card className="sticky top-20 border shadow-sm">
    <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-base">
                    Live Preview
                </CardTitle>
                <CardDescription>
                    How your template will look
                </CardDescription>
            </div>
        </div>
    </CardHeader>
    <CardContent className="p-4 space-y-4">
        <!-- Preview content -->
    </CardContent>
</Card>
```

- Sticky positioning on desktop
- Smaller title text size
- Reduced padding in the header
- Content with consistent spacing

## Colors

- Primary with opacity: `bg-primary/5`, `bg-primary/10`
- Muted backgrounds: `bg-muted/20`, `bg-muted/50`, `bg-muted/60`
- Status colors:
  - Success: `bg-green-500/10 text-green-500 border-green-200`
  - Neutral: `bg-slate-500/10 text-slate-500 border-slate-200`
  - Premium: `bg-amber-500/10 text-amber-500 border-amber-200`
  - Info: `bg-blue-500/10 text-blue-500 border-blue-200`
  - Special: `bg-purple-500/10 text-purple-500 border-purple-200`

## Background Color Usage Rules

To maintain visual consistency across the application, follow these strict rules for background colors:

### Solid Backgrounds

- Card backgrounds: `bg-background` (no opacity modifier)
- Primary button backgrounds: `bg-primary` (no opacity modifier)
- Secondary button backgrounds: `bg-secondary` (no opacity modifier)
- Destructive button backgrounds: `bg-destructive` (no opacity modifier)

### Subtle Backgrounds (Sections & Containers)

- Page section containers: `bg-muted/10`
- Card section backgrounds: `bg-muted/20`
- Filter/toolbar areas: `bg-muted/20`
- Table header backgrounds: `bg-muted/20`

### Accent Backgrounds (Visual Highlights)

- Page headers: `bg-primary/5` with pattern overlay
- Feature highlights: `bg-primary/10`
- Card hover states: `hover:bg-primary/5`
- Selected items: `bg-primary/10`

### Status & Badge Backgrounds

Always use consistent opacity for each color:
- Success indicators: `bg-green-500/10`
- Error/destructive indicators: `bg-red-500/10`
- Warning indicators: `bg-amber-500/10`
- Info indicators: `bg-blue-500/10`
- Premium/special indicators: `bg-purple-500/10`

### Hover State Backgrounds

- Button hovers: Solid colors (no opacity) with brightness adjustments
- Card hovers: `hover:bg-muted/30` or `hover:bg-primary/5`
- Interactive items: `hover:bg-muted/40`

### Form Element Backgrounds

- Input fields: `bg-background` (solid)
- Input field hover: `hover:bg-muted/20`
- Disabled inputs: `bg-muted/20`
- Form section backgrounds: `bg-muted/10`

This standardization ensures visual consistency and proper contrast across the application.

## Typography

- Page headings: `text-2xl md:text-3xl font-bold tracking-tight`
- Card titles: `text-xl font-medium`
- Section headings: `text-base font-medium`
- Body text: Default or `text-sm`
- Helper text: `text-sm text-muted-foreground`
- Code snippets: `font-mono`

## Layout Spacing

- Page top padding: `pt-6`
- Gap between grid items: `gap-6`
- Space between card sections: `space-y-6`
- Section/subsection margins: `mb-6`
- Inline item spacing: `gap-2`
- Form field groups: `space-y-3`

## Responsive Behavior

- Column layout on mobile, row layout on desktop for headers
- Full width components on mobile, grid-based layout on desktop
- No sticky positioning on mobile
- Font sizes adjust between mobile and desktop

## Tabbed Interface

New design with tabs inside card header:
```
<Card className="border shadow-sm">
    <CardHeader className="pb-4 border-b">
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Card Title</CardTitle>
                <Badge>Optional Badge</Badge>
            </div>
            <TabsList className="w-full grid grid-cols-3 h-9">
                <TabsTrigger value="tab1" className="text-xs">
                    <Icon1 className="w-4 h-4 mr-2" />
                    Tab 1
                </TabsTrigger>
                <TabsTrigger value="tab2" className="text-xs">
                    <Icon2 className="w-4 h-4 mr-2" />
                    Tab 2
                </TabsTrigger>
                <TabsTrigger value="tab3" className="text-xs">
                    <Icon3 className="w-4 h-4 mr-2" />
                    Tab 3
                </TabsTrigger>
            </TabsList>
        </div>
    </CardHeader>
    <CardContent className="pt-6">
        <TabsContent value="tab1">
            <!-- Content for Tab 1 -->
        </TabsContent>
        <TabsContent value="tab2">
            <!-- Content for Tab 2 -->
        </TabsContent>
        <TabsContent value="tab3">
            <!-- Content for Tab 3 -->
        </TabsContent>
    </CardContent>
</Card>
``` 