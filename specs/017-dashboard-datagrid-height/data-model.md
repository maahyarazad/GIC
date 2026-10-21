# Data Model: Dashboard Data Grid Fixed Height

This feature changes only the UI layout. It adds no data entities, API changes or stored state.

## Layout model

The height chain on desktop and tablet (≥ 601px):

```text
viewport (100dvh)
├── fixed navbar ........................................ 70px (existing)
└── .main-content  [opted in: height calc(100dvh - 70px), flex column, overflow-y auto]
    ├── ☰ .open-sidebar-btn (only < 768px) ............. natural height
    └── .dash-section.dash-section--grid  [flex: 1; min-height: 0; flex column]
        ├── .dash-header (title, count, buttons) ........ natural height
        ├── toolbar(s), e.g. .email-log-toolbar ......... natural height
        └── one of:
            ├── Loader / .dash-empty .................... flex: 1 (keeps the height)
            └── .table-wrapper  [flex: 1; min-height: 20rem; flex column]
                ├── .table-scroll  [flex: 1; min-height: 0; overflow: auto]
                │   └── table > thead th [sticky top: 0]
                └── .grid-pagination ...................... flex: none
```

In the slide-out panel, `.slide-menu__content` (already `flex: 1` inside the `100vh` flex-column `.slide-menu`) takes the place of `.main-content`.

At ≤ 600px (card layout), none of the opted-in sizing applies.

## Opted-in sections (9)

| Section (menu title) | Component | Where |
|---|---|---|
| Member Requests | `ui/src/Components/Dashboard/ContactUsRequests/ContactUsRequests.tsx` | main |
| Member Profiles | `ui/src/Components/Dashboard/User/Profile.tsx` | main |
| Blog | `ui/src/Components/Dashboard/Blog/Blog.tsx` | main |
| Newsletter | `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx` | main |
| Newsletter Subscribers | `ui/src/Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers.tsx` | slide-out panel |
| File Management | `ui/src/Components/Dashboard/FileManagement/FileManagement.tsx` | main |
| Email Templates | `ui/src/Components/Dashboard/EmailTemplate/EmailTemplate.tsx` | main |
| Email Logs | `ui/src/Components/Dashboard/EmailLogs/EmailLogs.tsx` | main |
| Manage Sub Region | `ui/src/Components/Dashboard/Continent/Continent.tsx` | main |
