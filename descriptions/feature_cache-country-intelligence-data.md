## Feature - Cache Country Intelligence Data

## Description

1. Implement a server-side caching service for all `/product` and `/continent` endpoints.
2. Cache the responses to improve performance and reduce database queries.
3. Invalidate the cache automatically whenever any product data is created, updated, or deleted, ensuring that clients always receive the latest information.


# Part 2

## Improve the Compare Card Header UX

## Target Files:
1. CompareCountries.scss
2. CompareCountries.tsx

### Description

1. Make the `.compare-card-head` sticky once it scrolls out of the viewport.
2. When it becomes sticky:
   - Smoothly transition into the sticky state.
   - Shrink its size to **50%** of the original.
3. When the user scrolls back to the top:
   - Smoothly restore the header to its original size and position.
4. Apply the behavior to the following component:

```jsx
<div className="compare-card-head">
  {country?.code && (
    <span
      className={`fi fi-${country.code.toLowerCase()} compare-flag`}
      aria-hidden="true"
    />
  )}
  <span className="compare-card-name">
    {country?.name ?? "Unknown"}
  </span>
</div>
```