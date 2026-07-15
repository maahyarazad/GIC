import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/api/axiosInstance"; // your axios instance
import "./EconomicInsights.css"; // optional: for styling tabs/products
import Loader from "@/Components/Loader/Loader";
import 'flag-icons/css/flag-icons.min.css';
import { getPDFBlob } from '@/api/user';
import { useToast } from "@/Providers/ToastContext";
import { Product } from "../../../../src/types/product.types"

// --- Types --
export interface Continent {
    _id: string;
    name: string;
    slug: string;
    description?: string | null;
    products?: Product[];
}

const STAR_TOTAL = 5;

type ConfidenceLevel = "high" | "moderate" | "cautious" | "low";

/** The indicator arrives as "🟡 Moderate Confidence" — match on the wording, not the emoji. */
const confidenceLevel = (indicator?: string | null): ConfidenceLevel | null => {
    const text = indicator?.toLowerCase() ?? "";
    if (text.includes("high")) return "high";
    if (text.includes("moderate")) return "moderate";
    if (text.includes("cautious")) return "cautious";
    if (text.includes("low")) return "low";
    return null;
};

/** Drops the leading emoji so the pill can carry its own colour-coded dot instead. */
const confidenceLabel = (indicator: string): string => indicator.replace(/^[^\p{L}]+/u, "").trim();

/** "★★★☆☆" -> 3, so filled and empty stars can be styled apart. */
const filledStars = (rating?: string | number | null): number | null => {
    if (rating === null || rating === undefined) return null;

    const filled =
        typeof rating === "number" ? Math.round(rating) : (rating.match(/★/g) ?? []).length;

    return filled > 0 ? Math.min(filled, STAR_TOTAL) : null;
};

// --- Component ---
const EconomicInsights: React.FC = () => {
    const [categories, setCategories] = useState<Continent[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Continent | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [downloadingProductId, setDownloadingProductId] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const { show } = useToast();
    // Fetch categories (continents) on mount

    const fetchCategories = useCallback(async () => {
        setLoadingCategories(true);
        try {

            const res = await axiosInstance.get<Continent[]>("/continents");
            const { data } = res;
            const { continents } = data?.data;

            setCategories(continents);
            if (continents.length > 0) {
                //set default 
                setSelectedCategory(continents[0]);
            }
        } catch (err: any) {
            console.error(err);
            setError("Failed to load categories");
        } finally {
            setLoadingCategories(false);
        }
    }, []);


    useEffect(() => { fetchCategories() }, [fetchCategories]);

    // Handle category selection
    const loadProducts = useCallback(async (category: Continent) => {

        setLoadingProducts(true);
        setProducts([]);
        try {

            // Fetch products for category if not included
            const res = await axiosInstance.get<Product[]>(`/products/by-parent/${category._id}`);
            setProducts(res.data.products);

        } catch (err) {
            console.error(err);
            setError("Failed to load products");
        } finally {
            setLoadingProducts(false);
        }
    }, []);

    useEffect(() => {
        if (selectedCategory) loadProducts(selectedCategory)
    }, [selectedCategory]);

    if (loadingCategories)

        return (

            <div className="row">

                <div className="col-12">
                    <Loader />
                    {/* <span>Loading categories...</span> */}
                </div>
            </div>
        )



    const pdfDownload = async (fileId: string) => {

        try {

            const { blob, filename } = await getPDFBlob(fileId);

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {

            show({ type: "error", message: err!.message! });
            console.error(err);
        } finally {
            setDownloadingProductId(null);
        }
    };


    if (error) return <p className="text-danger">{error}</p>;

    return (
        <div className="dash-section economic-insights">
            <div className="dash-header">
                <h3>Country Intelligence</h3>
            </div>

            <div className="categories row">
                <div className="col-12">
                    <div className="categories-scroll">
                        {categories
                            .filter((category) => category.isActive)
                            .sort((a, b) => a.order - b.order)
                            .map((category) => (
                                <div
                                    key={category._id}
                                    className={`continent ${selectedCategory?._id === category._id ? "active" : ""
                                        }`}
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category.name}
                                </div>
                            ))}
                    </div>
                </div>
            </div>


            {/* Products list */}
            {loadingProducts ? (
                <Loader />
            ) : products.length === 0 ? (
                <p>No products found in this category.</p>
            ) : (
                <div className="_products row mt-2">
                    {products.map((p) => {
                        const ratings = p.metadata?.conclusion?.gicStarRatings;
                        const stars = filledStars(ratings?.gicStarRating);
                        const indicator = ratings?.investorConfidenceIndicator;
                        const level = confidenceLevel(indicator);
                        const rationale = ratings?.rationaleIndustrialInvestability;
                        console.log(ratings);
                        return (
                            <div
                                key={p._id}
                                className="col-md-6 mb-3 col-lg-4 col-xl-4 col-xxl-3"
                                onClick={() => { setDownloadingProductId(p._id); pdfDownload(p.fileId); }}
                            >
                                <div className="_card h-100">
                                    <div className="_card-body">
                                        <div className="_card-head">
                                            <div className="_card-head-main">
                                                <i
                                                    className={`fi fi-${p.code.toLowerCase()} flag-icon`}
                                                    aria-hidden="true"
                                                />
                                                <div className="_card-head-text">
                                                    <h5 className="_card-title-d">{p.name}</h5>
                                                    <span className="_card-downloads">
                                                        {p.downloadCount} downloads
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="_card-head-meta">
                                                {stars !== null && (
                                                    <div
                                                        className="_rating"
                                                        aria-label={`GIC star rating: ${stars} out of ${STAR_TOTAL}`}
                                                    >
                                                        <span className="_stars" aria-hidden="true">
                                                            {Array.from({ length: STAR_TOTAL }, (_, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`_star ${i < stars ? "filled" : ""}`}
                                                                >
                                                                    ★
                                                                </span>
                                                            ))}
                                                        </span>
                                                        <span className="_rating-value">{stars}/{STAR_TOTAL}</span>
                                                    </div>
                                                )}

                                                {level && indicator && (
                                                    <span className={`_confidence _confidence--${level}`}>
                                                        <span className="_confidence-dot" aria-hidden="true" />
                                                        {confidenceLabel(indicator)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {rationale && (
                                            <p className="_rationale" title={rationale}>
                                                {rationale}
                                            </p>
                                        )}

                                        <span className="_card-cta">Download report</span>
                                    </div>

                                    <div className={`loader-overlay ${downloadingProductId === p._id ? "" : "d-none"}`}>
                                        <Loader />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EconomicInsights;
