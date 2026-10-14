import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import { useFormikContext } from "formik";

/**
 * Dependent Country → City dropdowns for the recommendation-letter request.
 * Countries come from `react-select-country-list` (ISO2 codes). Cities are loaded from
 * `country-state-city` via a dynamic import, so its ~8 MB dataset is code-split out of the
 * main bundle and only fetched once a country is chosen.
 *
 * The Formik form stores the country and city as display names (strings); the ISO code is
 * derived from the chosen country only to look up its cities.
 */

interface Option {
    value: string;
    label: string;
}

// Only the fields this component reads/writes; the parent form has more.
interface LocationValues {
    country: string;
    city: string;
}

// ISO2 code → human name, for every country.
const countryOptions: Option[] = countryList().getData();

// Themed to the app's CSS variables (mirrors CountriesSelector).
const reactSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "var(--bg2)",
        borderColor: state.isFocused ? "var(--ora)" : "var(--bdr)",
        boxShadow: state.isFocused ? "0 0 0 1px var(--ora)" : "none",
        "&:hover": { borderColor: "var(--ora)" },
        minHeight: 38,
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: "var(--bg2)",
        color: "var(--txt)",
        border: "1px solid var(--bdr)",
        zIndex: 20,
    }),
    menuList: (base: any) => ({ ...base, backgroundColor: "var(--bg2)" }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isFocused ? "var(--bgp)" : state.isSelected ? "var(--ora)" : "var(--bg2)",
        color: state.isSelected ? "#fff" : "var(--txt)",
        cursor: "pointer",
    }),
    singleValue: (base: any) => ({ ...base, color: "var(--txt)" }),
    input: (base: any) => ({ ...base, color: "var(--txt)" }),
    placeholder: (base: any) => ({ ...base, color: "var(--mu)" }),
    dropdownIndicator: (base: any) => ({ ...base, color: "var(--mu)", "&:hover": { color: "var(--txt)" } }),
    indicatorSeparator: (base: any) => ({ ...base, backgroundColor: "var(--bdr)" }),
    clearIndicator: (base: any) => ({ ...base, color: "var(--mu)", "&:hover": { color: "var(--txt)" } }),
};

const selectTheme = (theme: any) => ({
    ...theme,
    borderRadius: 6,
    colors: {
        ...theme.colors,
        primary: "var(--ora)",
        primary25: "var(--bgp)",
        primary50: "var(--bgp2)",
        neutral0: "var(--bg2)",
        neutral5: "var(--bg2)",
        neutral10: "var(--bdr)",
        neutral20: "var(--bdr)",
        neutral30: "var(--ora)",
        neutral40: "var(--mu)",
        neutral50: "var(--mu)",
        neutral60: "var(--txt)",
        neutral70: "var(--txt)",
        neutral80: "var(--txt)",
        neutral90: "var(--txt)",
    },
});

const CountryCitySelect: React.FC = () => {
    const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext<LocationValues>();
    const [cityOptions, setCityOptions] = useState<Option[]>([]);
    const [citiesLoading, setCitiesLoading] = useState(false);

    // ISO2 of the chosen country (by its display name), used to look up cities.
    const countryIso = useMemo(
        () => countryOptions.find((option) => option.label === values.country)?.value ?? "",
        [values.country]
    );

    useEffect(() => {
        if (!countryIso) {
            setCityOptions([]);
            return;
        }

        let cancelled = false;
        setCitiesLoading(true);
        // Dynamic import keeps the large city dataset out of the main bundle.
        import("country-state-city")
            .then(({ City }) => {
                if (cancelled) return;
                const seen = new Set<string>();
                const options: Option[] = [];
                for (const city of City.getCitiesOfCountry(countryIso) ?? []) {
                    if (!seen.has(city.name)) {
                        seen.add(city.name);
                        options.push({ value: city.name, label: city.name });
                    }
                }
                setCityOptions(options);
            })
            .catch((error) => {
                console.error("Failed to load cities", error);
                if (!cancelled) setCityOptions([]);
            })
            .finally(() => {
                if (!cancelled) setCitiesLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [countryIso]);

    const countryValue = countryOptions.find((option) => option.label === values.country) ?? null;
    const cityValue = values.city ? { value: values.city, label: values.city } : null;

    const onCountryChange = (option: Option | null) => {
        setFieldValue("country", option?.label ?? "");
        // Changing the country invalidates any previously chosen city.
        setFieldValue("city", "");
        setFieldTouched("country", true, false);
    };

    const onCityChange = (option: Option | null) => {
        setFieldValue("city", option?.value ?? "");
        setFieldTouched("city", true, false);
    };

    return (
        <div className="bl-row">
            <div className="bl-field">
                <label htmlFor="bl-country" className="required">Country</label>
                <Select
                    inputId="bl-country"
                    options={countryOptions}
                    value={countryValue}
                    onChange={onCountryChange}
                    onBlur={() => setFieldTouched("country", true)}
                    placeholder="Select country"
                    isSearchable
                    isClearable
                    styles={reactSelectStyles}
                    theme={selectTheme}
                />
                {touched.country && errors.country && <div className="bl-error">{errors.country as string}</div>}
            </div>
            <div className="bl-field">
                <label htmlFor="bl-city" className="required">City</label>
                <Select
                    inputId="bl-city"
                    options={cityOptions}
                    value={cityValue}
                    onChange={onCityChange}
                    onBlur={() => setFieldTouched("city", true)}
                    placeholder={!countryIso ? "Select a country first" : citiesLoading ? "Loading cities…" : "Select city"}
                    isDisabled={!countryIso || citiesLoading}
                    isLoading={citiesLoading}
                    isSearchable
                    isClearable
                    noOptionsMessage={() => (countryIso ? "No cities found" : "Select a country first")}
                    styles={reactSelectStyles}
                    theme={selectTheme}
                />
                {touched.city && errors.city && <div className="bl-error">{errors.city as string}</div>}
            </div>
        </div>
    );
};

export default CountryCitySelect;
