import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
} from "react";
import { ContinetViewModel } from "../../../../../src/types/continent.types";
import slugify from "slugify";
import CountriesSelector from "./CountriesSelector";

type Notify = (toast: { type: "success" | "error"; message: string }) => void;

interface ModifyContinentProps {
    id?: string;
    continent?: ContinetViewModel;
    handleSaveContinent: (continent: ContinetViewModel) => void;
    // Toast callback captured from a parent inside ToastProvider (the slide-menu
    // content is rendered outside that provider).
    notify?: Notify;
}

export interface ModifyContinentRef {
    submitForm: () => void;
}

const inputStyle: React.CSSProperties = {
    background: "var(--bg2)",
    color: "var(--txt)",
    border: "1px solid var(--bdr)",
    boxShadow: "none",
};

const disabledInputStyle: React.CSSProperties = {
    ...inputStyle,
    background: "var(--bgp2)",
    color: "var(--mu)",
    cursor: "not-allowed",
    opacity: 1,
};

const labelStyle: React.CSSProperties = {
    color: "var(--txt)",
    fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
    background: "var(--bg)",
    color: "var(--txt)",
};

const ModifyContinent = forwardRef<
    ModifyContinentRef,
    ModifyContinentProps
>(({ id, continent, handleSaveContinent, notify }, ref) => {
    const formRef = useRef<HTMLFormElement>(null);

    const [formState, setFormState] = useState<ContinetViewModel>({
        _id: id,
        name: "",
        slug: "",
        description: "",
        products: [],
        productObjects: [],
        parent: "root",
        children: [],
        isActive: true,
        order: 0,
        image: null,
        imageAlt: "",
        seoTitle: "",
        seoDescription: "",
        seoKeywords: [],
    });

    // Sync from the parent only when a *different* continent is opened. Keying on
    // the whole `continent` object would reset formState on every incidental
    // re-render, wiping in-progress edits like the uploaded fileUpload_timeStamp.
    useEffect(() => {
        if (continent) {
            setFormState({
                ...continent,
                slug: slugify(continent.name, {
                    lower: true,
                    strict: true,
                    locale: "en",
                }),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [continent?._id]);

    useImperativeHandle(ref, () => ({
        submitForm: () => {
            formRef.current?.requestSubmit();
        },
    }));

    const handleChange = <K extends keyof ContinetViewModel>(
        key: K,
        value: ContinetViewModel[K]
    ) => {
        setFormState((prev) => ({
            ...prev,
            [key]: value,
            ...(key === "name" && {
                slug: slugify(String(value), {
                    lower: true,
                    strict: true,
                    locale: "en",
                }),
            }),
        }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSaveContinent(formState);
    };

    return (
        <form
            ref={formRef}
            onSubmit={onSubmit}
            className="d-flex flex-column gap-3"
            style={cardStyle}
        >
            <button
                type="submit"
                className="btn dashboard-btn align-self-start"
                disabled={!formState.name || !formState.slug}
            >
                Save
            </button>

            {formState._id && (
                <input type="hidden" name="_id" value={formState._id} />
            )}

            <div className="row g-3">
                <div className="col-12 col-lg-6">
                    <label className="form-label" style={labelStyle}>
                        Name *
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        style={inputStyle}
                        value={formState.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                    />
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label" style={labelStyle}>
                        Slug *
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        style={disabledInputStyle}
                        value={formState.slug}
                        disabled
                        required
                    />
                </div>

                <div className="col-12 col-lg-12">
                    <CountriesSelector
                        continent={formState}
                        setContinent={setFormState}
                        notify={notify}
                    />
                </div>

                <div className="col-12">
                    <label className="form-label" style={labelStyle}>
                        Description
                    </label>
                    <textarea
                        className="form-control"
                        style={inputStyle}
                        rows={3}
                        value={formState.description ?? ""}
                        onChange={(e) =>
                            handleChange("description", e.target.value)
                        }
                    />
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label" style={labelStyle}>
                        Parent ID
                    </label>
                    <input
                        type="text"
                        disabled
                        className="form-control"
                        style={disabledInputStyle}
                        value={formState.parent ?? ""}
                    />
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label" style={labelStyle}>
                        Order
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        style={inputStyle}
                        value={formState.order}
                        onChange={(e) =>
                            handleChange("order", Number(e.target.value))
                        }
                    />
                </div>

                <div className="col-12">
                    <div className="form-check mt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={formState.isActive}
                            onChange={(e) =>
                                handleChange("isActive", e.target.checked)
                            }
                            style={{
                                backgroundColor: formState.isActive
                                    ? "var(--ora)"
                                    : "var(--bg2)",
                                borderColor: "var(--bdr)",
                            }}
                        />
                        <label
                            className="form-check-label"
                            style={{ color: "var(--txt)" }}
                        >
                            Active
                        </label>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label" style={labelStyle}>
                        Image URL
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        style={inputStyle}
                        value={formState.image ?? ""}
                        onChange={(e) =>
                            handleChange("image", e.target.value || null)
                        }
                    />
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label" style={labelStyle}>
                        Image Alt Text
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        style={inputStyle}
                        value={formState.imageAlt ?? ""}
                        onChange={(e) =>
                            handleChange("imageAlt", e.target.value)
                        }
                    />
                </div>

                <div className="col-12">
                    <label className="form-label" style={labelStyle}>
                        SEO Title
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        style={inputStyle}
                        value={formState.seoTitle ?? ""}
                        onChange={(e) =>
                            handleChange("seoTitle", e.target.value)
                        }
                    />
                </div>

                <div className="col-12">
                    <label className="form-label" style={labelStyle}>
                        SEO Description
                    </label>
                    <textarea
                        className="form-control"
                        style={inputStyle}
                        rows={2}
                        value={formState.seoDescription ?? ""}
                        onChange={(e) =>
                            handleChange("seoDescription", e.target.value)
                        }
                    />
                </div>

                <div className="col-12">
                    <label className="form-label" style={labelStyle}>
                        SEO Keywords (comma separated)
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        style={inputStyle}
                        value={formState.seoKeywords?.join(", ") ?? ""}
                        onChange={(e) =>
                            handleChange(
                                "seoKeywords",
                                e.target.value
                                    .split(",")
                                    .map((k) => k.trim())
                                    .filter(Boolean)
                            )
                        }
                    />
                </div>
            </div>
        </form>
    );
});

export default ModifyContinent;