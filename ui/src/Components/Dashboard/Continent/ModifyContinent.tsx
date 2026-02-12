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


interface ModifyContinentProps {
    continent?: ContinetViewModel;
    handleSaveContinent: (continent: ContinetViewModel) => void;
}

export interface ModifyContinentRef {
    submitForm: () => void;
}

const ModifyContinent = forwardRef<
    ModifyContinentRef,
    ModifyContinentProps
>(({ id, continent, handleSaveContinent }, ref) => {
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

        // SEO & image
        image: null,
        imageAlt: "",
        seoTitle: "",
        seoDescription: "",
        seoKeywords: [],
    });



    useEffect(() => {
        if (continent) {
            setFormState((prev) => ({
                ...continent,
                slug: slugify(continent.name, {
                    lower: true,
                    strict: true,
                    locale: "en",
                }),
            }));
        }
    }, [continent]);

    useImperativeHandle(ref, () => ({
        submitForm: () => {
            formRef.current?.requestSubmit();
        },
    }));

    const handleChange = <K extends keyof ContinetViewModel>(key: K, value: ContinetViewModel[K]) => {
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
        >
            <button
                type="submit"
                className="btn dashboard-btn align-self-start"
                disabled={!formState.name || !formState.slug}
            >
                Save
            </button>

                {/* Hidden Continent ID */}
                {formState._id && (
                <input type="hidden" name="_id" value={formState._id} />
                )}
            <div className="row g-3">

                {/* Name */}
                <div className="col-12 col-lg-6">
                    <label className="form-label fw-bold">Name *</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formState.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                    />
                </div>

                {/* Slug */}
                <div className="col-12 col-lg-6">
                    <label className="form-label fw-bold">Slug *</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formState.slug}
                        disabled
                        required
                    />
                </div>

                {/* Countries */}
                <div className="col-12 col-lg-12">
                  {/* Countries Selector */}
                        <CountriesSelector
                        continent={formState}
                        setContinent={setFormState}
                        />
                </div>

                {/* Description */}
                <div className="col-12">
                    <label className="form-label fw-bold">Description</label>
                    <textarea
                        className="form-control"
                        rows={3}
                        value={formState.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                    />
                </div>

                {/* Parent */}
                <div className="col-12 col-lg-6">
                    <label className="form-label fw-bold">Parent ID</label>
                    <input
                        type="text"
                        disabled
                        className="form-control"
                        value={formState.parent ?? ""}
                    />
                </div>

                {/* Order */}
                <div className="col-12 col-lg-6">
                    <label className="form-label fw-bold">Order</label>
                    <input
                        type="number"
                        className="form-control"
                        value={formState.order}
                        onChange={(e) => handleChange("order", Number(e.target.value))}
                    />
                </div>

                {/* Active */}
                <div className="col-12">
                    <div className="form-check mt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={formState.isActive}
                            onChange={(e) => handleChange("isActive", e.target.checked)}
                        />
                        <label className="form-check-label">Active</label>
                    </div>
                </div>

                {/* Image URL and Alt Text side by side */}
                <div className="col-12 col-lg-6">
                    <label className="form-label fw-bold">Image URL</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formState.image ?? ""}
                        onChange={(e) => handleChange("image", e.target.value || null)}
                    />
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label fw-bold">Image Alt Text</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formState.imageAlt ?? ""}
                        onChange={(e) => handleChange("imageAlt", e.target.value)}
                    />
                </div>

                {/* SEO Title */}
                <div className="col-12">
                    <label className="form-label fw-bold">SEO Title</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formState.seoTitle ?? ""}
                        onChange={(e) => handleChange("seoTitle", e.target.value)}
                    />
                </div>

                {/* SEO Description */}
                <div className="col-12">
                    <label className="form-label fw-bold">SEO Description</label>
                    <textarea
                        className="form-control"
                        rows={2}
                        value={formState.seoDescription ?? ""}
                        onChange={(e) => handleChange("seoDescription", e.target.value)}
                    />
                </div>

                {/* SEO Keywords */}
                <div className="col-12">
                    <label className="form-label fw-bold">SEO Keywords (comma separated)</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formState.seoKeywords?.join(", ") ?? ""}
                        onChange={(e) =>
                            handleChange(
                                "seoKeywords",
                                e.target.value.split(",").map((k) => k.trim())
                            )
                        }
                    />
                </div>

            </div>
        </form>



    );
});

export default ModifyContinent;
