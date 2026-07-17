## Feature - Cache Country Intelligence Data

## Description

1. Implement a server-side caching service for all `/product` and `/continent` endpoints.
2. Cache the responses to improve performance and reduce database queries.
3. Invalidate the cache automatically whenever any product data is created, updated, or deleted, ensuring that clients always receive the latest information.