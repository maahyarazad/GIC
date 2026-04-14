import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/api/axiosInstance"; // your axios instance
import "./EconomicInsights.css"; // optional: for styling tabs/products
import Loader from "@/Components/Loader/Loader";
import 'flag-icons/css/flag-icons.min.css';
import { getPDFBlob } from '@/api/user';
import { useToast } from "@/providers/ToastContext";
import { Product } from "../../../../src/types/product.types"

// --- Types --
export interface Continent {
    _id: string;
    name: string;
    slug: string;
    description?: string | null;
    products?: Product[];
}

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

    useEffect(() => { fetchCategories() }, [fetchCategories]);


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


    useEffect

    if (error) return <p className="text-danger">{error}</p>;

    return (


        <div className="economic-insights">
            <h3 className="mb">Economic Insights</h3>

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
                    {products.map((p) => (
                        <div
                            key={p._id}
                            className="col-md-6 mb-3 col-lg-4 col-xl-4 col-xxl-3"
                            onClick={() => { setDownloadingProductId(p._id); pdfDownload(p.fileId); }}
                        >
                            <div className="_card h-100">
                                <div className="_card-body">
                                    <h5 className="_card-title-d text-center">{p.name}</h5>

                                    {/* Row: flag + downloads on left, rating + signal on right */}
                                    <div className="d-flex align-items-center justify-content-between gap-2 my-2">
                                        <div className="d-flex align-items-center gap-2 ps-4">
                                            <i
                                                className={`fi fi-${p.code.toLowerCase()} flag-icon`}
                                                aria-hidden="true"
                                            />
                                            <span className="_card-text small">Downloads: {p.downloadCount}</span>
                                        </div>

                                        <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: '#dee2e6', margin: '0 8px' }} />

                                        {p.metadata?.conclusion && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="pe-4">
                                                {/* Left: Rating & Signal */}
                                                <div className="text-start">
                                                    <p className="_card-text p-0 m-0 small">
                                                        Rating:
                                                    </p>
                                                    <p className="_card-text p-0 m-0 small">
                                                        Signal:
                                                    </p>
                                                </div>

                                                {/* Right: remaining content */}
                                                <div className="text-end">
                                                    <p className="_card-text p-0 m-0 small">
                                                        {p.metadata.conclusion.gicStarRating}
                                                    </p>
                                                    <p className="_card-text p-0 m-0">
                                                        {p.metadata.conclusion.investmentAttractivenessSignal === '⚖' ? "⚖️" : p.metadata.conclusion.investmentAttractivenessSignal}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>


                                    <hr style={{ borderColor: '#dee2e6', margin: '8px 0' }} />

                                    {/* Rationale below */}
                                    {p.metadata?.conclusion?.rationaleIndustrialInvestability && (
                                        <p className="_card-text small text-center mt-1 p-0 m-0">
                                            {p.metadata.conclusion.rationaleIndustrialInvestability}
                                        </p>
                                    )}
                                </div>

                                <div className={`loader-overlay ${downloadingProductId === p._id ? "" : "d-none"}`}>
                                    <Loader />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EconomicInsights;
