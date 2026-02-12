import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/api/axiosInstance"; // your axios instance
import "./EconomicInsights.css"; // optional: for styling tabs/products
import Loader from "@/Components/Loader/Loader";
import 'flag-icons/css/flag-icons.min.css';
import {getPDFBlob} from '@/api/user';
import { useToast } from "@/providers/ToastContext";


// --- Types ---
export interface Product {
    _id: string;
    fileId: string;
    name: string;
    code: string;
    content?: any | null;
    variant?: any | null;
    media?: any | null;
    tags?: string[] | null;
    downloadCount: number;
    importance: "A" | "B" | "C" | "D";
    parent?: string | null;
    children?: string[] | null;
    recommended?: string[] | null;
}

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
    const [error, setError] = useState<string | null>(null);
    const { show } = useToast();
    // Fetch categories (continents) on mount

    const fetchCategories = useCallback(async () => {
        setLoadingCategories(true);
        try {

            const res = await axiosInstance.get<Continent[]>("/continents");

            const data = res.data?.data.categories;

            setCategories(data);
            if (data.length > 0) {
                //set default 
                setSelectedCategory(data[0]);
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


            const pdfDownload = async ( fileId: string) => {
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
                    debugger
                    show({ type: "error", message: err!.message! });
                    console.error(err);
                }
            };




    if (error) return <p className="text-danger">{error}</p>;

    return (


        <div className="economic-insights">
            <h3 className="mb-3">Economic Insights</h3>

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
                <div className="products row mt-2">
                    {products.map((p) => (
                        <div key={p._id} className="col-md-4 mb-3 col-lg-2" 
                            onClick={()=> pdfDownload(p.fileId)}>
                            <div className="card h-100">
                                <div className="card-body text-center"> {/* center the content */}
                                    <h5 className="card-title">{p.name}</h5>

                                    {/* Flag icon */}
                                    <i
                                        className={`fi fi-${p.code.toLowerCase()} flag-icon mb-3`}
                                        aria-hidden="true"
                                    ></i>

                                    <p className="card-text">Downloads: {p.downloadCount}</p>
                                    <p className="card-text">Importance: {p.importance}</p>
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
