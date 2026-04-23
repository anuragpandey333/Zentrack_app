# Profile Photo Consistency Implementation Guide

## Overview
This implementation ensures that user profile photos are consistent across all pages in the Zentrack application using React Context API as a single source of truth.

## Architecture

### 1. **UserContext** (`/frontend/src/context/UserContext.jsx`)
- **Purpose**: Global state management for user data
- **Features**:
  - Fetches user profile on app load
  - Caches data in localStorage for instant load
  - Provides methods to update profile
  - Auto-syncs across all components

### 2. **Avatar Component** (`/frontend/src/components/Avatar.jsx`)
- **Purpose**: Reusable profile photo display
- **Features**:
  - Multiple sizes (xs, sm, md, lg, xl, 2xl, 3xl)
  - Fallback to initials if no image
  - Lazy loading optimization
  - Error handling
  - Loading states

### 3. **Header Component** (`/frontend/src/components/Header.jsx`)
- **Purpose**: Consistent header across all pages
- **Features**:
  - Displays user profile photo
  - Search, notifications, settings
  - Custom action buttons per page
  - Consumes UserContext

### 4. **Layout Component** (`/frontend/src/components/Layout.jsx`)
- **Purpose**: Sidebar navigation with profile
- **Features**:
  - Displays user profile in sidebar
  - Navigation menu
  - Logout functionality
  - Uses Avatar component

## How It Works

### Data Flow:
```
1. User logs in → Token saved
2. App.jsx wraps app with UserProvider
3. UserContext fetches profile from API
4. Profile cached in localStorage
5. All components consume from UserContext
6. Profile update → Context updates → All components re-render
```

### Single Source of Truth:
```javascript
// ❌ OLD WAY (Inconsistent)
const user = JSON.parse(localStorage.getItem('user'));

// ✅ NEW WAY (Consistent)
const { user } = useUser();
```

## Usage Examples

### Using Avatar Component:
```jsx
import Avatar from '../components/Avatar';
import { useUser } from '../context/UserContext';

function MyComponent() {
  const { user } = useUser();
  
  return (
    <Avatar 
      src={user?.picture} 
      alt={user?.name} 
      size="lg" 
    />
  );
}
```

### Using Header Component:
```jsx
import Header from '../components/Header';

function MyPage() {
  return (
    <Layout>
      <Header 
        title="Page Title"
        subtitle="Page description"
        actions={
          <button>Custom Action</button>
        }
      />
      {/* Page content */}
    </Layout>
  );
}
```

### Updating Profile Photo:
```jsx
import { useUser } from '../context/UserContext';

function ProfilePage() {
  const { updateProfilePhoto } = useUser();
  
  const handleUpdate = async (newPhotoUrl) => {
    await updateProfilePhoto(newPhotoUrl);
    // Photo instantly updates everywhere!
  };
}
```

## API Endpoints

### Get User Profile
```
GET /api/user/profile
Headers: Authorization: Bearer <token>
Response: { id, name, email, picture, bio, hobbies }
```

### Update User Profile
```
PUT /api/user/profile
Headers: Authorization: Bearer <token>
Body: { name?, picture?, bio?, hobbies? }
Response: { id, name, email, picture, bio, hobbies }
```

## Benefits

### ✅ Consistency
- Same profile photo everywhere
- Single update point
- No sync issues

### ✅ Performance
- Cached in localStorage
- No unnecessary re-fetches
- Lazy loading images

### ✅ Maintainability
- Reusable components
- Centralized logic
- Easy to update

### ✅ User Experience
- Instant updates
- Smooth transitions
- Fallback handling

## File Structure
```
frontend/src/
├── context/
│   └── UserContext.jsx          # Global user state
├── components/
│   ├── Avatar.jsx               # Reusable avatar
│   ├── Header.jsx               # Page header
│   └── Layout.jsx               # Sidebar layout
├── pages/
│   ├── Profile.jsx              # Profile settings
│   ├── Dashboard.jsx            # Uses Header
│   ├── Transactions.jsx         # Uses Header
│   └── Reports.jsx              # Uses Header
└── App.jsx                      # Wraps with UserProvider
```

## Migration Checklist

To add profile photo to a new page:

1. ✅ Import Header component
2. ✅ Import useUser hook
3. ✅ Replace custom header with `<Header />`
4. ✅ Use `user` from context instead of localStorage
5. ✅ Test profile photo updates

## Example Migration

### Before:
```jsx
function MyPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  
  return (
    <Layout>
      <div className="header">
        <h1>Title</h1>
        <img src={user?.picture} alt="Profile" />
      </div>
    </Layout>
  );
}
```

### After:
```jsx
import Header from '../components/Header';
import { useUser } from '../context/UserContext';

function MyPage() {
  const { user } = useUser();
  
  return (
    <Layout>
      <Header title="Title" />
      {/* Header automatically shows profile photo */}
    </Layout>
  );
}
```

## Testing

1. **Login** → Profile photo should appear in sidebar
2. **Navigate** → Photo consistent across all pages
3. **Update Profile** → Go to Profile page, change photo URL
4. **Verify** → Check all pages, photo should update instantly
5. **Refresh** → Photo should persist after page reload

## Troubleshooting

### Photo not showing?
- Check if user is logged in
- Verify API returns `picture` field
- Check browser console for errors
- Ensure valid image URL

### Photo not updating?
- Check if `updateProfile` is called correctly
- Verify API endpoint is working
- Clear localStorage and re-login
- Check network tab for API calls

### Different photos on different pages?
- Ensure all components use `useUser()` hook
- Remove any localStorage.getItem('user') calls
- Verify UserProvider wraps entire app

## Best Practices

1. **Always use useUser hook** - Never read from localStorage directly
2. **Use Avatar component** - Don't create custom image tags
3. **Use Header component** - Maintain consistency
4. **Handle loading states** - Show skeleton while fetching
5. **Provide fallbacks** - Show initials if no photo

## Future Enhancements

- [ ] Image upload to cloud storage (AWS S3, Cloudinary)
- [ ] Image cropping/resizing
- [ ] Multiple profile photos
- [ ] Avatar customization
- [ ] Gravatar integration
- [ ] WebP format support
- [ ] Progressive image loading

---

**Implementation Date**: 2024
**Last Updated**: Current
**Status**: ✅ Production Ready
