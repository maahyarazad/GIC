# Feature: Blog Pages & Protected Blog Viewing

## Overview

Design and implement two new Blog-related pages with full SEO support and protected access for authorized users only.

---

## Tasks

### 1. Create a New `Blog Posts` Page

Design and implement a dedicated page named `Blog Posts`.

#### Requirements

- Follow the existing site design system and side color palette.
- Maintain consistent typography, spacing, layout, and component styling used throughout the application.
- Display the list of blog posts in a clean and responsive layout.
- Ensure compatibility with both light and dark themes.
- The page should only be accessible to authorized users.
- Fetch the blog data from the `BlogController`.
- Add any required additional endpoints to support blog listing, filtering, pagination, or metadata retrieval.

---

### 2. Create a Dynamic Blog Details Page

Design and implement a separate Blog Details page that accepts a dynamic `slug` parameter (SEO-friendly blog name in the URL).

#### Requirements

- Use the slug as part of the route for SEO optimization.
- Add full SEO support, including:
  - Dynamic page title
  - Meta description
  - Open Graph tags
  - Structured metadata where applicable
- Fetch the blog data from the `BlogController`.
- Add any required additional endpoints to support fetching blogs by slug and retrieving related comments.
- Display the complete blog content.
- Display all related comments below the blog content section.
- Maintain responsive and consistent UI/UX with the rest of the platform.
- Support both light and dark themes.

---

## Authorization Requirements

- Both pages must be protected and accessible only to authorized users.
- Validate the authenticated user using `appState`.
- Unauthorized users should be redirected or blocked from accessing the pages.