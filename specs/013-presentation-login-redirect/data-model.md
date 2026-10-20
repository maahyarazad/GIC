# Data Model: Presentation Link Login Redirect

No persisted entities are added or changed.

**Pending destination** (transient): the original request path + query, carried in the `redirect` query parameter of `/login`. Valid only if it is a same-origin absolute path (starts with a single `/`). Discarded after login or when invalid.
