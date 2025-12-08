import React, { useEffect } from "react";
import { useHeadManager } from "../HeadManager";

interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  schema?: Record<string, any> | null; // JSON-LD object
}

export default function Seo({
  title,
  description,
  canonical,
  image,
  schema = null,
}: SeoProps) {
  const manager = useHeadManager();

  useEffect(() => {
    if (!manager) return;

    if (title) manager.pushTitle(title);
    if (description)
      manager.pushMeta({ name: "description", content: description });
    if (image) manager.pushMeta({ property: "og:image", content: image });
    if (title) manager.pushMeta({ property: "og:title", content: title });
    if (description)
      manager.pushMeta({ property: "og:description", content: description });
    if (title) manager.pushMeta({ name: "twitter:title", content: title });
    if (description)
      manager.pushMeta({ name: "twitter:description", content: description });
    if (image) manager.pushMeta({ name: "twitter:image", content: image });
    if (canonical) manager.pushLink({ rel: "canonical", href: canonical });

    if (schema) {
      // store stringified JSON-LD for server injection
      manager.pushScript(JSON.stringify(schema));
    }

    // On client we don't remove anything here (server rendered head already present).
  }, [title, description, canonical, image, JSON.stringify(schema), manager]);

  return null; // no DOM output
}
