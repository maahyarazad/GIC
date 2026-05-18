# Dashboard UI Styling Consistency

## Task

Use the same font family, typography, spacing, and overall styling from the `Blog(1)` section and apply them consistently to the following Dashboard components:

```tsx
const componentMap: Record<MenuItem, React.ReactNode> = {
  member_profiles: <UserProfilesDataGrid />,
  sitedata: <JsonViewer />,
  file_management: <FileManagement />,
  email_management: <EmailTemplatesDataGrid />,
  sub_region_management: <Continent />,
  country_intelligence: <EconomicInsights />,
  events: <Events />,
  profile: <UserProfileForm initialProfile={userProfile} />,
  logout: <LogoutComponent />,
};