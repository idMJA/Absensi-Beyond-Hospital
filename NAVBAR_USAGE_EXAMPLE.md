# Navbar Usage Examples

## Dashboard Page
```tsx
import { Navbar } from "@/components/Navbar";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Rest of your dashboard content */}
    </div>
  );
}
```

## Admin Page
```tsx
import { Navbar } from "@/components/Navbar";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar showBackButton={true} />
      {/* Rest of your admin content */}
    </div>
  );
}
```

## Features
- ✅ **Zero configuration**: Just `<Navbar />` - no props needed for basic usage
- ✅ **Self-contained**: Handles all user data fetching internally
- ✅ **Auto-redirect**: Automatically redirects to login if not authenticated
- ✅ **Admin detection**: Automatically shows/hides admin button based on user permissions
- ✅ **Responsive design**: Works on all screen sizes
- ✅ **Consistent styling**: Same look across all pages

## Props (Optional)
- `showBackButton?: boolean` - Shows back to dashboard button (for admin pages)
- `onBack?: () => void` - Custom back button handler (optional)

The Navbar component now:
1. Fetches user data automatically
2. Handles authentication checks
3. Manages logout functionality
4. Shows admin button only to authorized users
5. Provides consistent UI across all pages
