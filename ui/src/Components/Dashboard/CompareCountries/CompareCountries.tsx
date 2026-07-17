import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import Loader from "@/Components/Loader/Loader";
import { useToast } from "@/Providers/ToastContext";
import "flag-icons/css/flag-icons.min.css";
import "./CompareCountries.css";

/* ──────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */
interface Country {
  _id: string;
  name: string;
  code: string;
}

interface Region {
  _id: string;
  name: string;
  countries: Country[];
}

/* ──────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────── */

/** camelCase / PascalCase key -> human label, e.g. "gdpGrowthRate2024" -> "Gdp Growth Rate 2024". */
const humanize = (key: string): string => {
  const spaced = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Build the composite field id used to track a selected field. */
const fieldId = (category: string, field: string) => `${category}.${field}`;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Recursively renders a metadata value down to its leaf nodes, so we display the
 * value stored deep in the tree rather than only the parent key.
 */
const MetaNodes: React.FC<{ label: string; value: unknown; depth: number }> = React.memo(({
  label,
  value,
  depth,
}) => {
  const pad = { paddingLeft: depth * 14 };

  if (value === null || value === undefined || value === "") {
    return (
      <div className="compare-leaf" style={pad}>
        <span className="compare-leaf-label">{label}</span>
        <span className="compare-leaf-value">—</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className="compare-leaf" style={pad}>
          <span className="compare-leaf-label">{label}</span>
          <span className="compare-leaf-value">—</span>
        </div>
      );
    }
    return (
      <div className="compare-branch" style={pad}>
        <div className="compare-branch-label">{label}</div>
        {value.map((item, i) => (
          <MetaNodes key={i} label={`#${i + 1}`} value={item} depth={depth + 1} />
        ))}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <div className="compare-branch" style={pad}>
        <div className="compare-branch-label">{label}</div>
        {Object.entries(value).map(([k, v]) => (
          <MetaNodes key={k} label={humanize(k)} value={v} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="compare-leaf" style={pad}>
      <span className="compare-leaf-label">{label}</span>
      <span className="compare-leaf-value">{String(value)}</span>
    </div>
  );
});

/* ──────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */
const CompareCountries: React.FC = () => {
  const { show } = useToast();

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  // countryId -> full metadata object
  const [metadataById, setMetadataById] = useState<Record<string, Record<string, any>>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [addPanelOpen, setAddPanelOpen] = useState(true);
  const [fieldsPanelOpen, setFieldsPanelOpen] = useState(true);

  /* ── Initial load: regions (continents + their countries) ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const continentsRes = await axiosInstance.get("/continents");

      const continents: Array<{ _id: string; name: string }> =
        continentsRes.data?.data?.continents ?? [];

      const withCountries = await Promise.all(
        continents.map(async (c) => {
          try {
            const res = await axiosInstance.get(`/products/by-parent/${c._id}`);
            const countries: Country[] = (res.data?.products ?? []).map((p: any) => ({
              _id: String(p._id),
              name: p.name,
              code: p.code ?? "",
            }));
            return { _id: c._id, name: c.name, countries };
          } catch {
            return { _id: c._id, name: c.name, countries: [] as Country[] };
          }
        })
      );

      setRegions(withCountries.filter((r) => r.countries.length > 0));
    } catch (err) {
      console.error(err);
      show({ type: "error", message: "Failed to load comparison data" });
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Fetch full metadata for any newly-selected country (cached).
   *
   * Reads the already-loaded metadata from a ref so this effect depends ONLY on
   * `selectedCountryIds` — NOT on `metadataById`. Depending on `metadataById`
   * (which this effect also writes) makes it re-run on every metadata update,
   * causing redundant re-fetches and loading on/off churn that janks scrolling.
   */
  const metadataByIdRef = useRef(metadataById);

  useEffect(() => {
    const missing = selectedCountryIds.filter((id) => !metadataByIdRef.current[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      setLoadingMetadata(true);
      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const res = await axiosInstance.get(`/products/${id}/metadata`);
              return [id, res.data?.data?.metadata ?? {}] as const;
            } catch {
              return [id, {}] as const;
            }
          })
        );
        if (cancelled) return;
        setMetadataById((prev) => {
          const next = { ...prev };
          for (const [id, meta] of results) next[id] = meta;
          metadataByIdRef.current = next; // keep the ref in sync with state
          return next;
        });
      } finally {
        if (!cancelled) setLoadingMetadata(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCountryIds]);

  /* ── Lookups ── */
  const countryById = useMemo(() => {
    const map: Record<string, Country> = {};
    for (const r of regions) for (const c of r.countries) map[c._id] = c;
    return map;
  }, [regions]);

  /**
   * The category/field structure is derived from the real metadata of the
   * selected countries (union of keys) rather than a static schema, so it always
   * matches the actual data shape and adapts as new fields appear.
   */
  const categories = useMemo(() => {
    const catFields: Record<string, Set<string>> = {};
    for (const id of selectedCountryIds) {
      const meta = metadataById[id];
      if (!meta) continue;
      for (const [cat, val] of Object.entries(meta)) {
        catFields[cat] ??= new Set<string>();
        if (val && typeof val === "object" && !Array.isArray(val)) {
          for (const f of Object.keys(val)) catFields[cat].add(f);
        }
      }
    }
    return Object.entries(catFields)
      .map(([key, set]) => ({ key, fields: Array.from(set) }))
      .filter((c) => c.fields.length > 0);
  }, [metadataById, selectedCountryIds]);

  /* ── Selection handlers ── */
  const toggleCountry = (id: string) =>
    setSelectedCountryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const removeCountry = (id: string) =>
    setSelectedCountryIds((prev) => prev.filter((x) => x !== id));

  const toggleField = (id: string) =>
    setSelectedFields((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAllFields = (category: string, fields: string[], selectAll: boolean) => {
    const ids = fields.map((f) => fieldId(category, f));
    setSelectedFields((prev) => {
      const withoutCategory = prev.filter((id) => !ids.includes(id));
      return selectAll ? [...withoutCategory, ...ids] : withoutCategory;
    });
  };

  const toggleRegion = (id: string) =>
    setExpandedRegions((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleCategory = (key: string) =>
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Comparison groups (category -> selected fields) ── */
  const comparisonGroups = useMemo(() => {
    return categories
      .map((cat) => ({
        key: cat.key,
        fields: cat.fields.filter((f) => selectedFields.includes(fieldId(cat.key, f))),
      }))
      .filter((cat) => cat.fields.length > 0);
  }, [categories, selectedFields]);

  const hasComparison = selectedCountryIds.length > 0 && selectedFields.length > 0;

  if (loading) {
    return (
      <div className="compare-section">
        <Loader />
      </div>
    );
  }

  return (
    <div className="compare-section">
      <div className="compare-header">
        <h3>Compare Countries</h3>
        <span className="compare-subtitle">
          {selectedCountryIds.length} countries · {selectedFields.length} fields selected
        </span>
      </div>

      {/* ── Remove Countries (pill row, EconomicInsights "Categories" style) ── */}
      <div className="categories row">
        <div className="col-12">
          <div className="categories-scroll">
            {selectedCountryIds.length === 0 ? (
              <span className="compare-empty-hint">No countries selected yet.</span>
            ) : (
              selectedCountryIds.map((id) => (
                <div key={id} className="continent compare-remove-pill">
                  {countryById[id]?.code && (
                    <span
                      className={`fi fi-${countryById[id].code.toLowerCase()} compare-pill-flag`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{countryById[id]?.name ?? "Unknown"}</span>
                  <button
                    type="button"
                    className="compare-remove-btn"
                    aria-label={`Remove ${countryById[id]?.name ?? ""}`}
                    onClick={() => removeCountry(id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="compare-body">
        {/* ── Left controls column (200px): Add Countries + Comparison Fields stacked ── */}
        <div className="compare-controls">
          {/* Add Countries */}
          <div className="compare-panel">
            <button
              type="button"
              className="compare-panel-title compare-panel-toggle"
              onClick={() => setAddPanelOpen((o) => !o)}
            >
              <span>Add Countries</span>
              <span className={`compare-caret ${addPanelOpen ? "open" : ""}`}>▸</span>
            </button>
            <div className={`compare-collapse ${addPanelOpen ? "open" : ""}`}>
              <div className="compare-collapse-inner">
                {regions.map((region) => (
                  <div key={region._id} className="compare-dropdown">
                    <button
                      type="button"
                      className="compare-dropdown-header"
                      onClick={() => toggleRegion(region._id)}
                    >
                      <span>{region.name}</span>
                      <span className={`compare-caret ${expandedRegions[region._id] ? "open" : ""}`}>
                        ▸
                      </span>
                    </button>
                    <div className={`compare-collapse ${expandedRegions[region._id] ? "open" : ""}`}>
                      <div className="compare-dropdown-body">
                        {region.countries.map((country) => (
                          <label key={country._id} className="compare-check">
                            <input
                              type="checkbox"
                              checked={selectedCountryIds.includes(country._id)}
                              onChange={() => toggleCountry(country._id)}
                            />
                            <span>{country.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Fields */}
          <div className="compare-fields">
            <button
              type="button"
              className="compare-panel-title compare-panel-toggle"
              onClick={() => setFieldsPanelOpen((o) => !o)}
            >
              <span>Comparison Fields</span>
              <span className={`compare-caret ${fieldsPanelOpen ? "open" : ""}`}>▸</span>
            </button>
            <div className={`compare-collapse ${fieldsPanelOpen ? "open" : ""}`}>
              <div className="compare-collapse-inner">
                {categories.length === 0 && (
                  <p className="compare-empty-hint">
                    Add a country to load its comparison fields.
                  </p>
                )}
                {categories.map((cat) => {
                  const selectedInCat = cat.fields.filter((f) =>
                    selectedFields.includes(fieldId(cat.key, f))
                  ).length;
                  const allSelected =
                    selectedInCat === cat.fields.length && cat.fields.length > 0;

                  return (
                    <div key={cat.key} className="compare-accordion">
                      <div className="compare-accordion-header">
                        <label className="compare-check compare-check--parent">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = selectedInCat > 0 && !allSelected;
                            }}
                            onChange={(e) => toggleAllFields(cat.key, cat.fields, e.target.checked)}
                          />
                        </label>
                        <button
                          type="button"
                          className="compare-accordion-title"
                          onClick={() => toggleCategory(cat.key)}
                        >
                          <span>{humanize(cat.key)}</span>
                          <span className={`compare-caret ${expandedCategories[cat.key] ? "open" : ""}`}>
                            ▸
                          </span>
                        </button>
                      </div>
                      <div className={`compare-collapse ${expandedCategories[cat.key] ? "open" : ""}`}>
                        <div className="compare-accordion-body">
                          {cat.fields.map((f) => (
                            <label key={f} className="compare-check">
                              <input
                                type="checkbox"
                                checked={selectedFields.includes(fieldId(cat.key, f))}
                                onChange={() => toggleField(fieldId(cat.key, f))}
                              />
                              <span>{humanize(f)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Selected country cards (GSMArena-style columns) ── */}
        <div className="compare-cards-wrap">
          {loadingMetadata && (
            <div className="compare-overlay" role="status" aria-live="polite">
              <Loader />
              <span className="compare-overlay-text">Fetching country metadata…</span>
            </div>
          )}
          <div className="compare-cards">
            {!hasComparison ? (
              <p className="compare-empty-hint">
                Select at least one country and one field to see the comparison.
              </p>
            ) : (
              <>
                {selectedCountryIds.map((id) => {
                const country = countryById[id];
                const meta = metadataById[id] ?? {};
                return (
                  <div key={id} className="compare-card">
                    <div className="compare-card-head">
                      {country?.code && (
                        <span
                          className={`fi fi-${country.code.toLowerCase()} compare-flag`}
                          aria-hidden="true"
                        />
                      )}
                      <span className="compare-card-name">{country?.name ?? "Unknown"}</span>
                    </div>

                    <div className="compare-card-body">
                      {comparisonGroups.map((group) => (
                        <div key={group.key} className="compare-card-category">
                          <div className="compare-card-category-title">{humanize(group.key)}</div>
                          {group.fields.map((field) => (
                            <MetaNodes
                              key={field}
                              label={humanize(field)}
                              value={meta?.[group.key]?.[field]}
                              depth={0}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareCountries;
