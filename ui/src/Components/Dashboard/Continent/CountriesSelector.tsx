import React, { useMemo, useEffect, useCallback } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import { ContinetViewModel } from "../../../../../src/types/continent.types";
import { Product } from "../../../../../src/types/product.types";
import { MdOutlineDeleteForever } from "react-icons/md";
import axiosInstance from "@/api/axiosInstance";
interface Props {
    continent: ContinetViewModel;
    setContinent: React.Dispatch<React.SetStateAction<ContinetViewModel>>;
}

const importanceOptions = ["A", "B", "C", "D"] as const;

const CountriesSelector: React.FC<Props> = ({ continent, setContinent }) => {



    const editMode = (continent._id !== null && continent._id !== undefined);

    const options = useMemo(() => countryList().getData(), []);

    const fetchProductsByParent = useCallback(async (parentId: string) => {
        try {
            const { data } = await axiosInstance.get(`/products/by-parent/${parentId}`);
            debugger;
            return data;
        } catch (err) {
            console.error("Failed to fetch products", err);
            return [];
        }
    }, []);


    useEffect(() => {
        if (!continent._id) return;

        const loadProducts = async () => {
            const result = await fetchProductsByParent(continent._id);

            setContinent(prev => ({ ...prev, productObjects: result.products ?? [] }));
        };

        loadProducts();
    }, [continent._id, fetchProductsByParent]);

    const handleSelect = (selectedOption: { label: string; value: string } | null) => {
        if (!selectedOption) return;

        const countryProduct: Product = {
            fileId: "",            // user will input
            name: selectedOption.label,
            code: selectedOption.value,
            content: null,
            variant: null,
            media: null,
            tags: null,
            downloadCount: 0,      // default
            importance: "A",       // default importance
            parent: continent._id ?? null, // or null if you want
            children: [],
            recommended: [],
        };


        setContinent(prev => {
            const updated = {
                ...prev,
                productObjects: [...(prev.productObjects ?? []), countryProduct],
            };

            console.log("New state:", updated);
            return updated;
        });

    };

    useEffect(() => {
        if (!continent.productObjects) {
            setContinent(prev => ({
                ...prev,
                productObjects: []
            }));
        }
    }, []);


    const handleDelete = async (index: number) => {

        if (editMode) {
            const productId = continent.productObjects?.[index]?._id;
            if (!productId) return;
            try {
                const { data } = await axiosInstance.delete(`/products/${productId}`);
                console.log("Deleted product:", data);

                // Optionally, update local state after deletion
                setContinent(prev => {
                    const updatedProducts = [...(prev.productObjects ?? [])];
                    updatedProducts.splice(index, 1);
                    return { ...prev, productObjects: updatedProducts };
                });

                return data;
            } catch (err) {
                console.error("Failed to delete product", err);
                return null;
            }
        } else {
            // Local deletion only
            setContinent(prev => {
                const updatedProducts = [...(prev.productObjects ?? [])];
                updatedProducts.splice(index, 1);
                return { ...prev, productObjects: updatedProducts };
            });
        }
    };



    const handleProductChange = (
        index: number,
        key: keyof Product,
        value: any) => {
        setContinent(prev => {
            const updatedProducts = [...(prev.productObjects ?? [])];

            updatedProducts[index] = {
                ...updatedProducts[index],
                [key]: value,
            };

            return {
                ...prev,
                productObjects: updatedProducts,
            };
        });
    };


    return (
        <div>

            <div className="col-3">
                <label className="form-label fw-bold">Countries</label>
                <Select
                    options={options}
                    onChange={handleSelect}
                    placeholder="Select country"
                    isSearchable
                    filterOption={(option, inputValue) =>
                        option.label.toLowerCase().includes(inputValue.toLowerCase())
                    }
                />


            </div>
            <div>

                {/* Header Row */}
                {(continent.productObjects ?? []).length > 0 && (
                    <div className="d-flex mt-3 mb-1 fw-bold align-items-center">
                        <div style={{ width: "25%" }}>Name</div>
                        <div style={{ width: "15%" }}>Code</div>
                        <div style={{ width: "30%" }}>File ID</div>
                        <div style={{ width: "15%" }}>Importance</div>
                        <div style={{ width: "15%" }}>Actions</div>
                    </div>
                )}

                {/* Products */}
                {(continent.productObjects ?? []).map((product, index) => (
                    <div key={index} className="d-flex gap-2 mt align-items-center">
                        {/* Name */}
                        <input
                            type="hidden"
                            value={product._id}
                            name={`products[${index}]._id`}
                        />

                        <input
                            type="text"
                            className="form-control"
                            value={product.name}
                            readOnly
                            disabled
                            style={{ width: "25%" }}
                        />

                        {/* Code */}
                        <input
                            type="text"
                            className="form-control"
                            value={product.code}
                            readOnly
                            disabled
                            style={{ width: "15%" }}
                        />

                        {/* File ID */}
                        <input
                            type="text"
                            className="form-control"
                            placeholder="File ID"
                            value={product.fileId}
                            onChange={e => handleProductChange(index, "fileId", e.target.value)}
                            style={{ width: "30%" }}
                        />

                        {/* Importance */}
                        <select
                            className="form-control"
                            value={product.importance}
                            onChange={e => handleProductChange(index, "importance", e.target.value)}
                            style={{ width: "15%" }}
                        >
                            {importanceOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>

                        {/* Delete button */}
                        <button
                            style={{ width: "15%", fontSize: 24, color: 'red' }}
                            type="button"
                            className="btn"
                            title="Delete the product"
                            onClick={() => handleDelete(index)}
                        >
                            <MdOutlineDeleteForever />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CountriesSelector;
