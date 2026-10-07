import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface Category {
  key: string;
  fields: string[];
}

type Metadata = Record<string, any>;

/* ──────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────── */

const humanizeCache = new Map<string, string>();

/**
 * camelCase / PascalCase key -> human label, e.g. "gdpGrowthRate2024" -> "Gdp Growth Rate 2024".
 * Cached: the same keys are humanized for every card, field and re-render.
 */
const humanize = (key: string): string => {
  const cached = humanizeCache.get(key);
  if (cached !== undefined) return cached;

  const spaced = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  const label = spaced.charAt(0).toUpperCase() + spaced.slice(1);
  humanizeCache.set(key, label);
  return label;
};

/** Build the composite field id used to track a selected field. */
const fieldId = (category: string, field: string) => `${category}.${field}`;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Height of the fixed site navbar — keep in sync with $nav-height in the SCSS. */
const NAV_HEIGHT = 70;

/** Shared fallback so a card without metadata keeps a stable `meta` prop. */
const EMPTY_META: Metadata = {};

/**
 * Recursively renders a metadata value down to its leaf nodes, so we display the
 * value stored deep in the tree rather than only the parent key.
 */
const MetaNodes: React.FC<{ label: string; value: unknown; depth: number }> = memo(({
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
MetaNodes.displayName = "MetaNodes";

/* ──────────────────────────────────────────────────────────────
   Memoized building blocks
   Each one receives only primitives or stable references, so a change in one
   part of the page (a region expanding, a field toggling, the sticky heads
   compacting on scroll) doesn't re-render the rest.
──────────────────────────────────────────────────────────────── */

const SelectedCountryPill = memo(({
  id,
  country,
  onRemove,
}: {
  id: string;
  country?: Country;
  onRemove: (id: string) => void;
}) => (
  <div className="continent compare-remove-pill">
    {country?.code && (
      <span
        className={`fi fi-${country.code.toLowerCase()} compare-pill-flag`}
        aria-hidden="true"
      />
    )}
    <span>{country?.name ?? "Unknown"}</span>
    <button
      type="button"
      className="compare-remove-btn"
      aria-label={`Remove ${country?.name ?? ""}`}
      onClick={() => onRemove(id)}
    >
      ×
    </button>
  </div>
));
SelectedCountryPill.displayName = "SelectedCountryPill";

const CheckboxItem = memo(({
  value,
  label,
  checked,
  onToggle,
}: {
  value: string;
  label: string;
  checked: boolean;
  onToggle: (value: string) => void;
}) => (
  <label className="compare-check">
    <input type="checkbox" checked={checked} onChange={() => onToggle(value)} />
    <span>{label}</span>
  </label>
));
CheckboxItem.displayName = "CheckboxItem";

const RegionDropdown = memo(({
  region,
  expanded,
  selectedCountrySet,
  onToggleRegion,
  onToggleCountry,
}: {
  region: Region;
  expanded: boolean;
  selectedCountrySet: Set<string>;
  onToggleRegion: (id: string) => void;
  onToggleCountry: (id: string) => void;
}) => (
  <div className="compare-dropdown">
    <button
      type="button"
      className="compare-dropdown-header"
      onClick={() => onToggleRegion(region._id)}
    >
      <span>{region.name}</span>
      <span className={`compare-caret ${expanded ? "open" : ""}`}>▸</span>
    </button>
    <div className={`compare-collapse ${expanded ? "open" : ""}`}>
      <div className="compare-dropdown-body">
        {region.countries.map((country) => (
          <CheckboxItem
            key={country._id}
            value={country._id}
            label={country.name}
            checked={selectedCountrySet.has(country._id)}
            onToggle={onToggleCountry}
          />
        ))}
      </div>
    </div>
  </div>
));
RegionDropdown.displayName = "RegionDropdown";

const CategoryAccordion = memo(({
  category,
  expanded,
  selectedFieldSet,
  onToggleCategory,
  onToggleAll,
  onToggleField,
}: {
  category: Category;
  expanded: boolean;
  selectedFieldSet: Set<string>;
  onToggleCategory: (key: string) => void;
  onToggleAll: (category: string, fields: string[], selectAll: boolean) => void;
  onToggleField: (id: string) => void;
}) => {
  const { key, fields } = category;

  const selectedInCat = useMemo(
    () => fields.filter((f) => selectedFieldSet.has(fieldId(key, f))).length,
    [fields, key, selectedFieldSet]
  );
  const allSelected = selectedInCat === fields.length && fields.length > 0;
  const indeterminate = selectedInCat > 0 && !allSelected;

  // `indeterminate` is DOM-only; set it when it changes instead of via an inline
  // ref callback that React would detach and re-attach on every render.
  const parentRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (parentRef.current) parentRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleToggleAll = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onToggleAll(key, fields, e.target.checked),
    [key, fields, onToggleAll]
  );

  return (
    <div className="compare-accordion">
      <div className="compare-accordion-header">
        <label className="compare-check compare-check--parent">
          <input
            type="checkbox"
            checked={allSelected}
            ref={parentRef}
            onChange={handleToggleAll}
          />
        </label>
        <button
          type="button"
          className="compare-accordion-title"
          onClick={() => onToggleCategory(key)}
        >
          <span>{humanize(key)}</span>
          <span className={`compare-caret ${expanded ? "open" : ""}`}>▸</span>
        </button>
      </div>
      <div className={`compare-collapse ${expanded ? "open" : ""}`}>
        <div className="compare-accordion-body">
          {fields.map((f) => {
            const id = fieldId(key, f);
            return (
              <CheckboxItem
                key={f}
                value={id}
                label={humanize(f)}
                checked={selectedFieldSet.has(id)}
                onToggle={onToggleField}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
CategoryAccordion.displayName = "CategoryAccordion";

const CountryCard = memo(({
  country,
  meta,
  comparisonGroups,
}: {
  country?: Country;
  meta: Metadata;
  comparisonGroups: Category[];
}) => (
  <div className="compare-card">
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
));
CountryCard.displayName = "CountryCard";

/* ──────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */
const CompareCountries: React.FC = () => {
  const { show } = useToast();

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  // countryId -> full metadata object
  const [metadataById, setMetadataById] = useState<Record<string, Metadata>>({});
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

  // O(1) membership checks for every checkbox instead of Array.includes per render.
  const selectedCountrySet = useMemo(() => new Set(selectedCountryIds), [selectedCountryIds]);
  const selectedFieldSet = useMemo(() => new Set(selectedFields), [selectedFields]);

  /**
   * The category/field structure is derived from the real metadata of the
   * selected countries (union of keys) rather than a static schema, so it always
   * matches the actual data shape and adapts as new fields appear.
   */
  const categories = useMemo<Category[]>(() => {
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

  /* ── Selection handlers (stable: they only use state setters) ── */
  const toggleCountry = useCallback((id: string) =>
    setSelectedCountryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ), []);

  const removeCountry = useCallback((id: string) =>
    setSelectedCountryIds((prev) => prev.filter((x) => x !== id)), []);

  const toggleField = useCallback((id: string) =>
    setSelectedFields((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ), []);

  const toggleAllFields = useCallback((category: string, fields: string[], selectAll: boolean) => {
    const ids = fields.map((f) => fieldId(category, f));
    const idSet = new Set(ids);
    setSelectedFields((prev) => {
      const withoutCategory = prev.filter((id) => !idSet.has(id));
      return selectAll ? [...withoutCategory, ...ids] : withoutCategory;
    });
  }, []);

  const toggleRegion = useCallback((id: string) =>
    setExpandedRegions((prev) => ({ ...prev, [id]: !prev[id] })), []);

  const toggleCategory = useCallback((key: string) =>
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] })), []);

  const toggleAddPanel = useCallback(() => setAddPanelOpen((o) => !o), []);
  const toggleFieldsPanel = useCallback(() => setFieldsPanelOpen((o) => !o), []);

  /* ── Comparison groups (category -> selected fields) ── */
  const comparisonGroups = useMemo(() => {
    return categories
      .map((cat) => ({
        key: cat.key,
        fields: cat.fields.filter((f) => selectedFieldSet.has(fieldId(cat.key, f))),
      }))
      .filter((cat) => cat.fields.length > 0);
  }, [categories, selectedFieldSet]);

  const hasComparison = selectedCountryIds.length > 0 && selectedFields.length > 0;

  /**
   * Compact the sticky card heads (flag at 50%) once the cards reach the top of
   * the viewport — i.e. exactly when position: sticky starts pinning them.
   * Scroll work is throttled with requestAnimationFrame (one layout read per
   * frame) and state is only set when the compact flag actually flips.
   */
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const [compactHeads, setCompactHeads] = useState(false);

  useEffect(() => {
    if (!hasComparison) {
      setCompactHeads(false);
      return;
    }

    let raf = 0;
    let lastCompact: boolean | null = null;
    const update = () => {
      raf = 0;
      const wrap = cardsRef.current;
      // Compact once the cards reach the bottom edge of the fixed navbar —
      // the exact point where the sticky heads (top: $nav-height) start pinning.
      const compact = !!wrap && wrap.getBoundingClientRect().top <= NAV_HEIGHT;
      if (compact !== lastCompact) {
        lastCompact = compact;
        setCompactHeads(compact);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    // capture=true catches scroll from whichever ancestor actually scrolls.
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hasComparison]);

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
                <SelectedCountryPill
                  key={id}
                  id={id}
                  country={countryById[id]}
                  onRemove={removeCountry}
                />
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
              onClick={toggleAddPanel}
            >
              <span>Add Countries</span>
              <span className={`compare-caret ${addPanelOpen ? "open" : ""}`}>▸</span>
            </button>
            <div className={`compare-collapse ${addPanelOpen ? "open" : ""}`}>
              <div className="compare-collapse-inner">
                {regions.map((region) => (
                  <RegionDropdown
                    key={region._id}
                    region={region}
                    expanded={!!expandedRegions[region._id]}
                    selectedCountrySet={selectedCountrySet}
                    onToggleRegion={toggleRegion}
                    onToggleCountry={toggleCountry}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Fields */}
          <div className="compare-fields">
            <button
              type="button"
              className="compare-panel-title compare-panel-toggle"
              onClick={toggleFieldsPanel}
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
                {categories.map((cat) => (
                  <CategoryAccordion
                    key={cat.key}
                    category={cat}
                    expanded={!!expandedCategories[cat.key]}
                    selectedFieldSet={selectedFieldSet}
                    onToggleCategory={toggleCategory}
                    onToggleAll={toggleAllFields}
                    onToggleField={toggleField}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Selected country cards (GSMArena-style columns) ── */}
        <div
          ref={cardsRef}
          className={`compare-cards-wrap ${compactHeads ? "is-compact" : ""}`}
        >
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
              selectedCountryIds.map((id) => (
                <CountryCard
                  key={id}
                  country={countryById[id]}
                  meta={metadataById[id] ?? EMPTY_META}
                  comparisonGroups={comparisonGroups}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareCountries;
